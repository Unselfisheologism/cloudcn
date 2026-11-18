import "./index.css";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { Nimbus } from "@/components/ui/nimbus";
import { Dusk } from "@/components/ui/dusk";
import { Tempest } from "@/components/ui/tempest";
import { Horizon } from "@/components/ui/horizon";
import { Wisp } from "@/components/ui/wisp";
import { Haze } from "@/components/ui/haze";
import { Stratus } from "@/components/ui/stratus";

const REPO = "https://github.com/Unselfisheologism/cloudcn";
const INSTALL = 'npx shadcn@latest add "https://cloudcn.pages.dev/r/nimbus.json"';

const q = new URLSearchParams(location.search);
const t = q.has("t") ? Number(q.get("t")) : undefined;

/* ---------- icons ---------- */
const Arrow = () => (
  <svg className="arrowIcon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
    <path d="M2 8h11M9 4l4 4-4 4" />
  </svg>
);
const GithubIcon = () => (
  <svg className="githubIcon" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.42 7.42 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
  </svg>
);
const CloudMark = () => (
  <svg className="brandMark" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M7 18a4.5 4.5 0 0 1-.9-8.9A6 6 0 0 1 17.6 10 4.25 4.25 0 0 1 17.5 18H7Z" />
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
    <path d="M2 6.5 5 9.5 10 2.5" />
  </svg>
);

/* ---------- copy button ---------- */
function useCopy(): [boolean, (text: string) => void] {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<number>(0);
  const copy = React.useCallback((text: string) => {
    const done = () => {
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1600);
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done, done);
    else {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch { /* noop */ }
      ta.remove();
      done();
    }
  }, []);
  return [copied, copy];
}

function CopyPrompt({ label }: { label: string }) {
  const [copied, copy] = useCopy();
  return (
    <button type="button" className="promptBtn" aria-label={label} {...(copied ? { "data-copied": "" } : {})} onClick={() => copy(INSTALL)}>
      <span className="promptLabel">
        <span>{label}</span>
        <span className="promptDone" aria-hidden={!copied}>Copied to clipboard</span>
      </span>
    </button>
  );
}

function CopyCommand() {
  const [copied, copy] = useCopy();
  return (
    <button type="button" className="command" aria-label={`Copy: ${INSTALL}`} onClick={() => copy(INSTALL)}>
      <span>{INSTALL}</span>
      <span className="commandHint" aria-live="polite">{copied ? "copied" : "copy"}</span>
    </button>
  );
}

/* ---------- cloud cards ---------- */
type CloudDef = { id: string; name: string; line: string; render: () => React.ReactNode };
const CARD_H = { height: "100%" } as const;
const CLOUDS: CloudDef[] = [
  { id: "nimbus", name: "Nimbus", line: "One fair-weather cumulus. Drag to orbit.", render: () => <Nimbus coverage={0.6} quality={0.5} interactive={false} autoRotate={0.05} time={t} style={CARD_H} /> },
  { id: "dusk", name: "Dusk", line: "The same volume lit by a low sun. Warm edges, violet shadows.", render: () => <Dusk quality={0.5} interactive={false} autoRotate={0.05} time={t} style={CARD_H} /> },
  { id: "tempest", name: "Tempest", line: "A storm tower with an anvil top. Lightning flashes inside.", render: () => <Tempest lightning={0.6} quality={0.5} interactive={false} time={t} style={CARD_H} /> },
  { id: "horizon", name: "Horizon", line: "A wide cloud bank. Use it as a hero base or a divider.", render: () => <Horizon coverage={0.6} quality={0.5} time={t} style={CARD_H} /> },
  { id: "wisp", name: "Wisp", line: "Thin high streaks. Sits behind text.", render: () => <Wisp tone="white" coverage={0.6} quality={0.5} time={t} style={CARD_H} /> },
  { id: "haze", name: "Haze", line: "Low fog that thickens toward the bottom edge.", render: () => <Haze tone="white" coverage={0.55} quality={0.5} time={t} style={CARD_H} /> },
  { id: "stratus", name: "Stratus", line: "A full cloud sky, kept as an extra.", render: () => <Stratus coverage={0.55} sky={false} quality={0.5} time={t} style={CARD_H} /> },
];

