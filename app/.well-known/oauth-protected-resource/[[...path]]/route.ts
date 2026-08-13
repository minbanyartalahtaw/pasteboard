import {
  metadataPreflight,
  metadataResponse,
  requestOrigin,
  resourceUrl,
} from "@/lib/oauth-metadata";

// Optional catch-all: MCP clients probe both the bare path and the RFC 9728
// path-inserted form (/.well-known/oauth-protected-resource/api/mcp). Both
// describe the same single protected resource here.
export async function GET(): Promise<Response> {
  const origin = await requestOrigin();
  return metadataResponse({
    resource: resourceUrl(origin),
    authorization_servers: [origin],
    scopes_supported: ["mcp"],
    bearer_methods_supported: ["header"],
    resource_name: "Pasteboard",
    resource_documentation: `${origin}/user/settings/mcp`,
  });
}

export const OPTIONS = metadataPreflight;
