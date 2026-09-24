import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SubmissionRowActions from "./SubmissionRowActions";

export default async function SubmissionsPage({ searchParams }: { searchParams: Promise<{ productId?: string; status?: string; q?: string; view?: string }> }) {
  const { productId, status, q, view } = await searchParams;
  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });
  const archivedFilter = view === "archived" ? true : view === "all" ? undefined : false;
  const submissions = await prisma.submission.findMany({
    where: { productId: productId || undefined, status: status === "PENDING" || status === "SUBMITTED" ? status : undefined, archived: archivedFilter, soNumber: q?.trim() ? { contains: q.trim() } : undefined },
    orderBy: { createdAt: "desc" },
    include: { product: true, campaign: { select: { shareToken: true } } },
  });
  type Submission = (typeof submissions)[number];
  type Group = { key: string; product: Submission["product"]; soNumber: string; campaignUrl?: string; submissions: Submission[] };
  const grouped = submissions.reduce((map, submission) => {
    const key = submission.campaignId ?? `${submission.productId}:${submission.soNumber}`;
    const group = map.get(key) ?? { key, product: submission.product, soNumber: submission.soNumber, campaignUrl: submission.campaign ? `/campaign/${submission.campaign.shareToken}` : undefined, submissions: [] };
    group.submissions.push(submission);
    map.set(key, group);
    return map;
  }, new Map<string, Group>());
  const groups = Array.from(grouped.values());
  const submittedCount = submissions.filter((submission) => submission.status === "SUBMITTED").length;
  const pendingCount = submissions.length - submittedCount;
  const exportHref = `/api/submissions/export?${new URLSearchParams({ ...(productId ? { productId } : {}), ...(status ? { status } : {}) }).toString()}`;

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 rounded-3xl bg-[#172b54] px-6 py-7 text-white shadow-lg sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sky-200">PG Fulfilment Operations Team</p><h1 className="mt-1 text-2xl font-bold">Campaign submissions</h1><p className="mt-1 text-sm text-white/65">Manage every campaign grouped under its Sales Order.</p></div><a href={exportHref} className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#172b54] transition hover:bg-sky-50">Export CSV</a></div>
    <div className="grid gap-3 sm:grid-cols-3"><Summary label="SO orders" value={String(groups.length)} /><Summary label="Completed campaigns" value={String(submittedCount)} tone="text-emerald-600" /><Summary label="Awaiting submission" value={String(pendingCount)} tone="text-amber-600" /></div>
    <form className="flex flex-wrap gap-3 rounded-2xl border border-crystal bg-white p-4 shadow-sm"><input type="search" name="q" defaultValue={q ?? ""} placeholder="Search SO number..." className="min-w-[220px] flex-1 rounded-xl border border-crystal bg-[#fbfcff] px-4 py-2.5 text-sm outline-none focus:border-ignite focus:ring-4 focus:ring-ignite/10" /><select name="productId" defaultValue={productId ?? ""} className="rounded-xl border border-crystal bg-white px-3 py-2.5 text-sm outline-none focus:border-ignite"><option value="">All products</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select><select name="status" defaultValue={status ?? ""} className="rounded-xl border border-crystal bg-white px-3 py-2.5 text-sm outline-none focus:border-ignite"><option value="">All statuses</option><option value="PENDING">Pending</option><option value="SUBMITTED">Submitted</option></select><select name="view" defaultValue={view ?? "active"} className="rounded-xl border border-crystal bg-white px-3 py-2.5 text-sm outline-none focus:border-ignite"><option value="active">Active</option><option value="archived">Archived</option><option value="all">All</option></select><button className="rounded-xl bg-ignite px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ignite-hover">Filter</button></form>
    <div className="space-y-4">{groups.length === 0 ? <div className="rounded-2xl border border-dashed border-crystal bg-white p-10 text-center text-sm text-mahogany/50">No submissions match this filter.</div> : groups.map((group) => {
      const groupSubmitted = group.submissions.filter((submission) => submission.status === "SUBMITTED").length;
      return <section key={group.key} className="overflow-hidden rounded-3xl border border-crystal bg-white shadow-sm"><div className="flex flex-col gap-4 border-b border-crystal bg-[linear-gradient(90deg,_#f4f8ff,_#ffffff)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2169df] text-xs font-bold text-white">SO</span><div><p className="text-xs font-semibold text-mahogany/50">Sales Order</p><h2 className="text-lg font-bold text-mahogany">SO {group.soNumber}</h2><p className="text-sm text-mahogany/60">{group.product.name}</p></div></div><div className="flex flex-wrap items-center gap-3"><span className="rounded-full bg-crystal-soft px-3 py-1.5 text-xs font-semibold text-mahogany/65">{groupSubmitted} / {group.submissions.length} completed</span>{group.campaignUrl && <a href={group.campaignUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-ignite hover:underline">Open campaign portal ↗</a>}</div></div><div className="divide-y divide-crystal">{group.submissions.map((submission, index) => <div key={submission.id} className="flex flex-col gap-3 px-5 py-4 transition hover:bg-crystal-soft/50 sm:flex-row sm:items-center sm:justify-between"><Link href={`/fot/submissions/${submission.id}`} className="group flex min-w-0 items-center gap-3"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${submission.status === "SUBMITTED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{String(submission.campaignSequence ?? index + 1).padStart(2, "0")}</span><div><p className="font-semibold text-mahogany">Campaign {submission.campaignSequence ?? index + 1}</p><p className="mt-0.5 text-xs text-mahogany/50">{submission.status === "SUBMITTED" ? "Submitted" : "Pending"} · {new Date(submission.submittedAt ?? submission.createdAt).toLocaleString()}{submission.archived ? " · Archived" : ""}</p></div><span className="text-sm text-ignite opacity-0 transition group-hover:opacity-100">View →</span></Link><SubmissionRowActions submissionId={submission.id} archived={submission.archived} /></div>)}</div></section>;
    })}</div>
  </div>;
}

function Summary({ label, value, tone = "text-mahogany" }: { label: string; value: string; tone?: string }) {
  return <div className="rounded-2xl border border-crystal bg-white p-4 shadow-sm"><p className="text-sm text-mahogany/55">{label}</p><p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p></div>;
}
