import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SubmissionRowActions from "./SubmissionRowActions";

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string; status?: string; q?: string; view?: string }>;
}) {
  const { productId, status, q, view } = await searchParams;

  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });

  const archivedFilter = view === "archived" ? true : view === "all" ? undefined : false;

  const submissions = await prisma.submission.findMany({
    where: {
      productId: productId || undefined,
      status: status === "PENDING" || status === "SUBMITTED" ? status : undefined,
      archived: archivedFilter,
      soNumber: q?.trim() ? { contains: q.trim() } : undefined,
    },
    orderBy: { createdAt: "desc" },
    include: { product: true },
  });

  const exportHref = `/api/submissions/export?${new URLSearchParams({
    ...(productId ? { productId } : {}),
    ...(status ? { status } : {}),
  }).toString()}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-mahogany">All Submissions</h1>
        <a
          href={exportHref}
          className="rounded-md bg-ignite px-4 py-2 text-sm font-medium text-white hover:bg-ignite-hover"
        >
          Export CSV
        </a>
      </div>

      <form className="flex flex-wrap gap-3">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search SO number..."
          className="flex-1 min-w-[180px] rounded-md border px-3 py-2 text-sm focus:border-ignite focus:outline-none"
        />
        <select name="productId" defaultValue={productId ?? ""} className="rounded-md border px-3 py-2 text-sm">
          <option value="">All products</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status ?? ""} className="rounded-md border px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="SUBMITTED">Submitted</option>
        </select>
        <select name="view" defaultValue={view ?? "active"} className="rounded-md border px-3 py-2 text-sm">
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="all">All</option>
        </select>
        <button className="rounded-md border border-crystal px-4 py-2 text-sm font-medium text-mahogany hover:bg-crystal-soft">
          Filter
        </button>
      </form>

      <div className="divide-y divide-crystal rounded-lg border border-crystal bg-white">
        {submissions.length === 0 && (
          <p className="p-4 text-sm text-mahogany/50">No submissions match this filter.</p>
        )}
        {submissions.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-4 p-4 hover:bg-crystal-soft">
            <Link href={`/fot/submissions/${s.id}`} className="min-w-0 flex-1">
              <p className="font-medium text-mahogany">
                {s.product.name} — SO {s.soNumber}
                {s.archived && <span className="ml-2 text-xs text-mahogany/40">(archived)</span>}
              </p>
              <p className="text-sm text-mahogany/50">
                {s.status === "SUBMITTED" ? "✅ Submitted" : "⏳ Pending"} ·{" "}
                {new Date(s.createdAt).toLocaleString()}
              </p>
            </Link>
            <SubmissionRowActions submissionId={s.id} archived={s.archived} />
          </div>
        ))}
      </div>
    </div>
  );
}
