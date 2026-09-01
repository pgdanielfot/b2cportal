"use client";

import { useTransition } from "react";
import { deleteSubmissionFromList, setSubmissionArchived } from "@/app/actions/submissions";

export default function SubmissionRowActions({
  submissionId,
  archived,
}: {
  submissionId: string;
  archived: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleArchiveToggle() {
    startTransition(async () => {
      await setSubmissionArchived(submissionId, !archived);
    });
  }

  function handleDelete() {
    if (!confirm("Delete this submission permanently? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteSubmissionFromList(submissionId);
    });
  }

  return (
    <div className="flex shrink-0 gap-2">
      <button
        type="button"
        onClick={handleArchiveToggle}
        disabled={isPending}
        className="rounded-md border border-crystal px-3 py-1 text-xs font-medium text-mahogany hover:bg-crystal-soft disabled:opacity-50"
      >
        {archived ? "Unarchive" : "Archive"}
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
