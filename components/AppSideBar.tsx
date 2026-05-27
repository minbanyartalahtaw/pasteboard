import { IconLayoutDashboard } from "@tabler/icons-react"

import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { SideBarNavLink } from "@/components/AppSideBarNav"
import { PresentationSidebarItem } from "@/components/AppSideBarPresentationItem"
import AppSideBarFooter from "@/components/AppSideBarFooter"
import Image from "next/image"
import Link from "next/link"

export async function AppSideBar() {
  const session = await getSession()

  const user = session
    ? await prisma.user.findUnique({
        where: { id: session.userId },
        select: { name: true, email: true },
      })
    : null

  const presentations = session
    ? await prisma.presentation.findMany({
        where: { userId: session.userId },
        select: {
          id: true,
          title: true,
          isPublic: true,
          slides: {
            select: { thumbnailUrl: true },
            orderBy: { order: "asc" },
            take: 1,
          },
        },
        orderBy: { updatedAt: "desc" },
      })
    : []

  return (
    <Sidebar >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            
            <SidebarMenuButton asChild size="lg" tooltip="Pasteboard">
{/*               <Link href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                  <IconPresentation className="size-5" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold">Pasteboard</span>
                  <span className="text-xs text-sidebar-foreground/70">
                    Presentations
                  </span>
                </div>
              </Link> */}
              <Link href="/">
              <Image
                src="/logo.png"
                alt="Pasteboard"
                width={200}
                height={100}
                loading="eager"
              />
              </Link>
            </SidebarMenuButton>
            
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>

            <SidebarMenu>
              <SidebarMenuItem>
                <SideBarNavLink href="/user/presentation" title="Home" exact>
                  <IconLayoutDashboard />
                  <span>Dashboard</span>
                </SideBarNavLink>
              </SidebarMenuItem>
{/*               <SidebarMenuItem>
                <NewPresentationDialog>
                  <SidebarMenuButton tooltip="New presentation">
                    <IconPlus />
                    <span>New Presentation</span>
                  </SidebarMenuButton>
                </NewPresentationDialog>
              </SidebarMenuItem> */}
            </SidebarMenu>


        <SidebarGroup>
          <SidebarGroupLabel>Presentations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {presentations.length === 0 ? (
                <SidebarMenuItem>
                  <div className="px-2 py-1.5 text-xs text-sidebar-foreground/60">
                    {session ? "No presentations yet" : "Sign in to view"}
                  </div>
                </SidebarMenuItem>
              ) : (
                presentations.map((p) => (
                  <SidebarMenuItem key={p.id}>
                    <PresentationSidebarItem
                      id={p.id}
                      title={p.title}
                      isPublic={p.isPublic}
                      thumbnailUrl={p.slides[0]?.thumbnailUrl ?? null}
                    />
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />

      <AppSideBarFooter name={user?.name ?? null} email={user?.email ?? null} />
    </Sidebar>
  )
}
