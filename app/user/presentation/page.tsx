import Link from "next/link";
import { IconPresentation } from "@tabler/icons-react";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NewPresentationDialog from "./NewPresentationDialog";
import { DashboardHeader } from "./DashboardHeader";

export default async function PresentationListPage() {
  const session = await getSession();

  if (!session) {
    return (
      <>
        <DashboardHeader />
        <EmptyShell
          title="Sign in to view your presentations"
          description="You need an account to create and manage presentations."
        />
      </>
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
        select: { thumbnailUrl: true },
        orderBy: { order: "asc" },
        take: 1,
      },
      _count: { select: { slides: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (presentations.length === 0) {
    return (
      <>
        <DashboardHeader />
        <EmptyShell
          title="No presentations yet"
          description="Create your first presentation to get started."
        />
      </>
    );
  }

  return (
    <>
      <DashboardHeader />
      <div className="flex-1 bg-background">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>

            <p className="text-sm text-muted-foreground">
              {presentations.length}{" "}
              {presentations.length === 1 ? "presentation" : "presentations"}
            </p>
          </div>

        <NewPresentationDialog />
        </div>

        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {presentations.map((p) => (
            <li key={p.id}>
              <Link
                href={`/user/presentation/${p.id}`}
                className="group block overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  {p.slides[0]?.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/thumbnail?url=${encodeURIComponent(p.slides[0].thumbnailUrl)}`}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      <IconPresentation className="size-8" />
                    </div>
                  )}
                </div>
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {p.isPublic && (
                      <span
                        className="inline-block size-1.5 shrink-0 rounded-full bg-emerald-500"
                        aria-label="Public"
                        title="Public"
                      />
                    )}
                    <h2 className="line-clamp-1 text-sm font-medium tracking-tight">
                      {p.title}
                    </h2>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {p._count.slides}{" "}
                    {p._count.slides === 1 ? "slide" : "slides"} ·{" "}
                    {formatRelative(p.updatedAt)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
    </>
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
    <div className="flex flex-1 items-center justify-center  px-6 py-16 ">
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <IconPresentation className="size-6" />
        </div>
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">{description}</p>
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


export async function generateMetadata() {
  return {
    title: "Dashboard",
    description: "View and manage your presentations.",
  };
}