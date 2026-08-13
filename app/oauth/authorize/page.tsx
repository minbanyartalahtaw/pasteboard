import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ConsentForm from "./ConsentForm";
import { validateAuthorizeRequest } from "./validate";

export const metadata = { title: "Authorize – Pasteboard" };

// The request carries a code_challenge that is single-use, so this page must
// never be cached.
export const dynamic = "force-dynamic";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      {children}
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
      <div className="mb-6 flex items-center justify-start gap-3">
        <Link href="/">
          <Image src="/logo.png" alt="Pasteboard" width={110} height={34} />
        </Link>
      </div>
      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        Cannot connect this app
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">{message}</p>
      <p className="mt-6 text-sm text-muted-foreground">
        Nothing was shared. Close this window and start again from the app.
      </p>
    </div>
  );
}

export default async function AuthorizePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") search.set(key, value);
    else if (Array.isArray(value) && value[0] !== undefined)
      search.set(key, value[0]);
  }
  const query = search.toString();

  // Validate before asking anyone to sign in — a malformed request should fail
  // immediately rather than after a login round-trip.
  const result = await validateAuthorizeRequest(search);
  if (result.kind === "invalid")
    return (
      <Shell>
        <ErrorCard message={result.message} />
      </Shell>
    );
  if (result.kind === "reject") redirect(result.redirectTo);

  const session = await getSession();
  if (!session)
    redirect(`/auth/login?next=${encodeURIComponent(`/oauth/authorize?${query}`)}`);

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true },
  });
  if (!user)
    redirect(`/auth/login?next=${encodeURIComponent(`/oauth/authorize?${query}`)}`);

  return (
    <Shell>
      <ConsentForm
        appName={result.client.name}
        appUri={result.client.clientUri}
        email={user.email}
        query={query}
      />
    </Shell>
  );
}
