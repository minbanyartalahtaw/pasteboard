"use client";

export function SlideGeneratingAnimation({ prompt }: { prompt: string }) {
  return (
    <div className="w-full aspect-video rounded-lg border bg-muted/30 overflow-hidden relative flex flex-col justify-center px-8 gap-4">
      {/* prompt text */}
      {prompt && (
        <p className="text-xs text-muted-foreground/60 absolute top-3 left-4 right-4 truncate">
          {prompt}
        </p>
      )}

      {/* headline bar */}
      <div
        className="h-6 rounded-md bg-muted animate-pulse"
        style={{ width: "55%", animationDelay: "0ms" }}
      />
      {/* subheadline */}
      <div
        className="h-3.5 rounded-md bg-muted animate-pulse"
        style={{ width: "38%", animationDelay: "150ms" }}
      />

      {/* 3-column cards */}
      <div className="flex gap-3 mt-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex-1 rounded-md bg-muted animate-pulse"
            style={{ height: 56, animationDelay: `${300 + i * 120}ms` }}
          />
        ))}
      </div>

      {/* bottom caption */}
      <div
        className="h-2.5 rounded-md bg-muted animate-pulse"
        style={{ width: "25%", animationDelay: "700ms" }}
      />

      {/* bouncing dots */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="size-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="size-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
