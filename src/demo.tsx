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

const q = new URLSearchParams(location.search);
const t = q.has("t") ? Number(q.get("t")) : undefined;
const qual = q.has("q") ? Number(q.get("q")) : 0.7;

type Theme = "dark" | "light";

function Card({ name, line, code, theme, children }: { name: string; line: string; code: string; theme: Theme; children: React.ReactNode }) {
  const dark = theme === "dark";
  return (
    <article className={"overflow-hidden rounded-2xl border " + (dark ? "border-white/10 bg-[#0b1020]" : "border-slate-200 bg-slate-50")}>
      <div className="h-[300px]">{children}</div>
      <div className={"border-t p-5 " + (dark ? "border-white/10 text-slate-300" : "border-slate-200 text-slate-600")}>
        <h2 className={"text-lg font-semibold " + (dark ? "text-white" : "text-slate-900")}>{name}</h2>
        <p className="mt-1 text-sm">{line}</p>
        <code className={"mt-3 block overflow-x-auto rounded-md px-3 py-2 text-xs " + (dark ? "bg-white/5" : "bg-slate-200/70")}>{code}</code>
      </div>
    </article>
  );
}

function Demo() {
  const [theme, setTheme] = React.useState<Theme>((q.get("bg") as Theme) || "dark");
  const dark = theme === "dark";
  const tone = dark ? "white" : "slate";
  const P = { time: t, quality: qual, style: { height: "100%" } } as const;
  return (
    <div className={"min-h-screen " + (dark ? "bg-[#05070f] text-white" : "bg-white text-slate-900")}>
      <header className="mx-auto max-w-6xl px-6 pt-14 pb-8">
        <p className={"text-sm font-medium " + (dark ? "text-slate-400" : "text-slate-500")}>cloudcn</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">Real clouds for your UI.</h1>
        <p className={"mt-4 max-w-xl " + (dark ? "text-slate-300" : "text-slate-600")}>
          Copy-paste React and Tailwind components. Four are raymarched 3D volumes on a transparent background. Drag them to turn them.
        </p>
        <div className="mt-6 inline-flex rounded-lg border border-current/20 p-1 text-sm">
          {(["dark", "light"] as Theme[]).map((x) => (
            <button key={x} onClick={() => setTheme(x)} className={"rounded-md px-4 py-1.5 capitalize " + (theme === x ? (dark ? "bg-white text-slate-900" : "bg-slate-900 text-white") : "opacity-70")}>{x}</button>
          ))}
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl gap-6 px-6 pb-20 md:grid-cols-2">
        <Card theme={theme} name="Nimbus" line="A fair-weather 3D cloud. Drag to orbit." code="<Nimbus coverage={0.6} />"><Nimbus {...P} /></Card>
        <Card theme={theme} name="Dusk" line="The same volume lit by a low sun. Warm edges, violet shadows." code="<Dusk sunElevation={7} />"><Dusk {...P} /></Card>
        <Card theme={theme} name="Tempest" line="A storm tower with an anvil top. Lightning flashes inside it." code="<Tempest lightning={0.6} />"><Tempest {...P} /></Card>
        <Card theme={theme} name="Horizon" line="A wide cloud bank. Use it as a hero base or a divider." code="<Horizon coverage={0.6} />"><Horizon {...P} /></Card>
        <Card theme={theme} name="Wisp" line="Thin high streaks. Sits behind text." code={`<Wisp tone="${tone}" />`}><Wisp tone={tone} {...P} /></Card>
        <Card theme={theme} name="Haze" line="Low fog that thickens toward the bottom edge." code={`<Haze tone="${tone}" />`}><Haze tone={tone} {...P} /></Card>
        <div className="md:col-span-2">
          <Card theme={theme} name="Stratus" line="A full cloud sky, kept as an extra." code="<Stratus coverage={0.55} />"><Stratus time={t} quality={0.55} style={{ height: "100%" }} /></Card>
        </div>
      </main>
      <footer className={"mx-auto max-w-6xl px-6 pb-12 text-sm " + (dark ? "text-slate-500" : "text-slate-500")}>
        WebGL. Each cloud pauses off screen and respects reduced motion.
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Demo />);
