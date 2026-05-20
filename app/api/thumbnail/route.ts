import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return new Response(null, { status: 401 });

  const url = request.nextUrl.searchParams.get("url");
  if (!url || !url.includes("blob.vercel-storage.com")) {
    return new Response(null, { status: 400 });
  }
  const blobRes = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
    },
  });

  if (!blobRes.ok) return new Response(null, { status: blobRes.status });

  return new Response(blobRes.body, {
    headers: {
      "Content-Type": blobRes.headers.get("Content-Type") ?? "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
