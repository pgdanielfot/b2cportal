"use client";

import { useEffect, useRef, useState } from "react";
import { cropAndResize } from "@/lib/cropImage";
import { formatLabels } from "@/lib/fileFormats";
import { getMediaDimensions } from "@/lib/mediaDimensions";
import ImageThumbnail from "./ImageThumbnail";
import ManualCropModal from "./ManualCropModal";

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

export default function FileFieldInput({ field }: { field: Field }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [formatError, setFormatError] = useState<string | null>(null);
  const [issues, setIssues] = useState<DimensionIssue[]>([]);
  const [previews, setPreviews] = useState<Preview[]>([]);
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
    setPreviewsFor([]);

    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    if (field.allowedTypes.length > 0) {
      const bad = files.filter((f) => !field.allowedTypes.includes(f.type));
      if (bad.length > 0) {
        setFormatError(
          `"${bad.map((f) => f.name).join(", ")}" is not an accepted format. Allowed: ${formatLabels(field.allowedTypes)}.`,
        );
        e.target.value = "";
        return;
      }
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
      setPreviewsFor(ok.map((c) => c.file));
      return;
    }

    setPreviewsFor(files);
  }

  function removeFileFromInput(file: File) {
    const current = Array.from(inputRef.current?.files ?? []).filter((f) => f !== file);
    replaceInputFiles(current);
  }

  async function handleAutoCrop(issue: DimensionIssue) {
    if (!field.width || !field.height) return;
    setProcessingName(issue.file.name);
    try {
      const fixed = await cropAndResize(issue.file, field.width, field.height);
      applyFixedFile(issue, fixed);
    } finally {
      setProcessingName(null);
    }
  }

  function applyFixedFile(issue: DimensionIssue, fixed: File) {
    const current = Array.from(inputRef.current?.files ?? []);
    const updated = current.map((f) => (f === issue.file ? fixed : f));
    replaceInputFiles(updated);
    if (issue.previewUrl) URL.revokeObjectURL(issue.previewUrl);

    const remainingIssues = issues.filter((i) => i.file !== issue.file);
    setIssues(remainingIssues);
    setPreviewsFor(updated.filter((f) => !remainingIssues.some((i) => i.file === f)));
  }

  function handleRemoveIssue(issue: DimensionIssue) {
    removeFileFromInput(issue.file);
    if (issue.previewUrl) URL.revokeObjectURL(issue.previewUrl);
    setIssues((prev) => prev.filter((i) => i.file !== issue.file));
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        name={field.id}
        multiple={(field.maxFiles ?? 1) > 1}
        accept={field.allowedTypes.length ? field.allowedTypes.join(",") : undefined}
        onChange={handleChange}
        className="w-full rounded-md border px-3 py-2 text-sm focus:border-ignite focus:outline-none"
      />
      <p className="text-xs text-mahogany/40">
        {field.minFiles && field.minFiles > 1
          ? `${field.minFiles}–${field.maxFiles ?? 1} file(s)`
          : `Max ${field.maxFiles ?? 1} file(s)`}
        , up to {field.maxSizeMb ?? 10}MB each
        {field.allowedTypes.length ? ` · ${formatLabels(field.allowedTypes)}` : ""}
        {field.width && field.height ? ` · ${field.width}×${field.height}px` : ""}
      </p>

      {formatError && <p className="text-sm text-red-600">{formatError}</p>}

      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {previews.map((p) =>
            p.type.startsWith("image/") ? (
              <ImageThumbnail key={p.url} src={p.url} alt={p.name} />
            ) : (
              <div
                key={p.url}
                className="flex h-16 w-16 flex-col items-center justify-center rounded border border-crystal bg-crystal-soft p-1 text-center text-[10px] text-mahogany/70"
              >
                <span className="truncate w-full">{p.name}</span>
              </div>
            ),
          )}
        </div>
      )}

      {issues.map((issue) =>
        issue.isVideo ? (
          <div
            key={issue.file.name}
            className="space-y-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm"
          >
            <p className="text-red-700">
              &ldquo;{issue.file.name}&rdquo; is {issue.width}×{issue.height}px, but this field
              requires exactly {field.width}×{field.height}px. Videos can&rsquo;t be auto-cropped —
              please re-upload a video with the correct dimensions.
            </p>
            <button
              type="button"
              onClick={() => handleRemoveIssue(issue)}
              className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
            >
              Remove file
            </button>
          </div>
        ) : (
          <div
            key={issue.previewUrl}
            className="space-y-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm"
          >
            <div className="flex items-center gap-3">
              {issue.previewUrl && <ImageThumbnail src={issue.previewUrl} alt={issue.file.name} />}
              <p className="text-red-700">
                &ldquo;{issue.file.name}&rdquo; is {issue.width}×{issue.height}px, but this field
                requires exactly {field.width}×{field.height}px.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleAutoCrop(issue)}
                disabled={processingName === issue.file.name}
                className="rounded-md bg-ignite px-3 py-1.5 text-xs font-medium text-white hover:bg-ignite-hover disabled:opacity-50"
              >
                {processingName === issue.file.name ? "Cropping..." : "Auto-crop & resize for me"}
              </button>
              <button
                type="button"
                onClick={() => setManualCropTarget(issue)}
                className="rounded-md border border-mahogany/30 px-3 py-1.5 text-xs font-medium text-mahogany hover:bg-crystal-soft"
              >
                Manually crop
              </button>
              <button
                type="button"
                onClick={() => handleRemoveIssue(issue)}
                className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
              >
                I&rsquo;ll crop it myself — remove file
              </button>
            </div>
          </div>
        ),
      )}

      {manualCropTarget && field.width && field.height && (
        <ManualCropModal
          file={manualCropTarget.file}
          targetWidth={field.width}
          targetHeight={field.height}
          onCancel={() => setManualCropTarget(null)}
          onConfirm={(fixed) => {
            applyFixedFile(manualCropTarget, fixed);
            setManualCropTarget(null);
          }}
        />
      )}
    </>
  );
}
