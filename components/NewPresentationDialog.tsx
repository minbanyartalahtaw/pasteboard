"use client"

import { useState, useTransition, type ReactNode } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { createPresentation } from "@/app/presentation/actions"

export function NewPresentationDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const handleCreate = () => {
    const t = title.trim()
    if (!t) return
    startTransition(async () => {
      const result = await createPresentation(t)
      if (result.ok) {
        setOpen(false)
        setTitle("")
        router.push(`/presentation/${result.id}`)
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setTitle("")
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Presentation Name</DialogTitle>

        </DialogHeader>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My presentation"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter" && title.trim() && !pending) handleCreate()
          }}
        />
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!title.trim() || pending}
          >
            {pending ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
