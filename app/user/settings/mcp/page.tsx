import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { listConnectedApps } from "@/lib/oauth";
import { requestOrigin, resourceUrl } from "@/lib/oauth-metadata";
import McpSettings from "./McpSettings";

export const metadata = { title: "MCP – Settings" };

export default async function McpSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login?next=/user/settings/mcp");

  const apps = await listConnectedApps(session.userId);
  const origin = await requestOrigin();

  return (
    <McpSettings
      endpoint={resourceUrl(origin)}
      apps={apps.map((a) => ({
        clientId: a.clientId,
        name: a.name,
        clientUri: a.clientUri,
        connectedAt: a.connectedAt.toISOString(),
        lastUsedAt: a.lastUsedAt?.toISOString() ?? null,
      }))}
    />
  );
}