function Carousel() {
  const railRef = React.useRef<HTMLDivElement>(null);
  const [active, setActive] = React.useState(0);
  const [motion] = React.useState(() => !q.has("t") && !window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const update = React.useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const mid = rail.scrollLeft + rail.clientWidth / 2;
    let best = 0;
    let bestD = Infinity;
    const cards = rail.querySelectorAll<HTMLElement>(".card");
    cards.forEach((c, i) => {
      const center = c.offsetLeft + c.offsetWidth / 2;
      const d = Math.min(1, Math.abs(center - mid) / (rail.clientWidth * 0.6));
      c.style.setProperty("--d", d.toFixed(3));
      if (Math.abs(center - mid) < bestD) { bestD = Math.abs(center - mid); best = i; }
    });
    setActive(best);
  }, []);

  React.useEffect(() => {
    update();
    const rail = railRef.current;
    if (!rail) return;
    let raf = 0;
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
    rail.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { rail.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
  }, [update]);

  const scrollTo = (i: number) => {
    const rail = railRef.current;
    const card = rail?.querySelectorAll<HTMLElement>(".card")[i];
    if (!rail || !card) return;
    rail.scrollTo({ left: card.offsetLeft + card.offsetWidth / 2 - rail.clientWidth / 2, behavior: motion ? "smooth" : "auto" });
  };

  return (
    <>
      <div className="carousel" ref={railRef} tabIndex={0} role="region" aria-roledescription="carousel" aria-label="Cloud components">
        {CLOUDS.map((c, i) => (
          <article key={c.id} className={"card" + (i === active ? " cardActive" : "")} aria-roledescription="slide" aria-label={`${i + 1} of ${CLOUDS.length}: ${c.name}`}>
            <div className="cardArt">{c.render()}</div>
            <div className="cardText">
              <p className="cardName">{c.name}</p>
              <p className="cardLine">{c.line}</p>
              <a className="cardLink" href={`${REPO}/blob/main/src/components/ui/${c.id}.tsx`} target="_blank" rel="noopener noreferrer">
                View source <Arrow />
              </a>
            </div>
            <button type="button" className="cardSelect" aria-label={`Show ${c.name}`} tabIndex={-1} onClick={() => scrollTo(i)} />
          </article>
        ))}
      </div>
      <div className="dots">
        <span className="dotIndicator" style={{ transform: `translateX(${active * 22}px)` }} />
        {CLOUDS.map((c, i) => (
          <button key={c.id} type="button" className="dot" aria-label={`Go to ${c.name}`} onClick={() => scrollTo(i)} />
        ))}
      </div>
    </>
  );
}

/* ---------- pixel wordmark ---------- */
const GLYPHS: Record<string, string[]> = {
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  N: ["10001", "11001", "11001", "10101", "10011", "10011", "10001"],
};
const Wordmark = ({ text }: { text: string }) => (
  <div className="wordmark" aria-hidden>
    {text.split("").map((ch, i) => (
      <div className="glyph" key={i}>
        {(GLYPHS[ch] || GLYPHS.C).join("").split("").map((p, j) => (
          <span key={j} className={p === "1" ? "on" : ""} />
        ))}
      </div>
    ))}
  </div>
);

