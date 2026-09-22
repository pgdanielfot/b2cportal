"use client";

import { useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { cropAndResize } from "@/lib/cropImage";
import { formatLabels } from "@/lib/fileFormats";
import { getMediaDimensions } from "@/lib/mediaDimensions";
import ImageThumbnail from "./ImageThumbnail";
import ManualCropModal from "./ManualCropModal";
import { translations, type Language } from "@/lib/i18n";

type Field = {
  id: string;
  label: string;
  minFiles: number | null;
  maxFiles: number | null;
  maxSizeMb: number | null;
  allowedTypes: string[];
  width: number | null;
  height: number | null;
};

type DimensionIssue = {
  file: File;
  width: number;
  height: number;
  previewUrl: string | null;
  isVideo: boolean;
};

type Preview = {
  name: string;
  url: string;
  type: string;
};

type UploadedFile = { url: string; name: string; size: number; type: string };

export default function FileFieldInput({
  field,
  token,
  useBlobUpload,
  onUploadingChange,
  onPreviewMediaChange,
  language = "en",
}: {
  field: Field;
  token: string;
  useBlobUpload: boolean;
  onUploadingChange?: (fieldId: string, uploading: boolean) => void;
  onPreviewMediaChange?: (fieldId: string, media: { url: string; type: string }[]) => void;
  language?: Language;
}) {
  const t = translations[language];
  const inputRef = useRef<HTMLInputElement>(null);
  const [formatError, setFormatError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [issues, setIssues] = useState<DimensionIssue[]>([]);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [readyFiles, setReadyFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [processingName, setProcessingName] = useState<string | null>(null);
  const [manualCropTarget, setManualCropTarget] = useState<DimensionIssue | null>(null);
  const objectUrls = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  function setPreviewsFor(files: File[]) {
    objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
    const next = files.map((f) => ({ name: f.name, url: URL.createObjectURL(f), type: f.type }));
    objectUrls.current = next.map((p) => p.url);
    setPreviews(next);
    onPreviewMediaChange?.(field.id, next.filter((item) => item.type.startsWith("image/") || item.type.startsWith("video/")).map(({ url, type }) => ({ url, type })));
  }

  async function syncReadyFiles(files: File[]) {
    setReadyFiles(files);
    replaceInputFiles(files);
    setPreviewsFor(files);
    setUploadError(null);

    if (!useBlobUpload) return;

    if (files.length === 0) {
      setUploadedFiles([]);
      return;
    }

    setUploading(true);
    onUploadingChange?.(field.id, true);
    try {
      const results = await Promise.all(
        files.map(async (file) => {
          const blob = await upload(`${token}/${field.id}/${file.name}`, file, {
            access: "public",
            handleUploadUrl: "/api/upload",
            clientPayload: JSON.stringify({ shareToken: token, fieldId: field.id }),
          });
          return { url: blob.url, name: file.name, size: file.size, type: file.type };
        }),
      );
      setUploadedFiles(results);
    } catch {
      setUploadError("Upload failed. Please try again.");
      setUploadedFiles([]);
    } finally {
      setUploading(false);
      onUploadingChange?.(field.id, false);
    }
  }

  function replaceInputFiles(files: File[]) {
    const input = inputRef.current;
    if (!input) return;
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    input.files = dt.files;
  }

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormatError(null);
    setIssues([]);

    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const maxFiles = field.maxFiles ?? 1;
    if (readyFiles.length + files.length > maxFiles) {
      setFormatError(`This field allows at most ${maxFiles} file(s). You already have ${readyFiles.length} selected.`);
      replaceInputFiles(readyFiles);
      return;
    }

    if (field.allowedTypes.length > 0) {
      const bad = files.filter((f) => !field.allowedTypes.includes(f.type));
      if (bad.length > 0) {
        setFormatError(
          `"${bad.map((f) => f.name).join(", ")}" is not an accepted format. Allowed: ${formatLabels(field.allowedTypes)}.`,
        );
        replaceInputFiles(readyFiles);
        return;
      }
    }

    const maxSizeMb = field.maxSizeMb ?? 10;
    const tooBig = files.filter((f) => f.size > maxSizeMb * 1024 * 1024);
    if (tooBig.length > 0) {
      setFormatError(`"${tooBig.map((f) => f.name).join(", ")}" exceeds the ${maxSizeMb}MB limit.`);
      replaceInputFiles(readyFiles);
      return;
    }

    if (field.width && field.height) {
      const checked = await Promise.all(
        files.map(async (file) => {
          const dims = await getMediaDimensions(file);
          return { file, width: dims?.width ?? 0, height: dims?.height ?? 0, isVideo: file.type.startsWith("video/") };
        }),
      );
      const mismatched = checked.filter((c) => c.width !== field.width || c.height !== field.height);
      const ok = checked.filter((c) => c.width === field.width && c.height === field.height);

      if (mismatched.length > 0) {
        setIssues(
          mismatched.map((m) => ({
            ...m,
            previewUrl: m.isVideo ? null : URL.createObjectURL(m.file),
          })),
        );
      }
      await syncReadyFiles([...readyFiles, ...ok.map((c) => c.file)]);
      return;
    }

    await syncReadyFiles([...readyFiles, ...files]);
  }

  async function removeReadyPreview(preview: Preview) {
    const remaining = readyFiles.filter((file) => file.name !== preview.name);
    await syncReadyFiles(remaining);
  }

  async function handleAutoCrop(issue: DimensionIssue) {
    if (!field.width || !field.height) return;
    setProcessingName(issue.file.name);
    try {
      const fixed = await cropAndResize(issue.file, field.width, field.height);
      await applyFixedFile(issue, fixed);
    } finally {
      setProcessingName(null);
    }
  }

  async function applyFixedFile(issue: DimensionIssue, fixed: File) {
    const existingIndex = readyFiles.indexOf(issue.file);
    const updated = existingIndex >= 0 ? readyFiles.map((file) => (file === issue.file ? fixed : file)) : [...readyFiles, fixed];
    if (issue.previewUrl) URL.revokeObjectURL(issue.previewUrl);

    const remainingIssues = issues.filter((i) => i.file !== issue.file);
    setIssues(remainingIssues);
    await syncReadyFiles(updated.filter((f) => !remainingIssues.some((i) => i.file === f)));
  }

  function handleRemoveIssue(issue: DimensionIssue) {
    replaceInputFiles(readyFiles);
    if (issue.previewUrl) URL.revokeObjectURL(issue.previewUrl);
    setIssues((prev) => prev.filter((i) => i.file !== issue.file));
  }

  return (
    <>
      <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        name={useBlobUpload ? undefined : field.id}
        multiple={(field.maxFiles ?? 1) > 1}
        accept={field.allowedTypes.length ? field.allowedTypes.join(",") : undefined}
        onChange={handleChange}
        className="w-full rounded-md border px-3 py-2 text-sm focus:border-ignite focus:outline-none"
      />
      {useBlobUpload && (
        <input type="hidden" name={field.id} value={JSON.stringify(uploadedFiles)} />
      )}
      <p className="text-xs text-mahogany/40">
        {field.minFiles && field.minFiles > 1
          ? `${field.minFiles}–${field.maxFiles ?? 1} file(s)`
          : `Max ${field.maxFiles ?? 1} file(s)`}
        , up to {field.maxSizeMb ?? 10}MB each
        {field.allowedTypes.length ? ` · ${formatLabels(field.allowedTypes)}` : ""}
        {field.width && field.height ? ` · ${field.width}×${field.height}px` : ""}
      </p>

      {formatError && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{formatError}</p>}
      {uploading && <p className="text-xs text-mahogany/50">Uploading…</p>}
      {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}

      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {previews.map((p) =>
            <div key={p.url} className="relative">
              {p.type.startsWith("image/") ? <ImageThumbnail src={p.url} alt={p.name} /> : <div className="flex h-16 w-16 flex-col items-center justify-center rounded border border-crystal bg-crystal-soft p-1 text-center text-[10px] text-mahogany/70"><span className="truncate w-full">{p.name}</span></div>}
              <button type="button" onClick={() => void removeReadyPreview(p)} className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white shadow hover:bg-red-700" aria-label={`Remove ${p.name}`}>×</button>
            </div>,
          )}
        </div>
      )}

      {issues.map((issue) =>
        issue.isVideo ? (
          <div
            key={issue.file.name}
            className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm shadow-sm"
          >
            <p className="font-semibold text-amber-950">{t.videoNeedsResizing}</p><p className="mt-1 leading-5 text-amber-900/75"><span className="font-medium">{issue.file.name}</span> {t.fileHasDimensions} {issue.width} × {issue.height}px. {t.requiredSize}: {field.width} × {field.height}px. {t.videosCannotCrop}</p>
            <button
              type="button"
              onClick={() => handleRemoveIssue(issue)}
              className="mt-3 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100"
            >
              {t.removeThisFile}
            </button>
          </div>
        ) : (
          <div
            key={issue.previewUrl}
            className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm shadow-sm"
          >
            <div className="flex items-center gap-3">
              {issue.previewUrl && <ImageThumbnail src={issue.previewUrl} alt={issue.file.name} />}
              <div><p className="font-semibold text-amber-950">{t.imageNeedsResizing}</p><p className="mt-1 leading-5 text-amber-900/75"><span className="font-medium">{issue.file.name}</span> {t.fileHasDimensions} {issue.width} × {issue.height}px. {t.requiredSize}: {field.width} × {field.height}px.</p></div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleAutoCrop(issue)}
                disabled={processingName === issue.file.name}
                className="rounded-lg bg-ignite px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-ignite-hover disabled:opacity-50"
              >
                {processingName === issue.file.name ? "…" : t.resizeAutomatically}
              </button>
              <button
                type="button"
                onClick={() => setManualCropTarget(issue)}
                className="rounded-lg border border-crystal bg-white px-3 py-1.5 text-xs font-semibold text-mahogany hover:bg-crystal-soft"
              >
                {t.cropManually}
              </button>
              <button
                type="button"
                onClick={() => handleRemoveIssue(issue)}
                className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
              >
                {t.removeThisFile}
              </button>
            </div>
          </div>
        ),
      )}
      </div>

      {manualCropTarget && field.width && field.height && (
        <ManualCropModal
          file={manualCropTarget.file}
          targetWidth={field.width}
          targetHeight={field.height}
          onCancel={() => setManualCropTarget(null)}
          onConfirm={(fixed) => {
            void applyFixedFile(manualCropTarget, fixed);
            setManualCropTarget(null);
          }}
        />
      )}
    </>
  );
}
