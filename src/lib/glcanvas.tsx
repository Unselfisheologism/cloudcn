import * as React from "react";

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

/** Shared WebGL plumbing: context, fullscreen triangle, resize, pause offscreen, reduced motion, drag. */
export function GLCanvas({ frag, uniforms, speed, quality, time, interactive, onFrame, redrawKey, behind, style, children, ...rest }: GLCanvasProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const live = React.useRef({ speed, quality, time, onFrame });
  live.current = { speed, quality, time, onFrame };
  const drag = React.useRef({ x: 0, y: 0, down: false, dyaw: 0, dpitch: 0 });
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    const canvas = canvasRef.current!;
    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) { setFailed(true); return; }
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
    } catch (e) { console.error(e); setFailed(true); return; }
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U: Record<string, WebGLUniformLocation | null> = {};
    for (const n of uniforms) U[n] = gl.getUniformLocation(prog, n);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = true, raf = 0, clock = 0, last = performance.now();
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
    io.observe(canvas);
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const p = live.current;
      const fixed = p.time !== undefined;
      if (!visible && !fixed) return;
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
      if (fixed || reduce) { cancelAnimationFrame(raf); raf = 0; canvas.dataset.ready = "1"; }
    };
    raf = requestAnimationFrame(frame);
    (canvas as any).__redraw = () => { if (!raf) raf = requestAnimationFrame(frame); };
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, [frag]);

  React.useEffect(() => { (canvasRef.current as any)?.__redraw?.(); }, [redrawKey, time, quality]);

  const onDown = (e: React.PointerEvent) => {
    if (!interactive) return;
    drag.current.down = true; drag.current.x = e.clientX; drag.current.y = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current; if (!d.down) return;
    d.dyaw -= (e.clientX - d.x) * 0.008; d.dpitch += (e.clientY - d.y) * 0.006;
    d.x = e.clientX; d.y = e.clientY;
    (canvasRef.current as any)?.__redraw?.();
  };
  const onUp = () => { drag.current.down = false; };

  return (
    <div {...rest} style={{ position: "relative", isolation: "isolate", cursor: interactive ? "grab" : undefined, touchAction: interactive ? "pan-y" : undefined, ...style }}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
      {failed ? <div aria-hidden style={{ position: "absolute", inset: "20% 10%", borderRadius: "50%", background: "rgba(255,255,255,.75)", filter: "blur(30px)" }} /> :
        <canvas ref={canvasRef} aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: behind ? -1 : 0, pointerEvents: "none" }} />}
      {children}
    </div>
  );
                 }
