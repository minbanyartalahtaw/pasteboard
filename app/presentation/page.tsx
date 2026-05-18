import Link from "next/link";
import {
  IconPresentation,
  IconWorld,
} from "@tabler/icons-react";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NewPresentationDialog from "./NewPresentationDialog";

export default async function PresentationListPage() {
  const session = await getSession();

  if (!session) {
    return (
      <EmptyShell
        title="Sign in to view your presentations"
        description="You need an account to create and manage presentations."
      />
    );
  }

  const presentations = await prisma.presentation.findMany({
    where: { userId: session.userId },
    select: {
      id: true,
      title: true,
      isPublic: true,
      updatedAt: true,
      slides: {
        select: { html: true },
        orderBy: { order: "asc" },
        take: 1,
      },
      _count: { select: { slides: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (presentations.length === 0) {
    return (
      <EmptyShell
        title="No presentations yet"
        description="Create your first presentation to get started."

      />
    );
  }

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>

            <p className="text-sm text-zinc-500">
              {presentations.length}{" "}
              {presentations.length === 1 ? "presentation" : "presentations"}
            </p>
          </div>

        <NewPresentationDialog />
        </div>

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {presentations.map((p) => (
            <li key={p.id}>
              <Link
                href={`/presentation/${p.id}`}
                className="group flex h-full flex-col rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80"
              >
                <div className="mb-3 flex w-full items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 px-3 py-4 text-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-700">
                  <div className="relative w-full max-w-[200px] aspect-video overflow-hidden bg-white">
                    {p.slides[0]?.html ? (
                      <iframe
                        srcDoc={p.slides[0].html}
                        sandbox="allow-scripts allow-same-origin"
                        tabIndex={-1}
                        className="border-0 pointer-events-none origin-top-left"
                        style={{
                          width: "1280px",
                          height: "720px",
                          transform: "scale(0.15625)",
                        }}
                        title={`${p.title} thumbnail`}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <IconPresentation className="size-6" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="line-clamp-1 text-sm font-medium">
                    {p.title}
                  </h2>
                  {p.isPublic && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      <IconWorld className="size-3" />
                      Public
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {p._count.slides}{" "}
                  {p._count.slides === 1 ? "slide" : "slides"} · Updated{" "}
                  {formatRelative(p.updatedAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function EmptyShell({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-zinc-950">
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
          <IconPresentation className="size-6" />
        </div>
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 mb-6 text-sm text-zinc-500">{description}</p>
        <NewPresentationDialog />
      </div>
    </div>
  );
}

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return date.toLocaleDateString();
}
