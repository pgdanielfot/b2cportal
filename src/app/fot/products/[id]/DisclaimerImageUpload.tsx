"use client";

import { useRef, useState } from "react";
import { uploadDisclaimerImage } from "@/app/actions/products";

export default function DisclaimerImageUpload({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (url: string | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const result = await uploadDisclaimerImage(formData);
      if (result.ok) {
        onChange(result.url);
      } else {
        setError(result.error);
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-mahogany/50">
        Reference image shown with this disclaimer (optional)
      </label>
      {value && (
        <div className="flex items-start gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="max-h-32 w-auto rounded-md border border-crystal" />
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-xs text-red-600 hover:underline"
          >
            Remove
          </button>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
        className="block w-full text-xs"
      />
      {uploading && <p className="text-xs text-mahogany/50">Uploading…</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
