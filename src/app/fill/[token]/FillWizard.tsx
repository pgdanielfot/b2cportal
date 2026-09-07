"use client";

import { useRef, useState, useTransition } from "react";
import { submitFillForm } from "@/app/actions/submissions";
import FileFieldInput from "./FileFieldInput";
import ImageThumbnail from "./ImageThumbnail";
import { isConditionMet, type Condition } from "@/lib/conditions";
import { LANGUAGES, translations, type Language } from "@/lib/i18n";
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
  disclaimerCondition?: Condition;
  fields: Field[];
  condition?: Condition;
};

export default function FillWizard({
  token,
  productName,
  steps,
  useBlobUpload,
}: {
  token: string;
  productName: string;
  steps: Step[];
  useBlobUpload: boolean;
}) {
  const [language, setLanguage] = useState<Language | null>(null);
  const [visiblePosition, setVisiblePosition] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [charCounts, setCharCounts] = useState<Record<string, number>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [agreedDisclaimers, setAgreedDisclaimers] = useState<Set<string>>(new Set());
  const [uploadingFields, setUploadingFields] = useState<Set<string>>(new Set());
  const [uploadedSummary, setUploadedSummary] = useState<
    { label: string; files: { name: string; url: string; type: string }[] }[]
  >([]);
  const formRef = useRef<HTMLFormElement>(null);

  const t = translations[language ?? "en"];
  const isUploading = uploadingFields.size > 0;

  const visibleStepIndices = steps
    .map((s, i) => i)
    .filter((i) => isConditionMet(steps[i].condition ?? null, answers));
  const currentStepIndex = visibleStepIndices[visiblePosition] ?? 0;
  const isLastStep = visiblePosition === visibleStepIndices.length - 1;

  function fieldVisible(field: Field) {
    return isConditionMet(field.condition ?? null, answers);
  }

  function localizedLabel(field: Field): string {
    if (language === "ms" && field.labelMs) return field.labelMs;
    if (language === "zh" && field.labelZh) return field.labelZh;
    return field.label;
  }

  function localizedTitle(step: Step): string {
    if (language === "ms" && step.titleMs) return step.titleMs;
    if (language === "zh" && step.titleZh) return step.titleZh;
    return step.title;
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
              return { label: localizedLabel(f), files: [...fromFiles, ...fromBlob] };
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
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-crystal bg-white p-8 text-center space-y-2">
          <p className="text-2xl">✅</p>
          <h1 className="text-lg font-semibold text-mahogany">{t.thankYou}</h1>
          <p className="text-sm text-mahogany/60">{t.submissionReceived}</p>
        </div>

        {uploadedSummary.length > 0 && (
          <div className="rounded-lg border border-crystal bg-white p-6 space-y-4">
            <h2 className="font-medium text-mahogany">{t.uploadedFiles}</h2>
            {uploadedSummary.map((group) => (
              <div key={group.label} className="space-y-2">
                <p className="text-sm font-medium text-mahogany/70">{group.label}</p>
                <div className="flex flex-wrap gap-2">
                  {group.files.map((f) =>
                    f.type.startsWith("image/") ? (
                      <ImageThumbnail key={f.url} src={f.url} alt={f.name} />
                    ) : (
                      <div
                        key={f.url}
                        className="flex h-16 w-16 flex-col items-center justify-center rounded border border-crystal bg-crystal-soft p-1 text-center text-[10px] text-mahogany/70"
                      >
                        <span className="truncate w-full">{f.name}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-mahogany">{productName}</h1>
        <div className="mt-2 flex gap-1">
          {visibleStepIndices.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i <= visiblePosition ? "bg-ignite" : "bg-crystal"}`}
            />
          ))}
        </div>
      </div>

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
        className="rounded-lg border border-crystal bg-white p-6 space-y-5"
      >
        <input type="hidden" name="__language" value={language ?? "en"} />
        {steps.map((step, stepIndex) => (
          <div
            key={step.id}
            className={stepIndex === currentStepIndex ? "space-y-4" : "hidden"}
          >
            <h2 className="font-medium text-mahogany">{localizedTitle(step)}</h2>
            {disclaimerVisible(step) && (
              <div className="space-y-2 rounded-md border border-ignite/30 bg-crystal-soft p-3 text-sm text-mahogany/80">
                <p>{localizedDisclaimer(step)}</p>
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
              <div key={field.id} className={fieldVisible(field) ? "space-y-1" : "hidden"}>
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm font-medium text-mahogany">
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
                      maxLength={field.maxLength ?? undefined}
                      onChange={(e) => {
                        setCharCounts((c) => ({ ...c, [field.id]: e.target.value.length }));
                        handleAnswerChange(field.id, e.target.value);
                      }}
                      className="w-full rounded-md border px-3 py-2 text-sm focus:border-ignite focus:outline-none"
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
                      rows={6}
                      maxLength={field.maxLength ?? undefined}
                      onChange={(e) => {
                        setCharCounts((c) => ({ ...c, [field.id]: e.target.value.length }));
                        handleAnswerChange(field.id, e.target.value);
                      }}
                      placeholder="You can write multiple paragraphs — press Enter to start a new line."
                      className="w-full resize-y rounded-md border px-3 py-2 text-sm leading-relaxed focus:border-ignite focus:outline-none"
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
                    placeholder="https://example.com"
                    onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm focus:border-ignite focus:outline-none"
                  />
                )}
                {field.type === "DATE" && (
                  <input
                    type="date"
                    name={field.id}
                    min={minLeadDateString(MIN_LEAD_WORKING_DAYS)}
                    onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm focus:border-ignite focus:outline-none"
                  />
                )}
                {field.type === "DROPDOWN" && (
                  <select
                    name={field.id}
                    onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  >
                    <option value="">{t.selectPlaceholder}</option>
                    {field.options.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                )}
                {field.type === "FILE" && (
                  <FileFieldInput
                    field={{ ...field, label: localizedLabel(field) }}
                    token={token}
                    useBlobUpload={useBlobUpload}
                    onUploadingChange={handleUploadingChange}
                  />
                )}
              </div>
            ))}
          </div>
        ))}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-between pt-2">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setVisiblePosition((p) => Math.max(0, p - 1));
            }}
            disabled={visiblePosition === 0}
            className="rounded-md border border-crystal px-4 py-2 text-sm font-medium text-mahogany disabled:opacity-40"
          >
            {t.back}
          </button>

          {isLastStep ? (
            <button
              type="submit"
              disabled={isPending || isUploading || disclaimerBlocking(steps[currentStepIndex])}
              className="rounded-md bg-ignite px-4 py-2 text-sm font-medium text-white hover:bg-ignite-hover disabled:opacity-50"
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
              className="rounded-md bg-ignite px-4 py-2 text-sm font-medium text-white hover:bg-ignite-hover disabled:opacity-50"
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
    </div>
  );
}
