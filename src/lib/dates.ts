const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toDateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Adds `days` working days (skipping Sat/Sun) to `from`, returned as a date-only value. */
export function addWorkingDays(from: Date, days: number): Date {
  const result = toDateOnly(from);
  let added = 0;
  while (added < days) {
    result.setTime(result.getTime() + MS_PER_DAY);
    const weekday = result.getDay();
    if (weekday !== 0 && weekday !== 6) added++;
  }
  return result;
}

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Earliest selectable date (YYYY-MM-DD) that is at least `workingDays` working days from now. */
export function minLeadDateString(workingDays = 7, from: Date = new Date()): string {
  return toDateInputValue(addWorkingDays(from, workingDays));
}
