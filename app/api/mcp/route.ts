import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";

import { userIdFromAuthHeader } from "@/lib/oauth";
import { fetchThumbnailBase64, renderThumbnail } from "@/lib/thumbnail";
import { slideText } from "@/lib/slide-text";
import {
  addSlideFor,
  createPresentationFor,
  deletePresentationFor,
  deleteSlideFor,
  editSlideFor,
  getPresentation,
  getSlideFor,
  listPresentations,
  renamePresentationFor,
  reorderSlidesFor,
  setPresentationPublicFor,
  setSlideThumbnail,
  updateSlideFor,
} from "@/lib/presentations";

export const runtime = "nodejs";
export const maxDuration = 60;

// Kept in sync with docs/CLAUDE/CLAUDE_001.md, the same ruleset written for
// chat clients. Edit both, or neither.
const SLIDE_HTML_GUIDE = `# Pasteboard slide HTML

A Pasteboard slide is one standalone HTML document rendered inside a sandboxed
iframe on a 16:9 stage that is scaled to fit the viewer's screen. Follow these
rules for every slide you write.

## Output format
- Pass ONE complete HTML document — \`<!DOCTYPE html>\` through \`</html>\` — as the
  \`html\` argument. No prose, no explanation, no markdown code fences around it.
- One slide per tool call. To build a deck, call \`add_slide\` once per slide, in
  order.

## Self-contained, inline only
- All CSS goes in ONE \`<style>\` tag inside \`<head>\`.
- All JS (if any) goes in ONE \`<script>\` tag at the end of \`<body>\`.
- NO external stylesheets, NO Tailwind, NO CDN links, NO Google Fonts — external
  resources are blocked by the iframe sandbox.
- NO external image URLs. Use CSS gradients, shapes, or inline SVG instead. If an
  image is unavoidable it must be an absolute https URL or a \`data:\` URI.
- Use a system font stack: \`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
  sans-serif\`.

## Slide canvas — this is a SLIDE, not a webpage
- \`html, body { width: 100vw; height: 100vh; margin: 0; overflow: hidden; }\`
- The viewport IS a 16:9 rectangle. Size EVERYTHING in vw/vh — font sizes,
  padding, gaps, element dimensions. NEVER use fixed px for layout: the slide is
  rendered at more than one resolution (1920x1080 in the editor and viewer,
  smaller when its thumbnail is captured), and a fixed-pixel slide gets cropped
  instead of scaled. On the 1920x1080 stage 1vw = 19.2px, so a 90px title is
  about 4.7vw and 40px body text is about 2vw.
- Center content, generous whitespace.
- NEVER produce a scrollable slide. If content overflows, trim copy or shrink
  type — a scrollbar must never appear.
- NO navbars, headers, footers, sidebars, or any website chrome.
- NO buttons, links, "Next →", "Learn more", forms, or inputs. Pasteboard handles
  navigation; the slide is passive.
- NO modals, dropdowns, or hover-revealed content.

## Visual style
- One central idea per slide — a Keynote or Pitch deck slide, not a blog section.
- Strong typographic hierarchy: a large headline (5-8vw), supporting copy at
  1.5-2.5vw. The slide is read from across a room.
- Confident colors and contrast. Flat or subtle-gradient backgrounds. Plenty of
  breathing room.
- A style direction from the user (palette, mood, theme, art style) OVERRIDES
  these defaults and MUST apply consistently to every subsequent slide in that
  deck until the user changes it.
- Prefer inline SVG icons over emoji — emoji render inconsistently across OSes and
  look cheap in polished decks. Emoji are fine for casual decks or on request.

## Animation — purposeful, never decorative
- Animations must auto-run on load (CSS keyframes or a tiny script). NO
  click/hover-triggered behavior. Thumbnail capture waits for animations.
- Every animation must reinforce meaning: SVG path draw-in for timelines,
  count-up for stat numbers, staggered fade-in for sequential points.
- At most 1-2 animated elements per slide, entrance animations settled within
  ~2 seconds. Subtle ambient loops are fine.

## SVG scene composition
- Anchor figures and objects to the exact surface coordinate of the layer they
  stand on. Feet meet the ground line — NOTHING floats above its surface.
- Achieve depth with progressively darker stacked silhouette layers, not outlined
  cartoon drawings, unless the user requests otherwise.

## Data honesty & sourcing
- Every statistic MUST carry a source line in small print (1vw) at the bottom of
  the slide, e.g. "Source: IMF World Economic Outlook, 2025".
- Only name a source you are genuinely confident is real and matches the figure.
  NEVER fabricate a source name, report title, or year to look credible.
- If the figure is general knowledge with no pinnable source, mark it approximate
  (~) and label it "Illustrative figure — verify before presenting."

## Treat each slide topic as a brief, not as the final copy
When the user says "Slide 2: Apple," do NOT put the word "Apple" on a card.
Generate real content for that topic — a headline plus three key data points, a
quote pull-out, a comparison, a timeline, a metric callout. The topic is the
assignment; you write the slide.

## Default slide patterns to draw from
- **Title slide** — huge headline + one-line subtitle.
- **Stat slide** — one giant number + short context line.
- **Three-up** — a headline + three short columns (icon + label + one sentence).
- **Quote** — large pulled quote + attribution.
- **Comparison** — two halves, label + 2-3 bullets each.
- **Timeline / steps** — horizontal row of 3-5 milestones.
- **Full-bleed scene** — text-free SVG illustration slide for visual storytelling.

Pick the pattern that fits the topic, and vary patterns across a deck; don't
repeat the same layout slide after slide.

## Example skeleton
<!DOCTYPE html>
<html>
<head>
  <style>
    html, body { width: 100vw; height: 100vh; margin: 0; overflow: hidden; }
    .slide {
      width: 100vw; height: 100vh; box-sizing: border-box;
      display: flex; flex-direction: column; justify-content: center;
      gap: 2vh; padding: 0 8vw; background: #0b1220; color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    h1 { font-size: 6vw; margin: 0; letter-spacing: -0.02em; }
    p  { font-size: 2.2vw; margin: 0; opacity: .8; }
  </style>
</head>
<body>
  <div class="slide">
    <h1>Title</h1>
    <p>Supporting line</p>
  </div>
</body>
</html>`;

