"use client";

import { useState } from "react";

type Status = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
type Screen = "FOT" | "AGENT" | "FORM";
type Campaign = { soNumber: string; quantity: number; statuses: Status[] };

const statusText: Record<Status, string> = { NOT_STARTED: "Not started", IN_PROGRESS: "In progress", COMPLETED: "Completed" };

function freshCampaign(soNumber = "100023", quantity = 5): Campaign {
  return { soNumber, quantity, statuses: Array.from({ length: quantity }, () => "NOT_STARTED") };
}

export default function CampaignConcept() {
  const [screen, setScreen] = useState<Screen>("FOT");
  const [campaign, setCampaign] = useState<Campaign>(() => freshCampaign());
  const [draftSo, setDraftSo] = useState(() => campaign.soNumber);
  const [draftQuantity, setDraftQuantity] = useState(() => campaign.quantity);
  const [activeCampaign, setActiveCampaign] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const completed = campaign.statuses.filter((status) => status === "COMPLETED").length;
  const inProgress = campaign.statuses.filter((status) => status === "IN_PROGRESS").length;
  const agentLink = "/local-preview/campaigns?agent=1";

  function generateCampaign() {
    if (/^\d{5,6}$/.test(draftSo)) setCampaign(freshCampaign(draftSo, draftQuantity));
  }
  function openCampaign(index: number) {
    setCampaign((current) => ({ ...current, statuses: current.statuses.map((status, item) => item === index && status === "NOT_STARTED" ? "IN_PROGRESS" : status) }));
    setActiveCampaign(index); setScreen("FORM");
  }
  function completeCampaign() {
    if (activeCampaign === null) return;
    setCampaign((current) => ({ ...current, statuses: current.statuses.map((status, item) => item === activeCampaign ? "COMPLETED" : status) }));
    setScreen("AGENT");
  }
  async function copyLink() {
    await navigator.clipboard.writeText(agentLink); setCopied(true); window.setTimeout(() => setCopied(false), 1400);
  }

  return <main className="min-h-screen bg-[#f5f8fc] text-[#172b54]">
    <header className="border-b border-[#dce6f5] bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
      <button type="button" onClick={() => setScreen("FOT")} className="text-left"><p className="text-lg font-bold">B2C Portal</p><p className="text-xs text-[#60708f]">Local campaign-quantity concept</p></button>
      <div className="flex rounded-lg bg-[#edf3fc] p-1 text-sm font-medium"><Tab active={screen === "FOT"} onClick={() => setScreen("FOT")}>FOT view</Tab><Tab active={screen !== "FOT"} onClick={() => setScreen("AGENT")}>Agent view</Tab></div>
    </div></header>
    <div className="mx-auto max-w-6xl px-5 py-8">
      {screen === "FOT" && <FotView campaign={campaign} draftSo={draftSo} draftQuantity={draftQuantity} agentLink={agentLink} copied={copied} onSoChange={(value) => setDraftSo(value.replace(/\D/g, "").slice(0, 6))} onQuantityChange={(value) => setDraftQuantity(Math.min(20, Math.max(1, value || 1)))} onGenerate={generateCampaign} onCopy={copyLink} onOpenAgent={() => setScreen("AGENT")} />}
      {screen === "AGENT" && <AgentView campaign={campaign} completed={completed} inProgress={inProgress} onOpen={openCampaign} />}
      {screen === "FORM" && activeCampaign !== null && <CampaignForm title={`Campaign Ad ${activeCampaign + 1}`} campaignNumber={activeCampaign + 1} total={campaign.quantity} status={campaign.statuses[activeCampaign]} onBack={() => setScreen("AGENT")} onComplete={completeCampaign} />}
    </div>
  </main>;
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button onClick={onClick} className={`rounded-md px-3 py-1.5 ${active ? "bg-white text-[#2169df] shadow-sm" : "text-[#60708f]"}`}>{children}</button>; }

