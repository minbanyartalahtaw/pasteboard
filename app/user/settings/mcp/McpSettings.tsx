"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import {
  IconCheck,
  IconCopy,
  IconLoader2,
  IconPlugConnected,
  IconTrash,
} from "@tabler/icons-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
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
      className="shrink-0 text-muted-foreground hover:text-foreground"
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

/**
 * A monospace value with a copy button, used for the endpoint and commands.
 * Long values scroll rather than truncate, so nothing is permanently hidden.
 */
function CodeBlock({ value }: { value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/40 py-1.5 pl-3 pr-1.5">
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs text-foreground">
        {value}
      </code>
      <CopyButton value={value} />
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium text-muted-foreground">
        {n}
      </span>
      <span className="text-sm text-muted-foreground">{children}</span>
    </li>
  );
}

function Ui({ children }: { children: React.ReactNode }) {
  return <span className="font-medium text-foreground">{children}</span>;
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

  return (
    <div className="flex flex-col">
      <div className="py-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">Connected apps</span>
          <span className="text-sm text-muted-foreground">
            Each of these can read and change your presentations.
          </span>
        </div>

        {apps.length === 0 ? (
          <div className="mt-3 flex flex-col items-center gap-1 rounded-lg border border-dashed px-4 py-8 text-center">
            <IconPlugConnected className="size-5 text-muted-foreground" />
            <span className="text-sm font-medium">No apps connected</span>
            <span className="text-sm text-muted-foreground">
              Follow the steps below to connect Claude.
            </span>
          </div>
        ) : (
          <div className="mt-3 flex flex-col rounded-lg border">
            {apps.map((app) => (
              <div
                key={app.clientId}
                className="flex items-center justify-between gap-3 px-3 py-2.5 not-last:border-b"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Image
                    src="/claude.webp"
                    alt=""
                    width={32}
                    height={32}
                    className="size-8 shrink-0 rounded-md border object-cover"
                  />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium">
                      {app.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      Connected{" "}
                      {new Date(app.connectedAt).toLocaleDateString()}
                      {app.lastUsedAt
                        ? ` · used ${new Date(app.lastUsedAt).toLocaleDateString()}`
                        : " · never used"}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
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
            ))}
          </div>
        )}
      </div>

      <div className="py-4">
        <Accordion type="single" collapsible>
          <AccordionItem value="claude-web">
            <AccordionTrigger>Connect to Claude web and desktop</AccordionTrigger>
            <AccordionContent>
              <ol className="flex flex-col gap-2.5">
                <Step n={1}>
                  Open <Ui>Settings → Connectors</Ui> in Claude.
                </Step>
                <Step n={2}>
                  Click <Ui>Add custom connector</Ui> and paste this address:
                </Step>
                <li className="ml-8">
                  <CodeBlock value={endpoint} />
                </li>
                <Step n={3}>
                  Click <Ui>Connect</Ui>. Claude sends you back here to approve
                  the request.
                </Step>
                <Step n={4}>
                  In any chat, open the <Ui>+</Ui> menu and enable{" "}
                  <Ui>Pasteboard</Ui>.
                </Step>
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="claude-code">
            <AccordionTrigger>Connect to Claude Code</AccordionTrigger>
            <AccordionContent>
              <ol className="flex flex-col gap-2.5">
                <Step n={1}>Run this in your terminal:</Step>
                <li className="ml-8">
                  <CodeBlock
                    value={`claude mcp add --transport http pasteboard ${endpoint}`}
                  />
                </li>
                <Step n={2}>
                  Run <Ui>/mcp</Ui>, pick <Ui>pasteboard</Ui>, then{" "}
                  <Ui>Authenticate</Ui>.
                </Step>
                <Step n={3}>
                  Approve the request in the browser tab that opens.
                </Step>
              </ol>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
