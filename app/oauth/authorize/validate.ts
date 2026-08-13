import { getClient } from "@/lib/oauth";

export type AuthorizeParams = {
  clientId: string;
  redirectUri: string;
  state: string | null;
  codeChallenge: string;
  resource: string | null;
};

export type ValidationResult =
  /** Show an error page. Redirecting would send the user somewhere unverified. */
  | { kind: "invalid"; message: string }
  /** The client and redirect_uri check out, so errors go back to the client. */
  | { kind: "reject"; redirectTo: string }
  | {
      kind: "ok";
      client: { id: string; name: string; clientUri: string | null };
      params: AuthorizeParams;
    };

function errorRedirect(
  redirectUri: string,
  state: string | null,
  error: string,
  description: string
): string {
  const url = new URL(redirectUri);
  url.searchParams.set("error", error);
  url.searchParams.set("error_description", description);
  if (state) url.searchParams.set("state", state);
  return url.toString();
}

/**
 * Validates an authorization request. Per OAuth 2.1, an unregistered client or
 * redirect_uri must never be redirected to — an attacker would otherwise get an
 * open redirect — so those two failures render in place instead.
 */
export async function validateAuthorizeRequest(
  search: URLSearchParams
): Promise<ValidationResult> {
  const clientId = search.get("client_id");
  const redirectUri = search.get("redirect_uri");
  const state = search.get("state");

  if (!clientId) return { kind: "invalid", message: "Missing client_id." };
  if (!redirectUri) return { kind: "invalid", message: "Missing redirect_uri." };

  const client = await getClient(clientId);
  if (!client)
    return { kind: "invalid", message: "This app is not registered with Pasteboard." };

  // Exact string match: no prefix or wildcard matching.
  if (!client.redirectUris.includes(redirectUri))
    return {
      kind: "invalid",
      message: "This app asked to be sent to an address it never registered.",
    };

  const responseType = search.get("response_type");
  if (responseType !== "code")
    return {
      kind: "reject",
      redirectTo: errorRedirect(
        redirectUri,
        state,
        "unsupported_response_type",
        "Only the authorization code flow is supported."
      ),
    };

  const codeChallenge = search.get("code_challenge");
  const method = search.get("code_challenge_method");
  if (!codeChallenge)
    return {
      kind: "reject",
      redirectTo: errorRedirect(
        redirectUri,
        state,
        "invalid_request",
        "PKCE is required: send code_challenge."
      ),
    };
  if (method !== "S256")
    return {
      kind: "reject",
      redirectTo: errorRedirect(
        redirectUri,
        state,
        "invalid_request",
        "code_challenge_method must be S256."
      ),
    };

  const scope = search.get("scope");
  if (scope && !scope.split(/\s+/).every((s) => s === "mcp"))
    return {
      kind: "reject",
      redirectTo: errorRedirect(
        redirectUri,
        state,
        "invalid_scope",
        "The only supported scope is 'mcp'."
      ),
    };

  return {
    kind: "ok",
    client: { id: client.id, name: client.name, clientUri: client.clientUri },
    params: {
      clientId,
      redirectUri,
      state,
      codeChallenge,
      resource: search.get("resource"),
    },
  };
}

export function denyRedirect(redirectUri: string, state: string | null): string {
  return errorRedirect(
    redirectUri,
    state,
    "access_denied",
    "The user declined the request."
  );
}
