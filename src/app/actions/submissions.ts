"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { saveUploadedFile } from "@/lib/files";
import { imageSize } from "image-size";
import { formatLabels } from "@/lib/fileFormats";
import { isConditionMet, type Condition } from "@/lib/conditions";
import { minLeadDateString } from "@/lib/dates";

const MIN_LEAD_WORKING_DAYS = 7;

async function requireFotUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const existing = await prisma.fotUser.findUnique({ where: { id: session.user.id } });
  if (existing) return existing.id;

  // Local development uses its own database, while the browser can retain a
  // signed-in FOT session from the normal portal. Mirror that known local
  // session user here so campaign testing does not fail on a foreign key.
  if (process.env.DATABASE_URL?.includes("localhost:51214")) {
    const email = session.user.email || `local-${session.user.id}@example.test`;
    const byEmail = await prisma.fotUser.findUnique({ where: { email } });
    if (byEmail) return byEmail.id;
    const localUser = await prisma.fotUser.create({
      data: { id: session.user.id, email, name: session.user.name || "Local FOT User", passwordHash: "local-session-only" },
    });
    return localUser.id;
  }

  throw new Error("Your FOT account could not be found.");
}

export async function createCampaignLink(productId: string, soNumber: string, quantity: number) {
  const userId = await requireFotUser();

  if (!/^\d{5,6}$/.test(soNumber)) {
    throw new Error("SO number must be 5 or 6 digits.");
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    throw new Error("Campaign quantity must be between 1 and 20.");
  }

  const campaign = await prisma.campaign.create({
    data: {
      productId,
      soNumber,
      quantity,
      createdById: userId,
      submissions: {
        create: Array.from({ length: quantity }, (_, index) => ({
          productId,
          soNumber,
          createdById: userId,
          campaignSequence: index + 1,
        })),
      },
    },
  });

  redirect(`/fot/products/${productId}?createdCampaign=${campaign.shareToken}`);
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

  const language = (formData.get("__language") as string | null) ?? "en";
  function resolveLabel(field: { label: string; labelMs: string | null; labelZh: string | null }) {
    if (language === "ms" && field.labelMs) return field.labelMs;
    if (language === "zh" && field.labelZh) return field.labelZh;
    return field.label;
  }

  const allFields = submission.product.steps.flatMap((step) =>
    step.fields.map((field) => ({ ...field, stepCondition: step.condition as Condition })),
  );

  const answers: Record<string, string> = {};
  for (const field of allFields) {
    if (field.type === "FILE") continue;
    const raw = formData.get(field.id);
    if (typeof raw === "string") answers[field.id] = raw.trim();
  }

  for (const field of allFields) {
    const isVisible =
      isConditionMet(field.stepCondition, answers) &&
      isConditionMet(field.condition as Condition, answers);
    if (!isVisible) continue;

    if (field.type === "FILE") {
      const rawValues = formData.getAll(field.id);
      const files = rawValues.filter((v): v is File => v instanceof File && v.size > 0);
      const blobJson = rawValues.find((v): v is string => typeof v === "string" && v.length > 0);

      if (files.length > 0) {
        // Local dev path: raw file bytes came through the server action, so we
        // re-validate and write them to local disk (or Blob if configured).
        const minFiles = field.minFiles ?? 1;
        if (files.length < minFiles) {
          return { ok: false, error: `"${resolveLabel(field)}" requires at least ${minFiles} file(s).` };
        }

        const maxFiles = field.maxFiles ?? 1;
        if (files.length > maxFiles) {
          return { ok: false, error: `"${resolveLabel(field)}" allows at most ${maxFiles} file(s).` };
        }

        const maxSizeMb = field.maxSizeMb ?? 10;
        const allowedTypes = (field.allowedTypes as string[] | null) ?? [];

        const buffers: Buffer[] = [];
        for (const file of files) {
          if (file.size > maxSizeMb * 1024 * 1024) {
            return { ok: false, error: `"${resolveLabel(field)}" exceeds ${maxSizeMb}MB limit.` };
          }
          if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
            return {
              ok: false,
              error: `"${resolveLabel(field)}": "${file.name}" is not an accepted format. Allowed formats: ${formatLabels(allowedTypes)}.`,
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
                  error: `"${resolveLabel(field)}": "${file.name}" is ${dimensions.width}×${dimensions.height}px, but must be exactly ${field.width ?? "any"}×${field.height ?? "any"}px. Crop or resize it and try again.`,
                };
              }
            } catch {
              return {
                ok: false,
                error: `"${resolveLabel(field)}": "${file.name}" could not be read as an image, so its dimensions couldn't be checked.`,
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
      } else if (blobJson) {
        // Production path: the client already uploaded these directly to Blob
        // (format/size were enforced server-side at upload time, dimensions
        // were checked client-side before upload started).
        let blobFiles: { url: string; name: string; size: number; type: string }[] = [];
        try {
          blobFiles = JSON.parse(blobJson);
        } catch {
          blobFiles = [];
        }

        if (field.required && blobFiles.length === 0) {
          return { ok: false, error: `"${resolveLabel(field)}" is required.` };
        }
        if (blobFiles.length === 0) continue;

        const minFiles = field.minFiles ?? 1;
        if (blobFiles.length < minFiles) {
          return { ok: false, error: `"${resolveLabel(field)}" requires at least ${minFiles} file(s).` };
        }

        const maxFiles = field.maxFiles ?? 1;
        if (blobFiles.length > maxFiles) {
          return { ok: false, error: `"${resolveLabel(field)}" allows at most ${maxFiles} file(s).` };
        }

        await prisma.fieldValue.upsert({
          where: { submissionId_fieldId: { submissionId: submission.id, fieldId: field.id } },
          create: { submissionId: submission.id, fieldId: field.id, files: blobFiles },
          update: { files: blobFiles },
        });
        continue;
      }

      if (field.required && files.length === 0 && !blobJson) {
        return { ok: false, error: `"${resolveLabel(field)}" is required.` };
      }
    } else {
      const value = (formData.get(field.id) as string | null)?.trim() ?? "";

      if (field.required && !value) {
        return { ok: false, error: `"${resolveLabel(field)}" is required.` };
      }

      if (!value) continue;

      if (field.maxLength && value.length > field.maxLength) {
        return { ok: false, error: `"${resolveLabel(field)}" exceeds the ${field.maxLength} character limit.` };
      }

      if (field.type === "URL") {
        try {
          new URL(value);
        } catch {
          return { ok: false, error: `"${resolveLabel(field)}" must be a valid URL.` };
        }
      }

      if (field.type === "DATE" && value < minLeadDateString(MIN_LEAD_WORKING_DAYS)) {
        return {
          ok: false,
          error: `"${resolveLabel(field)}" must be at least ${MIN_LEAD_WORKING_DAYS} working days from today.`,
        };
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
