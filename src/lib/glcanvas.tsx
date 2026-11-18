import * as React from "react";
import { CloudFallback } from "./fallback";

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;

export interface FrameCtx {
  gl: WebGLRenderingContext;
  U: Record<string, WebGLUniformLocation | null>;
  /** seconds of animation (scaled by speed) or the fixed time */
  t: number;
  w: number;
  h: number;
  /** accumulated drag in radians */
  dyaw: number;
  dpitch: number;
  fixed: boolean;
}

export interface GLCanvasProps extends React.HTMLAttributes<HTMLDivElement> {
  frag: string;
  uniforms: string[];
  speed: number;
  quality: number;
  /** fixed time in seconds for stills; disables animation */
  time?: number;
  interactive?: boolean;
  /** sets uniforms every frame */
  onFrame: (c: FrameCtx) => void;
  /** change to force a redraw in static mode */
  redrawKey?: unknown;
  /** z-order of the canvas: -1 puts it behind children */
  behind?: boolean;
}

/** Sparse readback check that a drawn frame actually contains visible pixels. */
export function frameLooksEmpty(gl: WebGLRenderingContext, w: number, h: number): boolean {
  try {
    if (gl.getError() !== gl.NO_ERROR) return true;
    const px = new Uint8Array(4);
    for (let iy = 0; iy < 8; iy++) {
      for (let ix = 0; ix < 8; ix++) {
        const x = Math.floor(w * (0.1 + (0.8 * (ix + 0.5)) / 8));
        const y = Math.floor(h * (0.1 + (0.8 * (iy + 0.5)) / 8));
        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        if (px[3] > 16) return false;
      }
    }
    return true;
  } catch {
    return false; // readback blocked: keep the canvas rather than false-failing
  }
}

/** Capture the just-drawn frame as an image URL, or null if the capture is blank/unsupported. */
function snapshot(canvas: HTMLCanvasElement): string | null {
  try {
    const url = canvas.toDataURL("image/webp", 0.95);
    return url.startsWith("data:image/") && url.length > 2000 ? url : null;
  } catch {
    return null;
  }
}

/** Shared WebGL plumbing: context, fullscreen triangle, resize, pause offscreen, reduced motion, drag.
 *
 *  Failure-hardened: detects context creation failure, shader link failure, involuntary context
 *  loss and blank first frames, and swaps in a static cloud instead of a blank box.
 *
 *  Context-budget aware: phones allow far fewer live WebGL contexts than desktops and silently
 *  kill the oldest ones when a page exceeds the budget. To stay under it, a context is created
 *  only when the component nears the viewport, an animated component scrolled out of view is
 *  frozen to an image and releases its context (it comes back to life when scrolled back to),
 *  and a fixed-time non-interactive still is frozen to an image right after its first good frame. */
