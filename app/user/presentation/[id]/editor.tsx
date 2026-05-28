"use client";

import { useEffect, useRef, useState } from "react";
import { IconArrowDownRight, IconDots, IconLoader2, IconMaximize } from "@tabler/icons-react";
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
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { savePresentation, generateSlideThumbnail } from "./actions";

type Slide = { id: string; html: string; thumbnailUrl: string | null };

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
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [current, setCurrent] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [pasteHtml, setPasteHtml] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editOriginal, setEditOriginal] = useState<string>("");
  const [deleteConfirmIdx, setDeleteConfirmIdx] = useState<number | null>(null);
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
    if (generatingIds.size > 0) return;
    const initial = initialRef.current;
    const unchanged =
      title === initial.title &&
      slides.length === initial.slides.length &&
      slides.every(
        (s, i) =>
          s.html === initial.slides[i]?.html &&
          s.thumbnailUrl === initial.slides[i]?.thumbnailUrl
      );
    if (unchanged) return;
    const t = setTimeout(() => {
      savePresentation(presentationId, {
        title,
        slides: slides.map((s) => ({ html: s.html, thumbnailUrl: s.thumbnailUrl })),
      }).catch((err) => console.error("save failed", err));
    }, 1000);
    return () => clearTimeout(t);
  }, [title, slides, presentationId, generatingIds]);

  const openAddModal = () => {
    setPasteHtml("");
    setShowModal(true);
  };

  const generateThumbnail = async (
    slideId: string,
    html: string,
    oldUrl?: string | null
  ) => {
    setGeneratingIds((prev) => new Set([...prev, slideId]));
    try {
      const url = await generateSlideThumbnail(presentationId, html, oldUrl);
      if (url) {
        setSlides((prev) =>
          prev.map((s) => (s.id === slideId ? { ...s, thumbnailUrl: url } : s))
        );
      }
    } catch {
      // thumbnail generation is best-effort
    } finally {
      setGeneratingIds((prev) => {
        const next = new Set(prev);
        next.delete(slideId);
        return next;
      });
    }
  };

  const confirmAdd = () => {
    const html = pasteHtml.trim();
    if (!html) return;
    const newSlide = { id: uid(), html, thumbnailUrl: null };
    setSlides((s) => [...s, newSlide]);
    setCurrent(slides.length);
    setShowModal(false);
    setPasteHtml("");
    generateThumbnail(newSlide.id, html);
  };

  const deleteSlide = (i: number) => {
    setSlides((s) => s.filter((_, idx) => idx !== i));
    setCurrent((c) => {
      const newLen = slides.length - 1;
      return newLen <= 0 ? 0 : Math.min(c, newLen - 1);
    });
  };

  const duplicateSlide = (i: number) => {
    const copy = { id: uid(), html: slides[i].html, thumbnailUrl: null };
    setSlides((s) => [...s.slice(0, i + 1), copy, ...s.slice(i + 1)]);
    setCurrent(i + 1);
    generateThumbnail(copy.id, copy.html);
  };

  const openEdit = (i: number) => {
    const s = slides[i];
    if (!s) return;
    setEditOriginal(s.html);
    setEditingId(s.id);
    setCurrent(i);
  };

  const cancelEdit = () => {
    if (!editingId) return;
    setSlides((arr) =>
      arr.map((s) => (s.id === editingId ? { ...s, html: editOriginal } : s)),
    );
    setEditingId(null);
  };

  const saveEdit = () => {
    const slide = slides.find((s) => s.id === editingId);
    if (slide) generateThumbnail(slide.id, slide.html, slide.thumbnailUrl);
    setEditingId(null);
  };

  const updateEditingHtml = (html: string) => {
    if (!editingId) return;
    setSlides((arr) =>
      arr.map((s) => (s.id === editingId ? { ...s, html } : s)),
    );
  };

  const editingSlide = editingId
    ? slides.find((s) => s.id === editingId)
    : undefined;

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
        isFullscreen ? "bg-black text-white" : "bg-muted text-foreground"
      )}
    >
      <HeaderSlot>
        <div className="flex w-full items-center justify-between">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            spellCheck={false}
            placeholder="Untitled"
            aria-label="Presentation title"
            className="h-8 w-50 sm:w-50 text-sm font-medium border-transparent bg-background/80 backdrop-blur hover:border-input focus-visible:bg-background"
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
          "flex-1 min-h-0 flex items-center justify-center bg-background/70",
          isFullscreen ? "p-0" : "p-3 sm:p-4 md:p-6 lg:p-8"
        )}
      >
        <div
          className={cn(
            "overflow-hidden",
            isFullscreen
              ? "bg-black"
              : "bg-card rounded-md border border-border shadow-sm"
          )}
          style={{ width: frame.w, height: frame.h }}
        >
          {currentSlide ? (
            <div
              className="relative origin-top-left"
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
              {isFullscreen && (
                <div className="absolute inset-0" aria-hidden />
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={openAddModal}
              className="w-full h-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Add your first slide</span>
              <IconArrowDownRight className="size-4" />
            </button>
          )}
        </div>
      </main>

      <footer
        className={cn(
          "shrink-0 bg-background border-t border-border px-4 pt-3 flex items-center gap-3",
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
                  isGenerating={generatingIds.has(s.id)}
                  onSelect={() => setCurrent(i)}
                  onEdit={() => openEdit(i)}
                  onDuplicate={() => duplicateSlide(i)}
                  onDelete={() => setDeleteConfirmIdx(i)}
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
            className="min-h-40 max-h-60 p-3 border border-border rounded font-mono text-xs text-foreground resize-none"
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

      <Dialog open={deleteConfirmIdx !== null} onOpenChange={(open) => { if (!open) setDeleteConfirmIdx(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete slide?</DialogTitle>
            <DialogDescription>
              Slide {deleteConfirmIdx !== null ? deleteConfirmIdx + 1 : ""} will be permanently removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmIdx(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (deleteConfirmIdx !== null) deleteSlide(deleteConfirmIdx);
                setDeleteConfirmIdx(null);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet
        open={editingId !== null}
        onOpenChange={(open) => {
          if (!open) cancelEdit();
        }}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-md flex flex-col "
        >
          <SheetHeader>
            <SheetTitle>Edit slide</SheetTitle>
          </SheetHeader>
          <Textarea
            value={editingSlide?.html ?? ""}
            onChange={(e) => updateEditingHtml(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") saveEdit();
              if (e.key === "Escape") cancelEdit();
            }}
            className="flex-1 min-h-40 p-3 border-x-0 border-y border-border rounded-none shadow-none focus-visible:ring-0 focus-visible:border-border font-mono text-xs text-foreground resize-none"
          />
          <SheetFooter className="flex-col-reverse sm:flex-row sm:justify-end">
            <Button variant="ghost" size="sm" onClick={cancelEdit}>
              Cancel
            </Button>
            <Button size="sm" onClick={saveEdit}>
              Done
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

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
  isGenerating: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

function Thumb({
  slide,
  index,
  active,
  isGenerating,
  onSelect,
  onEdit,
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
        "flex items-center gap-1 shrink-0 rounded-sm transition-colors border-4",
        active ? "border-primary dark:border-primary/50" : "border-transparent",
        isDragging && "opacity-50"
      )}
    >
      <span
        {...listeners}
        className={cn(
          "text-[11px] tabular-nums font-medium w-4 text-right transition-colors cursor-grab active:cursor-grabbing select-none",
          active ? "text-primary" : "text-muted-foreground"
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
        <div className="relative w-[128px] h-[72px] overflow-hidden bg-card">
          {isGenerating ? (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <IconLoader2 className="size-4 text-muted-foreground animate-spin" />
            </div>
          ) : slide.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/thumbnail?url=${encodeURIComponent(slide.thumbnailUrl)}`}
              alt={`Slide ${index + 1}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted" />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              title="Slide options"
              className={cn(
                "absolute top-1 right-1 size-5 rounded-md bg-card/90 backdrop-blur-sm text-foreground hover:bg-card shadow-sm flex items-center justify-center transition-opacity outline-none data-[state=open]:opacity-100",
                active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}
            >
              <IconDots className="size-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>
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
