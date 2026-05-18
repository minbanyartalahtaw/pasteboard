import Image from "next/image";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export default function Home() {
  const features = [
    {
      k: "Import",
      title: "HTML + CSS parsing",
      detail: "Bring in full pages or components with styles intact.",
      video: "/videos/feature-import.mp4",
      poster: "/videos/feature-import-poster.png",
      label: "Pasteboard parses HTML and CSS into editable slide content.",
    },
    {
      k: "Publish",
      title: "Share-ready decks",
      detail:
        "Share a public presentation link your team or audience can open instantly.",
      video: "/videos/feature-share.mp4",
      poster: "/videos/feature-share-poster.png",
      label:
        "Pasteboard publishes presentation slides at a public link like pasteboard.design/public/cmpw.",
    },
  ];

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
        <section className="py-20 md:py-28">
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
          <div className="mt-16 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 shadow-[0_24px_80px_rgba(24,24,27,0.10)]">
            <video
              aria-label="Pasteboard turns pasted HTML code into editable slides."
              autoPlay
              muted
              playsInline
              poster="/videos/landing-page-demo-poster.png"
              preload="metadata"
              className="aspect-[16/10] w-full bg-zinc-100 object-cover"
            >
              <source src="/videos/landing-page-demo.mp4" type="video/mp4" />
            </video>
          </div>
        </section>

        <section id="features" className="border-t border-zinc-100 py-20">
          <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
            What it does
          </h2>
          <div className="mt-10 space-y-14">
            {features.map((f) => (
              <article
                key={f.title}
                className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(220px,0.65fr)] lg:items-center"
              >
                <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 shadow-[0_18px_55px_rgba(24,24,27,0.08)]">
                  <video
                    aria-label={f.label}
                    autoPlay
                    muted
                    playsInline
                    poster={f.poster}
                    preload="metadata"
                    className="aspect-[16/10] w-full bg-zinc-100 object-cover"
                  >
                    <source src={f.video} type="video/mp4" />
                  </video>
                </div>
                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                    {f.title}
                  </span>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-600 md:text-base">
                    {f.detail}
                  </p>
                </div>
              </article>
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
              { n: "02", k: "Refine", t: "Reorder, duplicate, or edit inline." },
              { n: "03", k: "Share", t: "Publish to a single, public link." },
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
          <Accordion type="single" collapsible className="mt-10">
            {[
              {
                q: "What HTML can I paste?",
                a: "Full pages, components, or raw markup. Pasteboard preserves your layout and CSS.",
              },
              {
                q: "Can I share decks?",
                a: "Every deck gets a public link your audience can open instantly.",
              },
              {
                q : "I don't know coding. Is this for me?",
                a: "Ai can generate HTML for you. Just paste your content and let the AI do the design.",
              }
            ].map((item) => (
              <AccordionItem key={item.q} value={item.q}>
                <AccordionTrigger className="text-base font-medium text-zinc-900 hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-zinc-600">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
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
