"use client";

import { useEffect, useState } from "react";
import { createSubmissionLink } from "@/app/actions/submissions";

type SubmissionRow = {
  id: string;
  soNumber: string;
  status: string;
  shareToken: string;
  createdAt: string;
};

export default function SubmissionsPanel({
  productId,
  submissions,
  createdToken,
}: {
  productId: string;
  submissions: SubmissionRow[];
  createdToken?: string;
}) {
  const [soNumber, setSoNumber] = useState("");
  const [soError, setSoError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- needed once to avoid SSR/client origin mismatch
    setOrigin(window.location.origin);
  }, []);

  function linkFor(token: string) {
    return `${origin}/fill/${token}`;
  }

  async function copyLink(token: string) {
    await navigator.clipboard.writeText(linkFor(token));
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 1500);
  }

  return (
    <div className="rounded-lg border border-crystal bg-white p-5 space-y-4">
      <h2 className="font-semibold text-mahogany">Shareable links</h2>

      {createdToken && (
        <div className="rounded-md bg-crystal-soft border border-crystal p-3 text-sm space-y-1">
          <p className="font-medium text-mahogany">Link created</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-white px-2 py-1 border border-crystal">
              {linkFor(createdToken)}
            </code>
            <button
              onClick={() => copyLink(createdToken)}
              className="rounded-md bg-ignite px-3 py-1 text-xs font-medium text-white hover:bg-ignite-hover"
            >
              {copiedToken === createdToken ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      <form
        action={async () => {
          if (!/^\d{6}$/.test(soNumber)) {
            setSoError("SO number must be exactly 6 digits.");
            return;
          }
          setSoError(null);
          await createSubmissionLink(productId, soNumber);
        }}
        className="space-y-1"
      >
        <div className="flex gap-2">
          <div className="flex flex-1 overflow-hidden rounded-md border focus-within:border-ignite">
            <span className="flex items-center bg-crystal-soft px-3 text-sm font-medium text-mahogany">
              SO
            </span>
            <input
              name="soNumber"
              required
              value={soNumber}
              onChange={(e) => setSoNumber(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              placeholder="100023"
              className="flex-1 border-l px-3 py-2 text-sm focus:outline-none"
            />
          </div>
          <button className="rounded-md bg-ignite px-4 py-2 text-sm font-medium text-white hover:bg-ignite-hover">
            Generate link
          </button>
        </div>
        {soError && <p className="text-sm text-red-600">{soError}</p>}
      </form>

      <div className="divide-y divide-crystal">
        {submissions.length === 0 && (
          <p className="py-3 text-sm text-mahogany/50">No links generated yet.</p>
        )}
        {submissions.map((s) => (
          <div key={s.id} className="flex items-center justify-between py-3 text-sm">
            <div>
              <p className="font-medium text-mahogany">SO {s.soNumber}</p>
              <p className="text-mahogany/50">
                {s.status === "SUBMITTED" ? "✅ Submitted" : "⏳ Pending"} ·{" "}
                {new Date(s.createdAt).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => copyLink(s.shareToken)}
              className="rounded-md border border-crystal px-3 py-1 text-xs font-medium text-mahogany hover:bg-crystal-soft"
            >
              {copiedToken === s.shareToken ? "Copied!" : "Copy link"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