function FotView({ campaign, draftSo, draftQuantity, agentLink, copied, onSoChange, onQuantityChange, onGenerate, onCopy, onOpenAgent }: { campaign: Campaign; draftSo: string; draftQuantity: number; agentLink: string; copied: boolean; onSoChange: (value: string) => void; onQuantityChange: (value: number) => void; onGenerate: () => void; onCopy: () => void; onOpenAgent: () => void }) {
  return <div className="mx-auto max-w-3xl space-y-6"><div><p className="text-sm font-semibold text-[#2169df]">FOT · Create campaign request</p><h1 className="mt-1 text-3xl font-bold">Create one SO with multiple campaigns</h1><p className="mt-2 text-sm leading-6 text-[#60708f]">Set the required number of ad submissions once. The agent receives one dashboard link and completes every campaign separately.</p></div>
    <section className="space-y-5 rounded-2xl border border-[#dce6f5] bg-white p-6 shadow-sm"><div><p className="text-sm font-medium text-[#60708f]">Product</p><p className="mt-1 font-semibold">Meta Ads Campaign</p></div><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1 text-sm font-medium">SO number<div className="flex overflow-hidden rounded-lg border border-[#ccd9ec]"><span className="bg-[#edf3fc] px-3 py-2 font-semibold">SO</span><input value={draftSo} onChange={(event) => onSoChange(event.target.value)} inputMode="numeric" className="min-w-0 flex-1 border-l border-[#ccd9ec] px-3 py-2 outline-none" /></div></label><label className="space-y-1 text-sm font-medium">Number of campaign submissions<input type="number" min={1} max={20} value={draftQuantity} onChange={(event) => onQuantityChange(Number(event.target.value))} className="block w-full rounded-lg border border-[#ccd9ec] px-3 py-2 outline-none" /></label></div><button type="button" disabled={!/^\d{5,6}$/.test(draftSo)} onClick={onGenerate} className="rounded-lg bg-[#2169df] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#185bc5] disabled:opacity-50">Generate agent campaign link</button>{!/^\d{5,6}$/.test(draftSo) && <p className="text-sm text-rose-600">SO number needs 5 or 6 digits.</p>}</section>
    <section className="space-y-3 rounded-2xl border border-[#dce6f5] bg-white p-6 shadow-sm"><div className="flex items-center justify-between gap-3"><div><h2 className="font-bold">Agent campaign link</h2><p className="text-sm text-[#60708f]">SO {campaign.soNumber} · {campaign.quantity} campaign ads</p></div><span className="rounded-full bg-[#edf3fc] px-3 py-1 text-xs font-semibold text-[#2169df]">One link</span></div><div className="flex gap-2"><code className="min-w-0 flex-1 truncate rounded-lg bg-[#f5f8fc] px-3 py-2 text-xs text-[#60708f]">{agentLink}</code><button onClick={onCopy} className="rounded-lg border border-[#ccd9ec] px-3 text-sm font-semibold">{copied ? "Copied" : "Copy"}</button></div><button onClick={onOpenAgent} className="text-sm font-semibold text-[#2169df] hover:underline">Preview the agent dashboard →</button></section>
  </div>;
}

function AgentView({ campaign, completed, inProgress, onOpen }: { campaign: Campaign; completed: number; inProgress: number; onOpen: (index: number) => void }) {
  const ready = campaign.quantity - completed - inProgress;
  return <div className="space-y-7"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h1 className="text-3xl font-bold">Your Campaign</h1><p className="mt-1 text-sm text-[#60708f]">SO {campaign.soNumber} · Complete each campaign ad below</p></div><button className="rounded-xl bg-[#2169df] px-5 py-3 text-sm font-semibold text-white">Review all campaigns</button></div><div className="grid gap-4 sm:grid-cols-3"><Summary label="Campaign ads" value={String(campaign.quantity)} /><Summary label="Completed" value={`${completed} / ${campaign.quantity}`} /><Summary label="In progress" value={`${inProgress} / ${campaign.quantity}`} /></div>{ready > 0 && <p className="text-sm text-[#60708f]">{ready} campaign {ready === 1 ? "is" : "ads are"} ready to start.</p>}<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{campaign.statuses.map((status, index) => <article key={index} className="rounded-2xl border border-[#dce6f5] bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#edf3fc] text-xl text-[#6d86aa]">▧</div><span className={`rounded-full px-2.5 py-1.5 text-[11px] font-semibold ${status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" : status === "IN_PROGRESS" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-600"}`}>{statusText[status]}</span></div><h2 className="mt-4 text-base font-bold">Campaign Ad {index + 1}</h2><div className="mt-2 space-y-1 text-sm text-[#60708f]"><p>{status === "COMPLETED" ? "Listing / Profile selected" : "Listing / Profile not selected"}</p><p>{status === "COMPLETED" ? "Platform selected" : "Platform not selected"}</p><p>{status === "COMPLETED" ? "Start date selected" : "Start date not selected"}</p></div><button onClick={() => onOpen(index)} className={`mt-5 w-full rounded-lg px-4 py-2.5 text-sm font-semibold ${status === "COMPLETED" ? "border border-[#ccd9ec] hover:bg-[#f5f8fc]" : "bg-[#2169df] text-white hover:bg-[#185bc5]"}`}>{status === "NOT_STARTED" ? "Add campaign" : status === "IN_PROGRESS" ? "Continue campaign" : "Review submission"}</button></article>)}</div></div>;
}

function CampaignForm({ title, campaignNumber, total, status, onBack, onComplete }: { title: string; campaignNumber: number; total: number; status: Status; onBack: () => void; onComplete: () => void }) {
  const [step, setStep] = useState(1); const [language, setLanguage] = useState("English"); const [listing, setListing] = useState(""); const [platform, setPlatform] = useState(""); const [date, setDate] = useState("");
  return <div className="mx-auto max-w-xl space-y-6"><button onClick={onBack} className="text-sm font-semibold text-[#2169df] hover:underline">← Back to all campaigns</button><div><p className="text-sm text-[#60708f]">Campaign {campaignNumber} of {total} · {statusText[status]}</p><h1 className="mt-1 text-2xl font-bold">{title}</h1><div className="mt-3 flex gap-1">{[1, 2, 3].map((item) => <div key={item} className={`h-1.5 flex-1 rounded ${item <= step ? "bg-[#2169df]" : "bg-[#dce6f5]"}`} />)}</div></div><section className="space-y-5 rounded-2xl border border-[#dce6f5] bg-white p-6 shadow-sm">{step === 1 && <><h2 className="font-bold">Campaign details</h2><label className="block text-sm font-medium">Language<select value={language} onChange={(event) => setLanguage(event.target.value)} className="mt-1 block w-full rounded-lg border border-[#ccd9ec] px-3 py-2"><option>English</option><option>Bahasa Melayu</option><option>Mandarin</option></select></label><label className="block text-sm font-medium">Listing / profile URL<input value={listing} onChange={(event) => setListing(event.target.value)} placeholder="https://..." className="mt-1 block w-full rounded-lg border border-[#ccd9ec] px-3 py-2" /></label></>}{step === 2 && <><h2 className="font-bold">Ad setup</h2><label className="block text-sm font-medium">Platform<select value={platform} onChange={(event) => setPlatform(event.target.value)} className="mt-1 block w-full rounded-lg border border-[#ccd9ec] px-3 py-2"><option value="">Choose platform</option><option>Facebook</option><option>Instagram</option></select></label><label className="block text-sm font-medium">Preferred start date<input value={date} onChange={(event) => setDate(event.target.value)} type="date" className="mt-1 block w-full rounded-lg border border-[#ccd9ec] px-3 py-2" /></label></>}{step === 3 && <><h2 className="font-bold">Materials submission</h2><div className="rounded-lg border border-dashed border-[#9bb6dd] bg-[#f5f8fc] p-8 text-center text-sm text-[#60708f]">Upload your media materials here<br /><span className="text-xs">The final build will use your existing format, size and sample-link rules.</span></div></>}<div className="flex justify-between pt-2"><button onClick={() => step === 1 ? onBack() : setStep(step - 1)} className="rounded-lg border border-[#ccd9ec] px-4 py-2 text-sm font-semibold">Back</button>{step < 3 ? <button onClick={() => setStep(step + 1)} className="rounded-lg bg-[#2169df] px-4 py-2 text-sm font-semibold text-white">Next</button> : <button onClick={onComplete} className="rounded-lg bg-[#2169df] px-4 py-2 text-sm font-semibold text-white">Submit campaign</button>}</div></section></div>;
}

function Summary({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-[#dce6f5] bg-white p-5 shadow-sm"><p className="text-sm text-[#60708f]">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>; }
