"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import {
  createPresentationFor,
  deletePresentationFor,
  setPresentationPublicFor,
} from "@/lib/presentations";

type Result = { ok: true } | { ok: false; error: string };

export async function createPresentation(
  title: string
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  const created = await createPresentationFor(session.userId, title);
  if (!created) return { ok: false, error: "Title required" };

  revalidatePath("/user/presentation", "layout");
  return { ok: true, id: created.id };
}

export async function deletePresentation(id: string): Promise<Result> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  if (!(await deletePresentationFor(session.userId, id)))
    return { ok: false, error: "Not found" };

  revalidatePath("/user/presentation", "layout");
  return { ok: true };
}

export async function setPresentationPublic(
  id: string,
  isPublic: boolean
): Promise<Result> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  if (!(await setPresentationPublicFor(session.userId, id, isPublic)))
    return { ok: false, error: "Not found" };

  revalidatePath("/user/presentation", "layout");
  return { ok: true };
}
