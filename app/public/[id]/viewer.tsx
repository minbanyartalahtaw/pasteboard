"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconChevronLeft,
  IconChevronRight,
  IconMaximize,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PresentOverlay } from "@/components/PresentOverlay";
import { useFullscreen } from "@/hooks/use-fullscreen";

type Slide = { id: string; html: string };

export default function PublicViewer({
  title,
  slides,
}: {
  title: string;
  slides: Slide[];
}) {
  const [current, setCurrent] = useState(0);
  const mainRef = useRef<HTMLElement>(null);
  const [frame, setFrame] = useState({ w: 0, h: 0 });
  const { ref: rootRef, isFullscreen, toggle: toggleFullscreen } =
    useFullscreen<HTMLDivElement>();

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width <= 0 || height <= 0) return;
      if ((width * 9) / 16 <= height) {
        setFrame({ w: width, h: (width * 9) / 16 });
      } else {
        setFrame({ w: (height * 16) / 9, h: height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ")
        setCurrent((c) => Math.min(c + 1, slides.length - 1));
      else if (e.key === "ArrowLeft")
        setCurrent((c) => Math.max(c - 1, 0));
      else if (e.key === "f" || e.key === "F") toggleFullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slides.length, toggleFullscreen]);

  const slide = slides[current];

  return (
    <div
      ref={rootRef}
      className={cn(
        "flex flex-col min-h-screen font-sans",
        isFullscreen
          ? "bg-black text-white"
          : "bg-[#f0f0f5] text-zinc-900"
      )}
    >
      {!isFullscreen && (
        <header className="flex items-center justify-between h-12 shrink-0 px-4 bg-white border-b border-zinc-200">
          <h1 className="text-sm font-medium truncate">{title}</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 tabular-nums">
              {slides.length === 0 ? 0 : current + 1} / {slides.length}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleFullscreen}
              aria-label="Present (fullscreen)"
              title="Present (F)"
            >
              <IconMaximize />
            </Button>
          </div>
        </header>
      )}

      <main
        ref={mainRef}
        className={cn(
          "flex-1 min-h-0 flex items-center justify-center",
          isFullscreen ? "p-0" : "p-3 sm:p-4 md:p-6 lg:p-8"
        )}
      >
        <div
          className={cn(
            "overflow-hidden",
            isFullscreen
              ? "bg-black"
              : "bg-white rounded-md border border-zinc-200 shadow-sm"
          )}
          style={{ width: frame.w, height: frame.h }}
        >
          {slide ? (
            <div
              className="origin-top-left"
              style={{
                width: "1920px",
                height: "1080px",
                transform: `scale(${frame.w / 1920})`,
              }}
            >
              <iframe
                key={slide.id}
                srcDoc={slide.html}
                sandbox="allow-scripts allow-same-origin"
                width={1920}
                height={1080}
                className="border-0 block"
                title={`Slide ${current + 1}`}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-400 text-sm">
              No slides
            </div>
          )}
        </div>
      </main>

      {!isFullscreen && slides.length > 1 && (
        <footer
          className="shrink-0 bg-white border-t border-zinc-200 px-4 py-3 flex items-center justify-center gap-3"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrent((c) => Math.max(c - 1, 0))}
            disabled={current === 0}
            aria-label="Previous slide"
          >
            <IconChevronLeft />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setCurrent((c) => Math.min(c + 1, slides.length - 1))
            }
            disabled={current >= slides.length - 1}
            aria-label="Next slide"
          >
            <IconChevronRight />
          </Button>
        </footer>
      )}

      {isFullscreen && (
        <PresentOverlay
          current={current}
          total={slides.length}
          onPrev={() => setCurrent((c) => Math.max(c - 1, 0))}
          onNext={() => setCurrent((c) => Math.min(c + 1, slides.length - 1))}
          onExit={toggleFullscreen}
        />
      )}
    </div>
  );
}
