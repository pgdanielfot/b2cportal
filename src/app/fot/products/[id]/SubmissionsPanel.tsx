"use client";

import { useEffect, useState } from "react";
import { createCampaignLink } from "@/app/actions/submissions";

type CampaignRow = {
  id: string;
  soNumber: string;
  quantity: number;
  shareToken: string;
  createdAt: string;
  completed: number;
};

export default function SubmissionsPanel({ productId, campaigns, createdCampaign }: { productId: string; campaigns: CampaignRow[]; createdCampaign?: string }) {
  const [soNumber, setSoNumber] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only origin avoids an SSR mismatch.
    setOrigin(window.location.origin);
  }, []);
  const linkFor = (token: string) => `${origin}/campaign/${token}`;
  async function copyLink(token: string) {
    await navigator.clipboard.writeText(linkFor(token)); setCopiedToken(token);
    window.setTimeout(() => setCopiedToken(null), 1500);
  }

  return <div className="space-y-4 rounded-lg border border-crystal bg-white p-5">
    <div><h2 className="font-semibold text-mahogany">Campaign submission links</h2><p className="mt-1 text-sm text-mahogany/60">Create one SO link with a chosen number of separate campaign submissions.</p></div>
    {createdCampaign && <div className="space-y-2 rounded-md border border-crystal bg-crystal-soft p-3 text-sm"><p className="font-medium text-mahogany">Campaign link created</p><div className="flex items-center gap-2"><code className="flex-1 truncate rounded border border-crystal bg-white px-2 py-1">{linkFor(createdCampaign)}</code><button onClick={() => copyLink(createdCampaign)} className="rounded-md bg-ignite px-3 py-1 text-xs font-medium text-white hover:bg-ignite-hover">{copiedToken === createdCampaign ? "Copied!" : "Copy"}</button></div></div>}
    <form action={async () => { if (!/^\d{5,6}$/.test(soNumber)) { setError("SO number must be 5 or 6 digits."); return; } setError(null); await createCampaignLink(productId, soNumber, quantity); }} className="grid gap-3 sm:grid-cols-[1fr_11rem_auto] sm:items-end">
      <label className="space-y-1 text-sm font-medium text-mahogany">SO number<div className="flex overflow-hidden rounded-md border focus-within:border-ignite"><span className="bg-crystal-soft px-3 py-2">SO</span><input value={soNumber} onChange={(event) => setSoNumber(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="100023" className="min-w-0 flex-1 border-l px-3 py-2 focus:outline-none" /></div></label>
      <label className="space-y-1 text-sm font-medium text-mahogany">Campaign quantity<input type="number" min={1} max={20} value={quantity} onChange={(event) => setQuantity(Math.min(20, Math.max(1, Number(event.target.value) || 1)))} className="block w-full rounded-md border px-3 py-2 focus:border-ignite focus:outline-none" /></label>
      <button className="rounded-md bg-ignite px-4 py-2 text-sm font-medium text-white hover:bg-ignite-hover">Generate link</button>
    </form>
    {error && <p className="text-sm text-red-600">{error}</p>}
    <div className="divide-y divide-crystal">{campaigns.length === 0 && <p className="py-3 text-sm text-mahogany/50">No campaign links generated yet.</p>}{campaigns.map((campaign) => <div key={campaign.id} className="flex items-center justify-between gap-4 py-3 text-sm"><div className="min-w-0"><p className="font-medium text-mahogany">SO {campaign.soNumber} · {campaign.quantity} campaign {campaign.quantity === 1 ? "ad" : "ads"}</p><p className="text-mahogany/50">{campaign.completed} / {campaign.quantity} completed · {new Date(campaign.createdAt).toLocaleString()}</p></div><button onClick={() => copyLink(campaign.shareToken)} className="shrink-0 rounded-md border border-crystal px-3 py-1 text-xs font-medium text-mahogany hover:bg-crystal-soft">{copiedToken === campaign.shareToken ? "Copied!" : "Copy link"}</button></div>)}</div>
  </div>;
}
