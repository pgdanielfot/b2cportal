export type MediaDimensions = { width: number; height: number } | null;

export async function getMediaDimensions(file: File): Promise<MediaDimensions> {
  if (file.type.startsWith("image/")) {
    try {
      const bitmap = await createImageBitmap(file);
      return { width: bitmap.width, height: bitmap.height };
    } catch {
      return null;
    }
  }

  if (file.type.startsWith("video/")) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve({ width: video.videoWidth, height: video.videoHeight });
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      video.src = url;
    });
  }

  return null;
}
