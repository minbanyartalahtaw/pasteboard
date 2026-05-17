import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
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

  if (!presentation) notFound();

  return (
    <PublicViewer
      title={presentation.title}
      slides={presentation.slides}
    />
  );
}
