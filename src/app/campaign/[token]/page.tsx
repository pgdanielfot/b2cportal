import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SubmissionMediaSummary from "./SubmissionMediaSummary";

type StoredFile = { url: string; name: string; type: string };

export default async function CampaignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { shareToken: token },
    include: {
      product: true,
      submissions: {
        orderBy: { campaignSequence: "asc" },
        include: { values: { include: { field: { select: { label: true, type: true } } } } },
      },
    },
  });
  if (!campaign) notFound();

  const completed = campaign.submissions.filter((submission) => submission.status === "SUBMITTED").length;
  const inProgress = campaign.submissions.filter((submission) => submission.status === "PENDING").length;

  return <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#e0edff,_#f5f8fc_42%)]"><div className="mx-auto max-w-6xl px-5 py-10 space-y-7">
    <div className="rounded-3xl bg-[#172b54] px-7 py-8 text-white shadow-xl"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-200">Campaign workspace</p><h1 className="mt-1 text-3xl font-bold">Your Campaign</h1><p className="mt-1 text-sm text-white/70">SO {campaign.soNumber} · {campaign.product.name}</p></div><span className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">{completed} / {campaign.quantity} completed</span></div></div>
    <div className="grid gap-4 sm:grid-cols-3"><Summary label="Campaign ads" value={String(campaign.quantity)} /><Summary label="Completed" value={`${completed} / ${campaign.quantity}`} /><Summary label="Ready" value={`${inProgress} / ${campaign.quantity}`} /></div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{campaign.submissions.map((submission) => {
      const complete = submission.status === "SUBMITTED";
      const media = submission.values.filter((value) => value.field.type === "FILE").map((value) => ({ label: value.field.label, files: ((value.files as StoredFile[] | null) ?? []) }));
      return <article key={submission.id} className="rounded-2xl border border-crystal bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-start justify-between gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-lg bg-crystal-soft text-xl text-mahogany/40">▧</div><span className={`rounded-full px-2.5 py-1.5 text-[11px] font-semibold ${complete ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>{complete ? "Completed" : "Not started"}</span></div><h2 className="mt-4 text-base font-bold text-mahogany">Campaign Ad {submission.campaignSequence}</h2><p className="mt-2 text-sm text-mahogany/60">{complete ? "Submitted materials" : "Fill in the requested campaign information and materials."}</p>{complete && <SubmissionMediaSummary media={media} />}<Link href={`/fill/${submission.shareToken}`} className={`mt-5 block w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold ${complete ? "border border-crystal text-mahogany hover:bg-crystal-soft" : "bg-ignite text-white hover:bg-ignite-hover"}`}>{complete ? "Review submission" : "Add campaign"}</Link></article>;
    })}</div>
  </div></main>;
}

function Summary({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-crystal bg-white p-5 shadow-sm"><p className="text-sm text-mahogany/60">{label}</p><p className="mt-1 text-2xl font-bold text-mahogany">{value}</p></div>; }
