"use client";

import { useEffect, useRef, useState } from "react";
import { IconPresentation } from "@tabler/icons-react";

const SLIDE_W = 1280;
const SLIDE_H = 720;

export function ResponsiveThumb({
  html,
  title,
}: {
  html?: string;
  title: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.25);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w > 0) setScale(w / SLIDE_W);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative aspect-video w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950"
    >
      {html ? (
        <iframe
          srcDoc={html}
          sandbox="allow-scripts allow-same-origin"
          tabIndex={-1}
          className="absolute top-0 left-0 origin-top-left border-0 pointer-events-none"
          style={{
            width: `${SLIDE_W}px`,
            height: `${SLIDE_H}px`,
            transform: `scale(${scale})`,
          }}
          title={`${title} thumbnail`}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-400 dark:text-zinc-600">
          <IconPresentation className="size-8" />
        </div>
      )}
    </div>
  );
}
