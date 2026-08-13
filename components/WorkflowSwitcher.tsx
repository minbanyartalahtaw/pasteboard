"use client";

import Image from "next/image";
import { useState } from "react";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";

const STEPS = [
  {
    label: "Find Claude",
    caption: "Search for claude.ai and open it.",
    src: "/workflow/01-search-claude-ai.png",
    alt: "A browser search box with claude.ai typed in and the claude.ai suggestion highlighted.",
  },
  {
    label: "Open Connectors",
    caption: "In Claude, go to Settings → Connectors.",
    src: "/workflow/02-settings-connectors.png",
    alt: "Claude settings with the Connectors section selected.",
  },
  {
    label: "Add a connector",
    caption: "Click Add custom connector.",
    src: "/workflow/03-add-custom-connector.png",
    alt: "The Connectors page with the Add custom connector button.",
  },
  {
    label: "Paste the address",
    caption: "Paste https://pasteboard.design/api/mcp, then click Add.",
    src: "/workflow/04-paste-mcp-endpoint.png",
    alt: "The Add custom connector dialog with the Pasteboard MCP server URL pasted in.",
  },
  {
    label: "Approve it",
    caption: "Approve the request — Pasteboard is connected.",
    src: "/workflow/05-connected.png",
    alt: "Pasteboard listed as a connected connector in Claude.",
  },
  {
    label: "Ask for slides",
    caption: "Ask Claude for a deck. It calls the Pasteboard tools for you.",
    src: "/workflow/06-tools-running.png",
    alt: "A Claude chat running the Pasteboard tools: slide_html_guide, create_presentation and add_slide.",
  },
  {
    label: "Present it",
    caption: "The deck lands in Pasteboard, ready to share or present.",
    src: "/workflow/07-deck-created.png",
    alt: "A Claude chat showing the finished Q2 Roadmap deck with five slides in Pasteboard.",
  },
] as const;

/** Solid black on top of the screenshot; the hover overrides keep it flat. */
const ARROW =
  "absolute top-1/2 size-10 -translate-y-1/2 rounded-full border-transparent bg-foreground text-background shadow-md hover:border-transparent hover:bg-foreground hover:text-background";

export function WorkflowSwitcher() {
  const [active, setActive] = useState(0);
  const step = STEPS[active];

  const go = (delta: number) =>
    setActive((i) => (i + delta + STEPS.length) % STEPS.length);

  return (
    <div>
      <div className="relative overflow-hidden rounded-lg border border-border bg-muted shadow-[0_24px_80px_rgba(24,24,27,0.10)]">
        <div className="relative aspect-[16/10] w-full">
          {/* Every shot stays mounted so switching never waits on a load. */}
          {STEPS.map((s, i) => (
            <Image
              key={s.src}
              src={s.src}
              alt={s.alt}
              width={1440}
              height={900}
              priority={i === 0}
              sizes="(min-width: 1024px) 1024px, 100vw"
              aria-hidden={i !== active}
              className={`absolute inset-0 h-full w-full bg-muted object-cover transition-all duration-300 ease-out ${
                i === active
                  ? "translate-x-0 opacity-100"
                  : i < active
                    ? "-translate-x-4 opacity-0"
                    : "translate-x-4 opacity-0"
              }`}
            />
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Previous step"
          onClick={() => go(-1)}
          className={`${ARROW} left-3`}
        >
          <IconChevronLeft className="size-5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Next step"
          onClick={() => go(1)}
          className={`${ARROW} right-3`}
        >
          <IconChevronRight className="size-5" />
        </Button>
      </div>

      <p
        key={step.src}
        aria-live="polite"
        className="mt-4 animate-in fade-in text-sm leading-relaxed text-muted-foreground duration-300"
      >
        <span className="font-medium text-foreground">
          Step {active + 1} of {STEPS.length} · {step.label}.
        </span>{" "}
        {step.caption}
      </p>
    </div>
  );
}
