"use client";

import { useState } from "react";

type File = { url: string; name: string };

export default function DownloadAllFilesButton({ files }: { files: File[] }) {
  const [started, setStarted] = useState(false);

  function downloadAll() {
    setStarted(true);
    files.forEach((file, index) => {
      window.setTimeout(() => {
        const link = document.createElement("a");
        link.href = `/api/download?url=${encodeURIComponent(file.url)}&name=${encodeURIComponent(file.name)}`;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }, index * 250);
    });
  }

  return <button type="button" onClick={downloadAll} disabled={started} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-crystal px-4 py-2.5 text-sm font-semibold text-mahogany transition hover:bg-crystal-soft disabled:opacity-60"><svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 18v2h14v-2" strokeLinecap="round" strokeLinejoin="round" /></svg>{started ? "Downloads started" : `Download all files (${files.length})`}</button>;
}
