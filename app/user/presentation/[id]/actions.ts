"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";
import { renderThumbnail } from "@/lib/thumbnail";

export type SaveInput = {
  title: string;
  slides: { html: string; thumbnailUrl?: string | null }[];
};

export async function savePresentation(
  presentationId: string,
  data: SaveInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  const presentation = await prisma.presentation.findFirst({
    where: { id: presentationId, userId: session.userId },
    select: { id: true },
  });
  if (!presentation) return { ok: false, error: "Not found" };

  const title = data.title.trim() || "Untitled";
  const slides = data.slides.map((s, order) => ({
    presentationId,
    html: s.html,
    thumbnailUrl: s.thumbnailUrl ?? null,
    order,
  }));

  const existingSlides = await prisma.slide.findMany({
    where: { presentationId },
    select: { thumbnailUrl: true },
  });

  const incomingUrls = new Set(slides.map((s) => s.thumbnailUrl).filter(Boolean));
  const orphanedUrls = existingSlides
    .map((s) => s.thumbnailUrl)
    .filter((url): url is string => !!url && url.includes("blob.vercel-storage.com") && !incomingUrls.has(url));

  await prisma.$transaction([
    prisma.presentation.update({
      where: { id: presentationId },
      data: { title },
    }),
    prisma.slide.deleteMany({ where: { presentationId } }),
    ...(slides.length > 0
      ? [prisma.slide.createMany({ data: slides })]
      : []),
  ]);

  if (orphanedUrls.length > 0) {
    await Promise.allSettled(orphanedUrls.map((url) => del(url)));
  }

  revalidatePath("/user/presentation", "layout");

  return { ok: true };
}

export async function generateSlideThumbnail(
  presentationId: string,
  html: string,
  oldUrl?: string | null
): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;

  const presentation = await prisma.presentation.findFirst({
    where: { id: presentationId, userId: session.userId },
    select: { id: true },
  });
  if (!presentation) return null;

  return renderThumbnail(presentationId, html, oldUrl);
}
