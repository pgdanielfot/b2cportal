type File = { url: string; name: string; type: string };

export default function SubmissionMediaSummary({ media }: { media: { label: string; files: File[] }[] }) {
  if (media.length === 0) return <p className="mt-3 text-xs text-mahogany/50">No creative materials were submitted.</p>;
  return <div className="mt-4 space-y-3">{media.map((group) => <div key={group.label}><p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-mahogany/55">{group.label}</p><div className="flex flex-wrap gap-2">{group.files.map((file) => <div key={file.url} className="h-20 w-20 overflow-hidden rounded-lg border border-crystal bg-crystal-soft">{file.type.startsWith("video/") ? <video src={file.url} className="h-full w-full object-cover" controls muted playsInline /> : <>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={file.url} alt={file.name} className="h-full w-full object-cover" />
  </>}</div>)}</div></div>)}</div>;
}
