import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const name = searchParams.get("name") ?? "download";

  if (!url) {
    return new NextResponse("Missing url", { status: 400 });
  }

  const target = new URL(url, req.url);
  const isOwnFilesRoute = target.origin === req.nextUrl.origin && target.pathname.startsWith("/api/files/");
  const isVercelBlob = target.hostname.endsWith(".public.blob.vercel-storage.com");

  if (!isOwnFilesRoute && !isVercelBlob) {
    return new NextResponse("Invalid file source", { status: 400 });
  }

  const upstream = await fetch(target, { headers: { cookie: req.headers.get("cookie") ?? "" } });
  if (!upstream.ok || !upstream.body) {
    return new NextResponse("File not found", { status: 404 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${name.replace(/"/g, "")}"`,
    },
  });
}
