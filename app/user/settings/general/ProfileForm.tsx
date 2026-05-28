"use client";

import { useRef, useState, useTransition } from "react";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconPencil, IconCheck, IconLoader2, IconX } from "@tabler/icons-react";
import { updateProfile } from "./actions";

function ThemeSelect() {
  const { theme, setTheme } = useTheme();
  return (
    <Select value={theme ?? "light"} onValueChange={setTheme}>
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="light">Light</SelectItem>
        <SelectItem value="dark">Dark</SelectItem>
        <SelectItem value="system">System</SelectItem>
      </SelectContent>
    </Select>
  );
}

export default function ProfileForm({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [draft, setDraft] = useState(initialName);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleEdit() {
    setDraft(name);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleCancel() {
    setDraft(name);
    setEditing(false);
  }

  function handleSave() {
    const fd = new FormData();
    fd.set("name", draft);
    startTransition(async () => {
      await updateProfile(fd);
      setName(draft);
      setEditing(false);
    });
  }

  return (
    <div className="flex flex-col">
      {/* Name row */}
      <div className="flex items-center justify-between py-4">
        <div className="flex flex-col gap-0.5 min-w-0 mr-4">
          <span className="text-sm font-medium">Display name</span>
          {!editing && (
            <span className="text-sm text-muted-foreground truncate">
              {name || <span className="italic">Not set</span>}
            </span>
          )}
          {editing && (
            <div className="flex gap-2 mt-1.5">
              <Input
                ref={inputRef}
                id="name"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Your name"
                disabled={isPending}
                className="h-8 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") handleCancel();
                }}
              />
            </div>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          {!editing ? (
            <Button size="sm" variant="ghost" onClick={handleEdit} className="text-muted-foreground hover:text-foreground">
              <IconPencil className="size-3.5 mr-1" /> Edit
            </Button>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isPending}>
                <IconX className="size-3.5 mr-1" />
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isPending}>
                {isPending
                  ? <><IconLoader2 className="size-3.5 mr-1 animate-spin" /> Saving</>
                  : <><IconCheck className="size-3.5 mr-1" /></>
                }
              </Button>
            </>
          )}
        </div>
      </div>

      <Separator />

      {/* Email row */}
      <div className="flex items-center justify-between py-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">Email</span>
          <span className="text-sm text-muted-foreground">{email}</span>
        </div>
      </div>

            <Separator />

      {/* Theme */}
      <div className="flex items-center justify-between py-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">Theme</span>
          <span className="text-sm text-muted-foreground">Choose your preferred appearance</span>
        </div>
        <ThemeSelect />
      </div>
    </div>
  );
}
