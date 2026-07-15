"use client";

import { useState } from "react";
import Link from "next/link";
import { IconPresentation, IconSearch, IconX } from "@tabler/icons-react";

import { Input } from "@/components/ui/input";
import NewPresentationDialog from "./NewPresentationDialog";

export type PresentationSummary = {
  id: string;
  title: string;
  isPublic: boolean;
  updatedAt: Date;
  thumbnailUrl: string | null;
  slideCount: number;
};

export default function PresentationGrid({
  presentations,
}: {
  presentations: PresentationSummary[];
}) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = q
    ? presentations.filter((p) => p.title.toLowerCase().includes(q))
    : presentations;

  return (
    <div className="flex-1 bg-background">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="relative w-40 sm:w-64">
            <IconSearch className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search presentations"
              aria-label="Search presentations"
              className="pl-8 pr-8"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <IconX className="size-4" />
              </button>
            )}
          </div>
          <NewPresentationDialog />
        </div>

        {filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No presentations match &ldquo;{query.trim()}&rdquo;.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/user/presentation/${p.id}`}
                  className="group block overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    {p.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/thumbnail?url=${encodeURIComponent(p.thumbnailUrl)}`}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                        <IconPresentation className="size-8" />
                      </div>
                    )}
                  </div>
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {p.isPublic && (
                        <span
                          className="inline-block size-1.5 shrink-0 rounded-full bg-emerald-500"
                          aria-label="Public"
                          title="Public"
                        />
                      )}
                      <h2 className="line-clamp-1 text-sm font-medium tracking-tight">
                        {p.title}
                      </h2>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {p.slideCount} {p.slideCount === 1 ? "slide" : "slides"} ·{" "}
                      {formatRelative(p.updatedAt)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return date.toLocaleDateString();
}
