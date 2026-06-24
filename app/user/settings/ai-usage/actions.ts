"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function getAiUsageData() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      credits: true,
      aiUsages: {
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          prompt: true,
          model: true,
          inputTokens: true,
          outputTokens: true,
          costUsd: true,
          success: true,
          errorMessage: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) redirect("/login");
  return user;
}
