"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import {
  IconCheck,
  IconCopy,
  IconDots,
  IconPresentation,
  IconShare,
  IconTrash,
  IconWorld,
  IconWorldOff,
} from "@tabler/icons-react"

import {
  SidebarMenuAction,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  deletePresentation,
  setPresentationPublic,
} from "@/app/presentation/actions"

export function PresentationSidebarItem({
  id,
  title,
  isPublic,
}: {
  id: string
  title: string
  isPublic: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)

  const href = `/presentation/${id}`
  const isActive = pathname === href || pathname.startsWith(`${href}/`)
  const publicUrl =
    typeof window !== "undefined" ? `${window.location.origin}/public/${id}` : ""

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  const handleShare = () => {
    startTransition(async () => {
      if (!isPublic) {
        await setPresentationPublic(id, true)
      }
      await copyLink()
    })
  }

  const handleMakePrivate = () => {
    startTransition(async () => {
      await setPresentationPublic(id, false)
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      await deletePresentation(id)
      if (isActive) router.push("/presentation")
    })
  }

  return (
    <>
      <SidebarMenuButton asChild tooltip={title} isActive={isActive}>
        <Link href={href}>
          <IconPresentation />
          <span>{title}</span>
          {isPublic && (
            <IconWorld
              className="ml-auto text-emerald-600 dark:text-emerald-400"
              aria-label="Public"
            />
          )}
        </Link>
      </SidebarMenuButton>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction showOnHover aria-label="Presentation options">
            <IconDots />
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="min-w-40">
                    {isPublic && (
            <DropdownMenuItem onSelect={handleMakePrivate} disabled={pending}>
              <IconWorldOff />
              <span>Make private</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={handleShare} disabled={pending}>
            {copied ? <IconCheck /> : isPublic ? <IconCopy /> : <IconShare />}
            <span>
              {copied
                ? "Copied!"
                : isPublic
                  ? "Copy link"
                  : "Share Public"}
            </span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={handleDelete}
            disabled={pending}
          >
            <IconTrash />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
