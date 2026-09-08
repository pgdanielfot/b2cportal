import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import FillWizard from "./FillWizard";
import type { Condition } from "@/lib/conditions";

export default async function FillPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const submission = await prisma.submission.findUnique({
    where: { shareToken: token },
    include: {
      product: {
        include: { steps: { orderBy: { order: "asc" }, include: { fields: { orderBy: { order: "asc" } } } } },
      },
    },
  });

  if (!submission) notFound();

  if (submission.status === "SUBMITTED") {
    return (
      <div className="min-h-screen bg-crystal-soft">
        <div className="mx-auto max-w-xl px-6 py-16">
          <div className="rounded-lg border border-crystal bg-white p-8 text-center space-y-2">
            <p className="text-2xl">✅</p>
            <h1 className="text-lg font-semibold text-mahogany">Already submitted</h1>
            <p className="text-sm text-mahogany/60">This form has already been completed.</p>
          </div>
        </div>
      </div>
    );
  }

  const steps = submission.product.steps.map((s) => ({
    id: s.id,
    title: s.title,
    titleMs: s.titleMs ?? undefined,
    titleZh: s.titleZh ?? undefined,
    disclaimer: s.disclaimer ?? undefined,
    disclaimerMs: s.disclaimerMs ?? undefined,
    disclaimerZh: s.disclaimerZh ?? undefined,
    disclaimerImage: s.disclaimerImage ?? undefined,
    disclaimerCondition: (s.disclaimerCondition as Condition) ?? undefined,
    condition: (s.condition as Condition) ?? undefined,
    fields: s.fields.map((f) => ({
      id: f.id,
      label: f.label,
      labelMs: f.labelMs ?? undefined,
      labelZh: f.labelZh ?? undefined,
      type: f.type,
      required: f.required,
      options: (f.options as string[] | null) ?? [],
      maxLength: f.maxLength,
      minFiles: f.minFiles,
      maxFiles: f.maxFiles,
      maxSizeMb: f.maxSizeMb,
      allowedTypes: (f.allowedTypes as string[] | null) ?? [],
      width: f.width,
      height: f.height,
      sampleUrl: f.sampleUrl ?? undefined,
      condition: (f.condition as Condition) ?? undefined,
    })),
  }));

  return (
    <div className="min-h-screen bg-crystal-soft">
      <div className="mx-auto max-w-xl px-6 py-12">
        <FillWizard
          token={token}
          productName={submission.product.name}
          steps={steps}
          useBlobUpload={Boolean(process.env.BLOB_READ_WRITE_TOKEN)}
        />
      </div>
    </div>
  );
}
