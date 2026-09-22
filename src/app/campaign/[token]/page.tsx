import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SubmissionMediaSummary from "./SubmissionMediaSummary";
import CampaignIntake from "./CampaignIntake";
import { translations, type Language } from "@/lib/i18n";

type StoredFile = { url: string; name: string; type: string };

export default async function CampaignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { shareToken: token },
    include: {
      product: true,
      submissions: {
        orderBy: { campaignSequence: "asc" },
        include: { values: { include: { field: { select: { label: true, type: true, width: true, height: true } } } } },
      },
    },
  });
  if (!campaign) notFound();
  if (!campaign.language || !campaign.agentName || !campaign.agentId) return <CampaignIntake token={token} />;
  const t = translations[campaign.language as Language];

  const completed = campaign.submissions.filter((submission) => submission.status === "SUBMITTED").length;
  const inProgress = campaign.submissions.filter((submission) => submission.status === "PENDING").length;

  return <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#e0edff,_#f5f8fc_42%)]"><div className="mx-auto max-w-6xl px-5 py-10 space-y-7">
    <div className="rounded-3xl bg-[#172b54] px-7 py-8 text-white shadow-xl"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-200">{t.campaignWorkspace}</p><h1 className="mt-1 text-3xl font-bold">{t.yourCampaign}</h1><p className="mt-1 text-sm text-white/70">SO {campaign.soNumber} · {campaign.product.name}</p></div><span className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">{completed} / {campaign.quantity} {t.completed.toLowerCase()}</span></div></div>
    <div className="grid gap-4 sm:grid-cols-3"><Summary label={t.campaignAds} value={String(campaign.quantity)} /><Summary label={t.completed} value={`${completed} / ${campaign.quantity}`} /><Summary label={t.ready} value={`${inProgress} / ${campaign.quantity}`} /></div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{campaign.submissions.map((submission) => {
      const complete = submission.status === "SUBMITTED";
      const media = submission.values.filter((value) => value.field.type === "FILE").map((value) => ({ label: value.field.label, width: value.field.width, height: value.field.height, files: ((value.files as StoredFile[] | null) ?? []) }));
      return <article key={submission.id} className="group overflow-hidden rounded-3xl border border-crystal bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
        <div className={`flex items-center justify-between px-5 py-4 ${complete ? "bg-gradient-to-r from-emerald-50 to-white" : "bg-gradient-to-r from-rose-50 to-white"}`}>
          <div className="flex items-center gap-3"><span className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold ${complete ? "bg-emerald-600 text-white" : "bg-white text-ignite shadow-sm"}`}>{String(submission.campaignSequence).padStart(2, "0")}</span><div><p className="text-xs font-semibold text-mahogany/55">{t.campaignAd}</p><h2 className="text-base font-bold text-mahogany">{t.campaignAd} {submission.campaignSequence}</h2></div></div>
          <span className={`rounded-full px-2.5 py-1.5 text-[11px] font-semibold ${complete ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"}`}>{complete ? t.completed : t.notStarted}</span>
        </div>
        <div className="p-5"><p className="text-sm leading-5 text-mahogany/60">{complete ? t.materialsReady : t.addCampaignDetails}</p>{complete && <SubmissionMediaSummary media={media} />}<Link href={`/fill/${submission.shareToken}`} className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${complete ? "border border-crystal bg-white text-mahogany hover:border-mahogany/20 hover:bg-crystal-soft" : "bg-ignite text-white shadow-sm hover:bg-ignite-hover"}`}>{complete ? `${t.reviewSubmission} →` : `${t.addCampaign} →`}</Link></div>
      </article>;
    })}</div>
  </div></main>;
}

function Summary({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-crystal bg-white p-5 shadow-sm"><p className="text-sm text-mahogany/60">{label}</p><p className="mt-1 text-2xl font-bold text-mahogany">{value}</p></div>; }
