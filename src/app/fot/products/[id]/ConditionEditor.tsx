"use client";

import type { Condition } from "@/lib/conditions";
import type { FieldTypeValue } from "@/lib/types";

type CandidateField = {
  id: string;
  label: string;
  type: FieldTypeValue;
  options?: string[];
};

export default function ConditionEditor({
  condition,
  candidateFields,
  onChange,
}: {
  condition: Condition | undefined;
  candidateFields: CandidateField[];
  onChange: (condition: Condition | undefined) => void;
}) {
  const selectedField = candidateFields.find((f) => f.id === condition?.fieldId);

  if (candidateFields.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border border-dashed border-mahogany/20 p-2 space-y-2">
      <label className="flex items-center gap-2 text-xs text-mahogany/70">
        <input
          type="checkbox"
          checked={!!condition}
          onChange={(e) =>
            onChange(
              e.target.checked
                ? { fieldId: candidateFields[0].id, operator: "equals", value: "" }
                : undefined,
            )
          }
        />
        Only show if another answer matches
      </label>

      {condition && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <select
            value={condition.fieldId}
            onChange={(e) => onChange({ ...condition, fieldId: e.target.value, value: "" })}
            className="rounded-md border px-2 py-1 text-sm"
          >
            {candidateFields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label || "Untitled field"}
              </option>
            ))}
          </select>

          <select
            value={condition.operator}
            onChange={(e) =>
              onChange({ ...condition, operator: e.target.value as "equals" | "not_equals" })
            }
            className="rounded-md border px-2 py-1 text-sm"
          >
            <option value="equals">is</option>
            <option value="not_equals">is not</option>
          </select>

          {selectedField?.type === "DROPDOWN" ? (
            <select
              value={condition.value}
              onChange={(e) => onChange({ ...condition, value: e.target.value })}
              className="rounded-md border px-2 py-1 text-sm"
            >
              <option value="">Select...</option>
              {(selectedField.options ?? []).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={condition.value}
              onChange={(e) => onChange({ ...condition, value: e.target.value })}
              placeholder="Value"
              className="rounded-md border px-2 py-1 text-sm"
            />
          )}
        </div>
      )}
    </div>
  );
}
