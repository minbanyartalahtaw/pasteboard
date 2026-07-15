import { IconPresentation } from "@tabler/icons-react";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NewPresentationDialog from "./NewPresentationDialog";
import PresentationGrid from "./PresentationGrid";
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
      <PresentationGrid
        presentations={presentations.map((p) => ({
          id: p.id,
          title: p.title,
          isPublic: p.isPublic,
          updatedAt: p.updatedAt,
          thumbnailUrl: p.slides[0]?.thumbnailUrl ?? null,
          slideCount: p._count.slides,
        }))}
      />
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

export async function generateMetadata() {
  return {
    title: "Dashboard",
    description: "View and manage your presentations.",
  };
}
