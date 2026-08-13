import { getClient, revokeToken, verifyClientSecret } from "@/lib/oauth";

export const runtime = "nodejs";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type, authorization",
} as const;

/**
 * RFC 7009. Revoking an unknown token is a success, so a client cannot use this
 * endpoint to probe which tokens exist.
 */
export async function POST(req: Request): Promise<Response> {
  const form = new URLSearchParams(await req.text());

  const basic = req.headers.get("authorization")?.match(/^Basic\s+(.+)$/i)?.[1];
  let clientId = form.get("client_id");
  let secret = form.get("client_secret");
  if (basic) {
    const decoded = Buffer.from(basic, "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    if (separator !== -1) {
      clientId = decodeURIComponent(decoded.slice(0, separator));
      secret = decodeURIComponent(decoded.slice(separator + 1));
    }
  }

  if (!clientId)
    return new Response(
      JSON.stringify({ error: "invalid_client", error_description: "Missing client_id." }),
      { status: 401, headers: { "content-type": "application/json", ...CORS } }
    );

  const client = await getClient(clientId);
  if (!client || !verifyClientSecret(client, secret))
    return new Response(
      JSON.stringify({ error: "invalid_client", error_description: "Unknown client." }),
      { status: 401, headers: { "content-type": "application/json", ...CORS } }
    );

  const token = form.get("token");
  if (token) await revokeToken(clientId, token);

  return new Response(null, { status: 200, headers: { "cache-control": "no-store", ...CORS } });
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS });
}
