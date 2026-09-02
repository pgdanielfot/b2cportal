export type Condition = {
  fieldId: string;
  operator: "equals" | "not_equals";
  value: string;
} | null;

export function isConditionMet(condition: Condition, answers: Record<string, string>): boolean {
  if (!condition) return true;
  const actual = (answers[condition.fieldId] ?? "").trim();
  if (condition.operator === "equals") return actual === condition.value;
  return actual !== condition.value;
}
