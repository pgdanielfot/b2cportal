type File = { url: string; name: string; type: string };
type Asset = File & { label: string; width?: number | null; height?: number | null };

export default function SubmissionMediaSummary({ media }: { media: { label: string; width?: number | null; height?: number | null; files: File[] }[] }) {
  if (media.length === 0) return <p className="mt-3 text-xs text-mahogany/50">No creative materials were submitted.</p>;
  const assets: Asset[] = media.flatMap((group) => group.files.map((file) => ({ ...file, label: group.label, width: group.width, height: group.height })));
  const feedAssets = assets.filter((asset) => /feed/i.test(asset.label));
  const storyAssets = assets.filter((asset) => !/feed/i.test(asset.label));
  return <div className="mt-5">
    <div className="mb-2 flex items-center justify-between"><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-mahogany/50">Creative kit</p><span className="rounded-full bg-crystal-soft px-2 py-0.5 text-[10px] font-semibold text-mahogany/60">{assets.length} {assets.length === 1 ? "asset" : "assets"}</span></div>
    <div className="space-y-3">{feedAssets.length > 0 && <AssetGroup title="Feed" assets={feedAssets} />}{storyAssets.length > 0 && <AssetGroup title="Story" assets={storyAssets} />}</div>
  </div>;
}

function AssetGroup({ title, assets }: { title: string; assets: Asset[] }) {
  return <div className="rounded-xl border border-crystal bg-[#fbfcff] p-2.5"><div className="mb-2 flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-mahogany/50">{title}</p><span className="text-[10px] font-semibold text-mahogany/45">{assets.length} {assets.length === 1 ? "creative" : "creatives"}</span></div><div className="grid grid-cols-2 gap-2">{assets.map((asset) => <AssetTile key={asset.url} asset={asset} />)}</div></div>;
}

function AssetTile({ asset }: { asset: Asset }) {
  const ratio = asset.width && asset.height ? `${asset.width} / ${asset.height}` : /stor(y|ies)/i.test(asset.label) ? "9 / 16" : "1 / 1";
  return <figure className="min-w-0"><div className="group relative w-full overflow-hidden rounded-lg border border-crystal bg-crystal-soft shadow-sm" style={{ aspectRatio: ratio }}>{asset.type.startsWith("video/") ? <video src={asset.url} className="h-full w-full object-cover" muted playsInline preload="metadata" /> : <>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={asset.url} alt={asset.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
  </>}<figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2 pb-1.5 pt-5 text-[8px] font-bold uppercase tracking-wide text-white">{asset.type.startsWith("video/") && "▶ "}{asset.label.replace(" (Optional)", "")}</figcaption></div></figure>;
}
