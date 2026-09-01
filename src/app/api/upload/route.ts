import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = clientPayload ? JSON.parse(clientPayload) : null;
        const shareToken = payload?.shareToken as string | undefined;
        const fieldId = payload?.fieldId as string | undefined;

        if (!shareToken || !fieldId) {
          throw new Error("Missing upload context.");
        }

        const submission = await prisma.submission.findUnique({
          where: { shareToken },
          include: { product: { include: { steps: { include: { fields: true } } } } },
        });

        if (!submission) throw new Error("Invalid submission link.");
        if (submission.status === "SUBMITTED") {
          throw new Error("This form has already been submitted.");
        }

        const field = submission.product.steps.flatMap((s) => s.fields).find((f) => f.id === fieldId);
        if (!field || field.type !== "FILE") throw new Error("Invalid field.");

        const allowedTypes = (field.allowedTypes as string[] | null) ?? [];
        const maxSizeMb = field.maxSizeMb ?? 10;

        return {
          allowedContentTypes: allowedTypes.length > 0 ? allowedTypes : undefined,
          maximumSizeInBytes: maxSizeMb * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ shareToken, fieldId }),
        };
      },
      onUploadCompleted: async () => {
        // No-op: we record the uploaded URL when the form is submitted, not here.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

