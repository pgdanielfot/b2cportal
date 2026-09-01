"use client";

import { useState } from "react";

export default function CopyableValue({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
      } catch {
        // best effort fallback; nothing more we can do
      }
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mt-1 flex items-start gap-2">
      <p className="whitespace-pre-wrap text-sm text-mahogany">{value || "—"}</p>
      {value && (
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 rounded-md border border-crystal px-2 py-0.5 text-xs font-medium text-mahogany hover:bg-crystal-soft"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      )}
    </div>
  );
}