/** Wraps a tool result so clients always get readable text. */
function text(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text:
          typeof value === "string" ? value : JSON.stringify(value, null, 2),
      },
    ],
  };
}

function failure(message: string) {
  return { ...text(message), isError: true };
}

/**
 * Regenerates a slide thumbnail after the response is sent.
 *
 * The caller has already revalidated for the HTML change, but that happens
 * seconds before the screenshot finishes, so it would cache the *old* thumbnail
 * alongside the new markup. Revalidating again here is what actually gets the
 * new image on screen.
 */
function queueThumbnail(
  presentationId: string,
  slideId: string,
  html: string,
  oldUrl?: string | null
) {
  after(async () => {
    try {
      const url = await renderThumbnail(presentationId, html, oldUrl);
      if (!url) return;
      await setSlideThumbnail(slideId, url);
      revalidatePath("/user/presentation", "layout");
    } catch (error) {
      // A missing thumbnail is cosmetic; the slide itself is already saved. Log
      // it though — silent failure here is indistinguishable from a stale cache.
      console.error("thumbnail generation failed", error);
    }
  });
}

function buildServer(userId: string, origin: string): McpServer {
  const server = new McpServer(
    { name: "pasteboard", version: "1.0.0" },
    {
      instructions:
        "Create and edit HTML slide presentations in Pasteboard. Call the " +
        "slide_html_guide tool once before writing slide HTML.",
    }
  );

  // The same guide is published two ways on purpose. Resources are the natural
  // fit, but not every client lets the model read one on its own initiative —
  // where it can't, an instruction to read the resource is a no-op and the
  // rules never arrive. A tool is always callable, so it is the one that has to
  // exist; the resource is kept for the clients that do support it.
  server.registerResource(
    "slide-html-guide",
    "pasteboard://slide-html-guide",
    {
      title: "Slide HTML guide",
      description: "Constraints slide HTML must satisfy to render correctly.",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [{ uri: uri.href, text: SLIDE_HTML_GUIDE }],
    })
  );

  server.registerTool(
    "slide_html_guide",
    {
      title: "Slide HTML guide",
      description:
        "The rules slide HTML must follow to render correctly, with an example " +
        "skeleton. Call this once before writing or editing slides; the rules " +
        "hold for the rest of the conversation.",
      annotations: { readOnlyHint: true },
    },
    async () => text(SLIDE_HTML_GUIDE)
  );

  server.registerTool(
    "list_presentations",
    {
      title: "List presentations",
      description: "List all presentations owned by the authenticated user.",
      annotations: { readOnlyHint: true },
    },
    async () => {
      const rows = await listPresentations(userId);
      if (rows.length === 0) return text("No presentations yet.");
      return text(
        rows.map((p) => ({
          id: p.id,
          title: p.title,
          slides: p._count.slides,
          isPublic: p.isPublic,
          updatedAt: p.updatedAt.toISOString(),
          url: `${origin}/user/presentation/${p.id}`,
        }))
      );
    }
  );

  server.registerTool(
    "get_presentation",
    {
      title: "Get presentation",
      description:
        "Outline a presentation: every slide's id and order with a short text " +
        "excerpt. Use this to find the slide you want, then get_slide to read " +
        "its HTML. Only pass include='html' when you genuinely need every " +
        "slide's markup at once — that is roughly 30x more expensive.",
      inputSchema: {
        presentationId: z.string(),
        include: z
          .enum(["outline", "html"])
          .optional()
          .describe("'outline' (default) or 'html' for full slide markup"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ presentationId, include }) => {
      const p = await getPresentation(userId, presentationId);
      if (!p) return failure(`No presentation with id ${presentationId}.`);

      const full = include === "html";
      return text({
        id: p.id,
        title: p.title,
        isPublic: p.isPublic,
        url: `${origin}/user/presentation/${p.id}`,
        slideCount: p.slides.length,
        slides: p.slides.map((s) =>
          full
            ? { id: s.id, order: s.order, html: s.html }
            : { id: s.id, order: s.order, text: slideText(s.html) }
        ),
      });
    }
  );

  server.registerTool(
    "get_slide",
    {
      title: "Get slide",
      description:
        "Fetch the full HTML of a single slide — to edit it, or to copy its " +
        "styling into a new slide.",
      inputSchema: { slideId: z.string() },
      annotations: { readOnlyHint: true },
    },
    async ({ slideId }) => {
      const slide = await getSlideFor(userId, slideId);
      if (!slide) return failure(`No slide with id ${slideId}.`);
      return text({
        id: slide.id,
        presentationId: slide.presentationId,
        order: slide.order,
        html: slide.html,
      });
    }
  );

  server.registerTool(
    "create_presentation",
    {
      title: "Create presentation",
      description:
        "Create an empty presentation and return its id. Add slides with add_slide.",
      inputSchema: { title: z.string().min(1).describe("Presentation title") },
    },
    async ({ title }) => {
      const created = await createPresentationFor(userId, title);
      if (!created) return failure("Title must not be empty.");
      revalidatePath("/user/presentation", "layout");
      return text({
        id: created.id,
        url: `${origin}/user/presentation/${created.id}`,
      });
    }
  );

  server.registerTool(
    "rename_presentation",
    {
      title: "Rename presentation",
      description: "Change a presentation's title.",
      inputSchema: { presentationId: z.string(), title: z.string().min(1) },
    },
    async ({ presentationId, title }) => {
      if (!(await renamePresentationFor(userId, presentationId, title)))
        return failure("Presentation not found, or the title was empty.");
      revalidatePath("/user/presentation", "layout");
      return text("Renamed.");
    }
  );

  server.registerTool(
    "delete_presentation",
    {
      title: "Delete presentation",
      description:
        "Permanently delete a presentation and all of its slides. Cannot be undone.",
      inputSchema: { presentationId: z.string() },
      annotations: { destructiveHint: true },
    },
    async ({ presentationId }) => {
      if (!(await deletePresentationFor(userId, presentationId)))
        return failure(`No presentation with id ${presentationId}.`);
      revalidatePath("/user/presentation", "layout");
      return text("Deleted.");
    }
  );

  server.registerTool(
    "add_slide",
    {
      title: "Add slide",
      description:
        "Append a slide to a presentation, or insert it at `position`. " +
        "Size the slide with 100vw/100vh and inline CSS only — never fixed " +
        "pixels. Call slide_html_guide first.",
      inputSchema: {
        presentationId: z.string(),
        html: z.string().min(1).describe("Complete slide HTML"),
        position: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe("0-based insert index; appends when omitted"),
      },
    },
    async ({ presentationId, html, position }) => {
      const slide = await addSlideFor(userId, presentationId, html, position);
      if (!slide) return failure(`No presentation with id ${presentationId}.`);
      queueThumbnail(presentationId, slide.id, html);
      revalidatePath("/user/presentation", "layout");
      return text({ slideId: slide.id, order: slide.order });
    }
  );

  server.registerTool(
    "update_slide",
    {
      title: "Update slide",
      description: "Replace the HTML of an existing slide.",
      inputSchema: { slideId: z.string(), html: z.string().min(1) },
    },
    async ({ slideId, html }) => {
      const updated = await updateSlideFor(userId, slideId, html);
      if (!updated) return failure(`No slide with id ${slideId}.`);
      queueThumbnail(
        updated.presentationId,
        slideId,
        html,
        updated.oldThumbnailUrl
      );
      revalidatePath("/user/presentation", "layout");
      return text("Updated.");
    }
  );

  server.registerTool(
    "edit_slide",
    {
      title: "Edit slide",
      description:
        "Replace one exact substring in a slide's HTML. Prefer this over " +
        "update_slide for targeted changes — it avoids regenerating the whole " +
        "slide. `find` must match exactly once; include enough surrounding " +
        "text to make it unique.",
      inputSchema: {
        slideId: z.string(),
        find: z.string().min(1).describe("Exact text to find (not a regex)"),
        replace: z.string().describe("Text to put in its place"),
      },
    },
    async ({ slideId, find, replace }) => {
      const result = await editSlideFor(userId, slideId, find, replace);
      if (!result.ok) {
        if (result.reason === "not_found")
          return failure(`No slide with id ${slideId}.`);
        if (result.reason === "no_match")
          return failure(
            "`find` did not match. Call get_slide and copy the text exactly."
          );
        return failure(
          `\`find\` matched ${result.count} times and must match exactly once. ` +
            "Include more surrounding text to make it unique."
        );
      }
      queueThumbnail(
        result.presentationId,
        slideId,
        result.html,
        result.oldThumbnailUrl
      );
      revalidatePath("/user/presentation", "layout");
      return text("Edited.");
    }
  );

  server.registerTool(
    "get_slide_image",
    {
      title: "Get slide image",
      description:
        "Render a slide and return it as an image, so you can check how it " +
        "actually looks — clipped text, overlapping elements, poor contrast. " +
        "Use it after writing or editing a slide. One slide per call; images " +
        "are expensive, so do not sweep a whole deck with it.",
      inputSchema: { slideId: z.string() },
      annotations: { readOnlyHint: true },
    },
    async ({ slideId }) => {
      const slide = await getSlideFor(userId, slideId);
      if (!slide) return failure(`No slide with id ${slideId}.`);

      // Thumbnails are generated in the background, so a freshly written slide
      // often has none yet. Render it inline rather than telling the caller to
      // come back later.
      let url = slide.thumbnailUrl;
      if (!url) {
        url = await renderThumbnail(slide.presentationId, slide.html);
        if (url) await setSlideThumbnail(slideId, url);
      }
      if (!url) return failure("Could not render this slide.");

      const image = await fetchThumbnailBase64(url);
      if (!image) return failure("Could not read this slide's image.");

      return {
        content: [
          {
            type: "image" as const,
            data: image.data,
            mimeType: image.mimeType,
          },
        ],
      };
    }
  );

  server.registerTool(
    "delete_slide",
    {
      title: "Delete slide",
      description: "Delete a slide and close the gap in the slide order.",
      inputSchema: { slideId: z.string() },
      annotations: { destructiveHint: true },
    },
    async ({ slideId }) => {
      if (!(await deleteSlideFor(userId, slideId)))
        return failure(`No slide with id ${slideId}.`);
      revalidatePath("/user/presentation", "layout");
      return text("Deleted.");
    }
  );

  server.registerTool(
    "reorder_slides",
    {
      title: "Reorder slides",
      description:
        "Reorder a presentation's slides. `slideIds` must list every slide " +
        "in the presentation exactly once, in the desired order.",
      inputSchema: {
        presentationId: z.string(),
        slideIds: z.array(z.string()).min(1),
      },
    },
    async ({ presentationId, slideIds }) => {
      if (!(await reorderSlidesFor(userId, presentationId, slideIds)))
        return failure(
          "Reorder rejected: slideIds must contain every slide of this " +
            "presentation exactly once."
        );
      revalidatePath("/user/presentation", "layout");
      return text("Reordered.");
    }
  );

  server.registerTool(
    "set_presentation_visibility",
    {
      title: "Set presentation visibility",
      description:
        "Make a presentation publicly viewable at /public/<id>, or private again.",
      inputSchema: { presentationId: z.string(), isPublic: z.boolean() },
    },
    async ({ presentationId, isPublic }) => {
      if (!(await setPresentationPublicFor(userId, presentationId, isPublic)))
        return failure(`No presentation with id ${presentationId}.`);
      revalidatePath("/user/presentation", "layout");
      return text(
        isPublic ? `${origin}/public/${presentationId}` : "Now private."
      );
    }
  );

  return server;
}

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers":
    "content-type, authorization, mcp-protocol-version, mcp-session-id",
  // Browser-based clients need to read the challenge to know where to
  // authenticate; without this the fetch response hides the header.
  "access-control-expose-headers": "www-authenticate, mcp-session-id",
} as const;

