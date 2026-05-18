"use client";

import { useEffect, useState } from "react";
import {
  IconChevronLeft,
  IconChevronRight,
  IconX,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

type Props = {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onExit: () => void;
};

export function PresentOverlay({
  current,
  total,
  onPrev,
  onNext,
  onExit,
}: Props) {
  const [visible, setVisible] = useState(true);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const show = () => {
      setVisible(true);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (!hovering) setVisible(false);
      }, 2500);
    };

    show();
    window.addEventListener("mousemove", show);
    window.addEventListener("touchstart", show);
    window.addEventListener("keydown", show);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("mousemove", show);
      window.removeEventListener("touchstart", show);
      window.removeEventListener("keydown", show);
    };
  }, [hovering]);

  const atStart = current <= 0;
  const atEnd = current >= total - 1;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-6 flex justify-center transition-opacity duration-200",
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      )}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="flex items-center gap-1 rounded-full bg-black/70 px-2 py-1.5 text-white backdrop-blur-md ring-1 ring-white/10">
        <button
          type="button"
          onClick={onPrev}
          disabled={atStart}
          aria-label="Previous slide"
          className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <IconChevronLeft className="size-5" />
        </button>
        <span className="px-2 text-xs font-medium tabular-nums text-white/80">
          {total === 0 ? 0 : current + 1} / {total}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={atEnd}
          aria-label="Next slide"
          className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <IconChevronRight className="size-5" />
        </button>
        <div className="mx-1 h-5 w-px bg-white/20" aria-hidden />
        <button
          type="button"
          onClick={onExit}
          aria-label="Exit fullscreen"
          className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-white/10"
        >
          <IconX className="size-5" />
        </button>
      </div>
    </div>
  );
}
