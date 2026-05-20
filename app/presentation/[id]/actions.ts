"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { put, del } from "@vercel/blob";

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

  revalidatePath("/presentation", "layout");

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

  const executablePath =
    process.env.NODE_ENV === "production"
      ? await chromium.executablePath()
      : (process.env.CHROME_PATH ?? "/usr/bin/google-chrome");

  const browser = await puppeteer.launch({
    args:
      process.env.NODE_ENV === "production"
        ? chromium.args
        : ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1280, height: 720 },
    executablePath,
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load", timeout: 15000 });

    await page.evaluate(async () => {
      const anims = document.getAnimations();
      if (anims.length > 0) {
        await Promise.race([
          Promise.allSettled(anims.map((a) => a.finished)),
          new Promise<void>((r) => setTimeout(r, 5000)),
        ]);
      }
      await new Promise<void>((r) => setTimeout(r, 100));
    });

    const screenshot = Buffer.from(
      await page.screenshot({ type: "webp", quality: 80 })
    );

    const { url } = await put(
      `slides/${presentationId}/${Math.random().toString(36).slice(2, 10)}.webp`,
      screenshot,
      { access: "private" }
    );

    if (
      oldUrl &&
      typeof oldUrl === "string" &&
      oldUrl.includes("blob.vercel-storage.com")
    ) {
      await del(oldUrl).catch(() => {});
    }

    return url;
  } finally {
    await browser.close();
  }
}
