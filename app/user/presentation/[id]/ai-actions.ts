"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { anthropic } from "@/lib/anthropic";
import { MODEL, SYSTEM_PROMPT, calcCost } from "@/lib/ai-config";

export async function generateSlide(
  prompt: string
): Promise<{ html: string } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, credits: true },
  });
  if (!user) return { error: "User not found" };
  if (user.credits <= 0) return { error: "No credits remaining" };

  let inputTokens = 0;
  let outputTokens = 0;
  let html = "";
  let success = false;
  let errorMessage: string | undefined;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 6000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Create a presentation slide for: ${prompt}` }],
    });

    inputTokens = response.usage.input_tokens;
    outputTokens = response.usage.output_tokens;

    const block = response.content[0];
    if (block.type !== "text") throw new Error("Unexpected response type");
    html = block.text.trim();
    success = true;
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err);
    success = false;
  }

  await prisma.aiUsage.create({
    data: {
      userId: user.id,
      prompt,
      model: MODEL,
      inputTokens,
      outputTokens,
      costUsd: calcCost(inputTokens, outputTokens),
      success,
      errorMessage: errorMessage ?? null,
    },
  });

  if (success) {
    await prisma.user.update({
      where: { id: user.id },
      data: { credits: { decrement: 1 } },
    });
    return { html };
  }

  return { error: errorMessage ?? "Generation failed" };
}
