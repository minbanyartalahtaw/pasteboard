import {
  consumeCode,
  getClient,
  issueTokens,
  rotateRefreshToken,
  SCOPE,
  verifyClientSecret,
  verifyPkce,
} from "@/lib/oauth";

export const runtime = "nodejs";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type, authorization",
} as const;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...CORS },
  });
}

function oauthError(error: string, description: string, status = 400): Response {
  return json({ error, error_description: description }, status);
}

/**
 * Reads client credentials from either HTTP Basic (client_secret_basic) or the
 * form body (client_secret_post). Public clients send neither.
 */
function clientCredentials(
  req: Request,
  form: URLSearchParams
): { clientId: string | null; secret: string | null } {
  const basic = req.headers.get("authorization")?.match(/^Basic\s+(.+)$/i)?.[1];
  if (basic) {
    const decoded = Buffer.from(basic, "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    if (separator !== -1)
      return {
        clientId: decodeURIComponent(decoded.slice(0, separator)),
        secret: decodeURIComponent(decoded.slice(separator + 1)),
      };
  }
  return {
    clientId: form.get("client_id"),
    secret: form.get("client_secret"),
  };
}

export async function POST(req: Request): Promise<Response> {
  let form: URLSearchParams;
  try {
    form = new URLSearchParams(await req.text());
  } catch {
    return oauthError("invalid_request", "Body must be form-encoded.");
  }

  const { clientId, secret } = clientCredentials(req, form);
  if (!clientId) return oauthError("invalid_client", "Missing client_id.", 401);

  const client = await getClient(clientId);
  if (!client || !verifyClientSecret(client, secret))
    return oauthError("invalid_client", "Unknown client or bad secret.", 401);

  const grantType = form.get("grant_type");

  if (grantType === "authorization_code") {
    const code = form.get("code");
    const verifier = form.get("code_verifier");
    const redirectUri = form.get("redirect_uri");

    if (!code) return oauthError("invalid_request", "Missing code.");
    if (!verifier) return oauthError("invalid_request", "Missing code_verifier.");

    const row = await consumeCode(code);
    if (!row)
      return oauthError("invalid_grant", "This code is expired or already used.");
    if (row.clientId !== clientId)
      return oauthError("invalid_grant", "This code was issued to another client.");
    if (redirectUri !== row.redirectUri)
      return oauthError("invalid_grant", "redirect_uri does not match the request.");
    if (!verifyPkce(row.codeChallenge, verifier))
      return oauthError("invalid_grant", "code_verifier does not match the challenge.");

    const tokens = await issueTokens({
      clientId,
      userId: row.userId,
      resource: row.resource,
    });
    return json({
      access_token: tokens.accessToken,
      token_type: "Bearer",
      expires_in: tokens.expiresIn,
      refresh_token: tokens.refreshToken,
      scope: SCOPE,
    });
  }

  if (grantType === "refresh_token") {
    const refreshToken = form.get("refresh_token");
    if (!refreshToken)
      return oauthError("invalid_request", "Missing refresh_token.");

    const tokens = await rotateRefreshToken(clientId, refreshToken);
    if (!tokens)
      return oauthError("invalid_grant", "This refresh token is expired or already used.");

    return json({
      access_token: tokens.accessToken,
      token_type: "Bearer",
      expires_in: tokens.expiresIn,
      refresh_token: tokens.refreshToken,
      scope: SCOPE,
    });
  }

  return oauthError(
    "unsupported_grant_type",
    "Supported grants are authorization_code and refresh_token."
  );
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS });
}
