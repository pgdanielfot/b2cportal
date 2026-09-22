type File = { url: string; name: string; type: string };

export default function SubmissionMediaSummary({ media }: { media: { label: string; files: File[] }[] }) {
  if (media.length === 0) return <p className="mt-3 text-xs text-mahogany/50">No creative materials were submitted.</p>;
  const assets = media.flatMap((group) => group.files.map((file) => ({ ...file, label: group.label })));
  return <div className="mt-5">
    <div className="mb-2 flex items-center justify-between"><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-mahogany/50">Creative kit</p><span className="rounded-full bg-crystal-soft px-2 py-0.5 text-[10px] font-semibold text-mahogany/60">{assets.length} {assets.length === 1 ? "asset" : "assets"}</span></div>
    <div className="grid grid-cols-3 gap-2">
      {assets.map((file) => <figure key={file.url} className="group relative aspect-square overflow-hidden rounded-xl border border-crystal bg-crystal-soft shadow-sm">
        {file.type.startsWith("video/") ? <video src={file.url} className="h-full w-full object-cover" muted playsInline preload="metadata" /> : <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={file.url} alt={file.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        </>}
        <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2 pb-1.5 pt-5 text-[9px] font-bold uppercase tracking-wide text-white">{file.type.startsWith("video/") && "▶ "}{file.label.replace(" (Optional)", "")}</figcaption>
      </figure>)}
    </div>
  </div>;
}
