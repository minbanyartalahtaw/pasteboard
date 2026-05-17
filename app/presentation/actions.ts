"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Result = { ok: true } | { ok: false; error: string };

export async function createPresentation(
  title: string
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Unauthorized" };
  const trimmed = title.trim();
  if (!trimmed) return { ok: false, error: "Title required" };

  const presentation = await prisma.presentation.create({
    data: { userId: session.userId, title: trimmed },
    select: { id: true },
  });
  revalidatePath("/presentation", "layout");
  return { ok: true, id: presentation.id };
}

async function ownsPresentation(id: string): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;
  const p = await prisma.presentation.findFirst({
    where: { id, userId: session.userId },
    select: { id: true },
  });
  return p ? session.userId : null;
}

export async function deletePresentation(id: string): Promise<Result> {
  const ok = await ownsPresentation(id);
  if (!ok) return { ok: false, error: "Not found" };

  await prisma.presentation.delete({ where: { id } });
  revalidatePath("/presentation", "layout");
  return { ok: true };
}

export async function setPresentationPublic(
  id: string,
  isPublic: boolean
): Promise<Result> {
  const ok = await ownsPresentation(id);
  if (!ok) return { ok: false, error: "Not found" };

  await prisma.presentation.update({
    where: { id },
    data: { isPublic },
  });
  revalidatePath("/presentation", "layout");
  return { ok: true };
}
