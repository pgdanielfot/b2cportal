"use client";

import { useRef, useState, useTransition } from "react";
import { submitFillForm } from "@/app/actions/submissions";
import FileFieldInput from "./FileFieldInput";
import LiveAdPreview, { type Media } from "./LiveAdPreview";
import { isConditionMet, type Condition } from "@/lib/conditions";
import { LANGUAGES, localizeCommonContent, translations, type Language } from "@/lib/i18n";
import { minLeadDateString } from "@/lib/dates";

const MIN_LEAD_WORKING_DAYS = 7;

type Field = {
  id: string;
  label: string;
  labelMs?: string;
  labelZh?: string;
  type: "TEXT" | "TEXTAREA" | "URL" | "DATE" | "DROPDOWN" | "FILE";
  required: boolean;
  options: string[];
  maxLength: number | null;
  minFiles: number | null;
  maxFiles: number | null;
  maxSizeMb: number | null;
  allowedTypes: string[];
  width: number | null;
  height: number | null;
  sampleUrl?: string;
  condition?: Condition;
};

type Step = {
  id: string;
  title: string;
  titleMs?: string;
  titleZh?: string;
  disclaimer?: string;
  disclaimerMs?: string;
  disclaimerZh?: string;
  disclaimerImage?: string;
  disclaimerCondition?: Condition;
  fields: Field[];
  condition?: Condition;
};

type SubmittedAsset = { name: string; url: string; type: string; label: string; width?: number | null; height?: number | null };

