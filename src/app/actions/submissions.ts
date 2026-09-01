"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { saveUploadedFile } from "@/lib/files";
import { imageSize } from "image-size";
import { formatLabels } from "@/lib/fileFormats";

async function requireFotUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function createSubmissionLink(productId: string, soNumber: string) {
  const userId = await requireFotUser();

  if (!/^\d{5}$/.test(soNumber)) {
    throw new Error("SO number must be exactly 5 digits.");
  }

  const submission = await prisma.submission.create({
    data: { productId, soNumber, createdById: userId },
  });

  redirect(`/fot/products/${productId}?created=${submission.shareToken}`);
}

export async function deleteSubmission(submissionId: string, productId: string) {
  await requireFotUser();
  await prisma.submission.delete({ where: { id: submissionId } });
  redirect(`/fot/products/${productId}`);
}

export async function deleteSubmissionFromList(submissionId: string) {
  await requireFotUser();
  await prisma.submission.delete({ where: { id: submissionId } });
  revalidatePath("/fot/submissions");
}

export async function setSubmissionArchived(submissionId: string, archived: boolean) {
  await requireFotUser();
  await prisma.submission.update({ where: { id: submissionId }, data: { archived } });
  revalidatePath("/fot/submissions");
}

export type SubmitFormResult = { ok: true } | { ok: false; error: string };

export async function submitFillForm(
  token: string,
  formData: FormData,
): Promise<SubmitFormResult> {
  const submission = await prisma.submission.findUnique({
    where: { shareToken: token },
    include: { product: { include: { steps: { include: { fields: true } } } } },
  });

  if (!submission) return { ok: false, error: "This link is invalid." };
  if (submission.status === "SUBMITTED") {
    return { ok: false, error: "This form has already been submitted." };
  }

  const allFields = submission.product.steps.flatMap((s) => s.fields);

  for (const field of allFields) {
    if (field.type === "FILE") {
      const files = formData.getAll(field.id).filter((v): v is File => v instanceof File && v.size > 0);

      if (field.required && files.length === 0) {
        return { ok: false, error: `"${field.label}" is required.` };
      }

      if (files.length === 0) continue;

      const minFiles = field.minFiles ?? 1;
      if (files.length < minFiles) {
        return { ok: false, error: `"${field.label}" requires at least ${minFiles} file(s).` };
      }

      const maxFiles = field.maxFiles ?? 1;
      if (files.length > maxFiles) {
        return { ok: false, error: `"${field.label}" allows at most ${maxFiles} file(s).` };
      }

      const maxSizeMb = field.maxSizeMb ?? 10;
      const allowedTypes = (field.allowedTypes as string[] | null) ?? [];

      const buffers: Buffer[] = [];
      for (const file of files) {
        if (file.size > maxSizeMb * 1024 * 1024) {
          return { ok: false, error: `"${field.label}" exceeds ${maxSizeMb}MB limit.` };
        }
        if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
          return {
            ok: false,
            error: `"${field.label}": "${file.name}" is not an accepted format. Allowed formats: ${formatLabels(allowedTypes)}.`,
          };
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        buffers.push(buffer);

        if (field.width || field.height) {
          try {
            const dimensions = imageSize(buffer);
            if (
              (field.width && dimensions.width !== field.width) ||
              (field.height && dimensions.height !== field.height)
            ) {
              return {
                ok: false,
                error: `"${field.label}": "${file.name}" is ${dimensions.width}×${dimensions.height}px, but must be exactly ${field.width ?? "any"}×${field.height ?? "any"}px. Crop or resize it and try again.`,
              };
            }
          } catch {
            return {
              ok: false,
              error: `"${field.label}": "${file.name}" could not be read as an image, so its dimensions couldn't be checked.`,
            };
          }
        }
      }

      const savedFiles = [];
      for (let i = 0; i < files.length; i++) {
        savedFiles.push(await saveUploadedFile(submission.id, files[i], buffers[i]));
      }

      await prisma.fieldValue.upsert({
        where: { submissionId_fieldId: { submissionId: submission.id, fieldId: field.id } },
        create: { submissionId: submission.id, fieldId: field.id, files: savedFiles },
        update: { files: savedFiles },
      });
    } else {
      const value = (formData.get(field.id) as string | null)?.trim() ?? "";

      if (field.required && !value) {
        return { ok: false, error: `"${field.label}" is required.` };
      }

      if (!value) continue;

      if (field.maxLength && value.length > field.maxLength) {
        return { ok: false, error: `"${field.label}" exceeds the ${field.maxLength} character limit.` };
      }

      if (field.type === "URL") {
        try {
          new URL(value);
        } catch {
          return { ok: false, error: `"${field.label}" must be a valid URL.` };
        }
      }

      await prisma.fieldValue.upsert({
        where: { submissionId_fieldId: { submissionId: submission.id, fieldId: field.id } },
        create: { submissionId: submission.id, fieldId: field.id, value },
        update: { value },
      });
    }
  }

  await prisma.submission.update({
    where: { id: submission.id },
    data: { status: "SUBMITTED", submittedAt: new Date() },
  });

  return { ok: true };
}
