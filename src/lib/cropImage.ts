export async function cropAndResize(file: File, targetWidth: number, targetHeight: number): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const srcRatio = bitmap.width / bitmap.height;
  const targetRatio = targetWidth / targetHeight;

  let sx = 0;
  let sy = 0;
  let sw = bitmap.width;
  let sh = bitmap.height;

  if (srcRatio > targetRatio) {
    sw = bitmap.height * targetRatio;
    sx = (bitmap.width - sw) / 2;
  } else {
    sh = bitmap.width / targetRatio;
    sy = (bitmap.height - sh) / 2;
  }

  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);

  const outputType = file.type === "image/png" || file.type === "image/webp" ? file.type : "image/jpeg";

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, outputType, 0.92),
  );
  if (!blob) throw new Error("Failed to render cropped image");

  return new File([blob], file.name, { type: outputType });
}