export function GLCanvas({ frag, uniforms, speed, quality, time, interactive, onFrame, redrawKey, behind, style, children, ...rest }: GLCanvasProps) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const live = React.useRef({ speed, quality, time, onFrame });
  live.current = { speed, quality, time, onFrame };
  const drag = React.useRef({ x: 0, y: 0, down: false, dyaw: 0, dpitch: 0 });
  const [failed, setFailed] = React.useState(false);
  const [still, setStill] = React.useState<string | null>(null);
  const visibleRef = React.useRef(true);
  const reduceRef = React.useRef<boolean | null>(null);
  const redraw = React.useRef<() => void>(() => {});
  if (reduceRef.current === null && typeof window !== "undefined") {
    reduceRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  // persistent visibility tracking on the wrapper (survives canvas unmount):
  // revives a released animated component when it is scrolled back into view.
  React.useEffect(() => {
    const el = wrapRef.current!;
    const io = new IntersectionObserver(([e]) => {
      visibleRef.current = e.isIntersecting;
      if (e.isIntersecting && live.current.time === undefined && !reduceRef.current) setStill(null);
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  React.useEffect(() => {
    if (still) {
      // showing the captured frame; a redraw request re-creates the GL pass
      redraw.current = () => setStill(null);
      return;
    }
    const wrap = wrapRef.current!;
    let disposed = false;
    let cleanupGL: (() => void) | null = null;

    const init = () => {
      if (disposed) return;
      const canvas = canvasRef.current!;
      const fail = () => setFailed(true);
      const gl = (canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false }) ||
        canvas.getContext("experimental-webgl", { premultipliedAlpha: true, alpha: true, antialias: false } as WebGLContextAttributes)) as WebGLRenderingContext | null;
      if (!gl) { fail(); return; }
      const onLost = (e: Event) => { e.preventDefault(); fail(); };
      canvas.addEventListener("webglcontextlost", onLost);
      const loseExt = gl.getExtension("WEBGL_lose_context");
      const mk = (type: number, src: string) => {
        const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
        return s;
      };
      let prog: WebGLProgram;
      try {
        prog = gl.createProgram()!;
        gl.attachShader(prog, mk(gl.VERTEX_SHADER, VERT));
        gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, frag));
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || "link");
      } catch (e) { console.error(e); canvas.removeEventListener("webglcontextlost", onLost); fail(); return; }
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, "p");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const U: Record<string, WebGLUniformLocation | null> = {};
      for (const n of uniforms) U[n] = gl.getUniformLocation(prog, n);

      const reduce = !!reduceRef.current;
      let raf = 0, clock = 0, last = performance.now(), probed = false, hiddenSince = 0;
      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        const p = live.current;
        const fixed = p.time !== undefined;
        const visible = visibleRef.current;
        if (!visible && !fixed) {
          if (!hiddenSince) { hiddenSince = now; return; }
          if (now - hiddenSince < 2500) return;
          // offscreen for a while: draw one final frame below, then freeze and release
        } else hiddenSince = 0;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const sc = Math.max(0.2, Math.min(1, p.quality)) * dpr;
        const w = Math.max(2, Math.floor(canvas.clientWidth * sc));
        const h = Math.max(2, Math.floor(canvas.clientHeight * sc));
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
        gl.viewport(0, 0, w, h);
        const dt = (now - last) / 1000; last = now;
        if (!fixed && !reduce) clock += dt * p.speed;
        p.onFrame({ gl, U, t: fixed ? p.time! : clock, w, h, dyaw: drag.current.dyaw, dpitch: drag.current.dpitch, fixed });
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        if (!probed && w >= 64 && h >= 64) {
          probed = true;
          if (frameLooksEmpty(gl, w, h)) { cancelAnimationFrame(raf); fail(); return; }
        }
        if (fixed || reduce) {
          cancelAnimationFrame(raf); raf = 0; canvas.dataset.ready = "1";
          // a still never changes again: freeze it as an image and give the context back
          if (!interactive && probed) {
            const url = snapshot(canvas);
            if (url) { setStill(url); return; }
          }
        } else if (hiddenSince && now - hiddenSince >= 2500) {
          // animated but long offscreen: freeze; the wrapper observer revives it
          const url = snapshot(canvas);
          if (url) { setStill(url); return; }
          hiddenSince = 0;
        }
      };
      raf = requestAnimationFrame(frame);
      redraw.current = () => { if (!raf) raf = requestAnimationFrame(frame); };
      cleanupGL = () => {
        cancelAnimationFrame(raf);
        canvas.removeEventListener("webglcontextlost", onLost);
        try { loseExt?.loseContext(); } catch { /* already gone */ }
      };
    };

    // lazy mount: only pay for a GL context once the component nears the viewport
    const r = wrap.getBoundingClientRect();
    const nearView = r.bottom > -400 && r.top < (window.innerHeight || 800) + 400;
    if (nearView || live.current.time !== undefined) {
      init();
      return () => { disposed = true; cleanupGL?.(); };
    }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { io.disconnect(); init(); }
    }, { rootMargin: "400px" });
    io.observe(wrap);
    return () => { disposed = true; io.disconnect(); cleanupGL?.(); };
  }, [frag, still]);

  React.useEffect(() => { redraw.current(); }, [redrawKey, time, quality]);

  const onDown = (e: React.PointerEvent) => {
    if (!interactive) return;
    drag.current.down = true; drag.current.x = e.clientX; drag.current.y = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current; if (!d.down) return;
    d.dyaw -= (e.clientX - d.x) * 0.008; d.dpitch += (e.clientY - d.y) * 0.006;
    d.x = e.clientX; d.y = e.clientY;
    redraw.current();
  };
  const onUp = () => { drag.current.down = false; };

  const layerZ = behind ? -1 : 0;
  return (
    <div ref={wrapRef} {...rest} style={{ position: "relative", isolation: "isolate", cursor: interactive ? "grab" : undefined, touchAction: interactive ? "pan-y" : undefined, ...style }}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
      {failed ? <CloudFallback style={{ zIndex: layerZ }} /> :
        still ? <img aria-hidden src={still} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: layerZ, pointerEvents: "none" }} /> :
        <canvas ref={canvasRef} aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: layerZ, pointerEvents: "none" }} />}
      {children}
    </div>
  );
}
