import * as React from "react";
import { cn } from "@/lib/utils";
import { CloudFallback } from "@/lib/fallback";
import { frameLooksEmpty } from "@/lib/glcanvas";

/**
 * Stratus - realistic volumetric clouds for any UI.
 * Raymarched 3D fBm density in a WebGL fragment shader, with Beer-Lambert
 * absorption, powder darkening, dual-lobe Henyey-Greenstein sun scattering
 * (silver linings), height-based ambient, aerial perspective and slow wind drift.
 */
export interface StratusProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 0..1, how much of the sky is covered. */
  coverage?: number;
  /** Optical thickness multiplier. */
  density?: number;
  /** Wind drift speed multiplier. 0 freezes motion. */
  speed?: number;
  /** Sun elevation in degrees above the horizon (3..80). */
  sunElevation?: number;
  /** Sun azimuth in degrees (-90 left .. 90 right). */
  sunAzimuth?: number;
  /** Camera pitch, how far you look up (-0.1..0.8). Lower shows more horizon. */
  pitch?: number;
  /** Paint a sky gradient and sun behind the clouds. false = transparent clouds only. */
  sky?: boolean;
  /** Render scale 0.25..1. Lower is faster. Default 0.6. */
  quality?: number;
  /** Raymarch steps, 24..96. */
  steps?: number;
  /** Seed shifts the cloud layout. */
  seed?: number;
  /** Fixed time in seconds, for deterministic stills. Disables animation. */
  time?: number;
}

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;

const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime, uCover, uDens, uPitch, uSky, uSeed, uSteps;
uniform vec3 uSun;

