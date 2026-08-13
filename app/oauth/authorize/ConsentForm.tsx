"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import {
  IconEdit,
  IconLayoutBoardSplit,
  IconTrash,
  IconWorld,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { approve, deny } from "./actions";

const PERMISSIONS = [
  { icon: IconLayoutBoardSplit, text: "Read your presentations and slides" },
  { icon: IconEdit, text: "Create and edit slides on your behalf" },
  { icon: IconTrash, text: "Delete presentations and slides" },
  { icon: IconWorld, text: "Make presentations public or private" },
];

export default function ConsentForm({
  appName,
  appUri,
  email,
  query,
}: {
  appName: string;
  appUri: string | null;
  email: string;
  query: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [choice, setChoice] = useState<"approve" | "deny" | null>(null);

  const run = (which: "approve" | "deny") => {
    setChoice(which);
    setError(null);
    startTransition(async () => {
      const result = which === "approve" ? await approve(query) : await deny(query);
      // A success path redirects and never returns.
      if (result?.error) {
        setError(result.error);
        setChoice(null);
      }
    });
  };

  return (
    <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
      <div className="mb-6 flex items-center justify-start gap-3">
        <Link href="/">
          <Image src="/logo.png" alt="Pasteboard" width={110} height={34} />
        </Link>
      </div>

      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        Connect {appName}?
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {appUri ? (
          <>
            <span className="font-medium text-foreground">{appName}</span> (
            {new URL(appUri).host}) is asking to
          </>
        ) : (
          <>
            <span className="font-medium text-foreground">{appName}</span> is
            asking to
          </>
        )}{" "}
        access your Pasteboard account.
      </p>

      <ul className="mt-5 flex flex-col gap-2.5">
        {PERMISSIONS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-2.5 text-sm">
            <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span className="text-foreground">{text}</span>
          </li>
        ))}
      </ul>

      <p className="mt-5 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
        Anyone can register an app with this name. Only continue if you started
        this from {appName} yourself.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded border border-red-200 bg-red-50 px-2.5 py-1.5 text-sm text-red-600"
        >
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-2">
        <Button
          className="w-full"
          disabled={pending}
          onClick={() => run("approve")}
        >
          {pending && choice === "approve" ? "Connecting…" : "Approve"}
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          disabled={pending}
          onClick={() => run("deny")}
        >
          {pending && choice === "deny" ? "Cancelling…" : "Cancel"}
        </Button>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Signed in as {email}. You can revoke access any time from{" "}
        <Link
          href="/user/settings/mcp"
          className="font-medium text-foreground hover:underline"
        >
          Settings → MCP
        </Link>
        .
      </p>
    </div>
  );
}
