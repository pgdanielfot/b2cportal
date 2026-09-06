import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductBuilder from "./ProductBuilder";
import SubmissionsPanel from "./SubmissionsPanel";
import type { ProductDraft } from "@/lib/types";
import type { Condition } from "@/lib/conditions";

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      steps: { orderBy: { order: "asc" }, include: { fields: { orderBy: { order: "asc" } } } },
      submissions: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!product) notFound();

  const draft: ProductDraft = {
    id: product.id,
    name: product.name,
    adSamplesUrl: product.adSamplesUrl ?? undefined,
    steps: product.steps.map((s) => ({
      id: s.id,
      title: s.title,
      titleMs: s.titleMs ?? undefined,
      titleZh: s.titleZh ?? undefined,
      disclaimer: s.disclaimer ?? undefined,
      disclaimerMs: s.disclaimerMs ?? undefined,
      disclaimerZh: s.disclaimerZh ?? undefined,
      order: s.order,
      condition: (s.condition as Condition) ?? undefined,
      fields: s.fields.map((f) => ({
        id: f.id,
        label: f.label,
        labelMs: f.labelMs ?? undefined,
        labelZh: f.labelZh ?? undefined,
        type: f.type,
        required: f.required,
        order: f.order,
        options: (f.options as string[] | null) ?? [],
        maxLength: f.maxLength ?? undefined,
        minFiles: f.minFiles ?? undefined,
        maxFiles: f.maxFiles ?? undefined,
        maxSizeMb: f.maxSizeMb ?? undefined,
        allowedTypes: (f.allowedTypes as string[] | null) ?? [],
        width: f.width ?? undefined,
        height: f.height ?? undefined,
        condition: (f.condition as Condition) ?? undefined,
      })),
    })),
  };

  return (
    <div className="space-y-8">
      <ProductBuilder initial={draft} />
      <SubmissionsPanel
        productId={product.id}
        createdToken={created}
        submissions={product.submissions.map((s) => ({
          id: s.id,
          soNumber: s.soNumber,
          status: s.status,
          shareToken: s.shareToken,
          createdAt: s.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
