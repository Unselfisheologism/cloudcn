import * as React from "react";
import { GLCanvas, type FrameCtx } from "./glcanvas";

/**
 * Shared raymarched cloud volume. kind 0 = cumulus puff, 1 = storm tower with anvil, 2 = wide cloud bank.
 * Density: body shape eroded by 3D fBm. Light: marched toward the sun with Beer-Lambert,
 * powder darkening, Henyey-Greenstein silver lining, plus height-graded ambient.
 */
export type VolumeKind = 0 | 1 | 2;
export interface Tone { sun: [number, number, number]; top: [number, number, number]; bottom: [number, number, number]; }

export const TONES: Record<string, Tone> = {
  day: { sun: [5.0, 4.75, 4.3], top: [0.62, 0.76, 1.0], bottom: [0.30, 0.35, 0.48] },
  dusk: { sun: [5.6, 2.9, 1.5], top: [0.62, 0.48, 0.70], bottom: [0.22, 0.14, 0.28] },
  storm: { sun: [1.1, 1.1, 1.4], top: [0.2, 0.23, 0.36], bottom: [0.03, 0.035, 0.07] },
};

const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime, uCover, uDens, uSeed, uSteps, uYaw, uPitch, uKind, uDist, uFlash;
uniform vec3 uSun, uSunC, uAmbT, uAmbB, uFlashP;

