import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolveUploadPath } from "@/lib/files";
import { readFile, stat } from "fs/promises";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ submissionId: string; fileName: string }> },
) {
  const { submissionId, fileName } = await params;

  // Disclaimer images are FOT-authored content meant to be shown publicly on
  // the fill wizard, unlike agent-submitted files (which stay auth-gated).
  if (submissionId !== "disclaimer-images") {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  if (submissionId.includes("..") || fileName.includes("..")) {
    return new NextResponse("Invalid path", { status: 400 });
  }

  const filePath = resolveUploadPath(submissionId, fileName);

  try {
    await stat(filePath);
    const buffer = await readFile(filePath);
    return new NextResponse(new Uint8Array(buffer), {
      headers: { "Content-Type": "application/octet-stream" },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
