import * as React from "react";
import { GLCanvas, type FrameCtx } from "@/lib/glcanvas";

/** Wisp - high thin ice-crystal streaks (cirrus), domain-warped and stretched along the wind. Transparent. */
const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime, uCover, uAngle, uSeed; uniform vec3 uTint;
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 x){ vec2 i=floor(x),f=fract(x); f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float a=0.5,s=0.0; for(int i=0;i<6;i++){ s+=a*noise(p); p=mat2(1.6,1.2,-1.2,1.6)*p; a*=0.5; } return s; }
void main(){
  vec2 uv=gl_FragCoord.xy/uRes.y;
  float ca=cos(uAngle), sa=sin(uAngle);
  vec2 p=mat2(ca,-sa,sa,ca)*(uv-0.5);
  p+=uSeed*5.0;
  // stretch along the wind, then warp to curl the streaks
  vec2 q=vec2(p.x*0.9,p.y*6.5);
  vec2 w=vec2(fbm(q+vec2(uTime*0.02,0.0)+3.1),fbm(q*1.3+vec2(0.0,uTime*0.015)+7.7));
  q+=(w-0.5)*vec2(2.6,1.4);
  float n=fbm(q*vec2(1.0,1.4)+vec2(uTime*0.03,0.0));
  float n2=fbm(q*vec2(2.5,3.0)-vec2(uTime*0.02,0.0));
  float d=smoothstep(mix(0.62,0.4,uCover),0.85,n)*(0.55+0.7*n2);
  // thin hooks: brighter filaments
  float fil=smoothstep(0.55,0.95,fbm(q*vec2(3.0,9.0)+w*2.0));
  d=clamp(d*0.9+fil*0.35*smoothstep(0.35,0.7,n),0.0,1.0);
  // fade near the frame edges so it sits on any surface
  vec2 e=gl_FragCoord.xy/uRes; d*=smoothstep(0.0,0.12,e.x)*smoothstep(1.0,0.88,e.x)*smoothstep(0.0,0.15,e.y)*smoothstep(1.0,0.85,e.y);
  vec3 col=mix(vec3(0.82,0.88,1.0),vec3(1.0),smoothstep(0.2,0.9,d))*uTint;
  gl_FragColor=vec4(col*d,d*0.92);
}`;

export interface WispProps extends React.HTMLAttributes<HTMLDivElement> {
  coverage?: number; speed?: number; /** wind direction in degrees */ angle?: number; seed?: number;
  tint?: [number, number, number]; /** "white" for dark or sky surfaces, "slate" for light surfaces */ tone?: "white" | "slate"; quality?: number; time?: number;
}
export function Wisp({ coverage = 0.6, speed = 1, angle = -12, seed = 0, tone = "white", tint = tone === "slate" ? [0.5, 0.57, 0.72] : [1, 1, 1], quality = 0.6, time, style, ...rest }: WispProps) {
  const cfg = React.useRef({ coverage, angle, seed, tint }); cfg.current = { coverage, angle, seed, tint };
  const onFrame = React.useCallback(({ gl, U, t, w, h }: FrameCtx) => {
    const c = cfg.current;
    gl.uniform2f(U.uRes, w, h); gl.uniform1f(U.uTime, t * 4); gl.uniform1f(U.uCover, c.coverage);
    gl.uniform1f(U.uAngle, (c.angle * Math.PI) / 180); gl.uniform1f(U.uSeed, c.seed); gl.uniform3fv(U.uTint, c.tint);
  }, []);
  return <GLCanvas {...rest} frag={FRAG} uniforms={["uRes","uTime","uCover","uAngle","uSeed","uTint"]} speed={speed} quality={quality} time={time}
    onFrame={onFrame} redrawKey={[coverage, angle, seed, tint]} style={{ display: "block", width: "100%", height: 260, ...style }} />;
}