float hash(vec3 p){ p=fract(p*0.3183099+0.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float noise(vec3 x){
  vec3 i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fbm(vec3 p,int oct){ float a=0.5,s=0.0; for(int i=0;i<6;i++){ if(i>=oct) break; s+=a*noise(p); p=p*2.03+vec3(1.7,9.2,3.1); a*=0.5; } return s; }
float h1(float n){ return fract(sin(n*127.1+uSeed*13.7)*43758.5453); }

float body(vec3 p){
  float b=0.0;
  if(uKind<0.5){
    for(int i=0;i<9;i++){
      float fi=float(i); float ang=h1(fi)*6.2831;
      float rr=0.15+0.62*h1(fi+9.0)*(1.0-0.35*fi/9.0);
      vec3 c=vec3(cos(ang)*rr*1.25,-0.1+0.55*h1(fi+19.0)*(1.0-rr*0.6),sin(ang)*rr*0.9);
      float r=0.34+0.3*h1(fi+29.0);
      b=max(b,1.0-length((p-c)*vec3(1.0,1.15,1.0))/r);
    }
    b*=smoothstep(-0.62,-0.34,p.y);
  } else if(uKind<1.5){
    float r=length(p.xz); float h=p.y;
    float wob=0.08*sin(h*5.0+uSeed)+0.06*sin(h*9.0+uSeed*2.0);
    float rad=0.5+0.28*smoothstep(-0.9,0.7,h)+wob;
    float tower=1.0-r/rad;
    tower*=smoothstep(-0.98,-0.78,h)*smoothstep(1.02,0.82,h);
    float an=1.0-length(vec2(r/1.5,(h-0.9)/0.26));
    // billows climbing the tower
    for(int i=0;i<5;i++){ float fi=float(i); float a=h1(fi)*6.28; float hh=-0.5+fi*0.3;
      vec3 c=vec3(cos(a)*0.42,hh,sin(a)*0.42); tower=max(tower,0.9-length(p-c)/0.4); }
    b=max(tower,an);
  } else {
    for(int i=0;i<13;i++){
      float fi=float(i);
      float x=-3.1+6.2*fi/12.0+(h1(fi)-0.5)*0.4;
      vec3 c=vec3(x,-0.30+0.55*h1(fi+9.0)*(0.5+0.5*cos(x*0.55)),(h1(fi+19.0)-0.5)*0.9);
      float r=0.5+0.5*h1(fi+29.0);
      b=max(b,1.0-length((p-c)*vec3(1.0,1.5,1.0))/r);
    }
    b*=smoothstep(-0.78,-0.5,p.y);
  }
  return b;
}
float dens(vec3 p,int oct){
  float b=body(p);
  if(b<0.02) return 0.0;
  vec3 q=p*3.8+vec3(uTime*0.05,uTime*0.02,-uTime*0.035)+uSeed*3.1;
  if(uKind>1.5) q.x*=0.7;
  float n=fbm(q,oct);
  float d=b+(n-0.5)*1.3-mix(0.4,0.1,uCover);
  return clamp(d*5.5,0.0,1.0)*smoothstep(0.02,0.3,b)*uDens;
}
float hg(float c,float g){ float g2=g*g; return (1.0-g2)/(4.0*3.14159*pow(1.0+g2-2.0*g*c,1.5)); }

void main(){
  vec2 uv;
  float R=1.55;
  if(uKind<0.5) uv=(gl_FragCoord.xy-0.5*uRes)/min(uRes.x,uRes.y*1.25);
  else if(uKind<1.5){ uv=(gl_FragCoord.xy-0.5*uRes)/min(uRes.x*1.15,uRes.y*0.8); R=1.8; }
  else { uv=(gl_FragCoord.xy-0.5*uRes)/min(uRes.x*0.62,uRes.y*1.7); R=3.7; }
  float cy=cos(uYaw), sy=sin(uYaw), cp=cos(uPitch), sp=sin(uPitch);
  vec3 ro=vec3(sy*cp,sp,cy*cp)*uDist;
  vec3 fw=normalize(-ro), rt=normalize(cross(fw,vec3(0,1,0))), up=cross(rt,fw);
  vec3 rd=normalize(fw*1.9+rt*uv.x+up*uv.y);
  float b=dot(ro,rd), c=dot(ro,ro)-R*R, disc=b*b-c;
  if(disc<0.0){ gl_FragColor=vec4(0.0); return; }
  float sq=sqrt(disc), t0=-b-sq, t1=-b+sq;
  float dt=(t1-t0)/uSteps;
  float t=t0+dt*hash(vec3(gl_FragCoord.xy,uSeed));
  float cs=dot(rd,uSun);
  float phase=mix(hg(cs,0.65)*0.55,hg(cs,-0.25),0.4)*2.4+0.2;
  float scale=R/1.55;
  float T=1.0; vec3 L=vec3(0.0);
  for(int i=0;i<96;i++){
    if(float(i)>=uSteps||T<0.02) break;
    vec3 p=ro+rd*t;
    float d=dens(p,5);
    if(d>0.002){
      float od=0.0;
      for(int k=1;k<=5;k++){ float s=0.16*float(k)*0.55*scale; od+=dens(p+uSun*0.16*float(k)*float(k)*0.55*scale,3)*s*2.0; }
      float direct=exp(-od*9.0/scale)+0.1*exp(-od*1.4/scale);
      float powder=1.0-exp(-d*4.5);
      float hgt=clamp((p.y+0.8)/(uKind>0.5&&uKind<1.5?2.2:1.4),0.0,1.0);
      vec3 amb=mix(uAmbB,uAmbT,hgt);
      vec3 col=uSunC*direct*phase*mix(0.5,1.0,powder)+amb*(0.3+0.55*hgt);
      if(uFlash>0.0){ col+=vec3(0.75,0.8,1.0)*uFlash*3.5*exp(-length(p-uFlashP)*2.4); }
      float a=1.0-exp(-d*dt*5.5/scale);
      L+=T*a*col; T*=1.0-a;
    }
    t+=dt;
  }
  float alpha=1.0-T;
  float lum=max(dot(L,vec3(0.299,0.587,0.114)),1e-4);
  vec3 outc=L*((1.0-exp(-lum*1.35))/lum);
  outc=pow(outc,vec3(0.92));
  outc=min(outc,vec3(alpha));
  gl_FragColor=vec4(outc,alpha);
}`;

const NAMES = ["uRes","uTime","uCover","uDens","uSeed","uSteps","uYaw","uPitch","uKind","uDist","uFlash","uSun","uSunC","uAmbT","uAmbB","uFlashP"];

export interface VolumeProps extends React.HTMLAttributes<HTMLDivElement> {
  kind: VolumeKind;
  tone?: Tone;
  coverage?: number; density?: number; speed?: number;
  sunElevation?: number; sunAzimuth?: number;
  yaw?: number; pitch?: number; dist?: number;
  interactive?: boolean; autoRotate?: number;
  quality?: number; steps?: number; seed?: number; time?: number;
  /** 0..1 lightning rate (storm tower only) */
  lightning?: number;
}

export function Volume({ kind, tone = TONES.day, coverage = 0.6, density = 1, speed = 1, sunElevation = 40, sunAzimuth = 35,
  yaw = 20, pitch = 8, dist = 4.4, interactive = true, autoRotate = 0.06, quality = 0.7, steps = 64, seed = 0, time, lightning = 0, ...rest }: VolumeProps) {
  const cfg = React.useRef({ tone, coverage, density, sunElevation, sunAzimuth, yaw, pitch, dist, autoRotate, steps, seed, kind, lightning });
  cfg.current = { tone, coverage, density, sunElevation, sunAzimuth, yaw, pitch, dist, autoRotate, steps, seed, kind, lightning };
  const flash = React.useRef({ next: 1.5, at: -10, p: [0, 0.2, 0] as number[] });
  const onFrame = React.useCallback(({ gl, U, t, w, h, dyaw, dpitch, fixed }: FrameCtx) => {
    const c = cfg.current;
    const el = (c.sunElevation * Math.PI) / 180, az = (c.sunAzimuth * Math.PI) / 180;
    const yawR = (c.yaw * Math.PI) / 180 + dyaw + (fixed ? 0 : t * c.autoRotate);
    const pitchR = Math.max(-0.6, Math.min(0.9, (c.pitch * Math.PI) / 180 + dpitch));
    let fl = 0;
    if (c.lightning > 0) {
      const f = flash.current;
      if (fixed) { fl = 0.9; f.p = [0.1, 0.3, 0.15]; }
      else {
        if (t > f.next) { f.at = t; f.p = [(Math.random() - 0.5) * 0.5, -0.2 + Math.random() * 0.9, (Math.random() - 0.5) * 0.5]; f.next = t + (1.2 + Math.random() * 4) / c.lightning; }
        const age = t - f.at; fl = age < 0.5 ? Math.max(0, Math.sin(age * 40) * 0.5 + 0.5) * Math.exp(-age * 7) : 0;
      }
    }
    gl.uniform2f(U.uRes, w, h);
    gl.uniform1f(U.uTime, t * 3);
    gl.uniform1f(U.uCover, c.coverage); gl.uniform1f(U.uDens, c.density);
    gl.uniform1f(U.uSeed, c.seed); gl.uniform1f(U.uSteps, Math.max(16, Math.min(96, c.steps)));
    gl.uniform1f(U.uYaw, yawR); gl.uniform1f(U.uPitch, pitchR);
    gl.uniform1f(U.uKind, c.kind); gl.uniform1f(U.uDist, c.dist); gl.uniform1f(U.uFlash, fl);
    gl.uniform3f(U.uSun, Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    gl.uniform3fv(U.uSunC, c.tone.sun); gl.uniform3fv(U.uAmbT, c.tone.top); gl.uniform3fv(U.uAmbB, c.tone.bottom);
    gl.uniform3fv(U.uFlashP, flash.current.p);
  }, []);
  return <GLCanvas {...rest} frag={FRAG} uniforms={NAMES} speed={speed} quality={quality} time={time} interactive={interactive}
    onFrame={onFrame} redrawKey={[coverage, density, sunElevation, sunAzimuth, yaw, pitch, dist, steps, seed, tone, lightning]} />;
                 }
