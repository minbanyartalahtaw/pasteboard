"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "./actions";
import Image from "next/image";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const [state, formAction, pending] = useActionState(login, null);

  const registerHref = next ? `/register?next=${encodeURIComponent(next)}` : "/register";

  return (
    <div className="w-full max-w-sm rounded-xl border border-zinc-100 bg-white p-8 shadow-sm">
      <div className="mb-8 flex items-center justify-start gap-3">
        <Image
          src="/logo.png"
          alt="Pasteboard"
          width={110}
          height={34}
        />
        <span className="h-6 w-px bg-zinc-200" aria-hidden />
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
          Sign in
        </h1>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700">Email</span>
          <Input
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700">Password</span>
          <Input
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>

        {state?.error && (
          <p
            role="alert"
            className="rounded border border-red-200 bg-red-50 px-2.5 py-1.5 text-sm text-red-600"
          >
            {state.error}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        No account?{" "}
        <Link href={registerHref} className="font-medium text-zinc-900 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
