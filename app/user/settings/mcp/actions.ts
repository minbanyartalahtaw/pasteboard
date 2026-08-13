"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth";
import { revokeAppForUser } from "@/lib/oauth";

export async function disconnectApp(
  clientId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  if (!(await revokeAppForUser(session.userId, clientId)))
    return { ok: false, error: "Not found" };

  revalidatePath("/user/settings/mcp");
  return { ok: true };
}
