"use client";

import { useState, useTransition } from "react";
import { IconCheck, IconCopy, IconLoader2, IconTrash } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { disconnectApp } from "./actions";

type AppRow = {
  clientId: string;
  name: string;
  clientUri: string | null;
  connectedAt: string;
  lastUsedAt: string | null;
};

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? (
        <IconCheck className="size-3.5" />
      ) : (
        <IconCopy className="size-3.5" />
      )}
      {label ? <span className="ml-1">{copied ? "Copied" : label}</span> : null}
    </Button>
  );
}

export default function McpSettings({
  endpoint,
  apps,
}: {
  endpoint: string;
  apps: AppRow[];
}) {
  const [pending, startTransition] = useTransition();
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const handleDisconnect = (clientId: string) => {
    setDisconnectingId(clientId);
    startTransition(async () => {
      await disconnectApp(clientId);
      setDisconnectingId(null);
    });
  };

  const claudeCodeCommand = `claude mcp add --transport http pasteboard ${endpoint}`;

  return (
    <div className="flex flex-col">
      <div className="py-4">
        <h2 className="text-sm font-medium">MCP server</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Connect Pasteboard to any chatbot that speaks MCP, and let it build
          slides for you. You sign in with this account — no keys to copy.
        </p>
      </div>

      <Separator />

      <div className="flex items-center justify-between gap-4 py-4">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-medium">Endpoint</span>
          <code className="text-xs text-muted-foreground truncate">
            {endpoint}
          </code>
        </div>
        <CopyButton value={endpoint} />
      </div>

      <Separator />

      <div className="py-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">Connected apps</span>
          <span className="text-sm text-muted-foreground">
            Each of these can read and change your presentations.
          </span>
        </div>

        <div className="flex flex-col mt-3">
          {apps.length === 0 ? (
            <p className="text-xs text-muted-foreground py-3">
              Nothing connected yet.
            </p>
          ) : (
            apps.map((app) => (
              <div
                key={app.clientId}
                className="flex items-center justify-between gap-4 py-2.5 border-b last:border-b-0"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm truncate">{app.name}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    Connected {new Date(app.connectedAt).toLocaleDateString()}
                    {app.clientUri ? ` · ${new URL(app.clientUri).host}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {app.lastUsedAt
                      ? `Used ${new Date(app.lastUsedAt).toLocaleDateString()}`
                      : "Never used"}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    disabled={pending}
                    onClick={() => handleDisconnect(app.clientId)}
                  >
                    {disconnectingId === app.clientId ? (
                      <IconLoader2 className="size-3.5 animate-spin" />
                    ) : (
                      <IconTrash className="size-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Separator />

      <div className="py-4 flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Connect the Claude website</span>
          <p className="text-sm text-muted-foreground">
            Go to <span className="text-foreground">Customize → Connectors</span>{" "}
            → <span className="text-foreground">Add custom connector</span>, paste
            the endpoint above, and click Connect. Claude will send you here to
            approve the request.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Connect Claude Code</span>
          <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto">
            {claudeCodeCommand}
          </pre>
          <p className="text-xs text-muted-foreground">
            Then run <code>/mcp</code> and choose Authenticate. Cursor and VS
            Code take the same URL in their MCP config.
          </p>
        </div>
      </div>
    </div>
  );
}
