"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";
import { renderThumbnail } from "@/lib/thumbnail";

export type SaveSlideInput = {
  /** Stable key in editor state; maps the saved row back onto that state. */
  key: string;
  /** The database id, once this slide has been persisted. */
  id?: string | null;
  html: string;
  thumbnailUrl?: string | null;
  /** `Slide.updatedAt` as the editor last saw it, used to detect edits made
   *  elsewhere — the MCP server, or another tab. */
  savedAt?: string | null;
};

export type SaveInput = {
  title: string;
  slides: SaveSlideInput[];
  /** Database ids the editor deliberately removed. */
  removedIds?: string[];
};

export type SavedSlide = {
  key: string;
  id: string;
  html: string;
  thumbnailUrl: string | null;
  savedAt: string;
};

export type SaveResult =
  | { ok: true; slides: SavedSlide[]; conflicts: number }
  | { ok: false; error: string };

/**
 * Persists the editor's slides, keyed by id.
 *
 * Slides are updated in place rather than dropped and recreated, for two
 * reasons: ids stay stable, so a slide id the MCP server handed to a chatbot
 * keeps working; and a row the editor never loaded is left alone instead of
 * being deleted. Where a row has moved on since the editor loaded it, the
 * stored version wins — the editor is working from a stale copy and must not
 * overwrite an edit it never saw.
 */
export async function savePresentation(
  presentationId: string,
  data: SaveInput
): Promise<SaveResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  const presentation = await prisma.presentation.findFirst({
    where: { id: presentationId, userId: session.userId },
    select: { id: true },
  });
  if (!presentation) return { ok: false, error: "Not found" };

  const title = data.title.trim() || "Untitled";

  const existing = await prisma.slide.findMany({
    where: { presentationId },
    select: { id: true, html: true, thumbnailUrl: true, updatedAt: true },
  });
  const byId = new Map(existing.map((s) => [s.id, s]));

  const saved: SavedSlide[] = [];
  const kept = new Set<string>();
  let conflicts = 0;

  await prisma.$transaction(async (tx) => {
    await tx.presentation.update({
      where: { id: presentationId },
      data: { title },
    });

    for (const [order, slide] of data.slides.entries()) {
      const row = slide.id ? byId.get(slide.id) : undefined;

      if (!row) {
        const created = await tx.slide.create({
          data: {
            presentationId,
            html: slide.html,
            thumbnailUrl: slide.thumbnailUrl ?? null,
            order,
          },
        });
        kept.add(created.id);
        saved.push({
          key: slide.key,
          id: created.id,
          html: created.html,
          thumbnailUrl: created.thumbnailUrl,
          savedAt: created.updatedAt.toISOString(),
        });
        continue;
      }

      kept.add(row.id);

      const stale = slide.savedAt
        ? row.updatedAt.getTime() > Date.parse(slide.savedAt)
        : true;

      if (stale) {
        // Keep the stored html and thumbnail; only the ordering is the
        // editor's to decide.
        if (row.html !== slide.html) conflicts++;
        const reordered = await tx.slide.update({
          where: { id: row.id },
          data: { order },
        });
        saved.push({
          key: slide.key,
          id: row.id,
          html: reordered.html,
          thumbnailUrl: reordered.thumbnailUrl,
          savedAt: reordered.updatedAt.toISOString(),
        });
        continue;
      }

      const updated = await tx.slide.update({
        where: { id: row.id },
        data: {
          html: slide.html,
          order,
          // A missing thumbnail means the editor has nothing newer than what is
          // stored, so leave the column alone rather than blanking it.
          ...(slide.thumbnailUrl ? { thumbnailUrl: slide.thumbnailUrl } : {}),
        },
      });
      saved.push({
        key: slide.key,
        id: updated.id,
        html: updated.html,
        thumbnailUrl: updated.thumbnailUrl,
        savedAt: updated.updatedAt.toISOString(),
      });
    }
  });

  // Delete only what the editor explicitly removed. Anything else absent from
  // its list is a slide it never knew about.
  const removable = (data.removedIds ?? []).filter(
    (id) => byId.has(id) && !kept.has(id)
  );
  if (removable.length > 0) {
    await prisma.slide.deleteMany({
      where: { id: { in: removable }, presentationId },
    });
    const orphaned = removable
      .map((id) => byId.get(id)?.thumbnailUrl)
      .filter(
        (url): url is string =>
          !!url && url.includes("blob.vercel-storage.com")
      );
    if (orphaned.length > 0) {
      await Promise.allSettled(orphaned.map((url) => del(url)));
    }
  }

  revalidatePath("/user/presentation", "layout");

  return { ok: true, slides: saved, conflicts };
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
