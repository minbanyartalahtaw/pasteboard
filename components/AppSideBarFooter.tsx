"use client";
import { useState } from "react";
import Avvvatars from "avvvatars-react";
import { IconLogout, IconSelector, IconSettings } from "@tabler/icons-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/logout/actions";
import Link from "next/link";

type AppSideBarFooterProps = {
  name: string | null
  email: string | null
}

export default function AppSideBarFooter({ name, email }: AppSideBarFooterProps) {
  const logoutFormId = "logout-form";
  const displayName = name?.trim() || email || "Account";
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <SidebarFooter>
      <form id={logoutFormId} action={logout} className="hidden" />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Log out?</DialogTitle>
            <DialogDescription>You will be signed out of your account.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" type="submit" form={logoutFormId}>Log out</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton tooltip="Account" className="h-12 cursor-pointer">
                <Avvvatars value={name || "user"} size={32} style="shape" />
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-medium">{displayName}</span>
                
                </div>
                <IconSelector className="ml-auto size-4 text-muted-foreground" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem asChild>
                <Link href="/user/settings">
                  <IconSettings />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={(e) => { e.preventDefault(); setConfirmOpen(true); }}>
                <IconLogout />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}
