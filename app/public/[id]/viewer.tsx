"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  IconChevronLeft,
  IconChevronRight,
  IconMaximize,
  IconMinimize,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { useFullscreen } from "@/hooks/use-fullscreen";

type Slide = { id: string; html: string };

const HOVER_DELAY_MS = 200;
const HIDE_DELAY_MS = 2500;

export default function PublicViewer({
  title,
  slides,
}: {
  title: string;
  slides: Slide[];
}) {
  const [current, setCurrent] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState({ w: 0, h: 0 });
  const { ref: rootRef, isFullscreen, toggle: toggleFullscreen } =
    useFullscreen<HTMLDivElement>();

  const [controlsVisible, setControlsVisible] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isTouch, setIsTouch] = useState(() =>
    typeof window !== "undefined"
      ? "ontouchstart" in window || navigator.maxTouchPoints > 0
      : false
  );

  useEffect(() => {
    const update = () =>
      setIsTouch(
        "ontouchstart" in window || navigator.maxTouchPoints > 0
      );
    window.addEventListener("touchstart", update, { once: true, passive: true });
    return () => window.removeEventListener("touchstart", update);
  }, []);

  const clearHideTimer = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };

  const scheduleHide = () => {
    clearHideTimer();
    hideTimer.current = setTimeout(() => {
      setControlsVisible(false);
    }, HIDE_DELAY_MS);
  };

  const onBottomEnter = () => {
    if (isTouch) return;
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      clearHideTimer();
      setControlsVisible(true);
    }, HOVER_DELAY_MS);
  };

  const onBottomLeave = () => {
    if (isTouch) return;
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    scheduleHide();
  };

  const keepVisible = useCallback(
    ({ autoHide }: { autoHide?: boolean } = {}) => {
      clearHideTimer();
      setControlsVisible(true);
      if (autoHide && isTouch) {
        clearHideTimer();
        hideTimer.current = setTimeout(() => {
          setControlsVisible(false);
        }, HIDE_DELAY_MS);
      }
    },
    [isTouch]
  );

  const onBottomClick = () => {
    if (!isTouch) return;
    keepVisible({ autoHide: true });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === "ArrowRight" ||
        e.key === " " ||
        e.key === "ArrowLeft" ||
        e.key === "f" ||
        e.key === "F"
      ) {
        keepVisible({ autoHide: true });
      }
      if (e.key === "ArrowRight" || e.key === " ")
        setCurrent((c) => Math.min(c + 1, slides.length - 1));
      else if (e.key === "ArrowLeft")
        setCurrent((c) => Math.max(c - 1, 0));
      else if (e.key === "f" || e.key === "F") toggleFullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slides.length, toggleFullscreen, keepVisible]);

  useEffect(() => {
    const el = stageRef.current;
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

  const slide = slides[current];

  return (
    <div
      ref={rootRef}
      className={cn("relative h-screen w-screen overflow-hidden bg-black")}
      title={title}
    >
      <div
        ref={stageRef}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div
          className="relative overflow-hidden bg-white"
          style={{ width: frame.w, height: frame.h }}
        >
          {slide ? (
            <div
              className="relative origin-top-left bg-white"
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
                tabIndex={-1}
                className="border-0 block bg-white pointer-events-none select-none"
                title={`${title} — Slide ${current + 1}`}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-400 text-base">
              No slides
            </div>
          )}
        </div>
      </div>

      {slides.length > 0 && (
        <>
          <div
            onMouseEnter={onBottomEnter}
            onMouseLeave={onBottomLeave}
            onClick={onBottomClick}
            className="absolute left-0 right-0 bottom-0 z-30 cursor-pointer h-48"
          />

          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 z-20 transition-opacity duration-300",
              controlsVisible ? "opacity-100" : "opacity-0"
            )}
            aria-hidden={!controlsVisible}
          >
            <div className="h-40 sm:h-56 bg-gradient-to-t from-black/85 via-black/50 to-transparent" />
          </div>

          <div
            className={cn(
              "absolute inset-x-0 bottom-0 z-30 transition-all duration-300 ease-out",
              controlsVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-6 pointer-events-none"
            )}
            onMouseEnter={() => {
              if (!isTouch) keepVisible();
            }}
            onMouseLeave={() => {
              if (!isTouch) scheduleHide();
            }}
            onClick={() => keepVisible({ autoHide: true })}
          >
            <div className="px-4 sm:px-5 pb-4 sm:pb-6 pt-8 sm:pt-16 max-w-screen mx-auto flex flex-col gap-3 sm:gap-5">
              <div className="flex-1 min-w-0">
                <div
                  className="relative flex h-6 sm:h-7 items-center gap-1 sm:gap-1.5"
                  role="tablist"
                  aria-label="Slides"
                >
                  {slides.map((_, i) => {
                    const isPast = i < current;
                    const isActive = i === current;
                    return (
                      <button
                        key={i}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-label={`Go to slide ${i + 1}`}
                        onClick={() => setCurrent(i)}
                        className="group relative flex-1 h-2 rounded-full overflow-hidden transition-all duration-200"
                      >
                        <span
                          className={cn(
                            "absolute inset-0 transition-all duration-300 ease-out",
                            isPast || isActive
                              ? "bg-white"
                              : "bg-white/20 group-hover:bg-white/35"
                          )}
                        />
                        <span
                          className={cn(
                            "pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-200",
                            isActive
                              ? "opacity-100 scale-100"
                              : "opacity-0 scale-75"
                          )}
                          aria-hidden
                        >
                          <span className="relative block">
                            <span className="block size-3 sm:size-4 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.35)]" />
                            <span className="absolute inset-0 rounded-full bg-white/60 animate-ping size-3 sm:size-4" />
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrent((c) => Math.max(c - 1, 0))}
                    disabled={current === 0}
                    className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full text-white/90 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous slide"
                  >
                    <IconChevronLeft className="size-5 sm:size-6" stroke={2} />
                  </button>

                  <div className="text-center tabular-nums font-medium sm:font-semibold text-white text-sm sm:text-base select-none min-w-[3.5rem] sm:min-w-[4.5rem]">
                    {current + 1}
                    <span className="text-white/50">
                      {" "}
                      / {slides.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrent((c) => Math.min(c + 1, slides.length - 1))
                    }
                    disabled={current >= slides.length - 1}
                    className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full text-white/90 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next slide"
                  >
                    <IconChevronRight className="size-5 sm:size-6" stroke={2} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={toggleFullscreen}
                  aria-label={
                    isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
                  }
                  title={
                    isFullscreen ? "Exit fullscreen (F)" : "Present (F)"
                  }
                  className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/10 text-white/95 hover:bg-white/20 hover:text-white transition-colors border border-white/10 backdrop-blur-sm"
                >
                  {isFullscreen ? (
                    <IconMinimize className="size-4 sm:size-5" stroke={2} />
                  ) : (
                    <IconMaximize className="size-4 sm:size-5" stroke={2} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
