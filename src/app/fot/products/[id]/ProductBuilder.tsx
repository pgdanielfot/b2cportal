"use client";

import { useState, useTransition } from "react";
import { saveProduct } from "@/app/actions/products";
import type { ProductDraft, StepDraft, FieldDraft, FieldTypeValue } from "@/lib/types";
import { FILE_FORMAT_OPTIONS } from "@/lib/fileFormats";
import ConditionEditor from "./ConditionEditor";

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
      <div className="flex items-center gap-3">
        <input
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          className="flex-1 rounded-md border px-3 py-2 text-lg font-semibold text-mahogany focus:border-ignite focus:outline-none"
        />
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded-md bg-ignite px-4 py-2 text-sm font-medium text-white hover:bg-ignite-hover disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        {savedAt && <span className="text-sm text-mahogany/50">Saved at {savedAt}</span>}
      </div>

      {draft.steps.map((step, stepIndex) => (
        <div key={step.id ?? stepIndex} className="rounded-lg border border-crystal bg-white p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-mahogany/40">Step {stepIndex + 1}</span>
            <input
              value={step.title}
              onChange={(e) => updateStep(stepIndex, { title: e.target.value })}
              className="flex-1 rounded-md border px-3 py-1.5 text-sm font-medium focus:border-ignite focus:outline-none"
            />
            <button
              onClick={() => removeStep(stepIndex)}
              className="text-sm text-red-600 hover:underline"
            >
              Remove step
            </button>
          </div>

          <ConditionEditor
            condition={step.condition}
            candidateFields={savedFieldsExcept((si) => si !== stepIndex)}
            onChange={(condition) => updateStep(stepIndex, { condition })}
          />

          <div className="space-y-3">
            {step.fields.map((field, fieldIndex) => (
              <div key={field.id ?? fieldIndex} className="rounded-md border border-crystal p-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={field.label}
                    onChange={(e) => updateField(stepIndex, fieldIndex, { label: e.target.value })}
                    placeholder="Field label"
                    className="flex-1 min-w-[160px] rounded-md border px-2 py-1.5 text-sm"
                  />
                  <select
                    value={field.type}
                    onChange={(e) =>
                      updateField(stepIndex, fieldIndex, { type: e.target.value as FieldTypeValue })
                    }
                    className="rounded-md border px-2 py-1.5 text-sm"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-1 text-sm">
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
