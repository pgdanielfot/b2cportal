"use client";

import { useMemo, useState } from "react";

type File = { url: string; name: string; type: string };
type Field = { id: string; label: string; type: string; width?: number | null; height?: number | null };
type Step = { id: string; title: string; fields: Field[] };
type Value = { fieldId: string; value: string | null; files: File[] | null };

export default function SubmissionReview({ productName, steps, values, campaignUrl }: { productName: string; steps: Step[]; values: Value[]; campaignUrl?: string }) {
  const [remarks, setRemarks] = useState("");
  const valuesByField = useMemo(() => new Map(values.map((item) => [item.fieldId, item])), [values]);
  const [copied, setCopied] = useState(false);

  async function copyRemark() {
    await navigator.clipboard.writeText(`Change request — ${productName}\n\n${remarks || "[Please describe the requested change]"}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#e0edff,_#f5f8fc_42%)]">
    <div className="mx-auto max-w-4xl px-5 py-10">
      <section className="overflow-hidden rounded-3xl border border-crystal bg-white shadow-xl">
        <div className="bg-[#172b54] px-6 py-7 text-white"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-200">Submission review</p><h1 className="mt-1 text-2xl font-bold">{productName}</h1><p className="mt-2 text-sm text-white/70">Your submitted campaign information and creative materials.</p></div>{campaignUrl && <a href={campaignUrl} className="inline-flex shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20">← Back to all campaigns</a>}</div></div>
        <div className="m-5 rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm">🔒</span><div><h2 className="font-semibold text-amber-950">Submission locked</h2><p className="mt-1 text-sm leading-5 text-amber-900/75">Your submission has been received and cannot be edited here. Review the details below, then contact the PG Fulfilment Operations Team if you need a change.</p></div></div></div>
        <div className="space-y-5 px-5 pb-5">{steps.map((step, index) => <section key={step.id} className="rounded-2xl border border-crystal bg-white p-5"><div className="mb-4 flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-crystal-soft text-xs font-bold text-mahogany/60">{index + 1}</span><h2 className="font-semibold text-mahogany">{step.title}</h2></div><div className="space-y-4">{step.fields.map((field) => <ReviewField key={field.id} field={field} value={valuesByField.get(field.id)} />)}</div></section>)}</div>
        <div className="border-t border-crystal bg-crystal-soft px-5 py-6"><h2 className="font-semibold text-mahogany">Need something changed?</h2><p className="mt-1 text-sm text-mahogany/60">Add a remark, then share it with the PG Fulfilment Operations Team through your usual support channel.</p><textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} placeholder="Example: Please replace the Story image with an updated version." className="mt-3 min-h-28 w-full rounded-xl border border-crystal bg-white px-4 py-3 text-sm text-mahogany outline-none transition focus:border-ignite" /><div className="mt-3 flex justify-end"><button type="button" onClick={() => void copyRemark()} className="rounded-xl bg-ignite px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-ignite-hover">{copied ? "Remark copied" : "Copy remark"}</button></div></div>
      </section>
    </div>
  </main>;
}

function ReviewField({ field, value }: { field: Field; value?: Value }) {
  const files = value?.files ?? [];
  if (field.type !== "FILE") return <div><p className="text-[11px] font-bold uppercase tracking-wide text-mahogany/55">{field.label}</p><p className="mt-1 whitespace-pre-wrap rounded-xl bg-crystal-soft px-3 py-2.5 text-sm text-mahogany">{value?.value || "—"}</p></div>;
  const aspectRatio = field.width && field.height ? `${field.width} / ${field.height}` : /story/i.test(field.label) ? "9 / 16" : "1 / 1";
  const dimensions = field.width && field.height ? `${field.width} × ${field.height}` : /story/i.test(field.label) ? "9:16 Story" : "1:1 Feed";
  return <div><div className="flex items-center justify-between gap-3"><p className="text-[11px] font-bold uppercase tracking-wide text-mahogany/55">{field.label}</p><span className="text-[10px] font-semibold text-mahogany/45">{dimensions}</span></div><div className="mt-2 flex flex-wrap gap-3">{files.length > 0 ? files.map((file) => <div key={file.url} className="w-[min(100%,_12rem)]"><a href={file.url} target="_blank" rel="noreferrer" className="group relative block w-full overflow-hidden rounded-xl border border-crystal bg-crystal-soft shadow-sm" style={{ aspectRatio }}>
    {file.type.startsWith("video/") ? <video src={file.url} className="h-full w-full object-cover" muted playsInline preload="metadata" /> : <>
      {/* Review links may point to Blob or local upload URLs, so next/image cannot reliably optimize them. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={file.url} alt={file.name} className="h-full w-full object-cover" />
    </>}
    <span className="absolute inset-x-0 bottom-0 bg-black/60 px-1.5 py-1 text-[9px] font-semibold text-white">{file.type.startsWith("video/") ? "▶ Video" : "View image"}</span>
  </a></div>) : <p className="mt-1 text-sm text-mahogany/45">No file submitted.</p>}</div></div>;
}
