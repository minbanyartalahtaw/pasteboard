import { AppSideBar } from "@/components/AppSideBar"
import { HEADER_SLOT_ID } from "@/components/HeaderSlot"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function PresentationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSideBar />
      <SidebarInset>
        <header className="flex h-10 shrink-0 items-center gap-2 px-2">
          <SidebarTrigger />
          <div
            id={HEADER_SLOT_ID}
            className="flex min-w-0 flex-1 items-center "
          />
        </header>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
