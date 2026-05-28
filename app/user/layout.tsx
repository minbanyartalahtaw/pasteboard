import { AppSideBar } from "@/components/AppSideBar"
import { HEADER_SLOT_ID } from "@/components/HeaderSlot"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider className="h-svh min-h-0 overflow-hidden">
      <AppSideBar />
      <SidebarInset className="min-w-0 min-h-0 overflow-hidden">
        <header className="flex h-10 w-full flex-row shrink-0 items-center justify-center gap-1 sm:gap-2 px-2 bg-background border-b border-border">
          <SidebarTrigger />
          <div
            id={HEADER_SLOT_ID}
            className="flex min-w-0 flex-1 items-center"
          />
        </header>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
