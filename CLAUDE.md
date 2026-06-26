@AGENTS.md

# Pasteboard

HTML-slide presentation builder. Users paste raw HTML per slide; the app renders, stores, and lets them present fullscreen. Deployed on Vercel.

## Tech stack

- **Next.js 16** (App Router) — read `node_modules/next/dist/docs/` before writing Next.js code
- **React 19**
- **Tailwind CSS v4** — no `tailwind.config`; config lives in `app/globals.css`
- **shadcn/ui** (Radix-based) — components in `components/ui/`
- **Prisma 7** — client output at `lib/generated/prisma/`
- **PostgreSQL** — local dev via Docker (`docker-compose.yml`, port 9999)
- **Vercel Blob** — slide thumbnails stored as private blobs
- **Puppeteer + @sparticuz/chromium** — server-side thumbnail generation (headless Chrome)
- **jose** — JWT-based auth (cookie `token`, 30-day expiry)
- **@dnd-kit** — drag-to-reorder slides in the editor

## Project layout

```
app/
  page.tsx                   # landing page
  layout.tsx                 # root layout
  login/                     # login page + server action
  logout/                    # logout server action
  register/                  # register page + server action
  presentation/
    page.tsx                 # dashboard (list presentations)
    layout.tsx               # sidebar layout
    NewPresentationDialog.tsx
    actions.ts               # create/delete presentation actions
    [id]/
      page.tsx               # loads presentation, renders editor
      editor.tsx             # client-side editor component
      actions.ts             # savePresentation, generateSlideThumbnail
  public/[id]/               # unauthenticated viewer for shared presentations
  api/thumbnail/             # proxy route for private blob thumbnails
  playground/                # sandbox page
components/
  AppSideBar*.tsx            # sidebar navigation
  HeaderSlot.tsx             # portal target for per-page header content
  PresentOverlay.tsx         # fullscreen presentation controls
  WorkflowSwitcher.tsx
  ui/                        # shadcn components
hooks/
  use-fullscreen.ts
  use-mobile.ts
lib/
  auth.ts                    # getSession / signToken / verifyToken
  prisma.ts                  # PrismaClient singleton
  password.ts                # bcrypt helpers
  generated/prisma/          # generated Prisma client (do not edit)
prisma/
  schema.prisma              # User → Presentation → Slide
pasteboard-video/            # Remotion project for marketing videos (separate workspace)
```

## Data model

- `User` — email + bcrypt password hash
- `Presentation` — belongs to User; has `isPublic` flag
- `Slide` — belongs to Presentation; stores raw `html` (Text), `thumbnailUrl`, `order` (Int)

## Dev setup

```bash
# Start Postgres
docker compose up -d

# Install deps & generate Prisma client
npm install

# Push schema
npx prisma db push

# Run dev server
npm run dev
```

### Required env vars

```
DATABASE_URL=postgresql://mark:supersecret@localhost:9999/myapp
JWT_SECRET=<secret>
BLOB_READ_WRITE_TOKEN=<vercel blob token>
CHROME_PATH=/usr/bin/google-chrome   # local only; production uses @sparticuz/chromium
```

## Key behaviours

- **Auto-save**: editor debounces 1 s after any change, then calls `savePresentation` server action. Thumbnail generation is fire-and-forget.
- **Slides render at 1920×1080** scaled down to fit the viewport via CSS `transform: scale(...)`.
- **Thumbnails** are generated with Puppeteer (waits for animations, screenshots as WebP), stored in Vercel Blob, and proxied through `/api/thumbnail` to avoid exposing private blob URLs to the client.
- **Fullscreen presentation**: `useFullscreen` hook wraps the editor div; keyboard nav (`←` `→` `Space` `F`) works in fullscreen mode.
- **Public viewer** at `/public/[id]` — accessible without auth when `isPublic` is true.

## Patterns to follow

- Server actions use `getSession()` to gate writes — always check the session before any mutation.
- Prisma client is a singleton imported from `lib/prisma.ts`.
- Use `revalidatePath` after mutations that affect the presentation list or editor.
- Slide HTML is untrusted user content — the editor renders it inside `<iframe sandbox="allow-scripts allow-same-origin">`.
- Use `@tabler/icons-react` for icons; do not add other icon libraries.
- shadcn components are added via `npx shadcn add <component>` — do not hand-write Radix primitives.

## Commit conventions

When asked "what commit should I give" (or for a commit message):

- **Do not** lump every change into one commit. Break the working tree into focused, step-by-step commits — one concern per commit, each with its own `git add` of just that file/area.
- Prefix each message with a lowercase type tag, e.g.:
  - `feature: ...` — new behavior
  - `ui: ...` — visual / layout / styling changes
  - `chore: ...` — deps, config, renames, tooling
  - `fix: ...` — bug fixes
  - `refactor: ...` — restructuring without behavior change
- Give the exact `git add` + `git commit` commands for each step, in order, so the changes can be committed one at a time.