export default function FillWizard({
  token,
  productName,
  campaignUrl,
  initialLanguage,
  initialAnswers,
  steps,
  useBlobUpload,
}: {
  token: string;
  productName: string;
  campaignUrl?: string;
  initialLanguage?: Language;
  initialAnswers?: Record<string, string>;
  steps: Step[];
  useBlobUpload: boolean;
}) {
  const [language, setLanguage] = useState<Language | null>(initialLanguage ?? null);
  const [visiblePosition, setVisiblePosition] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [charCounts, setCharCounts] = useState<Record<string, number>>({});
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers ?? {});
  const [agreedDisclaimers, setAgreedDisclaimers] = useState<Set<string>>(new Set());
  const [uploadingFields, setUploadingFields] = useState<Set<string>>(new Set());
  const [uploadedSummary, setUploadedSummary] = useState<
    { label: string; width?: number | null; height?: number | null; files: { name: string; url: string; type: string }[] }[]
  >([]);
  const [previewMedia, setPreviewMedia] = useState<Record<string, Media[]>>({});
  const formRef = useRef<HTMLFormElement>(null);

  const t = translations[language ?? "en"];
  const isUploading = uploadingFields.size > 0;
  const brandField = steps.flatMap((step) => step.fields).find((field) => /advertise as|brand|where would you like to advertise/i.test(field.label) && field.type === "DROPDOWN");
  const captionField = steps.flatMap((step) => step.fields).find((field) => /caption/i.test(field.label));
  const ctaField = steps.flatMap((step) => step.fields).find((field) => /call.?to.?action|\bcta\b/i.test(field.label));
  const destinationField = steps.flatMap((step) => step.fields).find((field) => /agent listing url|listing.*url|profile.*url/i.test(field.label) && field.type === "URL");
  const showCampaignPreview = Boolean(campaignUrl && (brandField || captionField || ctaField || destinationField));
  const fieldLabelFor = (fieldId: string) => steps.flatMap((step) => step.fields).find((field) => field.id === fieldId)?.label ?? "";
  const mediaFor = (test: (label: string) => boolean) => Object.entries(previewMedia).find(([fieldId, media]) => media.length > 0 && test(fieldLabelFor(fieldId)))?.[1] ?? [];
  const feedMedia = mediaFor((label) => /feed/i.test(label));
  const storyImage = mediaFor((label) => /stor(y|ies)/i.test(label) && !/video/i.test(label));
  const storyVideo = mediaFor((label) => /stor(y|ies)/i.test(label) && /video/i.test(label));

  const visibleStepIndices = steps
    .map((s, i) => i)
    .filter((i) => isConditionMet(steps[i].condition ?? null, answers));
  const currentStepIndex = visibleStepIndices[visiblePosition] ?? 0;
  const isLastStep = visiblePosition === visibleStepIndices.length - 1;

  function fieldVisible(field: Field) {
    return !(campaignUrl && /platform/i.test(field.label)) && isConditionMet(field.condition ?? null, answers);
  }

  function localizedLabel(field: Field): string {
    if (language === "ms" && field.labelMs) return field.labelMs;
    if (language === "zh" && field.labelZh) return field.labelZh;
    return localizeCommonContent(field.label, language ?? "en");
  }

  function localizedTitle(step: Step): string {
    if (language === "ms" && step.titleMs) return step.titleMs;
    if (language === "zh" && step.titleZh) return step.titleZh;
    return localizeCommonContent(step.title, language ?? "en");
  }

  function localizedDisclaimer(step: Step): string | undefined {
    if (language === "ms" && step.disclaimerMs) return step.disclaimerMs;
    if (language === "zh" && step.disclaimerZh) return step.disclaimerZh;
    return step.disclaimer;
  }

  function disclaimerVisible(step: Step): boolean {
    return !!localizedDisclaimer(step) && isConditionMet(step.disclaimerCondition ?? null, answers);
  }

  // A visible disclaimer must be explicitly acknowledged before the agent can
  // proceed — this also stops a stray double-click on the (now-relabeled)
  // button from finishing the submission the instant this step appears.
  function disclaimerBlocking(step: Step): boolean {
    return disclaimerVisible(step) && !agreedDisclaimers.has(step.id);
  }

  function handleAnswerChange(fieldId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  }

  function handleUploadingChange(fieldId: string, uploading: boolean) {
    setUploadingFields((prev) => {
      const next = new Set(prev);
      if (uploading) next.add(fieldId);
      else next.delete(fieldId);
      return next;
    });
  }

  function handlePreviewMediaChange(fieldId: string, media: Media[]) {
    setPreviewMedia((current) => ({ ...current, [fieldId]: media }));
  }

  function validateStep(stepIndex: number): string | null {
    const form = formRef.current;
    if (!form) return null;

    for (const field of steps[stepIndex].fields) {
      if (!field.required || !fieldVisible(field)) continue;

      if (field.type === "FILE") {
        const el = form.elements.namedItem(field.id) as HTMLInputElement | null;
        let fileCount = 0;
        if (el?.type === "file") {
          fileCount = el.files?.length ?? 0;
        } else if (el?.type === "hidden") {
          try {
            fileCount = (JSON.parse(el.value || "[]") as unknown[]).length;
          } catch {
            fileCount = 0;
          }
        }
        if (fileCount < (field.minFiles ?? 1)) {
          return `"${localizedLabel(field)}" is required.`;
        }
        continue;
      }

      const el = form.elements.namedItem(field.id) as
        | HTMLInputElement
        | HTMLTextAreaElement
        | HTMLSelectElement
        | null;
      const value = el?.value.trim() ?? "";

      if (!value) {
        return `"${localizedLabel(field)}" is required.`;
      }

      if (field.type === "URL") {
        try {
          new URL(value);
        } catch {
          return `"${localizedLabel(field)}" must be a valid URL.`;
        }
      }

      if (field.type === "DATE" && value < minLeadDateString(MIN_LEAD_WORKING_DAYS)) {
        return `"${localizedLabel(field)}" must be at least ${MIN_LEAD_WORKING_DAYS} working days from today.`;
      }
    }

    return null;
  }

  function handleNext() {
    if (disclaimerBlocking(steps[currentStepIndex])) return;

    const validationError = validateStep(currentStepIndex);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setVisiblePosition((p) => Math.min(visibleStepIndices.length - 1, p + 1));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (disclaimerBlocking(steps[currentStepIndex])) return;

    const validationError = validateStep(currentStepIndex);
    if (validationError) {
      setError(validationError);
      return;
    }

    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await submitFillForm(token, formData);
      if (result.ok) {
        const fileFields = steps.flatMap((s) => s.fields).filter((f) => f.type === "FILE");
        setUploadedSummary(
          fileFields
            .map((f) => {
              const raw = formData.getAll(f.id);
              const fromFiles = raw
                .filter((v): v is File => v instanceof File && v.size > 0)
                .map((file) => ({ name: file.name, url: URL.createObjectURL(file), type: file.type }));
              const fromBlob = raw
                .filter((v): v is string => typeof v === "string" && v.length > 0)
                .flatMap((v) => {
                  try {
                    return JSON.parse(v) as { name: string; url: string; type: string }[];
                  } catch {
                    return [];
                  }
                });
              return { label: localizedLabel(f), width: f.width, height: f.height, files: [...fromFiles, ...fromBlob] };
            })
            .filter((f) => f.files.length > 0),
        );
        setDone(true);
      } else {
        setError(result.error);
      }
    });
  }

  if (!language) {
    return (
      <div className="rounded-lg border border-crystal bg-white p-8 text-center space-y-6">
        <div>
          <h1 className="text-lg font-semibold text-mahogany">{translations.en.chooseLanguage}</h1>
          <p className="text-sm text-mahogany/50">{translations.en.chooseLanguageHint}</p>
        </div>
        <div className="flex flex-col gap-3">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLanguage(l.code)}
              className="rounded-md border border-crystal px-4 py-3 text-sm font-medium text-mahogany hover:bg-crystal-soft"
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (done) {
    const submittedAssetCount = uploadedSummary.reduce((count, group) => count + group.files.length, 0);
    const submittedAssets: SubmittedAsset[] = uploadedSummary.flatMap((group) => group.files.map((file) => ({ ...file, label: group.label, width: group.width, height: group.height })));
    const feedAssets = submittedAssets.filter((asset) => /feed/i.test(asset.label));
    const storyAssets = submittedAssets.filter((asset) => !/feed/i.test(asset.label));
    return (
      <div className="mx-auto max-w-3xl space-y-5 py-4">
        <section className="overflow-hidden rounded-3xl border border-crystal bg-white shadow-xl shadow-[#172b5412]">
          <div className="bg-[linear-gradient(135deg,_#edf4ff,_#ffffff_65%)] px-6 py-9 text-center sm:px-10"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2169df] text-3xl font-bold text-white shadow-lg shadow-blue-200">✓</div><p className="mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#2169df]">Campaign submitted</p><h1 className="mt-1 text-2xl font-bold text-mahogany">{t.thankYou}</h1><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-mahogany/60">{t.submissionReceived} Your campaign materials have been securely saved for the FOT team.</p></div>
          <div className="flex flex-col gap-3 border-t border-crystal px-6 py-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-mahogany/60">You can revisit this campaign at any time to review it.</p>
          {campaignUrl && (
            <a
              href={campaignUrl}
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-ignite px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ignite-hover"
            >
              View all campaigns →
            </a>
          )}
          </div>
        </section>

        {uploadedSummary.length > 0 && (
          <section className="rounded-3xl border border-crystal bg-white p-5 shadow-sm sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mahogany/50">Creative kit</p><h2 className="mt-1 text-lg font-bold text-mahogany">Materials received</h2><p className="mt-1 text-sm text-mahogany/55">Organised by placement and shown at the requested proportions.</p></div><span className="rounded-full bg-crystal-soft px-3 py-1.5 text-xs font-semibold text-mahogany/60">{submittedAssetCount} {submittedAssetCount === 1 ? "asset" : "assets"}</span></div><div className="mt-6 grid gap-6 lg:grid-cols-2">{feedAssets.length > 0 && <PlacementGroup title="Feed creative" subtitle="Square placement" assets={feedAssets} />}{storyAssets.length > 0 && <PlacementGroup title="Story creative" subtitle="Vertical placement" assets={storyAssets} />}</div></section>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-crystal bg-white/75 px-5 py-4 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ignite">Campaign submission</p><h1 className="mt-0.5 text-xl font-bold text-mahogany">{productName}</h1></div><span className="rounded-full bg-crystal-soft px-3 py-1.5 text-xs font-semibold text-mahogany/60">Step {visiblePosition + 1} of {visibleStepIndices.length}</span></div>
        <div className="mt-2 flex gap-1">
          {visibleStepIndices.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i <= visiblePosition ? "bg-ignite" : "bg-crystal"}`}
            />
          ))}
        </div>
      </div>

      <div className={showCampaignPreview ? "grid gap-6 lg:grid-cols-[minmax(0,1fr)_30rem] lg:items-start" : ""}>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          // All steps share this one <form> (hidden steps stay mounted so their
          // values persist), so pressing Enter anywhere would otherwise trigger
          // the browser's native implicit submit instead of just advancing.
          if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
            e.preventDefault();
            if (!isLastStep) handleNext();
          }
        }}
        className="space-y-5 rounded-3xl border border-crystal bg-white p-5 shadow-lg shadow-[#1d37620d] sm:p-7"
      >
        <input type="hidden" name="__language" value={language ?? "en"} />
        {Object.entries(initialAnswers ?? {}).map(([fieldId, value]) => <input key={fieldId} type="hidden" name={fieldId} value={value} />)}
        {steps.map((step, stepIndex) => (
          <div
            key={step.id}
            className={stepIndex === currentStepIndex ? "space-y-5" : "hidden"}
          >
            <div className="border-b border-crystal pb-4"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ignite">Campaign brief</p><h2 className="mt-1 text-xl font-bold text-mahogany">{localizedTitle(step)}</h2><p className="mt-1 text-sm text-mahogany/55">{t.campaignBriefHint}</p></div>
            {disclaimerVisible(step) && (
              <div className="space-y-2 rounded-md border border-ignite/30 bg-crystal-soft p-3 text-sm text-mahogany/80">
                <p>{localizedDisclaimer(step)}</p>
                {step.disclaimerImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={step.disclaimerImage}
                    alt=""
                    className="max-h-64 w-auto rounded-md border border-crystal"
                  />
                )}
                <label className="flex items-center gap-2 text-sm font-medium text-mahogany">
                  <input
                    type="checkbox"
                    checked={agreedDisclaimers.has(step.id)}
                    onChange={(e) => {
                      setError(null);
                      setAgreedDisclaimers((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(step.id);
                        else next.delete(step.id);
                        return next;
                      });
                    }}
                  />
                  {t.disclaimerAgree}
                </label>
              </div>
            )}
            {step.fields.map((field) => (
              <div key={field.id} className={fieldVisible(field) ? "space-y-2" : "hidden"}>
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm font-semibold text-mahogany">
                    {localizedLabel(field)}
                    {field.required && <span className="text-ignite"> *</span>}
                  </label>
                  {field.type === "FILE" && field.sampleUrl && (
                    <a
                      href={field.sampleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-xs font-medium text-ignite hover:underline"
                    >
                      {t.viewAdSamples} ↗
                    </a>
                  )}
                </div>

                {field.type === "TEXT" && (
                  <>
                    <input
                      name={field.id}
                      defaultValue={answers[field.id] ?? ""}
                      maxLength={field.maxLength ?? undefined}
                      onChange={(e) => {
                        setCharCounts((c) => ({ ...c, [field.id]: e.target.value.length }));
                        handleAnswerChange(field.id, e.target.value);
                      }}
                      className="w-full rounded-xl border border-crystal bg-[#fbfcff] px-4 py-3 text-sm text-mahogany shadow-sm outline-none transition focus:border-ignite focus:ring-4 focus:ring-ignite/10"
                    />
                    {field.maxLength && (
                      <p className="text-right text-xs text-mahogany/40">
                        {charCounts[field.id] ?? 0} / {field.maxLength}
                      </p>
                    )}
                  </>
                )}
                {field.type === "TEXTAREA" && (
                  <>
                    <textarea
                      name={field.id}
                      defaultValue={answers[field.id] ?? ""}
                      rows={6}
                      maxLength={field.maxLength ?? undefined}
                      onChange={(e) => {
                        setCharCounts((c) => ({ ...c, [field.id]: e.target.value.length }));
                        handleAnswerChange(field.id, e.target.value);
                      }}
                      placeholder={t.paragraphHint}
                      className="w-full resize-y rounded-xl border border-crystal bg-[#fbfcff] px-4 py-3 text-sm leading-relaxed text-mahogany shadow-sm outline-none transition focus:border-ignite focus:ring-4 focus:ring-ignite/10"
                    />
                    {field.maxLength && (
                      <p className="text-right text-xs text-mahogany/40">
                        {charCounts[field.id] ?? 0} / {field.maxLength}
                      </p>
                    )}
                  </>
                )}
                {field.type === "URL" && (
                  <input
                    type="url"
                    name={field.id}
                    value={answers[field.id] ?? ""}
                    placeholder="https://example.com"
                    onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                    className="w-full rounded-xl border border-crystal bg-[#fbfcff] px-4 py-3 text-sm text-mahogany shadow-sm outline-none transition focus:border-ignite focus:ring-4 focus:ring-ignite/10"
                  />
                )}
                {field.type === "DATE" && (
                  <input
                    type="date"
                    name={field.id}
                    min={minLeadDateString(MIN_LEAD_WORKING_DAYS)}
                    onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                    className="w-full rounded-xl border border-crystal bg-[#fbfcff] px-4 py-3 text-sm text-mahogany shadow-sm outline-none transition focus:border-ignite focus:ring-4 focus:ring-ignite/10"
                  />
                )}
                {field.type === "DROPDOWN" && (
                  <select
                    name={field.id}
                    value={answers[field.id] ?? ""}
                    onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                    className="w-full rounded-xl border border-crystal bg-[#fbfcff] px-4 py-3 text-sm text-mahogany shadow-sm outline-none transition focus:border-ignite focus:ring-4 focus:ring-ignite/10"
                  >
                    <option value="">{t.selectPlaceholder}</option>
                    {field.options.map((o) => (
                      <option key={o} value={o}>
                        {localizeCommonContent(o, language ?? "en")}
                      </option>
                    ))}
                  </select>
                )}
                {field.type === "FILE" && (
                  <FileFieldInput
                    field={{ ...field, label: localizedLabel(field) }}
                    token={token}
                    useBlobUpload={useBlobUpload}
                    language={language ?? "en"}
                    onUploadingChange={handleUploadingChange}
                    onPreviewMediaChange={handlePreviewMediaChange}
                  />
                )}
              </div>
            ))}
          </div>
        ))}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-between border-t border-crystal pt-5">
          <button
            type="button"
            onClick={() => {
              setError(null);
              if (visiblePosition === 0) {
                setLanguage(null);
              } else {
                setVisiblePosition((p) => Math.max(0, p - 1));
              }
            }}
            className="rounded-xl border border-crystal bg-white px-5 py-2.5 text-sm font-semibold text-mahogany transition hover:bg-crystal-soft disabled:opacity-40"
          >
            {t.back}
          </button>

          {isLastStep ? (
            <button
              type="submit"
              disabled={isPending || isUploading || disclaimerBlocking(steps[currentStepIndex])}
              className="rounded-xl bg-ignite px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ignite-hover disabled:opacity-50"
            >
              {isUploading
                ? t.uploading
                : isPending
                  ? t.submitting
                  : disclaimerVisible(steps[currentStepIndex])
                    ? t.proceed
                    : t.submit}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              disabled={isUploading || disclaimerBlocking(steps[currentStepIndex])}
              className="rounded-xl bg-ignite px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ignite-hover disabled:opacity-50"
            >
              {isUploading
                ? t.uploading
                : disclaimerVisible(steps[currentStepIndex])
                  ? t.proceed
                  : t.next}
            </button>
          )}
        </div>
      </form>
      {showCampaignPreview && (
        <aside className="lg:sticky lg:top-6">
          <LiveAdPreview
            language={language ?? "en"}
            brand={brandField ? answers[brandField.id] : undefined}
            feedMedia={feedMedia}
            storyImage={storyImage}
            storyVideo={storyVideo}
            caption={captionField ? answers[captionField.id] : undefined}
            cta={ctaField ? answers[ctaField.id] : undefined}
            destination={destinationField ? answers[destinationField.id] : undefined}
          />
        </aside>
      )}
      </div>
    </div>
  );
}

function PlacementGroup({ title, subtitle, assets }: { title: string; subtitle: string; assets: SubmittedAsset[] }) {
  return <section className="rounded-2xl border border-crystal bg-[#fbfcff] p-4"><div className="mb-4 flex items-center justify-between"><div><h3 className="text-sm font-bold text-mahogany">{title}</h3><p className="mt-0.5 text-xs text-mahogany/50">{subtitle}</p></div><span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-mahogany/55 shadow-sm">{assets.length} {assets.length === 1 ? "creative" : "creatives"}</span></div><div className={/Feed/i.test(title) ? "grid grid-cols-2 gap-3" : "grid grid-cols-2 items-start gap-3"}>{assets.map((asset) => <CreativeAssetCard key={asset.url} asset={asset} />)}</div></section>;
}

function CreativeAssetCard({ asset }: { asset: SubmittedAsset }) {
  const ratio = asset.width && asset.height ? `${asset.width} / ${asset.height}` : /stor(y|ies)/i.test(asset.label) ? "9 / 16" : "1 / 1";
  return <div className="min-w-0"><div className="group relative overflow-hidden rounded-xl border border-crystal bg-crystal-soft shadow-sm" style={{ aspectRatio: ratio }}>{asset.type.startsWith("video/") ? <video src={asset.url} className="h-full w-full object-cover" muted playsInline preload="metadata" controls /> : <>
    {/* Object URLs and Blob URLs cannot reliably be optimized by next/image. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={asset.url} alt={asset.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
  </>}<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2.5 pb-2 pt-7 text-[9px] font-bold uppercase tracking-wide text-white">{asset.type.startsWith("video/") && "▶ "}{asset.label.replace(" (Optional)", "")}</div></div><p className="mt-2 truncate text-center text-[10px] font-semibold uppercase tracking-wide text-mahogany/50">{asset.width && asset.height ? `${asset.width} × ${asset.height}` : ratio}</p></div>;
}
