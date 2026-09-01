export const FILE_FORMAT_OPTIONS: { value: string; label: string }[] = [
  { value: "image/png", label: "PNG" },
  { value: "image/jpeg", label: "JPEG" },
  { value: "image/webp", label: "WEBP" },
  { value: "image/gif", label: "GIF" },
  { value: "video/mp4", label: "MP4" },
  { value: "video/quicktime", label: "MOV" },
  { value: "application/pdf", label: "PDF" },
];

const LABEL_BY_MIME = new Map(FILE_FORMAT_OPTIONS.map((f) => [f.value, f.label]));

export function formatLabel(mime: string): string {
  return LABEL_BY_MIME.get(mime) ?? mime;
}

export function formatLabels(mimes: string[]): string {
  return mimes.map(formatLabel).join(", ");
}
