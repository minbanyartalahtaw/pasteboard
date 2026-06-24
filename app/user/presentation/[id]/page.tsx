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

  const [presentation, user] = await Promise.all([
    prisma.presentation.findFirst({
      where: { id, userId: session.userId },
      include: { slides: { orderBy: { order: "asc" } } },
    }),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { credits: true },
    }),
  ]);

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
      credits={user?.credits ?? 0}
    />
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const presentation = await prisma.presentation.findFirst({ where: { id } });
  return {
    title: presentation ? `${presentation.title}` : "Presentation",
  };
}

