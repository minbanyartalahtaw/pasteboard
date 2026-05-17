"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"

import { SidebarMenuButton } from "@/components/ui/sidebar"

export function SideBarNavLink({
  href,
  title,
  exact = false,
  children,
}: {
  href: string
  title: string
  exact?: boolean
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <SidebarMenuButton asChild tooltip={title} isActive={isActive}>
      <Link href={href}>{children}</Link>
    </SidebarMenuButton>
  )
}
