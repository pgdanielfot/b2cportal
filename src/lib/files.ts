import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { put } from "@vercel/blob";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

type SavedFile = { url: string; name: string; size: number; type: string };

export async function saveUploadedFile(
  submissionId: string,
  file: File,
  buffer?: Buffer,
): Promise<SavedFile> {
  const ext = path.extname(file.name);
  const storedName = `${randomUUID()}${ext}`;
  const data = buffer ?? Buffer.from(await file.arrayBuffer());

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`${submissionId}/${storedName}`, data, {
      access: "public",
      contentType: file.type || undefined,
    });
    return { url: blob.url, name: file.name, size: file.size, type: file.type };
  }

  const dir = path.join(UPLOAD_ROOT, submissionId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, storedName), data);

  return {
    url: `/api/files/${submissionId}/${storedName}`,
    name: file.name,
    size: file.size,
    type: file.type,
  };
}

export function resolveUploadPath(submissionId: string, storedName: string) {
  return path.join(UPLOAD_ROOT, submissionId, storedName);
}
