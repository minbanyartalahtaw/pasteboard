import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PresentationEditor from "./editor";

export const maxDuration = 60;

export default async function PresentationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getSession();
  if (!session) {
    redirect(`/auth/login?next=/user/presentation/${id}`);
  }

  const presentation = await prisma.presentation.findFirst({
    where: { id, userId: session.userId },
    include: {
      slides: { orderBy: { order: "asc" } },
    },
  });

  if (!presentation) notFound();

  return (
    <PresentationEditor
      key={presentation.id}
      presentationId={presentation.id}
      initialTitle={presentation.title}
      initialSlides={presentation.slides.map((s) => ({
        id: s.id,
        html: s.html,
        thumbnailUrl: s.thumbnailUrl ?? null,
      }))}
    />
  );
}

