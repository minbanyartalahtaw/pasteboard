import { redirect } from "next/navigation";
import { getSession, safeNext } from "@/lib/auth";
import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (session) {
    // Honour `next` here too: the OAuth consent flow sends users through this
    // page, and an existing session must not swallow the destination.
    redirect(safeNext((await searchParams).next));
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <LoginForm />
    </div>
  );
}
