"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ProductDraft } from "@/lib/types";
import type { Condition } from "@/lib/conditions";
import { saveUploadedFile } from "@/lib/files";

function conditionToJson(condition: Condition | undefined) {
  return condition ? condition : Prisma.JsonNull;
}

async function requireFotUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function createProduct(name: string) {
  const userId = await requireFotUser();

  const product = await prisma.product.create({
    data: {
      name,
      createdById: userId,
      steps: {
        create: [{ title: "Step 1", order: 0 }],
      },
    },
  });

  redirect(`/fot/products/${product.id}`);
}

export async function saveProduct(draft: ProductDraft) {
  await requireFotUser();

  // This loops over every step/field with sequential round trips; against a
  // remote Postgres that can exceed Prisma's default 5s transaction timeout.
  await prisma.$transaction(
    async (tx) => {
    await tx.product.update({
      where: { id: draft.id },
      data: { name: draft.name },
    });

    const existingSteps = await tx.step.findMany({
      where: { productId: draft.id },
      select: { id: true },
    });
    const existingStepIds = existingSteps.map((s) => s.id);
    const keptStepIds = draft.steps.filter((s) => s.id).map((s) => s.id as string);
    const stepIdsToDelete = existingStepIds.filter((id) => !keptStepIds.includes(id));

    if (stepIdsToDelete.length) {
      await tx.step.deleteMany({ where: { id: { in: stepIdsToDelete } } });
    }

    for (const step of draft.steps) {
      const stepData = {
        title: step.title,
        titleMs: step.titleMs || null,
        titleZh: step.titleZh || null,
        disclaimer: step.disclaimer || null,
        disclaimerMs: step.disclaimerMs || null,
        disclaimerZh: step.disclaimerZh || null,
        disclaimerImage: step.disclaimerImage || null,
        disclaimerCondition: conditionToJson(step.disclaimerCondition),
        order: step.order,
        condition: conditionToJson(step.condition),
      };

      const stepRecord = step.id
        ? await tx.step.update({ where: { id: step.id }, data: stepData })
        : await tx.step.create({ data: { ...stepData, productId: draft.id } });

      const existingFields = await tx.field.findMany({
        where: { stepId: stepRecord.id },
        select: { id: true },
      });
      const existingFieldIds = existingFields.map((f) => f.id);
      const keptFieldIds = step.fields.filter((f) => f.id).map((f) => f.id as string);
      const fieldIdsToDelete = existingFieldIds.filter((id) => !keptFieldIds.includes(id));

      if (fieldIdsToDelete.length) {
        await tx.field.deleteMany({ where: { id: { in: fieldIdsToDelete } } });
      }

      for (const field of step.fields) {
        const data = {
          label: field.label,
          labelMs: field.labelMs || null,
          labelZh: field.labelZh || null,
          type: field.type,
          required: field.required,
          order: field.order,
          options: field.type === "DROPDOWN" ? field.options ?? [] : undefined,
          maxLength:
            field.type === "TEXT" || field.type === "TEXTAREA" ? field.maxLength ?? null : null,
          minFiles: field.type === "FILE" ? field.minFiles ?? 1 : null,
          maxFiles: field.type === "FILE" ? field.maxFiles ?? 1 : null,
          maxSizeMb: field.type === "FILE" ? field.maxSizeMb ?? 10 : null,
          allowedTypes: field.type === "FILE" ? field.allowedTypes ?? [] : undefined,
          width: field.type === "FILE" ? field.width ?? null : null,
          height: field.type === "FILE" ? field.height ?? null : null,
          sampleUrl: field.type === "FILE" ? field.sampleUrl || null : null,
          condition: conditionToJson(field.condition),
        };

        if (field.id) {
          await tx.field.update({ where: { id: field.id }, data });
        } else {
          await tx.field.create({ data: { ...data, stepId: stepRecord.id } });
        }
      }
    }
    },
    { timeout: 30000, maxWait: 10000 },
  );

  revalidatePath(`/fot/products/${draft.id}`);
}

export async function uploadDisclaimerImage(
  formData: FormData,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await requireFotUser();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No file provided." };
  }

  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Please upload an image file." };
  }

  const maxSizeMb = 10;
  if (file.size > maxSizeMb * 1024 * 1024) {
    return { ok: false, error: `Image exceeds ${maxSizeMb}MB limit.` };
  }

  const saved = await saveUploadedFile("disclaimer-images", file);
  return { ok: true, url: saved.url };
}

export async function deleteProduct(productId: string) {
  await requireFotUser();
  await prisma.product.delete({ where: { id: productId } });
  revalidatePath("/fot/dashboard");
}
