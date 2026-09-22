"use client";

import { useState } from "react";
import { localizeCommonContent, translations, type Language } from "@/lib/i18n";

type Props = {
  brand?: string;
  feedMedia?: Media[];
  storyImage?: Media[];
  storyVideo?: Media[];
  caption?: string;
  cta?: string;
  destination?: string;
  language?: Language;
};
export type Media = { url: string; type: string };

export default function LiveAdPreview({ brand, feedMedia, storyImage, storyVideo, caption, cta, destination, language = "en" }: Props) {
  const [placement, setPlacement] = useState<"FEED" | "STORY">("FEED");
  const [storyFormat, setStoryFormat] = useState<"IMAGE" | "VIDEO">("IMAGE");
  const [platform, setPlatform] = useState<"FACEBOOK" | "INSTAGRAM">("FACEBOOK");
  const [feedIndex, setFeedIndex] = useState(0);
  const [storyImageIndex, setStoryImageIndex] = useState(0);
  const [storyVideoIndex, setStoryVideoIndex] = useState(0);
  const t = translations[language];
  const action = localizeCommonContent(cta || t.learnMore, language);
  const brandLabel = /propertyguru.*\+.*iproperty|both/i.test(brand ?? "") ? "PropertyGuru / iProperty" : /iproperty|ipp/i.test(brand ?? "") ? "iProperty" : /propertyguru|\bpg\b/i.test(brand ?? "") ? "PropertyGuru" : "PropertyGuru / iProperty";
  const feed = feedMedia ?? [];
  const storyImages = storyImage ?? [];
  const storyVideos = storyVideo ?? [];
  const activeStoryMedia = storyFormat === "VIDEO" ? storyVideos : storyImages;

  return <section className="rounded-2xl border border-crystal bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3"><div><h2 className="text-base font-semibold text-mahogany">{t.liveAdPreview}</h2><p className="text-xs text-mahogany/55">Preview Iklan Langsung · 实时广告预览</p></div><span className="rounded-full bg-red-500 px-2 py-1 text-[10px] font-bold text-white">● LIVE</span></div>
    <div className="mt-3 flex flex-wrap gap-2"><Tab active={platform === "FACEBOOK"} onClick={() => setPlatform("FACEBOOK")}>Facebook</Tab><Tab active={platform === "INSTAGRAM"} onClick={() => setPlatform("INSTAGRAM")}>Instagram</Tab><span className="mx-1 hidden h-7 w-px bg-crystal sm:block" /><Tab active={placement === "FEED"} onClick={() => setPlacement("FEED")}>{t.feed}</Tab><Tab active={placement === "STORY"} onClick={() => setPlacement("STORY")}>{t.story}</Tab></div>
    {placement === "STORY" && storyVideos.length > 0 && <div className="mt-2 flex gap-2 text-[11px]"><button type="button" onClick={() => setStoryFormat("IMAGE")} className={`rounded px-2 py-1 ${storyFormat === "IMAGE" ? "bg-crystal text-mahogany" : "text-mahogany/55"}`}>{t.storyImage}</button><button type="button" onClick={() => setStoryFormat("VIDEO")} className={`rounded px-2 py-1 ${storyFormat === "VIDEO" ? "bg-crystal text-mahogany" : "text-mahogany/55"}`}>{t.storyVideo}</button></div>}
    {placement === "FEED" && <CreativeSelector count={feed.length} activeIndex={feedIndex} onChange={setFeedIndex} />}
    {placement === "STORY" && <CreativeSelector count={activeStoryMedia.length} activeIndex={storyFormat === "VIDEO" ? storyVideoIndex : storyImageIndex} onChange={storyFormat === "VIDEO" ? setStoryVideoIndex : setStoryImageIndex} />}
    <div className="mt-3 rounded-xl bg-[#e9f0fa] p-3 sm:p-4">
      <div className="mx-auto max-w-[360px]">
        <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-mahogany/55">{platform === "FACEBOOK" ? "Facebook" : "Instagram"}</p>
        {placement === "FEED" ? <FeedPost instagram={platform === "INSTAGRAM"} brand={brandLabel} media={feed[feedIndex] ?? feed[0]} caption={caption} action={action} destination={destination} t={t} /> : <StoryPost brand={brandLabel} media={activeStoryMedia[storyFormat === "VIDEO" ? storyVideoIndex : storyImageIndex] ?? activeStoryMedia[0]} caption={caption} action={action} t={t} />}
      </div>
    </div>
    <p className="mt-3 text-[11px] leading-4 text-mahogany/45">{t.visualGuide}</p>
  </section>;
}

