"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type SaveInput = {
  title: string;
  slides: { html: string }[];
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