/* ---------- page ---------- */
function Demo() {
  return (
    <div className="page">
      <a className="skipLink" href="#content">Skip to content</a>
      <header className="navBar">
        <nav className="nav" aria-label="Primary">
          <a className="brand" href="/">
            <CloudMark />
            <span>cloudcn</span>
          </a>
          <div className="navLinks">
            <a href="#components">Components</a>
            <a href="#install">Install</a>
            <a href={`${REPO}/tree/main/registry`} target="_blank" rel="noopener noreferrer">Registry</a>
          </div>
          <a className="navGithub" href={REPO} target="_blank" rel="noopener noreferrer">
            <GithubIcon />
            GitHub
          </a>
        </nav>
      </header>

      <main id="content" className="frame">
        {/* hero */}
        <section className="hero" aria-label="Real clouds for your UI">
          <div className="heroSky" aria-hidden>
            <Wisp tone="white" coverage={0.5} quality={0.45} time={t} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
            <Horizon coverage={0.55} quality={0.45} time={t} style={{ position: "absolute", left: 0, right: 0, bottom: -30, height: 240, width: "100%" }} />
          </div>
          <span className="introWrap">
            <a className="intro" href={REPO} target="_blank" rel="noopener noreferrer">
              <span className="introDot" />
              Seven WebGL cloud components
              <Arrow />
            </a>
            <div className="brackets" aria-hidden><i /><i /><i /><i /></div>
          </span>
          <h1 className="display">Real clouds for your UI.</h1>
          <p className="heroLede">Copy-paste React and Tailwind components. Four are raymarched 3D volumes on a transparent background. Drag them to turn them.</p>
          <div className="heroActions">
            <a className="primary" href={REPO} target="_blank" rel="noopener noreferrer">
              Get the components <Arrow />
            </a>
            <CopyPrompt label="Copy install command" />
          </div>
        </section>

        {/* steps */}
        <section className="steps crosses" id="install" aria-label="Get started">
          <div className="step">
            <p className="eyebrow">Install</p>
            <code className="chip"><span className="kw">npx</span> shadcn@latest <span className="fn">add</span> <span className="str">"cloudcn.pages.dev/r/nimbus.json"</span></code>
            <p className="note">One command, every dependency included</p>
          </div>
          <div className="step">
            <p className="eyebrow">Or copy</p>
            <code className="chip"><span className="kw">src</span><span className="punct">/</span>components<span className="punct">/</span>ui<span className="punct">/</span><span className="fn">nimbus.tsx</span></code>
            <p className="note">Plus glcanvas, volume and utils from src/lib</p>
          </div>
          <div className="step">
            <p className="eyebrow">Use</p>
            <code className="chip"><span className="punct">&lt;</span><span className="kw">Nimbus</span> <span className="fn">coverage</span><span className="punct">={"{"}</span><span className="str">0.6</span><span className="punct">{"}"}</span> <span className="punct">/&gt;</span></code>
            <p className="note">Floats over any UI. Drag it to turn it</p>
          </div>
        </section>

        <div className="hatch" aria-hidden />

        {/* carousel */}
        <section className="cell crosses" id="components" aria-labelledby="components-title">
          <div className="head">
            <h2 id="components-title" className="title">Seven skies, one API.</h2>
            <p className="lede">Fair-weather cumulus, a sunset, a storm tower, a cloud bank, thin streaks, low fog and a full sky. The props stay the same. <a href={`${REPO}/tree/main/src/components/ui`} target="_blank" rel="noopener noreferrer">Read the source</a>.</p>
          </div>
          <Carousel />
        </section>

        {/* swap */}
        <section className="cell crosses" aria-labelledby="swap-title">
          <div className="swap">
            <div className="head">
              <h2 id="swap-title" className="title">One canvas, every cloud.</h2>
              <p className="lede">Every volume shares the same raymarched core and the same props. Swapping skies is an import change, not a rewrite.</p>
            </div>
            <div className="swapBody">
              <div className="swapPanel">
                <div className="swapRow">
                  <code className="chip"><span className="punct">&lt;</span><span className="kw">Nimbus</span> <span className="fn">coverage</span><span className="punct">={"{"}</span><span className="str">0.6</span><span className="punct">{"}"}</span> <span className="punct">/&gt;</span></code>
                </div>
                <p className="swapArrow" aria-hidden>↕ same canvas, same props</p>
                <div className="swapRow">
                  <code className="chip"><span className="punct">&lt;</span><span className="kw">Tempest</span> <span className="fn">lightning</span><span className="punct">={"{"}</span><span className="str">0.6</span><span className="punct">{"}"}</span> <span className="punct">/&gt;</span></code>
                </div>
                <div className="propChips">
                  {["coverage", "density", "speed", "sunElevation", "sunAzimuth", "quality", "steps", "seed", "time"].map((p) => (
                    <span className="propChip" key={p}>{p}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* trio */}
        <section className="trio crosses" aria-label="How it works">
          <div className="feature">
            <div className="featureHead">
              <h3>Raymarched light</h3>
              <p>3D fBm density marched in a fragment shader. Beer-Lambert absorption, powder darkening, silver linings toward the sun.</p>
            </div>
            <div className="stage">
              <Tempest lightning={0.6} quality={0.5} interactive={false} time={t} style={{ position: "absolute", inset: 0, height: "100%" }} />
              <span className="stageTag" style={{ left: "50%", top: "10%" }}>lightning 0.6</span>
              <span className="stageTag stageTagOk" style={{ left: "50%", top: "94%" }}>64 steps · transparent</span>
            </div>
          </div>
          <div className="feature">
            <div className="featureHead">
              <h3>Floats over any UI</h3>
              <p>Transparent background with soft alpha edges. Drop a cloud behind text, over cards, under a navbar.</p>
            </div>
            <div className="stage">
              <Wisp tone="white" coverage={0.65} quality={0.5} time={t} style={{ position: "absolute", inset: 0, height: "100%" }} />
              <div className="stageText">sits behind text</div>
              <span className="stageTag" style={{ left: "50%", top: "92%" }}>tone white · slate</span>
            </div>
          </div>
          <div className="feature">
            <div className="featureHead">
              <h3>Gentle on the GPU</h3>
              <p>Every canvas pauses off screen, respects prefers-reduced-motion, and falls back to a gradient without WebGL.</p>
            </div>
            <div className="stage">
              <Haze tone="white" coverage={0.6} quality={0.5} time={t} style={{ position: "absolute", inset: 0, height: "100%" }} />
              <span className="stageTag stageTagOk" style={{ left: "50%", top: "90%" }}>quality 0.25 – 1</span>
            </div>
          </div>
        </section>

        {/* split */}
        <section className="split crosses" aria-labelledby="ship-title">
          <div className="splitText">
            <h2 id="ship-title" className="title">Copy, paste, ship.</h2>
            <p className="lede">No package to install and no version drift. The code lands in your repo and it is yours.</p>
            <ul className="checks">
              <li><span className="check"><CheckIcon /></span>React and Tailwind v4, nothing else</li>
              <li><span className="check"><CheckIcon /></span>TypeScript, MIT licensed</li>
              <li><span className="check"><CheckIcon /></span>Honest limits in the README, not the marketing</li>
            </ul>
          </div>
          <div className="term">
            <div className="termPanel">
              <pre className="termCode"><code>
                <span><span className="kw">$</span> npx shadcn@latest add <span className="str">"cloudcn.pages.dev/r/nimbus.json"</span></span>
                <span className="termOk">✓ added src/components/ui/nimbus.tsx</span>
                <span className="termOk">✓ added src/lib/volume.tsx</span>
                <span className="termOk">✓ added src/lib/glcanvas.tsx</span>
              </code></pre>
            </div>
          </div>
        </section>

        <div className="hatch" aria-hidden />

        {/* closing */}
        <section className="closing" aria-labelledby="closing-title">
          <div className="closingCanvas" aria-hidden>
            <Stratus coverage={0.4} sky={false} quality={0.5} time={t} style={{ width: "100%", height: "100%" }} />
          </div>
          <div className="closingText">
            <h2 id="closing-title" className="title">Start in one copy.</h2>
            <CopyCommand />
            <div className="heroActions">
              <a className="primary" href={REPO} target="_blank" rel="noopener noreferrer">
                Get the components <Arrow />
              </a>
              <CopyPrompt label="Copy install command" />
            </div>
          </div>
        </section>

        {/* footer */}
        <footer className="footer">
          <div className="footerTop">
            <div className="footerBrand">
              <a className="brand" href="/"><CloudMark /><span>cloudcn</span></a>
              <p>Copy-paste WebGL cloud components for React and Tailwind, in the style of shadcn/ui. MIT licensed.</p>
            </div>
            <div className="footerCol">
              <p className="eyebrow">Components</p>
              {CLOUDS.map((c) => (
                <a key={c.id} href={`${REPO}/blob/main/src/components/ui/${c.id}.tsx`} target="_blank" rel="noopener noreferrer">{c.name}</a>
              ))}
            </div>
            <div className="footerCol">
              <p className="eyebrow">Project</p>
              <a href={REPO} target="_blank" rel="noopener noreferrer">GitHub</a>
              <a href={`${REPO}/issues`} target="_blank" rel="noopener noreferrer">Issues</a>
              <a href={`${REPO}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer">MIT License</a>
              <a href="/llms.txt">llms.txt</a>
            </div>
          </div>
          <div className="footerRow">
            <a href={REPO} target="_blank" rel="noopener noreferrer">GitHub <Arrow /></a>
            <a href={`${REPO}/tree/main/registry`} target="_blank" rel="noopener noreferrer">Registry <Arrow /></a>
            <a href="/llms.txt">llms.txt <Arrow /></a>
          </div>
          <Wordmark text="CLOUDCN" />
          <div className="footerBase">
            <span>© 2026 Unselfisheologism</span>
            <span>MIT License</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Demo />);
