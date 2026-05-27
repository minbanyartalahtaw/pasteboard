import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileForm from "./ProfileForm";

export const metadata = { title: "General – Settings" };

export default async function ProfileSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login?next=/user/settings/profile");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true },
  });

  if (!user) redirect("/auth/login");

  return (
    <div className="flex flex-col gap-1">
      <ProfileForm initialName={user.name ?? ""} email={user.email} />
    </div>
  );
}
