"use server";

import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { issueCode } from "@/lib/oauth";
import { denyRedirect, validateAuthorizeRequest } from "./validate";

/**
 * Grants the app access. The request is validated a second time here — the
 * form's hidden fields come from the browser and cannot be trusted just because
 * the page that rendered them validated once.
 */
export async function approve(query: string): Promise<{ error: string } | void> {
  const session = await getSession();
  if (!session) return { error: "Your session expired. Sign in and try again." };

  const result = await validateAuthorizeRequest(new URLSearchParams(query));
  if (result.kind === "invalid") return { error: result.message };
  if (result.kind === "reject") redirect(result.redirectTo);

  const code = await issueCode({
    clientId: result.params.clientId,
    userId: session.userId,
    redirectUri: result.params.redirectUri,
    codeChallenge: result.params.codeChallenge,
    resource: result.params.resource,
  });

  const url = new URL(result.params.redirectUri);
  url.searchParams.set("code", code);
  if (result.params.state) url.searchParams.set("state", result.params.state);
  redirect(url.toString());
}

export async function deny(query: string): Promise<{ error: string } | void> {
  const result = await validateAuthorizeRequest(new URLSearchParams(query));
  if (result.kind === "invalid") return { error: result.message };
  if (result.kind === "reject") redirect(result.redirectTo);

  redirect(denyRedirect(result.params.redirectUri, result.params.state));
}
