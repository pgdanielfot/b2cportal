import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CopyableValue from "./CopyableValue";

type StoredFile = { url: string; name: string; size: number; type: string };

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      product: { include: { steps: { orderBy: { order: "asc" }, include: { fields: { orderBy: { order: "asc" } } } } } },
      values: true,
    },
  });

  if (!submission) notFound();

  const valueByFieldId = new Map(submission.values.map((v) => [v.fieldId, v]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-mahogany">
          {submission.product.name} — SO {submission.soNumber}
        </h1>
        <p className="text-sm text-mahogany/50">
          {submission.status === "SUBMITTED" ? "✅ Submitted" : "⏳ Pending"}
          {submission.submittedAt && ` on ${new Date(submission.submittedAt).toLocaleString()}`}
        </p>
      </div>

      {submission.product.steps.map((step) => (
        <div key={step.id} className="rounded-lg border border-crystal bg-white p-5 space-y-3">
          <h2 className="font-medium text-mahogany">{step.title}</h2>
          {step.fields.map((field) => {
            const fv = valueByFieldId.get(field.id);
            return (
              <div key={field.id} className="border-t border-crystal pt-3 first:border-t-0 first:pt-0">
                <p className="text-sm font-medium text-mahogany/70">{field.label}</p>
                {field.type === "FILE" ? (
                  <div className="mt-1 flex flex-wrap gap-2">
                    {((fv?.files as StoredFile[] | null) ?? []).length === 0 && (
                      <span className="text-sm text-mahogany/40">No file uploaded</span>
                    )}
                    {((fv?.files as StoredFile[] | null) ?? []).map((f, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md border border-crystal px-3 py-1 text-sm text-ignite hover:bg-crystal-soft"
                        >
                          {f.name}
                        </a>
                        <a
                          href={`/api/download?url=${encodeURIComponent(f.url)}&name=${encodeURIComponent(f.name)}`}
                          className="rounded-md border border-crystal px-2 py-1 text-sm text-mahogany hover:bg-crystal-soft"
                          title="Download"
                        >
                          ⬇
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <CopyableValue value={fv?.value ?? ""} />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
