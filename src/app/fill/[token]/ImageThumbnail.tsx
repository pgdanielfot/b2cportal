"use client";

import { useState } from "react";

export default function ImageThumbnail({
  src,
  alt,
  size = "h-16 w-16",
}: {
  src: string;
  alt: string;
  size?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${size} shrink-0 overflow-hidden rounded border border-crystal`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => setOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="max-h-full max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium text-mahogany hover:bg-white"
          >
            Close
          </button>
        </div>
      )}
    </>
  );
}
