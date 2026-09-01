"use client";

import { useEffect, useRef, useState } from "react";

const DISPLAY_MAX = 480;

export default function ManualCropModal({
  file,
  targetWidth,
  targetHeight,
  onCancel,
  onConfirm,
}: {
  file: File;
  targetWidth: number;
  targetHeight: number;
  onCancel: () => void;
  onConfirm: (file: File) => void;
}) {
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);
  const dragState = useRef<{ startX: number; startY: number; origin: { x: number; y: number } } | null>(
    null,
  );

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => setImgEl(img);
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!imgEl) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
        <p className="text-white text-sm">Loading image…</p>
      </div>
    );
  }

  const img = imgEl;
  const targetRatio = targetWidth / targetHeight;
  const naturalRatio = img.naturalWidth / img.naturalHeight;

  let cropW: number;
  let cropH: number;
  if (naturalRatio > targetRatio) {
    cropH = img.naturalHeight;
    cropW = cropH * targetRatio;
  } else {
    cropW = img.naturalWidth;
    cropH = cropW / targetRatio;
  }

  const maxX = img.naturalWidth - cropW;
  const maxY = img.naturalHeight - cropH;

  const displayScale = Math.min(DISPLAY_MAX / img.naturalWidth, DISPLAY_MAX / img.naturalHeight, 1);
  const displayW = img.naturalWidth * displayScale;
  const displayH = img.naturalHeight * displayScale;

  function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
  }

  function handlePointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, origin: offset };
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragState.current) return;
    const dxDisplay = e.clientX - dragState.current.startX;
    const dyDisplay = e.clientY - dragState.current.startY;
    const dxNatural = dxDisplay / displayScale;
    const dyNatural = dyDisplay / displayScale;
    setOffset({
      x: clamp(dragState.current.origin.x - dxNatural, 0, Math.max(0, maxX)),
      y: clamp(dragState.current.origin.y - dyNatural, 0, Math.max(0, maxY)),
    });
  }

  function handlePointerUp() {
    dragState.current = null;
  }

  async function handleApply() {
    setProcessing(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      ctx.drawImage(img, offset.x, offset.y, cropW, cropH, 0, 0, targetWidth, targetHeight);

      const outputType =
        file.type === "image/png" || file.type === "image/webp" ? file.type : "image/jpeg";
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, outputType, 0.92));
      if (!blob) throw new Error("Failed to render cropped image");

      onConfirm(new File([blob], file.name, { type: outputType }));
    } finally {
      setProcessing(false);
    }
  }

  // Position of the crop-box overlay in the (fixed-size, un-panned) view: the
  // image itself pans under a fixed-position crop window centered in the display area.
  const boxDisplayW = cropW * displayScale;
  const boxDisplayH = cropH * displayScale;
  const imgOffsetXDisplay = -offset.x * displayScale;
  const imgOffsetYDisplay = -offset.y * displayScale;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="w-full max-w-lg space-y-4 rounded-lg bg-white p-5">
        <div>
          <h2 className="font-semibold text-mahogany">Position your crop</h2>
          <p className="text-xs text-mahogany/50">
            Drag the image to choose what stays inside the frame. Output will be exactly{" "}
            {targetWidth}×{targetHeight}px.
          </p>
        </div>

        <div
          className="relative mx-auto touch-none overflow-hidden rounded-md border border-crystal bg-black/5"
          style={{ width: boxDisplayW, height: boxDisplayH }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.src}
            alt="Crop preview"
            draggable={false}
            className="absolute max-w-none cursor-move select-none"
            style={{
              width: displayW,
              height: displayH,
              left: imgOffsetXDisplay,
              top: imgOffsetYDisplay,
            }}
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-crystal px-4 py-2 text-sm font-medium text-mahogany hover:bg-crystal-soft"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={processing}
            className="rounded-md bg-ignite px-4 py-2 text-sm font-medium text-white hover:bg-ignite-hover disabled:opacity-50"
          >
            {processing ? "Applying..." : "Apply crop"}
          </button>
        </div>
      </div>
    </div>
  );
}
