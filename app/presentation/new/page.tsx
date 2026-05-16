"use client";

import { useState } from "react";
import Link from "next/link";
import { IconDots } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";

type Slide = { id: string; html: string };

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function NewPresentation() {
  const [title, setTitle] = useState("Untitled Presentation");
  const [slides, setSlides] = useState<Slide[]>([]);
  const [current, setCurrent] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [pasteHtml, setPasteHtml] = useState("");

  const openAddModal = () => {
    setPasteHtml("");
    setShowModal(true);
  };

  const confirmAdd = () => {
    const html = pasteHtml.trim();
    if (!html) return;
    const newSlide = { id: uid(), html };
    setSlides((s) => [...s, newSlide]);
    setCurrent(slides.length);
    setShowModal(false);
    setPasteHtml("");
  };

  const deleteSlide = (i: number) => {
    setSlides((s) => s.filter((_, idx) => idx !== i));
    setCurrent((c) => {
      const newLen = slides.length - 1;
      return newLen <= 0 ? 0 : Math.min(c, newLen - 1);
    });
  };

  const duplicateSlide = (i: number) => {
    setSlides((s) => {
      const copy = { id: uid(), html: s[i].html };
      return [...s.slice(0, i + 1), copy, ...s.slice(i + 1)];
    });
    setCurrent(i + 1);
  };

  const moveSlide = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= slides.length) return;
    setSlides((s) => {
      const next = [...s];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setCurrent(j);
  };

  const currentSlide = slides[current];

  return (
    <div className="flex flex-col h-screen bg-[#f0f0f5] font-sans text-zinc-900">
      <nav className="flex items-center justify-between h-14 shrink-0 px-4 bg-white border-b border-zinc-200">
        <div className="flex items-center gap-2 min-w-0">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            spellCheck={false}
            className="h-8 w-72 text-sm font-medium border-transparent shadow-none hover:border-input focus-visible:bg-white"
          />
        </div>
      </nav>

      <main
        className="flex-1 min-h-0 flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8"
        style={{ containerType: "size" }}
      >
        <div
          className="aspect-video bg-white rounded-md border border-zinc-200 shadow-sm overflow-hidden"
          style={{ width: "min(100cqw, calc(100cqh * 16 / 9))" }}
        >
          {currentSlide ? (
            <div
              className="origin-top-left"
              style={{
                width: "1920px",
                height: "1080px",
                transform:
                  "scale(min(calc(100cqw / 1920px), calc(100cqh / 1080px)))",
              }}
            >
              <iframe
                key={currentSlide.id}
                srcDoc={currentSlide.html}
                sandbox="allow-scripts allow-same-origin"
                width={1920}
                height={1080}
                className="border-0 block"
                title={`Slide ${current + 1}`}
              />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-3">
              <p className="text-sm">No slides yet</p>
              <Button variant="link" size="sm" onClick={openAddModal}>
                Add your first slide
              </Button>
            </div>
          )}
        </div>
      </main>

      <footer className="shrink-0 bg-white border-t border-zinc-200 px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0 flex items-center gap-3 overflow-x-auto pb-1">
          {slides.map((s, i) => (
            <Thumb
              key={s.id}
              slide={s}
              index={i}
              active={i === current}
              onSelect={() => setCurrent(i)}
              onDuplicate={() => duplicateSlide(i)}
              onMoveLeft={() => moveSlide(i, -1)}
              onMoveRight={() => moveSlide(i, 1)}
              onDelete={() => deleteSlide(i)}
              canLeft={i > 0}
              canRight={i < slides.length - 1}
            />
          ))}
        </div>
        <div className="flex shrink-0">
          <Button
            onClick={openAddModal}
            title="Add slide"
            className="w-10 h-[72px] text-lg font-light"
          >
            +
          </Button>
        </div>
      </footer>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/30 backdrop-blur-sm p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-1">Add slide</h2>
            <p className="text-sm text-zinc-500 mb-4">
              Paste raw HTML for your new slide.
            </p>
            <Textarea
              value={pasteHtml}
              onChange={(e) => setPasteHtml(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") confirmAdd();
              }}
              className="w-full h-64 p-3 border border-zinc-200 rounded font-mono text-xs text-zinc-800 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 resize-none"
              placeholder={`<!DOCTYPE html>\n<html>\n  <body>\n    <h1>Hello</h1>\n  </body>\n</html>`}
              autoFocus
            />
            <div className="flex items-center justify-end mt-4">

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={confirmAdd}
                  disabled={!pasteHtml.trim()}
                >
                  Add slide
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type ThumbProps = {
  slide: Slide;
  index: number;
  active: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onDelete: () => void;
  canLeft: boolean;
  canRight: boolean;
};

function Thumb({
  slide,
  index,
  active,
  onSelect,
  onDuplicate,
  onMoveLeft,
  onMoveRight,
  onDelete,
  canLeft,
  canRight,
}: ThumbProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 shrink-0 border-2 rounded-sm transition-colors",
        active ? "border-blue-500" : "border-transparent"
      )}
    >
      <span
        className={cn(
          "text-[11px] tabular-nums font-medium w-4 text-right transition-colors",
          active ? "text-blue-500" : "text-zinc-400"
        )}
      >
        {index + 1}
      </span>

      <div
        onClick={onSelect}
        className={cn(
          "relative group shrink-0 p-[5px] cursor-pointer transition-colors"
        )}
      >
        <div className="relative w-[128px] h-[72px] overflow-hidden bg-white">
          <iframe
            srcDoc={slide.html}
            sandbox="allow-scripts allow-same-origin"
            tabIndex={-1}
            className="border-0 pointer-events-none origin-top-left"
            style={{
              width: "1280px",
              height: "720px",
              transform: "scale(0.1)",
            }}
            title={`Thumbnail ${index + 1}`}
          />
          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              title="Slide options"
              className="absolute top-1 right-1 size-5 rounded-md bg-white/90 backdrop-blur-sm text-zinc-700 hover:bg-white hover:text-zinc-900 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity outline-none"
            >
              <IconDots className="size-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem onSelect={onDuplicate}>Duplicate</DropdownMenuItem>
              <DropdownMenuItem onSelect={onMoveLeft} disabled={!canLeft}>
                Move left
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onMoveRight} disabled={!canRight}>
                Move right
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
