type File = { url: string; name: string; type: string };

export default function SubmissionMediaSummary({ media }: { media: { label: string; width?: number | null; height?: number | null; files: File[] }[] }) {
  if (media.length === 0) return <p className="mt-3 text-xs text-mahogany/50">No creative materials were submitted.</p>;
  const assets = media.flatMap((group) => group.files.map((file) => ({ ...file, label: group.label, width: group.width, height: group.height })));
  return <div className="mt-5">
    <div className="mb-2 flex items-center justify-between"><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-mahogany/50">Creative kit</p><span className="rounded-full bg-crystal-soft px-2 py-0.5 text-[10px] font-semibold text-mahogany/60">{assets.length} {assets.length === 1 ? "asset" : "assets"}</span></div>
    <div className="flex flex-wrap items-start gap-2">
      {assets.map((file) => <figure key={file.url} className="w-[calc((100%-1rem)/3)]">
        <div className="group relative w-full overflow-hidden rounded-xl border border-crystal bg-crystal-soft shadow-sm" style={{ aspectRatio: file.width && file.height ? `${file.width} / ${file.height}` : /story/i.test(file.label) ? "9 / 16" : "1 / 1" }}>
        {file.type.startsWith("video/") ? <video src={file.url} className="h-full w-full object-cover" muted playsInline preload="metadata" /> : <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={file.url} alt={file.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        </>}
        <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2 pb-1.5 pt-5 text-[9px] font-bold uppercase tracking-wide text-white">{file.type.startsWith("video/") && "▶ "}{file.label.replace(" (Optional)", "")}</figcaption>
        </div>
      </figure>)}
    </div>
  </div>;
}
