"use client";

import { useEffect, useRef, useState } from "react";
import { IconArrowDownRight, IconDots, IconMaximize } from "@tabler/icons-react";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HeaderSlot } from "@/components/HeaderSlot";
import { PresentOverlay } from "@/components/PresentOverlay";
import { useFullscreen } from "@/hooks/use-fullscreen";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { savePresentation } from "./actions";

type Slide = { id: string; html: string };

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

type Props = {
  presentationId: string;
  initialTitle: string;
  initialSlides: Slide[];
};

export default function PresentationEditor({
  presentationId,
  initialTitle,
  initialSlides,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [slides, setSlides] = useState<Slide[]>(initialSlides);
  const [current, setCurrent] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [pasteHtml, setPasteHtml] = useState("");
  const mainRef = useRef<HTMLElement>(null);
  const [frame, setFrame] = useState({ w: 0, h: 0 });
  const initialRef = useRef({ title: initialTitle, slides: initialSlides });
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
      const t = e.target;
      if (
        t instanceof HTMLElement &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      ) {
        return;
      }
      if (!isFullscreen && e.key !== "f" && e.key !== "F") return;
      if (e.key === "ArrowRight" || e.key === " ")
        setCurrent((c) => Math.min(c + 1, slides.length - 1));
      else if (e.key === "ArrowLeft")
        setCurrent((c) => Math.max(c - 1, 0));
      else if (e.key === "f" || e.key === "F") toggleFullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slides.length, isFullscreen, toggleFullscreen]);

  useEffect(() => {
    const initial = initialRef.current;
    const unchanged =
      title === initial.title &&
      slides.length === initial.slides.length &&
      slides.every((s, i) => s.html === initial.slides[i]?.html);
    if (unchanged) return;
    const t = setTimeout(() => {
      savePresentation(presentationId, {
        title,
        slides: slides.map((s) => ({ html: s.html })),
      }).catch((err) => console.error("save failed", err));
    }, 1000);
    return () => clearTimeout(t);
  }, [title, slides, presentationId]);

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

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = slides.findIndex((s) => s.id === active.id);
    const newIdx = slides.findIndex((s) => s.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    setSlides((s) => arrayMove(s, oldIdx, newIdx));
    setCurrent((c) => {
      if (c === oldIdx) return newIdx;
      if (oldIdx < c && newIdx >= c) return c - 1;
      if (oldIdx > c && newIdx <= c) return c + 1;
      return c;
    });
  };

  const currentSlide = slides[current];

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative flex flex-1 min-h-0 flex-col font-sans pt-[env(safe-area-inset-top)]",
        isFullscreen ? "bg-black text-white" : "bg-[#f0f0f5] text-zinc-900"
      )}
    >
      <HeaderSlot>
        <div className="flex items-center gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            spellCheck={false}
            placeholder="Untitled"
            aria-label="Presentation title"
            className="h-8 w-32 sm:w-50 text-sm font-medium border-transparent bg-white/80 backdrop-blur hover:border-input focus-visible:bg-white"
          />
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
        
      </HeaderSlot>

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
          {currentSlide ? (
            <div
              className="origin-top-left"
              style={{
                width: "1920px",
                height: "1080px",
                transform: `scale(${frame.w / 1920})`,
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
            <button
              type="button"
              onClick={openAddModal}
              className="w-full h-full flex items-center justify-center gap-2 text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <span>Add your first slide</span>
              <IconArrowDownRight className="size-4" />
            </button>
          )}
        </div>
      </main>

      <footer
        className={cn(
          "shrink-0 bg-white border-t border-zinc-200 px-4 pt-3 flex items-center gap-3",
          isFullscreen && "hidden"
        )}
        style={{
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
        }}
      >
        <DndContext
          id="slide-thumb-strip"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          autoScroll={{ threshold: { x: 0.2, y: 0 } }}
        >
          <SortableContext
            items={slides.map((s) => s.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div
              className="flex-1 min-w-0 flex items-center gap-3 overflow-x-auto  [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              onWheel={(e) => {
                if (e.deltaY === 0) return;
                e.currentTarget.scrollBy({ left: e.deltaY });
              }}
            >
              {slides.map((s, i) => (
                <Thumb
                  key={s.id}
                  slide={s}
                  index={i}
                  active={i === current}
                  onSelect={() => setCurrent(i)}
                  onDuplicate={() => duplicateSlide(i)}
                  onDelete={() => deleteSlide(i)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <div className="flex shrink-0">
          <Button
            type="button"
            onClick={openAddModal}
            title="Add slide"
            className="w-10 h-[72px] text-lg font-light"
          >
            +
          </Button>
        </div>
      </footer>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add slide</DialogTitle>
            <DialogDescription>
              Paste raw HTML for your new slide.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={pasteHtml}
            onChange={(e) => setPasteHtml(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") confirmAdd();
            }}
            className="min-h-40 max-h-60 p-3 border border-zinc-200 rounded font-mono text-xs text-zinc-800 resize-none"
            placeholder={`<!DOCTYPE html>\n<html>\n  <body>\n    <h1>Hello</h1>\n  </body>\n</html>`}
          />
          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isFullscreen && slides.length > 0 && (
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

type ThumbProps = {
  slide: Slide;
  index: number;
  active: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

function Thumb({
  slide,
  index,
  active,
  onSelect,
  onDuplicate,
  onDelete,
}: ThumbProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        "flex items-center gap-1 shrink-0 border-2 rounded-sm transition-colors",
        active ? "border-blue-500" : "border-transparent",
        isDragging && "opacity-50"
      )}
    >
      <span
        {...listeners}
        className={cn(
          "text-[11px] tabular-nums font-medium w-4 text-right transition-colors cursor-grab active:cursor-grabbing select-none",
          active ? "text-blue-500" : "text-zinc-400"
        )}
      >
        {index + 1}
      </span>

      <div
        onClick={onSelect}
        {...listeners}
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
              <DropdownMenuItem onSelect={onDuplicate}>
                Duplicate
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
