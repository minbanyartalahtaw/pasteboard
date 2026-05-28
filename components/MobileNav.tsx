"use client"

import { useState } from "react"
import Link from "next/link"
import { IconMenu2 } from "@tabler/icons-react"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

const links = [
  { label: "Workflow", href: "#workflow" },
  { label: "Features", href: "#features" },
  { label: "FAQ", href: "#faq" },
  { label: "Playground", href: "/playground", primary: true },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      
      <SheetTrigger asChild>
        <button className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:text-foreground md:hidden">
          <IconMenu2 size={20} />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-56 p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <nav className="flex flex-col pt-10">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`px-6 py-3.5 text-sm font-medium transition-colors hover:bg-muted ${
                l.primary ? "text-primary" : "text-foreground"
              }`}
            >
              {l.label}
            </a>
          ))}
          <div className="px-6 pt-4">
            <Link href="/auth/login" onClick={() => setOpen(false)}>
              <Button className="w-full">Get started</Button>
            </Link>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
