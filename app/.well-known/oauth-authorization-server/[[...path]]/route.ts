import {
  metadataPreflight,
  metadataResponse,
  requestOrigin,
} from "@/lib/oauth-metadata";

// Catch-all for the same reason as the protected-resource document: clients try
// several RFC 8414 path shapes before giving up.
export async function GET(): Promise<Response> {
  const origin = await requestOrigin();
  return metadataResponse({
    issuer: origin,
    authorization_endpoint: `${origin}/oauth/authorize`,
    token_endpoint: `${origin}/oauth/token`,
    registration_endpoint: `${origin}/oauth/register`,
    revocation_endpoint: `${origin}/oauth/revoke`,
    scopes_supported: ["mcp"],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    // OAuth 2.1 requires PKCE and forbids the `plain` method.
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: [
      "none",
      "client_secret_post",
      "client_secret_basic",
    ],
    service_documentation: `${origin}/user/settings/mcp`,
  });
}

export const OPTIONS = metadataPreflight;
