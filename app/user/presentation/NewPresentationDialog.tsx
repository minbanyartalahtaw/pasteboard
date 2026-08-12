"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconPlus } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SidebarGroupAction } from "@/components/ui/sidebar";
import { createPresentation } from "@/app/user/presentation/actions";

type NewPresentationDialogProps = {
  triggerLabel?: string;
  /**
   * How to render the trigger. Kept as a plain string rather than a
   * ReactNode prop: an element built in a Server Component arrives as a lazy
   * reference during SSR, which Radix's Slot (`asChild`) cannot clone, so the
   * trigger renders as null on the server and mismatches on hydration.
   */
  triggerVariant?: "button" | "sidebar-action";
};

export default function NewPresentationDialog({
  triggerLabel = "",
  triggerVariant = "button",
}: NewPresentationDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handleCreate = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await createPresentation(trimmed);
      if (result.ok) {
        setOpen(false);
        setTitle("");
        router.push(`/user/presentation/${result.id}`);
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setTitle("");
      }}
    >
      <DialogTrigger asChild>
        {triggerVariant === "sidebar-action" ? (
          <SidebarGroupAction title="New presentation">
            <IconPlus />
            <span className="sr-only">New presentation</span>
          </SidebarGroupAction>
        ) : (
          <Button>
            <IconPlus />
            {triggerLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Presentation Name</DialogTitle>
          <DialogDescription>
            Enter a name for your presentation. You can change this later.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="My presentation"
          autoFocus
          onKeyDown={(event) => {
            if (event.key === "Enter" && title.trim() && !pending)
              handleCreate();
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
          <Button onClick={handleCreate} disabled={!title.trim() || pending}>
            {pending ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
