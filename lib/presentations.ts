import { list, del } from "@vercel/blob";

import { prisma } from "@/lib/prisma";

/**
 * Presentation/slide operations scoped to an explicit `userId`.
 *
 * Server actions read the id from the session cookie, the MCP endpoint reads it
 * from a bearer token — both funnel through here so ownership is enforced in one
 * place. Every function returns null/false rather than throwing when the caller
 * does not own the row, so the two transports can shape their own errors.
 */

export async function ownsPresentation(
  userId: string,
  presentationId: string
): Promise<boolean> {
  const found = await prisma.presentation.findFirst({
    where: { id: presentationId, userId },
    select: { id: true },
  });
  return found !== null;
}

export async function listPresentations(userId: string) {
  return prisma.presentation.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      isPublic: true,
      updatedAt: true,
      _count: { select: { slides: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getPresentation(userId: string, presentationId: string) {
  return prisma.presentation.findFirst({
    where: { id: presentationId, userId },
    select: {
      id: true,
      title: true,
      isPublic: true,
      updatedAt: true,
      slides: {
        select: { id: true, html: true, order: true },
        orderBy: { order: "asc" },
      },
    },
  });
}

export async function createPresentationFor(
  userId: string,
  title: string
): Promise<{ id: string } | null> {
  const trimmed = title.trim();
  if (!trimmed) return null;
  return prisma.presentation.create({
    data: { userId, title: trimmed },
    select: { id: true },
  });
}

export async function deletePresentationFor(
  userId: string,
  presentationId: string
): Promise<boolean> {
  if (!(await ownsPresentation(userId, presentationId))) return false;

  await prisma.presentation.delete({ where: { id: presentationId } });

  const { blobs } = await list({ prefix: `slides/${presentationId}/` });
  if (blobs.length > 0) {
    await Promise.allSettled(blobs.map((b) => del(b.url)));
  }
  return true;
}

export async function setPresentationPublicFor(
  userId: string,
  presentationId: string,
  isPublic: boolean
): Promise<boolean> {
  if (!(await ownsPresentation(userId, presentationId))) return false;
  await prisma.presentation.update({
    where: { id: presentationId },
    data: { isPublic },
  });
  return true;
}

export async function renamePresentationFor(
  userId: string,
  presentationId: string,
  title: string
): Promise<boolean> {
  const trimmed = title.trim();
  if (!trimmed) return false;
  if (!(await ownsPresentation(userId, presentationId))) return false;
  await prisma.presentation.update({
    where: { id: presentationId },
    data: { title: trimmed },
  });
  return true;
}

/**
 * Appends a slide, or inserts it at `position` (0-based), shifting later slides
 * down. Returns the new slide's id.
 */
export async function addSlideFor(
  userId: string,
  presentationId: string,
  html: string,
  position?: number
): Promise<{ id: string; order: number } | null> {
  if (!(await ownsPresentation(userId, presentationId))) return null;

  return prisma.$transaction(async (tx) => {
    const count = await tx.slide.count({ where: { presentationId } });
    const order =
      position === undefined ? count : Math.max(0, Math.min(position, count));

    if (order < count) {
      await tx.slide.updateMany({
        where: { presentationId, order: { gte: order } },
        data: { order: { increment: 1 } },
      });
    }

    const slide = await tx.slide.create({
      data: { presentationId, html, order },
      select: { id: true, order: true },
    });
    return slide;
  });
}

export async function getSlideFor(userId: string, slideId: string) {
  return prisma.slide.findFirst({
    where: { id: slideId, presentation: { userId } },
    select: {
      id: true,
      presentationId: true,
      html: true,
      order: true,
      thumbnailUrl: true,
    },
  });
}

export type EditSlideResult =
  | { ok: true; presentationId: string; html: string; oldThumbnailUrl: string | null }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "no_match" }
  | { ok: false; reason: "ambiguous"; count: number };

/**
 * Replaces a single literal occurrence of `find` in a slide's HTML.
 *
 * Zero or multiple matches are rejected rather than guessed at — a patch the
 * caller cannot predict the result of should fail, not silently rewrite the
 * wrong part of the slide.
 */
export async function editSlideFor(
  userId: string,
  slideId: string,
  find: string,
  replace: string
): Promise<EditSlideResult> {
  const slide = await prisma.slide.findFirst({
    where: { id: slideId, presentation: { userId } },
    select: { id: true, presentationId: true, html: true, thumbnailUrl: true },
  });
  if (!slide) return { ok: false, reason: "not_found" };

  const count = slide.html.split(find).length - 1;
  if (count === 0) return { ok: false, reason: "no_match" };
  if (count > 1) return { ok: false, reason: "ambiguous", count };

  const html = slide.html.replace(find, replace);
  await prisma.slide.update({ where: { id: slideId }, data: { html } });

  return {
    ok: true,
    presentationId: slide.presentationId,
    html,
    oldThumbnailUrl: slide.thumbnailUrl,
  };
}

export async function updateSlideFor(
  userId: string,
  slideId: string,
  html: string
): Promise<{ presentationId: string; oldThumbnailUrl: string | null } | null> {
  const slide = await prisma.slide.findFirst({
    where: { id: slideId, presentation: { userId } },
    select: { id: true, presentationId: true, thumbnailUrl: true },
  });
  if (!slide) return null;

  await prisma.slide.update({ where: { id: slideId }, data: { html } });
  return {
    presentationId: slide.presentationId,
    oldThumbnailUrl: slide.thumbnailUrl,
  };
}

export async function deleteSlideFor(
  userId: string,
  slideId: string
): Promise<string | null> {
  const slide = await prisma.slide.findFirst({
    where: { id: slideId, presentation: { userId } },
    select: { id: true, presentationId: true, order: true, thumbnailUrl: true },
  });
  if (!slide) return null;

  await prisma.$transaction([
    prisma.slide.delete({ where: { id: slideId } }),
    prisma.slide.updateMany({
      where: { presentationId: slide.presentationId, order: { gt: slide.order } },
      data: { order: { decrement: 1 } },
    }),
  ]);

  if (slide.thumbnailUrl?.includes("blob.vercel-storage.com")) {
    await del(slide.thumbnailUrl).catch(() => {});
  }
  return slide.presentationId;
}

/**
 * Reorders a presentation's slides to match `slideIds`, which must list every
 * slide in the presentation exactly once.
 */
export async function reorderSlidesFor(
  userId: string,
  presentationId: string,
  slideIds: string[]
): Promise<boolean> {
  if (!(await ownsPresentation(userId, presentationId))) return false;

  const existing = await prisma.slide.findMany({
    where: { presentationId },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((s) => s.id));
  if (
    slideIds.length !== existingIds.size ||
    new Set(slideIds).size !== slideIds.length ||
    !slideIds.every((id) => existingIds.has(id))
  ) {
    return false;
  }

  // Two passes: shift into a range that cannot collide with the final orders,
  // so the unique-ish (presentationId, order) sequence never overlaps mid-write.
  await prisma.$transaction([
    ...slideIds.map((id, i) =>
      prisma.slide.update({
        where: { id },
        data: { order: -(i + 1) },
      })
    ),
    ...slideIds.map((id, i) =>
      prisma.slide.update({ where: { id }, data: { order: i } })
    ),
  ]);
  return true;
}

export async function setSlideThumbnail(
  slideId: string,
  thumbnailUrl: string
): Promise<void> {
  await prisma.slide
    .update({ where: { id: slideId }, data: { thumbnailUrl } })
    .catch(() => {});
}