function CreativeSelector({ count, activeIndex, onChange }: { count: number; activeIndex: number; onChange: (index: number) => void }) {
  if (count < 2) return null;
  return <div className="mt-2 flex items-center gap-2"><span className="text-[11px] font-medium text-mahogany/55">Creative</span>{Array.from({ length: count }, (_, index) => <button key={index} type="button" onClick={() => onChange(index)} className={`rounded-md border px-2 py-1 text-[11px] font-semibold ${activeIndex === index ? "border-ignite bg-ignite/5 text-ignite" : "border-crystal text-mahogany/60 hover:bg-crystal-soft"}`}>{index + 1}</button>)}</div>;
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={onClick} className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${active ? "border-ignite bg-ignite/5 text-ignite" : "border-crystal text-mahogany/60 hover:bg-crystal-soft"}`}>{children}</button>; }

function FeedPost({ instagram, brand, media, caption, action, destination, t }: { instagram: boolean; brand: string; media?: Media; caption?: string; action: string; destination?: string; t: (typeof translations)[Language] }) {
  return <div className="mx-auto w-full max-w-[340px] overflow-hidden rounded-xl border border-crystal bg-white shadow-sm">
    <div className="flex items-center gap-2 px-3 py-2.5"><Avatar brand={brand} /><div className="min-w-0"><p className="truncate text-xs font-bold text-mahogany">{brand}</p><p className="text-[10px] text-mahogany/50">{instagram ? "Sponsored" : "Sponsored · Facebook"}</p></div><span className="ml-auto text-lg leading-none text-mahogany/50">•••</span></div>
    <Creative media={media} ratio="1 / 1" t={t} />
    {instagram && <div className="px-3 pt-2 text-base tracking-wide text-mahogany">♡　◯　⌁</div>}
    <div className="space-y-1 px-3 py-2"><p className="whitespace-pre-wrap text-xs text-mahogany"><b>{brand}</b> {caption || t.campaignCaptionHint}</p><p className="truncate text-[10px] text-mahogany/45">{destination || (instagram ? "View more" : "Sponsored")}</p></div>
    {!instagram && <div className="flex items-center justify-between border-t border-crystal bg-[#f7f9fc] px-3 py-2"><span className="max-w-32 truncate text-[10px] font-semibold uppercase text-mahogany/55">{destination || "PROPERTYGURU.COM.MY"}</span><ActionButton brand={brand}>{action}</ActionButton></div>}
    {instagram && <div className="border-t border-crystal bg-[#f7f9fc] p-2"><ActionButton brand={brand} full>{action}</ActionButton></div>}
  </div>;
}

function StoryPost({ brand, media, caption, action, t }: { brand: string; media?: Media; caption?: string; action: string; t: (typeof translations)[Language] }) {
  return <div className="mx-auto w-full max-w-[300px] overflow-hidden rounded-[1.7rem] border-[6px] border-[#111b30] bg-[#111b30] shadow-[0_18px_34px_rgba(20,35,60,0.3)]">
    <div className="relative aspect-[9/16] overflow-hidden bg-[#dce6f5]">
      <Creative media={media} ratio="9 / 16" full t={t} />
      <div className="absolute inset-x-3 top-3 h-0.5 rounded bg-white/55"><div className="h-full w-2/3 rounded bg-white" /></div>
      <div className="absolute inset-x-3 top-6 flex items-center gap-2 text-white"><Avatar brand={brand} /><div><p className="text-[10px] font-bold drop-shadow">{brand}</p><p className="text-[9px] opacity-85">Sponsored</p></div><span className="ml-auto text-sm">•••</span></div>
      <p className="absolute inset-x-4 bottom-16 line-clamp-2 text-[10px] font-semibold leading-4 text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">{caption || t.campaignCaptionHint}</p>
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

function Creative({ media, ratio, full = false, t }: { media?: Media; ratio: string; full?: boolean; t: (typeof translations)[Language] }) {
  return <div className={`relative flex items-center justify-center overflow-hidden bg-[#e8eff9] ${full ? "h-full" : ""}`} style={full ? undefined : { aspectRatio: ratio }}>
    {media ? <>
      {/* Object URLs from the local upload input cannot use next/image. */}
      {media.type.startsWith("video/") ? <video src={media.url} className="h-full w-full object-cover" controls autoPlay loop muted playsInline preload="metadata" /> : <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={media.url} alt="Uploaded ad creative preview" className="h-full w-full object-cover" />
      </>}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
    </> : <div className="text-center text-[#8499b9]"><p className="text-2xl">▧</p><p className="mt-1 text-xs font-semibold">{t.previewPlaceholder}</p><p className="text-[10px]">{t.uploadCreativeHint}</p></div>}
  </div>;
}
