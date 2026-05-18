"use client";

import Link from "next/link";
import { IconLogout, IconSettings, IconUserCircle } from "@tabler/icons-react";

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
import { logout } from "@/app/logout/actions";

type AppSideBarFooterProps = {
  name: string | null
  email: string | null
}

export default function AppSideBarFooter({ name, email }: AppSideBarFooterProps) {
  const logoutFormId = "logout-form";
  const displayName = name?.trim() || email || "Account";

  return (
    <SidebarFooter>
      <form id={logoutFormId} action={logout} className="hidden" />
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton tooltip="Account">
                <IconUserCircle />
                <span>{displayName}</span>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <IconSettings />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" asChild>
                <button
                  type="submit"
                  form={logoutFormId}
                  className="flex w-full items-center gap-2"
                >
                  <IconLogout />
                  <span>Logout</span>
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}
