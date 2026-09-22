"use client";

import { useRef, useState, useTransition } from "react";
import { saveProduct } from "@/app/actions/products";
import type { ProductDraft, StepDraft, FieldDraft, FieldTypeValue } from "@/lib/types";
import { FILE_FORMAT_OPTIONS } from "@/lib/fileFormats";
import ConditionEditor from "./ConditionEditor";
import DisclaimerImageUpload from "./DisclaimerImageUpload";

const FIELD_TYPES: { value: FieldTypeValue; label: string }[] = [
  { value: "TEXT", label: "Text box" },
  { value: "TEXTAREA", label: "Long text" },
  { value: "URL", label: "URL / Link" },
  { value: "DATE", label: "Calendar / Date" },
  { value: "DROPDOWN", label: "Dropdown" },
  { value: "FILE", label: "Media upload" },
];

let tempId = 0;
function newTempId() {
  tempId -= 1;
  return `temp-${tempId}`;
}

export default function ProductBuilder({ initial }: { initial: ProductDraft }) {
  const [draft, setDraft] = useState<ProductDraft>(initial);
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const draggedStepIndex = useRef<number | null>(null);
  const draggedField = useRef<{ stepIndex: number; fieldIndex: number } | null>(null);

  function reorderStep(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    setDraft((d) => {
      const steps = [...d.steps];
      const [moved] = steps.splice(fromIndex, 1);
      steps.splice(toIndex, 0, moved);
      return { ...d, steps };
    });
  }

  function reorderField(stepIndex: number, fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    setDraft((d) => ({
      ...d,
      steps: d.steps.map((s, i) => {
        if (i !== stepIndex) return s;
        const fields = [...s.fields];
        const [moved] = fields.splice(fromIndex, 1);
        fields.splice(toIndex, 0, moved);
        return { ...s, fields };
      }),
    }));
  }

  function updateStep(stepIndex: number, patch: Partial<StepDraft>) {
    setDraft((d) => ({
      ...d,
      steps: d.steps.map((s, i) => (i === stepIndex ? { ...s, ...patch } : s)),
    }));
  }

  function addStep() {
    setDraft((d) => ({
      ...d,
      steps: [
        ...d.steps,
        { id: newTempId(), title: `Step ${d.steps.length + 1}`, order: d.steps.length, fields: [] },
      ],
    }));
  }

  function removeStep(stepIndex: number) {
    setDraft((d) => ({ ...d, steps: d.steps.filter((_, i) => i !== stepIndex) }));
  }

  function addField(stepIndex: number) {
    setDraft((d) => ({
      ...d,
      steps: d.steps.map((s, i) =>
        i === stepIndex
          ? {
              ...s,
              fields: [
                ...s.fields,
                {
                  id: newTempId(),
                  label: "New field",
                  type: "TEXT",
                  required: false,
                  order: s.fields.length,
                  options: [],
                  maxFiles: 1,
                  maxSizeMb: 10,
                  allowedTypes: [],
                },
              ],
            }
          : s,
      ),
    }));
  }

  function updateField(stepIndex: number, fieldIndex: number, patch: Partial<FieldDraft>) {
    setDraft((d) => ({
      ...d,
      steps: d.steps.map((s, i) =>
        i === stepIndex
          ? {
              ...s,
              fields: s.fields.map((f, j) => (j === fieldIndex ? { ...f, ...patch } : f)),
            }
          : s,
      ),
    }));
  }

  function removeField(stepIndex: number, fieldIndex: number) {
    setDraft((d) => ({
      ...d,
      steps: d.steps.map((s, i) =>
        i === stepIndex ? { ...s, fields: s.fields.filter((_, j) => j !== fieldIndex) } : s,
      ),
    }));
  }

  function savedFieldsExcept(predicate: (stepIndex: number, fieldIndex: number) => boolean) {
    return draft.steps.flatMap((s, si) =>
      s.fields
        .map((f, fi) => ({ ...f, stepIndex: si, fieldIndex: fi }))
        .filter(
          (f): f is typeof f & { id: string } =>
            !!f.id && !f.id.startsWith("temp-") && predicate(f.stepIndex, f.fieldIndex),
        ),
    );
  }

  function handleSave() {
    startTransition(async () => {
      const cleaned: ProductDraft = {
        ...draft,
        steps: draft.steps.map((s, i) => ({
          ...s,
          id: s.id?.startsWith("temp-") ? undefined : s.id,
          order: i,
          fields: s.fields.map((f, j) => ({
            ...f,
            id: f.id?.startsWith("temp-") ? undefined : f.id,
            order: j,
            options: f.options?.map((o) => o.trim()).filter(Boolean),
          })),
        })),
      };
      await saveProduct(cleaned);
      setSavedAt(new Date().toLocaleTimeString());
    });
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-3 z-10 flex flex-col gap-3 rounded-2xl border border-crystal bg-white/95 p-3 shadow-sm backdrop-blur sm:flex-row sm:items-center">
        <input
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          className="flex-1 rounded-xl border border-crystal bg-[#fbfcff] px-4 py-3 text-lg font-bold text-mahogany outline-none transition focus:border-ignite focus:ring-4 focus:ring-ignite/10"
        />
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded-xl bg-ignite px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-ignite-hover disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        {savedAt && <span className="text-sm text-mahogany/50">Saved at {savedAt}</span>}
      </div>

      {draft.steps.map((step, stepIndex) => (
        <div
          key={step.id ?? stepIndex}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (draggedStepIndex.current !== null) {
              reorderStep(draggedStepIndex.current, stepIndex);
              draggedStepIndex.current = null;
            }
          }}
          className="space-y-5 rounded-3xl border border-crystal bg-white p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-center gap-2 border-b border-crystal pb-4">
            <span
              draggable
              onDragStart={() => {
                draggedStepIndex.current = stepIndex;
              }}
              title="Drag to reorder step"
              className="cursor-grab select-none text-mahogany/30 hover:text-mahogany active:cursor-grabbing"
            >
              ⠿
            </span>
            <span className="rounded-full bg-crystal-soft px-2.5 py-1 text-xs font-bold text-mahogany/55">Step {stepIndex + 1}</span>
            <input
              value={step.title}
              onChange={(e) => updateStep(stepIndex, { title: e.target.value })}
              className="min-w-[200px] flex-1 rounded-xl border border-crystal bg-[#fbfcff] px-3 py-2 text-sm font-semibold text-mahogany outline-none transition focus:border-ignite focus:ring-4 focus:ring-ignite/10"
            />
            <button
              onClick={() => removeStep(stepIndex)}
              className="ml-auto text-sm font-medium text-red-600 hover:underline"
            >
              Remove step
            </button>
          </div>

          <div className="grid gap-3 rounded-2xl bg-crystal-soft/60 p-3 sm:grid-cols-2">
            <input
              value={step.titleMs ?? ""}
              onChange={(e) => updateStep(stepIndex, { titleMs: e.target.value })}
              placeholder="Bahasa Melayu title (optional)"
              className="w-full rounded-lg border border-crystal bg-white px-3 py-2 text-sm outline-none focus:border-ignite"
            />
            <input
              value={step.titleZh ?? ""}
              onChange={(e) => updateStep(stepIndex, { titleZh: e.target.value })}
              placeholder="Mandarin title (optional)"
              className="w-full rounded-lg border border-crystal bg-white px-3 py-2 text-sm outline-none focus:border-ignite"
            />
          </div>

          <details className="rounded-2xl border border-crystal bg-[#fbfcff] p-4">
            <summary className="cursor-pointer text-sm font-semibold text-mahogany">Disclaimer & display rules <span className="font-normal text-mahogany/50">(optional)</span></summary>
            <div className="mt-4 space-y-2">
            <textarea
              value={step.disclaimer ?? ""}
              onChange={(e) => updateStep(stepIndex, { disclaimer: e.target.value })}
              placeholder="Disclaimer in English"
              rows={2}
              className="w-full rounded-lg border border-crystal bg-white px-3 py-2 text-sm outline-none focus:border-ignite"
            />
            <textarea
              value={step.disclaimerMs ?? ""}
              onChange={(e) => updateStep(stepIndex, { disclaimerMs: e.target.value })}
              placeholder="Disclaimer in Bahasa Melayu (optional)"
              rows={2}
              className="w-full rounded-lg border border-crystal bg-white px-3 py-2 text-sm outline-none focus:border-ignite"
            />
            <textarea
              value={step.disclaimerZh ?? ""}
              onChange={(e) => updateStep(stepIndex, { disclaimerZh: e.target.value })}
              placeholder="Disclaimer in Mandarin (optional)"
              rows={2}
              className="w-full rounded-lg border border-crystal bg-white px-3 py-2 text-sm outline-none focus:border-ignite"
            />
            <DisclaimerImageUpload
              value={step.disclaimerImage}
              onChange={(disclaimerImage) => updateStep(stepIndex, { disclaimerImage })}
            />
            <ConditionEditor
              condition={step.disclaimerCondition}
              candidateFields={savedFieldsExcept((si) => si === stepIndex)}
              onChange={(disclaimerCondition) => updateStep(stepIndex, { disclaimerCondition })}
              label="Only show this disclaimer if a specific answer is chosen"
            />
            </div>
          </details>

          <details className="rounded-xl border border-dashed border-crystal bg-white px-4 py-3"><summary className="cursor-pointer text-sm font-medium text-mahogany/70">Show this step only when an answer matches</summary><div className="mt-3"><ConditionEditor condition={step.condition} candidateFields={savedFieldsExcept((si) => si !== stepIndex)} onChange={(condition) => updateStep(stepIndex, { condition })} /></div></details>

          <div className="space-y-3">
            {step.fields.map((field, fieldIndex) => (
              <div
                key={field.id ?? fieldIndex}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const from = draggedField.current;
                  if (from && from.stepIndex === stepIndex) {
                    reorderField(stepIndex, from.fieldIndex, fieldIndex);
                  }
                  draggedField.current = null;
                }}
                className="space-y-3 rounded-2xl border border-crystal bg-[#fbfcff] p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    draggable
                    onDragStart={() => {
                      draggedField.current = { stepIndex, fieldIndex };
                    }}
                    title="Drag to reorder field"
                    className="cursor-grab select-none text-mahogany/30 hover:text-mahogany active:cursor-grabbing"
                  >
                    ⠿
                  </span>
                  <input
                    value={field.label}
                    onChange={(e) => updateField(stepIndex, fieldIndex, { label: e.target.value })}
                    placeholder="Field label"
                    className="min-w-[200px] flex-1 rounded-xl border border-crystal bg-white px-3 py-2 text-sm font-semibold text-mahogany outline-none focus:border-ignite"
                  />
                  <select
                    value={field.type}
                    onChange={(e) =>
                      updateField(stepIndex, fieldIndex, { type: e.target.value as FieldTypeValue })
                    }
                    className="rounded-xl border border-crystal bg-white px-3 py-2 text-sm outline-none focus:border-ignite"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-1 rounded-lg bg-white px-2 py-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) =>
                        updateField(stepIndex, fieldIndex, { required: e.target.checked })
                      }
                    />
                    Required
                  </label>
                  <button
                    onClick={() => removeField(stepIndex, fieldIndex)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid gap-3 rounded-xl bg-white p-3 sm:grid-cols-2">
                  <input
                    value={field.labelMs ?? ""}
                    onChange={(e) => updateField(stepIndex, fieldIndex, { labelMs: e.target.value })}
                    placeholder="Bahasa Melayu label (optional)"
                    className="w-full rounded-lg border border-crystal px-3 py-2 text-sm outline-none focus:border-ignite"
                  />
                  <input
                    value={field.labelZh ?? ""}
                    onChange={(e) => updateField(stepIndex, fieldIndex, { labelZh: e.target.value })}
                    placeholder="Mandarin label (optional)"
                    className="w-full rounded-lg border border-crystal px-3 py-2 text-sm outline-none focus:border-ignite"
                  />
                </div>

                {(field.type === "TEXT" || field.type === "TEXTAREA") && (
                  <label className="flex items-center gap-1 text-sm text-mahogany/70">
                    Character limit
                    <input
                      type="number"
                      min={1}
                      value={field.maxLength ?? ""}
                      onChange={(e) =>
                        updateField(stepIndex, fieldIndex, {
                          maxLength: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      placeholder="No limit"
                      className="w-24 rounded-md border px-2 py-1 focus:border-ignite focus:outline-none"
                    />
                  </label>
                )}

                {field.type === "DROPDOWN" && (
                  <div className="space-y-2">
                    {(field.options ?? []).map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center gap-2">
                        <input
                          value={option}
                          onChange={(e) => {
                            const options = [...(field.options ?? [])];
                            options[optionIndex] = e.target.value;
                            updateField(stepIndex, fieldIndex, { options });
                          }}
                          placeholder={`Option ${optionIndex + 1}`}
                          className="flex-1 rounded-md border px-2 py-1.5 text-sm focus:border-ignite focus:outline-none"
                        />
                        <button
                          onClick={() => {
                            const options = (field.options ?? []).filter((_, i) => i !== optionIndex);
                            updateField(stepIndex, fieldIndex, { options });
                          }}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() =>
                        updateField(stepIndex, fieldIndex, {
                          options: [...(field.options ?? []), ""],
                        })
                      }
                      className="text-sm font-medium text-ignite hover:underline"
                    >
                      + Add option
                    </button>
                  </div>
                )}

                {field.type === "FILE" && (
                  <div className="flex flex-wrap gap-2">
                    <label className="flex items-center gap-1 text-sm">
                      Min files
                      <input
                        type="number"
                        min={0}
                        value={field.minFiles ?? 1}
                        onChange={(e) =>
                          updateField(stepIndex, fieldIndex, { minFiles: Number(e.target.value) })
                        }
                        className="w-16 rounded-md border px-2 py-1"
                      />
                    </label>
                    <label className="flex items-center gap-1 text-sm">
                      Max files
                      <input
                        type="number"
                        min={1}
                        value={field.maxFiles ?? 1}
                        onChange={(e) =>
                          updateField(stepIndex, fieldIndex, { maxFiles: Number(e.target.value) })
                        }
                        className="w-16 rounded-md border px-2 py-1"
                      />
                    </label>
                    <label className="flex items-center gap-1 text-sm">
                      Max size (MB)
                      <input
                        type="number"
                        min={1}
                        value={field.maxSizeMb ?? 10}
                        onChange={(e) =>
                          updateField(stepIndex, fieldIndex, { maxSizeMb: Number(e.target.value) })
                        }
                        className="w-16 rounded-md border px-2 py-1"
                      />
                    </label>
                    <label className="flex items-center gap-1 text-sm">
                      Width (px)
                      <input
                        type="number"
                        min={1}
                        value={field.width ?? ""}
                        onChange={(e) =>
                          updateField(stepIndex, fieldIndex, {
                            width: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        placeholder="Any"
                        className="w-20 rounded-md border px-2 py-1"
                      />
                    </label>
                    <label className="flex items-center gap-1 text-sm">
                      Height (px)
                      <input
                        type="number"
                        min={1}
                        value={field.height ?? ""}
                        onChange={(e) =>
                          updateField(stepIndex, fieldIndex, {
                            height: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        placeholder="Any"
                        className="w-20 rounded-md border px-2 py-1"
                      />
                    </label>
                    <label className="flex items-center gap-1 text-sm">
                      Sample link
                      <input
                        type="text"
                        value={field.sampleUrl ?? ""}
                        onChange={(e) =>
                          updateField(stepIndex, fieldIndex, { sampleUrl: e.target.value })
                        }
                        placeholder="https://... (optional reference for this upload)"
                        className="w-40 rounded-md border px-2 py-1"
                      />
                    </label>
                    <div className="min-w-[160px] space-y-1">
                      <select
                        multiple
                        value={field.allowedTypes ?? []}
                        onChange={(e) =>
                          updateField(stepIndex, fieldIndex, {
                            allowedTypes: Array.from(e.target.selectedOptions, (o) => o.value),
                          })
                        }
                        className="w-full rounded-md border px-2 py-1.5 text-sm"
                        size={FILE_FORMAT_OPTIONS.length}
                      >
                        {FILE_FORMAT_OPTIONS.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-mahogany/40">
                        Ctrl/Cmd-click to select multiple. None selected = any format.
                      </p>
                    </div>
                  </div>
                )}

                <ConditionEditor
                  condition={field.condition}
                  candidateFields={savedFieldsExcept(
                    (si, fi) => !(si === stepIndex && fi === fieldIndex),
                  )}
                  onChange={(condition) => updateField(stepIndex, fieldIndex, { condition })}
                />
              </div>
            ))}
          </div>

          <button
            onClick={() => addField(stepIndex)}
            className="text-sm font-medium text-ignite hover:underline"
          >
            + Add field
          </button>
        </div>
      ))}

      <button
        onClick={addStep}
        className="rounded-md border border-dashed border-crystal px-4 py-2 text-sm font-medium text-mahogany/70 hover:bg-crystal-soft"
      >
        + Add step
      </button>
    </div>
  );
}
