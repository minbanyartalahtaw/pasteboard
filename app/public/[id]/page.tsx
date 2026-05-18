import Link from "next/link";
import { IconLock } from "@tabler/icons-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import PublicViewer from "./viewer";

export default async function PublicPresentationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const presentation = await prisma.presentation.findFirst({
    where: { id, isPublic: true },
    select: {
      id: true,
      title: true,
      slides: {
        orderBy: { order: "asc" },
        select: { id: true, html: true },
      },
    },
  });

  if (!presentation) {
    return (
      <div className="flex min-h-svh flex-1 items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-zinc-950">
        <div className="flex max-w-sm flex-col items-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
            <IconLock className="size-6" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">
            This link isn&apos;t public
          </h1>
          <p className="mt-1 mb-6 text-sm text-zinc-500">
            The presentation you&apos;re looking for either doesn&apos;t exist
            or its owner hasn&apos;t shared it publicly.
          </p>
          <Button asChild size="sm">
            <Link href="/">Go Back</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PublicViewer
      title={presentation.title}
      slides={presentation.slides}
    />
  );
}
