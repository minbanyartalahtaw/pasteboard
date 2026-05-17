"use client"

import { useEffect, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"

export const HEADER_SLOT_ID = "presentation-header-slot"

export function HeaderSlot({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<Element | null>(null)

  useEffect(() => {
    setTarget(document.getElementById(HEADER_SLOT_ID))
  }, [])

  return target ? createPortal(children, target) : null
}
