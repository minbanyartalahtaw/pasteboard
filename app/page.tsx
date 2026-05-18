import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-zinc-900">
      <header className="sticky top-0 z-10 border-b border-zinc-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <Image
            src="/logo.png"
            alt="Pasteboard"
            width={130}
            height={40}
            loading="eager"
          />
          <nav className="hidden items-center gap-8 text-sm text-zinc-600 md:flex">
            <a className="transition-colors hover:text-zinc-900" href="#features">
              Features
            </a>
            <a className="transition-colors hover:text-zinc-900" href="#workflow">
              Workflow
            </a>
            <a className="transition-colors hover:text-zinc-900" href="#faq">
              FAQ
            </a>
          </nav>
          <Link href="/login">
            <Button>Get started</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6">
        <section className="py-24 md:py-32">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Paste · Slide · Share
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            Turn <K>HTML</K> into <K>slides</K> in seconds.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-600 md:text-lg">
            Paste a page. Keep your <K>CSS</K>. Publish a <K>shareable</K> deck
            — no rebuilding required.
          </p>
          <div className="mt-10 flex items-center gap-5">
            <Link href="/login">
              <Button size="lg">Start pasting</Button>
            </Link>
            <a
              href="#workflow"
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
            >
              See how it works →
            </a>
          </div>
        </section>

        <section id="features" className="border-t border-zinc-100 py-20">
          <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
            What it does
          </h2>
          <div className="mt-10 grid gap-x-12 gap-y-10 md:grid-cols-3">
            {[
              {
                k: "Import",
                title: "HTML + CSS parsing",
                detail:
                  "Bring in full pages or components with styles intact.",
              },
              {
                k: "Map",
                title: "Auto slide split",
                detail:
                  "Sections are detected for you, then fine-tune the boundaries.",
              },
              {
                k: "Publish",
                title: "Share-ready decks",
                detail:
                  "One public link your team or audience can open instantly.",
              },
            ].map((f) => (
              <div key={f.title}>
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  {f.k}
                </span>
                <div className="mt-2 text-base font-medium text-zinc-900">
                  {f.title}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  {f.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="workflow" className="border-t border-zinc-100 py-20">
          <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
            How it works
          </h2>
          <ol className="mt-10 grid gap-10 sm:grid-cols-2 md:grid-cols-4">
            {[
              { n: "01", k: "Paste", t: "Drop raw HTML or paste an entire page." },
              { n: "02", k: "Map", t: "Sections become slides automatically." },
              { n: "03", k: "Refine", t: "Reorder, duplicate, or edit inline." },
              { n: "04", k: "Share", t: "Publish to a single, public link." },
            ].map((s) => (
              <li key={s.n} className="flex flex-col">
                <span className="text-xs font-medium tabular-nums text-zinc-400">
                  {s.n}
                </span>
                <span className="mt-3 text-base font-semibold text-primary">
                  {s.k}
                </span>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  {s.t}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section id="faq" className="border-t border-zinc-100 py-20">
          <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
            FAQ
          </h2>
          <div className="mt-10 grid gap-x-12 gap-y-10 md:grid-cols-2">
            {[
              {
                q: "What HTML can I paste?",
                a: "Full pages, components, or raw markup. Pasteboard preserves your layout and CSS.",
              },
              {
                q: "Do you support custom CSS?",
                a: "Yes — inline styles and external stylesheets both render accurately.",
              },
              {
                q: "How are slides created?",
                a: "Sections are auto-detected; refine the boundaries before publishing.",
              },
              {
                q: "Can I share decks?",
                a: "Every deck gets a public link your audience can open instantly.",
              },
            ].map((item) => (
              <div key={item.q}>
                <div className="text-base font-medium text-zinc-900">
                  {item.q}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-100">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-4 px-6 py-8 text-xs text-zinc-500 md:flex-row">
          <span>© 2026 Pasteboard</span>
          <div className="flex items-center gap-6">
            <a className="transition-colors hover:text-zinc-900" href="#">
              Privacy
            </a>
            <a className="transition-colors hover:text-zinc-900" href="#">
              Terms
            </a>
            <a className="transition-colors hover:text-zinc-900" href="#">
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function K({ children }: { children: React.ReactNode }) {
  return <span className="text-primary">{children}</span>;
}
