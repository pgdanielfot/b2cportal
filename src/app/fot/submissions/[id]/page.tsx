import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CopyableValue from "./CopyableValue";

type StoredFile = { url: string; name: string; size: number; type: string };

export default async function SubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      product: { include: { steps: { orderBy: { order: "asc" }, include: { fields: { orderBy: { order: "asc" } } } } } },
      values: true,
    },
  });
  if (!submission) notFound();
  const valueByFieldId = new Map(submission.values.map((value) => [value.fieldId, value]));
  const keyValue = (pattern: RegExp) => {
    const field = submission.product.steps.flatMap((step) => step.fields).find((item) => pattern.test(item.label));
    return field ? valueByFieldId.get(field.id)?.value : undefined;
  };
  const campaignStats = [{ label: "Platform", value: keyValue(/platform/i) }, { label: "Brand", value: keyValue(/advertise as|brand/i) }, { label: "Start date", value: keyValue(/start date/i) }].filter((item) => item.value);

  return <div className="space-y-6">
    <section className="overflow-hidden rounded-3xl bg-[#172b54] text-white shadow-lg"><div className="px-6 py-6 sm:px-8"><Link href="/fot/submissions" className="text-sm font-semibold text-sky-200 transition hover:text-white">← Back to submissions</Link><div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sky-200">Submission review</p><h1 className="mt-1 text-2xl font-bold">SO {submission.soNumber}</h1><p className="mt-1 text-sm text-white/70">{submission.product.name} · Campaign {submission.campaignSequence ?? "—"}</p></div><span className={`inline-flex w-fit rounded-full px-3 py-1.5 text-sm font-semibold ${submission.status === "SUBMITTED" ? "bg-emerald-400/20 text-emerald-100" : "bg-amber-300/20 text-amber-100"}`}>{submission.status === "SUBMITTED" ? "● Submitted" : "● Pending"}</span></div></div><div className="flex flex-wrap gap-5 border-t border-white/10 bg-white/5 px-6 py-4 text-sm text-white/75 sm:px-8"><span>Received: {new Date(submission.submittedAt ?? submission.createdAt).toLocaleString()}</span>{campaignStats.map((item) => <span key={item.label}><b className="font-semibold text-white">{item.label}:</b> {item.value}</span>)}</div></section>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start"><div className="space-y-5">{submission.product.steps.map((step, stepIndex) => <section key={step.id} className="rounded-3xl border border-crystal bg-white p-5 shadow-sm sm:p-6"><div className="mb-5 flex items-center gap-3 border-b border-crystal pb-4"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-crystal-soft text-xs font-bold text-mahogany/65">{stepIndex + 1}</span><div><p className="text-[11px] font-bold uppercase tracking-[0.13em] text-mahogany/45">Submission section</p><h2 className="font-bold text-mahogany">{step.title}</h2></div></div><div className="grid gap-4 md:grid-cols-2">{step.fields.map((field) => <div key={field.id} className={field.type === "TEXTAREA" || field.type === "FILE" ? "md:col-span-2" : ""}><p className="text-[11px] font-bold uppercase tracking-wide text-mahogany/55">{field.label}</p>{field.type === "FILE" ? <FileReview files={(valueByFieldId.get(field.id)?.files as StoredFile[] | null) ?? []} width={field.width} height={field.height} /> : <CopyableValue value={valueByFieldId.get(field.id)?.value ?? ""} />}</div>)}</div></section>)}</div>
      <aside className="space-y-4 xl:sticky xl:top-6"><div className="rounded-2xl border border-crystal bg-white p-5 shadow-sm"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mahogany/50">Quick actions</p><Link href="/fot/submissions" className="mt-3 flex w-full items-center justify-center rounded-xl bg-ignite px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ignite-hover">All submissions</Link></div><div className="rounded-2xl border border-crystal bg-crystal-soft/60 p-5"><p className="text-sm font-semibold text-mahogany">Review tip</p><p className="mt-2 text-sm leading-5 text-mahogany/60">Click a creative file to open it at full size, or use the download action to save the original file.</p></div></aside>
    </div>
  </div>;
}

function FileReview({ files, width, height }: { files: StoredFile[]; width: number | null; height: number | null }) {
  if (files.length === 0) return <p className="mt-2 text-sm text-mahogany/45">No file uploaded.</p>;
  const ratio = width && height ? `${width} / ${height}` : "1 / 1";
  return <div className="mt-2 flex flex-wrap items-start gap-3">{files.map((file) => <div key={file.url} className="w-[min(100%,_13rem)]"><a href={file.url} target="_blank" rel="noreferrer" className="group relative block w-full overflow-hidden rounded-2xl border border-crystal bg-crystal-soft shadow-sm" style={{ aspectRatio: ratio }}>{file.type.startsWith("video/") ? <video src={file.url} className="h-full w-full object-cover" controls muted playsInline preload="metadata" /> : <>
      {/* Blob and local upload URLs cannot reliably use next/image optimization. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={file.url} alt={file.name} className="h-full w-full object-cover transition group-hover:scale-105" />
    </>}<span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 pb-2 pt-7 text-xs font-semibold text-white">{file.type.startsWith("video/") ? "▶ Video" : "Open preview"}</span></a><div className="mt-2 flex items-center justify-between gap-2"><span className="min-w-0 truncate text-xs text-mahogany/55" title={file.name}>{file.name}</span><a href={`/api/download?url=${encodeURIComponent(file.url)}&name=${encodeURIComponent(file.name)}`} className="shrink-0 rounded-lg border border-crystal px-2 py-1 text-xs font-semibold text-mahogany hover:bg-crystal-soft" title="Download original">↓</a></div></div>)}</div>;
}
