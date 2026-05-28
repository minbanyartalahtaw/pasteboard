"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Result = { ok: true } | { ok: false; error: string };

export async function updateProfile(formData: FormData): Promise<Result> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  const name = (formData.get("name") as string | null)?.trim() ?? "";

  await prisma.user.update({
    where: { id: session.userId },
    data: { name: name || null },
  });

  revalidatePath("/user/settings/profile");
  return { ok: true };
}