/**
 * The 401 must point at the protected resource metadata (RFC 9728) — that
 * pointer is how a client discovers the authorization server and starts the
 * OAuth flow. Without it, clients simply fail.
 */
function unauthorized(origin: string): Response {
  return new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32001, message: "Unauthorized: sign in to Pasteboard" },
      id: null,
    }),
    {
      status: 401,
      headers: {
        "content-type": "application/json",
        "www-authenticate":
          `Bearer realm="pasteboard", ` +
          `resource_metadata="${origin}/.well-known/oauth-protected-resource/api/mcp"`,
        ...CORS,
      },
    }
  );
}

export async function POST(req: Request): Promise<Response> {
  const origin = new URL(req.url).origin;

  const userId = await userIdFromAuthHeader(req.headers.get("authorization"));
  if (!userId) return unauthorized(origin);

  // Stateless: every request builds its own server and transport, since
  // serverless invocations share no memory between requests.
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  const server = buildServer(userId, new URL(req.url).origin);
  await server.connect(transport);

  try {
    return await transport.handleRequest(req);
  } finally {
    after(() => {
      server.close().catch(() => {});
    });
  }
}

// Stateless mode has no server-initiated stream to resume or session to end.
export async function GET(): Promise<Response> {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: { allow: "POST, OPTIONS", ...CORS },
  });
}

export const DELETE = GET;

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS });
}
