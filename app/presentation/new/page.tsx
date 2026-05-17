import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function NewPresentationPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/presentation/new");
  }

  const presentation = await prisma.presentation.create({
    data: { userId: session.userId },
  });
  console.log("Created presentation with ID:", presentation.id);

  redirect(`/presentation/${presentation.id}`);
}