float hash(vec3 p){ p = fract(p*0.3183099+0.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float noise(vec3 x){
  vec3 i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fbm(vec3 p, int oct){
  float a=0.5,s=0.0;
  for(int i=0;i<6;i++){ if(i>=oct) break; s+=a*noise(p); p=p*2.03+vec3(1.7,9.2,3.1); a*=0.5; }
  return s;
}
const float Y0=1500.0, Y1=3600.0;
float dens(vec3 p, int oct){
  float h=clamp((p.y-Y0)/(Y1-Y0),0.0,1.0);
  float prof=smoothstep(0.0,0.12,h)*smoothstep(1.0,0.45,h);
  vec3 q=p*0.0009+vec3(uTime*0.012,0.0,uTime*0.004)+uSeed*7.13;
  // large-scale cumulus layout, then billow-eroding detail
  float base=fbm(q*0.8,3);
  float cov=mix(0.78,0.36,uCover);
  float d=base*prof*1.5-cov;
  if(d<=0.0) return 0.0;
  float det=fbm(q*5.0+vec3(0.0,uTime*0.02,0.0),oct);
  d=d-(1.0-det)*0.34*(1.0-h*0.5);
  return clamp(d,0.0,1.0)*uDens*6.0;
}
float hg(float c,float g){ float g2=g*g; return (1.0-g2)/(4.0*3.14159*pow(1.0+g2-2.0*g*c,1.5)); }
vec3 skyCol(vec3 rd){ rd=normalize(vec3(rd.x,max(rd.y,0.0),rd.z));
  float y=max(rd.y,0.0); 
  vec3 hor=vec3(0.78,0.87,0.96), zen=vec3(0.16,0.42,0.86);
  vec3 c=mix(hor,zen,pow(y,0.45));
  float s=max(dot(rd,uSun),0.0);
  c+=vec3(1.0,0.85,0.6)*pow(s,6.0)*0.1+vec3(1.0,0.95,0.85)*pow(s,400.0)*2.0;
  return c;
}
void main(){
  vec2 uv=(gl_FragCoord.xy-0.5*uRes)/uRes.y;
  vec3 rd=normalize(vec3(uv.x*1.15,uv.y*1.15+uPitch,1.0));
  vec3 ro=vec3(0.0,0.0,0.0);
  vec3 bg=uSky>0.5?skyCol(rd):vec3(0.0);
  float T=1.0; vec3 L=vec3(0.0);
  if(rd.y>0.012){
    float t0=Y0/rd.y, t1=Y1/rd.y;
    t1=min(t1,t0+9000.0);
    float dt=(t1-t0)/uSteps;
    float jit=hash(vec3(gl_FragCoord.xy,uSeed));
    float t=t0+dt*jit;
    float cs=dot(rd,uSun);
    float phase=mix(hg(cs,0.7)*0.5,hg(cs,-0.2),0.4)*3.0+0.15;
    vec3 sunC=vec3(1.0,0.94,0.84)*3.4;
    for(int i=0;i<96;i++){
      if(float(i)>=uSteps||T<0.02) break;
      vec3 p=ro+rd*t;
      float d=dens(p,5);
      if(d>0.001){
        // light march toward the sun
        float od=0.0; float ls=260.0;
        for(int k=1;k<=5;k++){ od+=dens(p+uSun*ls*float(k)*(float(k)*0.5+0.5),3)*ls; }
        float h=clamp((p.y-Y0)/(Y1-Y0),0.0,1.0);
        float direct=exp(-od*0.0032)+0.25*exp(-od*0.0008);
        float powder=1.0-exp(-d*5.0);
        vec3 amb=mix(vec3(0.34,0.40,0.52),vec3(0.62,0.74,0.95),h)*1.1;
        vec3 col=sunC*direct*phase*mix(0.55,1.0,powder)+amb*(0.6+0.4*h);
        float a=1.0-exp(-d*dt*0.0036);
        // aerial perspective: distant cloud fades to haze
        float fog=1.0-exp(-t*0.00007);
        col=mix(col,skyCol(vec3(rd.x,0.02,rd.z))*0.95,fog*0.8);
        L+=T*a*col; T*=1.0-a;
      }
      t+=dt;
    }
    // fade the layer into the horizon
    float hz=smoothstep(0.012,0.12,rd.y);
    L*=hz; T=mix(1.0,T,hz);
  }
  vec3 outc;
  float alpha;
  if(uSky>0.5){ outc=L+bg*T; alpha=1.0; }
  else { alpha=1.0-T; outc=L; }
  // filmic-ish tonemap
  outc=1.0-exp(-outc*1.45);
  outc=pow(outc,vec3(0.92));
  gl_FragColor=vec4(outc,alpha);
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
  return s;
}

export const Stratus = React.forwardRef<HTMLDivElement, StratusProps>(function Stratus(
  { coverage = 0.55, density = 1, speed = 1, sunElevation = 38, sunAzimuth = 30, pitch = 0.62,
    sky = true, quality = 0.6, steps = 56, seed = 0, time, className, children, ...rest }, ref) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const props = React.useRef({ coverage, density, speed, sunElevation, sunAzimuth, pitch, sky, quality, steps, seed, time });
  props.current = { coverage, density, speed, sunElevation, sunAzimuth, pitch, sky, quality, steps, seed, time };
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    const canvas = canvasRef.current!;
    const gl = (canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false }) ||
      canvas.getContext("experimental-webgl", { premultipliedAlpha: true, alpha: true, antialias: false } as WebGLContextAttributes)) as WebGLRenderingContext | null;
    if (!gl) { setFailed(true); return; }
    const onLost = (e: Event) => { e.preventDefault(); setFailed(true); };
    canvas.addEventListener("webglcontextlost", onLost);
    let prog: WebGLProgram;
    try {
      prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || "link");
    } catch (e) { console.error(e); canvas.removeEventListener("webglcontextlost", onLost); setFailed(true); return; }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = (n: string) => gl.getUniformLocation(prog, n);
    const U = { res: u("uRes"), time: u("uTime"), cover: u("uCover"), dens: u("uDens"), pitch: u("uPitch"),
      sky: u("uSky"), seed: u("uSeed"), steps: u("uSteps"), sun: u("uSun") };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = true, raf = 0, clock = 0, last = performance.now(), probed = false;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
    io.observe(canvas);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const p = props.current;
      const fixed = p.time !== undefined;
      if (!visible && !fixed) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const sc = Math.max(0.2, Math.min(1, p.quality)) * dpr;
      const w = Math.max(2, Math.floor(canvas.clientWidth * sc));
      const h = Math.max(2, Math.floor(canvas.clientHeight * sc));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      if (!fixed && !reduce) clock += ((now - last) / 1000) * p.speed;
      last = now;
      const t = fixed ? p.time! : clock;
      const el = (p.sunElevation * Math.PI) / 180, az = (p.sunAzimuth * Math.PI) / 180;
      gl.uniform2f(U.res, w, h);
      gl.uniform1f(U.time, t * 60);
      gl.uniform1f(U.cover, p.coverage);
      gl.uniform1f(U.dens, p.density);
      gl.uniform1f(U.pitch, p.pitch);
      gl.uniform1f(U.sky, p.sky ? 1 : 0);
      gl.uniform1f(U.seed, p.seed);
      gl.uniform1f(U.steps, Math.max(16, Math.min(96, p.steps)));
      gl.uniform3f(U.sun, Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!probed && w >= 64 && h >= 64) {
        probed = true;
        if (frameLooksEmpty(gl, w, h)) { cancelAnimationFrame(raf); raf = 0; setFailed(true); return; }
      }
      if (fixed || reduce) { cancelAnimationFrame(raf); raf = 0; (canvas as any).dataset.ready = "1"; }
    };
    raf = requestAnimationFrame(frame);
    // static modes redraw when props change
    (canvas as any).__redraw = () => { if (!raf) raf = requestAnimationFrame(frame); };
    return () => { cancelAnimationFrame(raf); io.disconnect(); canvas.removeEventListener("webglcontextlost", onLost); };
  }, []);

  React.useEffect(() => { (canvasRef.current as any)?.__redraw?.(); }, [coverage, density, sunElevation, sunAzimuth, pitch, sky, quality, steps, seed, time]);

  return (
    <div ref={ref} className={cn("relative isolate overflow-hidden", className)} {...rest}>
      {failed ? (
        <CloudFallback style={{ zIndex: -1 }} />
      ) : (
        <canvas ref={canvasRef} aria-hidden className="absolute inset-0 -z-10 h-full w-full" />
      )}
      {children}
    </div>
  );
});
