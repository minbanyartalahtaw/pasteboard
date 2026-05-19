"use client";

import { useState } from "react";

const STEPS = [
  {
    n: 1,
    label: "Prompt the LLM",
    description: "Open the prompt, copy it, and paste it into ChatGPT.",
    video: "/videos/workflow-step-1.mp4",
    poster: "/videos/workflow-step-1-poster.png",
    aria:
      "Open the prompt, copy it, and paste it into ChatGPT to generate HTML.",
  },
  {
    n: 2,
    label: "HTML into a slide",
    description: "Paste the HTML reply into Pasteboard to get a live slide.",
    video: "/videos/workflow-step-2.mp4",
    poster: "/videos/workflow-step-2-poster.png",
    aria: "Pasted HTML is parsed into a single editable slide in Pasteboard.",
  },
] as const;

export function WorkflowSwitcher() {
  const [active, setActive] = useState(0);
  const step = STEPS[active];

  return (
    <div>
      <div
        role="tablist"
        aria-label="Workflow steps"
        className="grid gap-3 sm:grid-cols-2"
      >
        {STEPS.map((s, i) => {
          const isActive = i === active;
          return (
            <button
              key={s.n}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => setActive(i)}
              className={`flex items-start gap-4 rounded-lg border px-5 py-4 text-left transition-colors ${
                isActive
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300"
              }`}
            >
              <span
                className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-sm font-semibold tabular-nums ${
                  isActive
                    ? "bg-white text-zinc-900"
                    : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {s.n}
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-semibold leading-tight">
                  {s.label}
                </span>
                <span
                  className={`mt-1 text-xs leading-relaxed ${
                    isActive ? "text-zinc-300" : "text-zinc-500"
                  }`}
                >
                  {s.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-6 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 shadow-[0_24px_80px_rgba(24,24,27,0.10)]">
        <video
          key={step.video}
          aria-label={step.aria}
          autoPlay
          loop
          muted
          playsInline
          poster={step.poster}
          preload="metadata"
          className="aspect-[16/10] w-full bg-zinc-100 object-cover"
        >
          <source src={step.video} type="video/mp4" />
        </video>
      </div>
    </div>
  );
}
