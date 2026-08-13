import { headers } from "next/headers";

/**
 * The public origin of this deployment, derived from the request. Metadata
 * documents must advertise absolute URLs, and the same value is shown to users
 * on the MCP settings page.
 */
export async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}

/** The MCP endpoint, which is the OAuth protected resource. */
export function resourceUrl(origin: string): string {
  return `${origin}/api/mcp`;
}

/**
 * Metadata documents are fetched by browser-based MCP clients, so they must be
 * readable cross-origin.
 */
export const METADATA_HEADERS = {
  "content-type": "application/json",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-headers": "content-type, authorization, mcp-protocol-version",
  "cache-control": "public, max-age=300",
} as const;

export function metadataResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { headers: METADATA_HEADERS });
}

export function metadataPreflight(): Response {
  return new Response(null, { status: 204, headers: METADATA_HEADERS });
}
