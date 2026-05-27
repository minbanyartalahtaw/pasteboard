"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { IconCopy, IconCopyCheck } from "@tabler/icons-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

const SAMPLE_CODE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <title>Pasteboard</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', system-ui, sans-serif;
      background: #09090b;
      color: #fafafa;
      width: 1280px;
      height: 720px;
      overflow: hidden;
      position: relative;
    }

    .glow {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 70% 60% at 65% 50%, rgba(99,102,241,.14) 0%, transparent 70%),
        radial-gradient(ellipse 35% 45% at 85% 15%, rgba(192,132,252,.09) 0%, transparent 60%);
      animation: breathe 7s ease-in-out infinite alternate;
    }
    @keyframes breathe { from { opacity:.7 } to { opacity:1 } }

    .grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
      background-size: 64px 64px;
    }

    .layout {
      position: relative;
      z-index: 1;
      display: flex;
      height: 100%;
      padding: 64px 80px;
      gap: 72px;
      align-items: center;
    }

    /* ── Left ── */
    .left { flex: 1; display: flex; flex-direction: column; }

    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: .18em;
      text-transform: uppercase;
      color: #a78bfa;
      margin-bottom: 22px;
      opacity: 0;
      animation: up .5s .1s ease forwards;
    }
    .pulse {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #a78bfa;
      animation: blink 2s infinite;
    }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.25} }

    h1 {
      font-size: 66px;
      font-weight: 800;
      line-height: 1.0;
      letter-spacing: -.04em;
      margin-bottom: 18px;
      opacity: 0;
      animation: up .55s .25s ease forwards;
    }
    .grad {
      background: linear-gradient(130deg, #818cf8 0%, #c084fc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .sub {
      font-size: 15.5px;
      line-height: 1.65;
      color: #a1a1aa;
      max-width: 400px;
      margin-bottom: 32px;
      opacity: 0;
      animation: up .55s .4s ease forwards;
    }

    .items { display: flex; flex-direction: column; gap: 11px; }
    .item {
      display: flex; align-items: center; gap: 10px;
      font-size: 13px; color: #d4d4d8;
      opacity: 0;
    }
    .item:nth-child(1) { animation: up .45s .55s ease forwards; }
    .item:nth-child(2) { animation: up .45s .7s  ease forwards; }
    .item:nth-child(3) { animation: up .45s .85s ease forwards; }

    .check {
      width: 18px; height: 18px; flex-shrink: 0;
      border-radius: 50%;
      border: 1px solid rgba(129,140,248,.35);
      background: rgba(129,140,248,.1);
      display: flex; align-items: center; justify-content: center;
      font-size: 9px; color: #818cf8;
    }

    /* ── Right ── */
    .right {
      width: 430px; flex-shrink: 0;
      display: flex; flex-direction: column; gap: 14px;
      opacity: 0;
      animation: right .7s .35s ease forwards;
    }

    .window {
      background: #111113;
      border: 1px solid rgba(255,255,255,.07);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 40px 100px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.04);
    }
    .bar {
      display: flex; align-items: center; gap: 6px;
      padding: 11px 15px;
      background: #18181b;
      border-bottom: 1px solid rgba(255,255,255,.05);
    }
    .d { width:10px; height:10px; border-radius:50%; opacity:.7; }
    .dr { background:#ef4444; }
    .dy { background:#f59e0b; }
    .dg { background:#22c55e; }
    .fname { margin-left:auto; font-size:11px; color:#3f3f46; font-family:monospace; }

    .code {
      padding: 18px 20px;
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 12.5px;
      line-height: 1.9;
    }
    .ln { color:#3f3f46; display:inline-block; width:18px; margin-right:12px; text-align:right; }
    .kw  { color:#c084fc; }
    .tg  { color:#60a5fa; }
    .at  { color:#86efac; }
    .st  { color:#fde68a; }
    .tx  { color:#e4e4e7; }
    .cm  { color:#3f3f46; font-style:italic; }
    .cur {
      display:inline-block; width:2px; height:13px;
      background:#818cf8; vertical-align:middle; margin-left:1px;
      animation: blink 1s step-end infinite;
    }

    .published {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 14px;
      background: rgba(129,140,248,.05);
      border: 1px solid rgba(129,140,248,.13);
      border-radius: 8px;
      opacity: 0;
      animation: up .5s .9s ease forwards;
    }
    .pub-url { font-size:11px; color:#52525b; font-family:monospace; }
    .pub-badge {
      font-size:11px; font-weight:600; color:#818cf8;
      background:rgba(129,140,248,.12);
      padding:2px 9px; border-radius:4px;
    }

    @keyframes up    { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
    @keyframes right { from{opacity:0;transform:translateX(22px)} to{opacity:1;transform:translateX(0)} }
  </style>
</head>
<body>
  <div class="glow"></div>
  <div class="grid"></div>
  <div class="layout">

    <div class="left">
      <div class="eyebrow"><span class="pulse"></span>Paste · Slide · Share</div>
      <h1>Turn <span class="grad">HTML</span><br>into slides.</h1>
      <p class="sub">Paste any page. Keep your CSS. Publish a shareable deck in seconds — no rebuilding, no tools.</p>
      <div class="items">
        <div class="item"><span class="check">✓</span>Paste raw HTML with styles intact</div>
        <div class="item"><span class="check">✓</span>Share a public link instantly</div>
        <div class="item"><span class="check">✓</span>Generate slides with AI prompts</div>
      </div>
    </div>

    <div class="right">
      <div class="window">
        <div class="bar">
          <span class="d dr"></span><span class="d dy"></span><span class="d dg"></span>
          <span class="fname">slide.html</span>
        </div>
        <div class="code">
          <div><span class="ln">1</span><span class="kw">&lt;!</span><span class="tg">DOCTYPE</span> <span class="at">html</span><span class="kw">&gt;</span></div>
          <div><span class="ln">2</span><span class="kw">&lt;</span><span class="tg">html</span><span class="kw">&gt;</span></div>
          <div><span class="ln">3</span><span class="kw">&lt;</span><span class="tg">style</span><span class="kw">&gt;</span></div>
          <div><span class="ln">4</span><span class="cm">&nbsp;&nbsp;/* your styles */</span></div>
          <div><span class="ln">5</span><span class="kw">&lt;/</span><span class="tg">style</span><span class="kw">&gt;</span></div>
          <div><span class="ln">6</span></div>
          <div><span class="ln">7</span><span class="kw">&lt;</span><span class="tg">body</span><span class="kw">&gt;</span></div>
          <div><span class="ln">8</span>&nbsp;&nbsp;<span class="kw">&lt;</span><span class="tg">h1</span><span class="kw">&gt;</span><span class="tx">Hello, world</span><span class="kw">&lt;/</span><span class="tg">h1</span><span class="kw">&gt;</span></div>
          <div><span class="ln">9</span><span class="kw">&lt;/</span><span class="tg">body</span><span class="kw">&gt;</span></div>
          <div><span class="ln">10</span><span class="kw">&lt;/</span><span class="tg">html</span><span class="kw">&gt;</span><span class="cur"></span></div>
        </div>
      </div>
      <div class="published">
        <span class="pub-url">pasteboard.design/p/demo</span>
        <span class="pub-badge">Published ↗</span>
      </div>
    </div>

  </div>
</body>
</html>`

const PROMPT = `You are generating a single-page HTML slide for Pasteboard — a tool that turns HTML into shareable presentation slides.

Rules:
- Output ONE complete HTML file, nothing else.
- Inline all CSS inside a <style> tag. No external CSS files.
- Use system fonts or a single Google Fonts <link>. No other external dependencies.
- No JavaScript unless it genuinely improves the slide.
- The slide should look great at 1280×720 (16:9). Center the main content.
- One clear idea per slide. Strong visual hierarchy: big headline, supporting text, optional accent element.
- Dark or light background — your choice based on the topic.
- Modern, minimal aesthetic. Avoid clipart, shadows on everything, or busy layouts.

Topic: [describe your slide topic here]`

export default function PlaygroundPage() {
  const [code, setCode] = useState(SAMPLE_CODE)
  const [activeTab, setActiveTab] = useState("code")
  const [codeCopied, setCodeCopied] = useState(false)
  const [promptCopied, setPromptCopied] = useState(false)
  const [scale, setScale] = useState(1)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const previewWrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = previewWrapperRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setScale(Math.min(width / 1280, height / 720))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  function copyCode() {
    navigator.clipboard.writeText(code)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  function copyPrompt() {
    navigator.clipboard.writeText(PROMPT)
    setPromptCopied(true)
    setTimeout(() => setPromptCopied(false), 2000)
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      {/* Header */}
      <header className="flex-none bg-white border-b border-zinc-200">
        <div className="flex items-center justify-between px-4 py-2">
          <Link href="/">
            <Image src="/logo.png" alt="Pasteboard" width={100} height={30} priority />
          </Link>
          <Link href="/auth/login">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </header>

      {/* Body — stacked on mobile/tablet, side-by-side on desktop */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Left panel */}
        <div className="flex flex-1 flex-col lg:flex-none lg:w-[400px]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col">
            <div className="flex flex-none items-center justify-between px-3 py-2">
              <TabsList>
                <TabsTrigger value="code">Code</TabsTrigger>
                <TabsTrigger value="prompt">Prompt</TabsTrigger>
              </TabsList>
              <Button size="sm" variant="ghost" onClick={activeTab === "code" ? copyCode : copyPrompt}>
                {(activeTab === "code" ? codeCopied : promptCopied)
                  ? <IconCopyCheck size={15} />
                  : <IconCopy size={15} />}
              </Button>
            </div>

            {/* Code tab */}
            <TabsContent value="code" className="flex min-h-0 flex-1 flex-col p-3">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                className="min-h-0 flex-1 resize-none rounded border border-zinc-200 bg-zinc-50 p-2.5 font-mono text-[12px] leading-relaxed text-zinc-800 outline-none focus:border-zinc-400"
              />
            </TabsContent>

            {/* Prompt tab */}
            <TabsContent value="prompt" className="flex min-h-0 flex-1 flex-col gap-2 p-3">
              <div className="min-h-0 flex-1 overflow-y-auto rounded bg-zinc-50 p-3">
                <pre className="whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-zinc-700">
                  {PROMPT}
                </pre>
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-400">
                Replace the last line with your topic → copy → paste into ChatGPT or Claude → paste the HTML into the Code tab.
              </p>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right panel — live preview */}
        <div className="flex h-[42vh] flex-none flex-col lg:h-auto lg:flex-1">
          <div
            ref={previewWrapperRef}
            className="flex flex-1 min-h-0 items-center justify-center overflow-hidden px-2 lg:px-5"
          >
            <div
              style={{
                width: Math.round(1280 * scale),
                height: Math.round(720 * scale),
                position: "relative",
                overflow: "hidden",
                borderRadius: 8,
                boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
              }}
            >
              <div
                style={{
                  width: 1280,
                  height: 720,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  position: "absolute",
                  top: 0,
                  left: 0,
                }}
              >
                <iframe
                  ref={iframeRef}
                  srcDoc={code}
                  sandbox="allow-scripts"
                  title="Slide preview"
                  className="h-full w-full bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
