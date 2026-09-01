"use client";

import { useRef, useState, useTransition } from "react";
import { submitFillForm } from "@/app/actions/submissions";
import FileFieldInput from "./FileFieldInput";
import ImageThumbnail from "./ImageThumbnail";

type Field = {
  id: string;
  label: string;
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
};

type Step = {
  id: string;
  title: string;
  fields: Field[];
};

export default function FillWizard({
  token,
  productName,
  steps,
}: {
  token: string;
  productName: string;
  steps: Step[];
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [charCounts, setCharCounts] = useState<Record<string, number>>({});
  const [uploadedSummary, setUploadedSummary] = useState<
    { label: string; files: { name: string; url: string; type: string }[] }[]
  >([]);
  const formRef = useRef<HTMLFormElement>(null);

  const isLastStep = currentStep === steps.length - 1;

  function validateStep(stepIndex: number): string | null {
    const form = formRef.current;
    if (!form) return null;

    for (const field of steps[stepIndex].fields) {
      if (!field.required) continue;

      if (field.type === "FILE") {
        const input = form.elements.namedItem(field.id) as HTMLInputElement | null;
        const fileCount = input?.files?.length ?? 0;
        if (fileCount < (field.minFiles ?? 1)) {
          return `"${field.label}" is required.`;
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
        return `"${field.label}" is required.`;
      }

      if (field.type === "URL") {
        try {
          new URL(value);
        } catch {
          return `"${field.label}" must be a valid URL.`;
        }
      }
    }

    return null;
  }

  function handleNext() {
    const validationError = validateStep(currentStep);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setCurrentStep((s) => Math.min(steps.length - 1, s + 1));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await submitFillForm(token, formData);
      if (result.ok) {
        const fileFields = steps.flatMap((s) => s.fields).filter((f) => f.type === "FILE");
        setUploadedSummary(
          fileFields
            .map((f) => ({
              label: f.label,
              files: formData
                .getAll(f.id)
                .filter((v): v is File => v instanceof File && v.size > 0)
                .map((file) => ({
                  name: file.name,
                  url: URL.createObjectURL(file),
                  type: file.type,
                })),
            }))
            .filter((f) => f.files.length > 0),
        );
        setDone(true);
      } else {
        setError(result.error);
      }
    });
  }

  if (done) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-crystal bg-white p-8 text-center space-y-2">
          <p className="text-2xl">✅</p>
          <h1 className="text-lg font-semibold text-mahogany">Thank you!</h1>
          <p className="text-sm text-mahogany/60">Your submission has been received.</p>
        </div>

        {uploadedSummary.length > 0 && (
          <div className="rounded-lg border border-crystal bg-white p-6 space-y-4">
            <h2 className="font-medium text-mahogany">Uploaded files</h2>
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
          {steps.map((s, i) => (
            <div
              key={s.id}
              className={`h-1.5 flex-1 rounded-full ${i <= currentStep ? "bg-ignite" : "bg-crystal"}`}
            />
          ))}
        </div>
      </div>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="rounded-lg border border-crystal bg-white p-6 space-y-5"
      >
        {steps.map((step, stepIndex) => (
          <div key={step.id} className={stepIndex === currentStep ? "space-y-4" : "hidden"}>
            <h2 className="font-medium text-mahogany">{step.title}</h2>
            {step.fields.map((field) => (
              <div key={field.id} className="space-y-1">
                <label className="text-sm font-medium text-mahogany">
                  {field.label}
                  {field.required && <span className="text-ignite"> *</span>}
                </label>

                {field.type === "TEXT" && (
                  <>
                    <input
                      name={field.id}
                      maxLength={field.maxLength ?? undefined}
                      onChange={(e) =>
                        setCharCounts((c) => ({ ...c, [field.id]: e.target.value.length }))
                      }
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
                      onChange={(e) =>
                        setCharCounts((c) => ({ ...c, [field.id]: e.target.value.length }))
                      }
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
                    className="w-full rounded-md border px-3 py-2 text-sm focus:border-ignite focus:outline-none"
                  />
                )}
                {field.type === "DATE" && (
                  <input
                    type="date"
                    name={field.id}
                    className="w-full rounded-md border px-3 py-2 text-sm focus:border-ignite focus:outline-none"
                  />
                )}
                {field.type === "DROPDOWN" && (
                  <select name={field.id} className="w-full rounded-md border px-3 py-2 text-sm">
                    <option value="">Select...</option>
                    {field.options.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                )}
                {field.type === "FILE" && <FileFieldInput field={field} />}
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
              setCurrentStep((s) => Math.max(0, s - 1));
            }}
            disabled={currentStep === 0}
            className="rounded-md border border-crystal px-4 py-2 text-sm font-medium text-mahogany disabled:opacity-40"
          >
            Back
          </button>

          {isLastStep ? (
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-ignite px-4 py-2 text-sm font-medium text-white hover:bg-ignite-hover disabled:opacity-50"
            >
              {isPending ? "Submitting..." : "Submit"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="rounded-md bg-ignite px-4 py-2 text-sm font-medium text-white hover:bg-ignite-hover"
            >
              Next
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
