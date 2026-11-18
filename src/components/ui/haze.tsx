import * as React from "react";
import { GLCanvas, type FrameCtx } from "@/lib/glcanvas";

/** Haze - low drifting fog or mist that thickens toward the bottom edge. Transparent. Use under content or as a footer. */
const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime, uCover, uSeed; uniform vec3 uTint;
float hash(vec3 p){ p=fract(p*0.3183099+0.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float noise(vec3 x){ vec3 i=floor(x),f=fract(x); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z); }
float fbm(vec3 p){ float a=0.5,s=0.0; for(int i=0;i<5;i++){ s+=a*noise(p); p=p*2.02+vec3(3.1,1.7,5.3); a*=0.5; } return s; }
void main(){
  vec2 e=gl_FragCoord.xy/uRes; float asp=uRes.x/uRes.y;
  float acc=0.0;
  // three depth layers drifting at different speeds, thicker at the bottom
  for(int i=0;i<3;i++){
    float fi=float(i); float sp=0.05+0.04*fi; float sc=1.4+fi*1.1;
    vec3 p=vec3(e.x*asp*sc-uTime*sp,e.y*sc*1.6,uTime*0.03+fi*4.0+uSeed*3.0);
    float n=fbm(p);
    float h=smoothstep(1.0,0.0,e.y+0.18*fi*(0.0));
    float layer=smoothstep(mix(0.62,0.35,uCover),0.8,n)*pow(h,1.0+fi*0.4);
    acc+=layer*(0.55-0.12*fi);
  }
  acc=clamp(acc,0.0,1.0);
  acc*=smoothstep(0.0,0.08,e.x)*smoothstep(1.0,0.92,e.x);
  vec3 col=mix(vec3(0.72,0.78,0.88),vec3(0.97,0.98,1.0),acc)*uTint;
  gl_FragColor=vec4(col*acc,acc);
}`;
export interface HazeProps extends React.HTMLAttributes<HTMLDivElement> {
  coverage?: number; speed?: number; seed?: number; tint?: [number, number, number]; /** "white" for dark or sky surfaces, "slate" for light surfaces */ tone?: "white" | "slate"; quality?: number; time?: number;
}
export function Haze({ coverage = 0.55, speed = 1, seed = 0, tone = "white", tint = tone === "slate" ? [0.5, 0.57, 0.72] : [1, 1, 1], quality = 0.55, time, style, ...rest }: HazeProps) {
  const cfg = React.useRef({ coverage, seed, tint }); cfg.current = { coverage, seed, tint };
  const onFrame = React.useCallback(({ gl, U, t, w, h }: FrameCtx) => {
    const c = cfg.current;
    gl.uniform2f(U.uRes, w, h); gl.uniform1f(U.uTime, t * 4); gl.uniform1f(U.uCover, c.coverage);
    gl.uniform1f(U.uSeed, c.seed); gl.uniform3fv(U.uTint, c.tint);
  }, []);
  return <GLCanvas {...rest} frag={FRAG} uniforms={["uRes","uTime","uCover","uSeed","uTint"]} speed={speed} quality={quality} time={time}
    onFrame={onFrame} redrawKey={[coverage, seed, tint]} style={{ display: "block", width: "100%", height: 220, ...style }} />;
                                             }
