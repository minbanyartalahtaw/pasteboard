import { z } from "zod";

import { isAllowedRedirectUri, registerClient } from "@/lib/oauth";

export const runtime = "nodejs";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type",
} as const;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...CORS },
  });
}

function invalid(description: string): Response {
  return json({ error: "invalid_client_metadata", error_description: description }, 400);
}

// RFC 7591 client metadata. Unknown fields are ignored rather than rejected —
// clients send plenty this server has no use for.
const RegistrationSchema = z.object({
  client_name: z.string().max(200).optional(),
  redirect_uris: z.array(z.string()).min(1).max(10),
  grant_types: z.array(z.string()).optional(),
  response_types: z.array(z.string()).optional(),
  token_endpoint_auth_method: z.string().optional(),
  client_uri: z.string().max(500).optional(),
  logo_uri: z.string().max(500).optional(),
});

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return invalid("Body must be JSON.");
  }

  const parsed = RegistrationSchema.safeParse(body);
  if (!parsed.success) return invalid("redirect_uris is required.");
  const meta = parsed.data;

  const badUri = meta.redirect_uris.find((uri) => !isAllowedRedirectUri(uri));
  if (badUri)
    return invalid(
      `redirect_uri ${badUri} must be https, or http on localhost, and carry no fragment.`
    );

  const authMethod = meta.token_endpoint_auth_method ?? "none";
  if (!["none", "client_secret_post", "client_secret_basic"].includes(authMethod))
    return invalid(`token_endpoint_auth_method ${authMethod} is not supported.`);

  const grantTypes = meta.grant_types ?? ["authorization_code", "refresh_token"];
  const unsupported = grantTypes.find(
    (g) => g !== "authorization_code" && g !== "refresh_token"
  );
  if (unsupported) return invalid(`grant_type ${unsupported} is not supported.`);

  const { client, secret } = await registerClient({
    name: meta.client_name?.trim() || "Unnamed app",
    redirectUris: meta.redirect_uris,
    grantTypes,
    tokenAuthMethod: authMethod,
    clientUri: meta.client_uri,
    logoUri: meta.logo_uri,
  });

  return json(
    {
      client_id: client.id,
      ...(secret ? { client_secret: secret } : {}),
      client_id_issued_at: Math.floor(client.createdAt.getTime() / 1000),
      // Secrets do not expire; the user revokes access from settings instead.
      ...(secret ? { client_secret_expires_at: 0 } : {}),
      client_name: client.name,
      redirect_uris: client.redirectUris,
      grant_types: client.grantTypes,
      response_types: ["code"],
      token_endpoint_auth_method: client.tokenAuthMethod,
    },
    201
  );
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS });
}
