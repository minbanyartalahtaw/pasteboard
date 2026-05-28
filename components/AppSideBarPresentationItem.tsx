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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  deletePresentation,
  setPresentationPublic,
} from "@/app/user/presentation/actions"

export function PresentationSidebarItem({
  id,
  title,
  isPublic,
  thumbnailUrl,
}: {
  id: string
  title: string
  isPublic: boolean
  thumbnailUrl: string | null
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const href = `/user/presentation/${id}`
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
      if (isActive) router.push("/user/presentation")
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
            onSelect={() => setConfirmOpen(true)}
            disabled={pending}
          >
            <IconTrash />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={confirmOpen}
        onOpenChange={(o) => {
          if (!pending) setConfirmOpen(o)
        }}
      >
        <DialogContent className="sm:max-w-sm">

          <DialogHeader>
            <DialogTitle>Delete &ldquo;{title}&rdquo;?</DialogTitle>
            <DialogDescription>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
                    {thumbnailUrl && (
            <div className="overflow-hidden rounded-md border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/thumbnail?url=${encodeURIComponent(thumbnailUrl)}`}
                alt={title}
                className="w-full aspect-video object-cover"
              />
            </div>
          )}
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmOpen(false)}
              disabled={pending}
            >
              No
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setConfirmOpen(false)
                handleDelete()
              }}
              disabled={pending}
            >
              Yes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
