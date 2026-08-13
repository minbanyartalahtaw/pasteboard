import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { put, del } from "@vercel/blob";

/**
 * Reads a private thumbnail blob and returns it base64-encoded.
 *
 * Thumbnails are stored with `access: "private"`, so the blob URL alone is not
 * enough — the store token has to be presented. Callers must have already
 * checked that the requesting user owns the slide this URL belongs to.
 */
export async function fetchThumbnailBase64(
  url: string
): Promise<{ data: string; mimeType: string } | null> {
  if (!url.includes("blob.vercel-storage.com")) return null;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
  });
  if (!res.ok) return null;

  const buffer = Buffer.from(await res.arrayBuffer());
  return {
    data: buffer.toString("base64"),
    mimeType: res.headers.get("content-type") ?? "image/webp",
  };
}

/**
 * Screenshots `html` in headless Chrome and stores it as a private blob.
 *
 * Callers are responsible for authorization — this does no session or ownership
 * checking, so never expose it directly.
 */
export async function renderThumbnail(
  presentationId: string,
  html: string,
  oldUrl?: string | null
): Promise<string | null> {
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
