"use client";

import { useState } from "react";

type Props = {
  platform: "Facebook" | "Instagram";
  brand?: string;
  feedMedia?: Media;
  storyImage?: Media;
  storyVideo?: Media;
  caption?: string;
  cta?: string;
  destination?: string;
};
export type Media = { url: string; type: string };

export default function LiveAdPreview({ platform, brand, feedMedia, storyImage, storyVideo, caption, cta, destination }: Props) {
  const [placement, setPlacement] = useState<"FEED" | "STORY">("FEED");
  const [storyFormat, setStoryFormat] = useState<"IMAGE" | "VIDEO">("IMAGE");
  const instagram = platform === "Instagram";
  const action = cta || "Learn More";
  const brandLabel = brand === "PropertyGuru" || brand === "iProperty" ? brand : "PropertyGuru / iProperty";

  return <section className="rounded-2xl border border-crystal bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3"><div><h2 className="text-base font-semibold text-mahogany">Live Ad Preview</h2><p className="text-xs text-mahogany/55">Preview Iklan Langsung · 实时广告预览</p></div><span className="rounded-full bg-red-500 px-2 py-1 text-[10px] font-bold text-white">● LIVE</span></div>
    <div className="mt-3 flex gap-2"><Tab active={placement === "FEED"} onClick={() => setPlacement("FEED")}>Feed</Tab><Tab active={placement === "STORY"} onClick={() => setPlacement("STORY")}>Story</Tab></div>
    {placement === "STORY" && storyVideo && <div className="mt-2 flex gap-2 text-[11px]"><button type="button" onClick={() => setStoryFormat("IMAGE")} className={`rounded px-2 py-1 ${storyFormat === "IMAGE" ? "bg-crystal text-mahogany" : "text-mahogany/55"}`}>Story image</button><button type="button" onClick={() => setStoryFormat("VIDEO")} className={`rounded px-2 py-1 ${storyFormat === "VIDEO" ? "bg-crystal text-mahogany" : "text-mahogany/55"}`}>Story video</button></div>}
    <div className="mt-3 rounded-xl bg-[#e9f0fa] p-4">
      {placement === "FEED" ? <FeedPost instagram={instagram} brand={brandLabel} media={feedMedia} caption={caption} action={action} destination={destination} /> : <StoryPost brand={brandLabel} media={storyFormat === "VIDEO" ? storyVideo : storyImage} caption={caption} action={action} />}
    </div>
    <p className="mt-3 text-[11px] leading-4 text-mahogany/45">Live visual guide only. The final display can vary by device and platform settings.</p>
  </section>;
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={onClick} className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${active ? "border-ignite bg-ignite/5 text-ignite" : "border-crystal text-mahogany/60 hover:bg-crystal-soft"}`}>{children}</button>; }

function FeedPost({ instagram, brand, media, caption, action, destination }: { instagram: boolean; brand: string; media?: Media; caption?: string; action: string; destination?: string }) {
  return <div className="mx-auto max-w-[340px] overflow-hidden rounded-xl border border-crystal bg-white shadow-sm">
    <div className="flex items-center gap-2 px-3 py-2.5"><Avatar brand={brand} /><div className="min-w-0"><p className="truncate text-xs font-bold text-mahogany">{brand}</p><p className="text-[10px] text-mahogany/50">{instagram ? "Sponsored" : "Sponsored · Facebook"}</p></div><span className="ml-auto text-lg leading-none text-mahogany/50">•••</span></div>
    <Creative media={media} ratio="1 / 1" />
    {instagram && <div className="px-3 pt-2 text-base tracking-wide text-mahogany">♡　◯　⌁</div>}
    <div className="space-y-1 px-3 py-2"><p className="whitespace-pre-wrap text-xs text-mahogany"><b>{brand}</b> {caption || "Your campaign caption will appear here."}</p><p className="truncate text-[10px] text-mahogany/45">{destination || (instagram ? "View more" : "Sponsored")}</p></div>
    {!instagram && <div className="flex items-center justify-between border-t border-crystal bg-[#f7f9fc] px-3 py-2"><span className="max-w-32 truncate text-[10px] font-semibold uppercase text-mahogany/55">{destination || "PROPERTYGURU.COM.MY"}</span><ActionButton brand={brand}>{action}</ActionButton></div>}
    {instagram && <div className="border-t border-crystal bg-[#f7f9fc] p-2"><ActionButton brand={brand} full>{action}</ActionButton></div>}
  </div>;
}

function StoryPost({ brand, media, caption, action }: { brand: string; media?: Media; caption?: string; action: string }) {
  return <div className="mx-auto w-[260px] overflow-hidden rounded-[1.4rem] border-[5px] border-[#111b30] bg-[#111b30] shadow-[0_16px_30px_rgba(20,35,60,0.28)]">
    <div className="relative aspect-[9/16] overflow-hidden bg-[#dce6f5]">
      <Creative media={media} ratio="9 / 16" full />
      <div className="absolute inset-x-3 top-3 h-0.5 rounded bg-white/55"><div className="h-full w-2/3 rounded bg-white" /></div>
      <div className="absolute inset-x-3 top-6 flex items-center gap-2 text-white"><Avatar brand={brand} /><div><p className="text-[10px] font-bold drop-shadow">{brand}</p><p className="text-[9px] opacity-85">Sponsored</p></div><span className="ml-auto text-sm">•••</span></div>
      <p className="absolute inset-x-4 bottom-16 line-clamp-2 text-[10px] font-semibold leading-4 text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">{caption || "Your campaign caption will appear here."}</p>
      <div className="absolute inset-x-4 bottom-5"><ActionButton brand={brand} full>{action}</ActionButton></div>
    </div>
  </div>;
}

function Avatar({ brand }: { brand: string }) {
  if (brand === "PropertyGuru / iProperty") {
    return <span aria-label="PropertyGuru and iProperty" className="flex h-9 w-9 shrink-0 rounded-full bg-[#8a919b] shadow-sm" />;
  }
  if (brand === "PropertyGuru") {
    return <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brands/propertyguru-profile.png" alt="PropertyGuru" className="h-full w-full object-cover" />
    </span>
  }
  return <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white bg-white shadow-sm">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src="/brands/iproperty.jpeg" alt="iProperty" className="h-full w-full object-contain" />
  </span>;
}

function ActionButton({ brand, full = false, children }: { brand: string; full?: boolean; children: React.ReactNode }) {
  const color = brand === "PropertyGuru" ? "bg-[#d80000]" : brand === "iProperty" ? "bg-[#2169df]" : "bg-[#707782]";
  return <button type="button" className={`${full ? "w-full" : ""} rounded-md ${color} px-4 py-2 text-[10px] font-bold text-white`}>{children}</button>;
}

function Creative({ media, ratio, full = false }: { media?: Media; ratio: string; full?: boolean }) {
  return <div className={`relative flex items-center justify-center overflow-hidden bg-[#e8eff9] ${full ? "h-full" : ""}`} style={full ? undefined : { aspectRatio: ratio }}>
    {media ? <>
      {/* Object URLs from the local upload input cannot use next/image. */}
      {media.type.startsWith("video/") ? <video src={media.url} className="h-full w-full object-cover" controls autoPlay loop muted playsInline preload="metadata" /> : <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={media.url} alt="Uploaded ad creative preview" className="h-full w-full object-cover" />
      </>}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
    </> : <div className="text-center text-[#8499b9]"><p className="text-2xl">▧</p><p className="mt-1 text-xs font-semibold">Preview placeholder</p><p className="text-[10px]">Upload creative to see your ad</p></div>}
  </div>;
}
