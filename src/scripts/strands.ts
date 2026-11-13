/**
 * Neon strands layer: one fixed canvas, one WebGL2 fragment shader over a full-screen triangle.
 * scenes.ts loads it on idle and calls read() in its frame: reads first, then the draw.
 * Off without WebGL2, on software renderers, after context loss and with reduced motion.
 */
import { blend, parseOklch, reach, route, SCENES, type Palette } from '../lib/strands';

const VS = `#version 300 es
in vec2 a; void main() { gl_Position = vec4(a, 0., 1.); }`;

// Per pixel: the nearest route piece (3 segments, 2 arcs) gives a signed offset s and a length u.
// uA: arc centre, radius, start angle. uB: sweep, u0, side, on. Each bundle draws its 5 nearest
// hairlines (≥0.8 device px wide, or they alias; under ~2 px spacing they blend to the average),
// breathes and wanders with chaos, sends out 3 strays and adds a soft bloom. Text rows dim it.
// Contact (uGlass): where a rail passes under text, a glass lane (bundle + 10 px gap) melts the
// hairlines into a glow under a 30% tint and a thin rim. Light (uLight): saturated dark ink, little haze.
// No comments or indentation inside the string: it ships as written.
const FS = `#version 300 es
precision highp float;
uniform vec2 uRes;uniform float uK;
uniform vec4 uS[3];uniform float uSU[3];uniform vec4 uA[2];uniform vec4 uB[2];
uniform vec4 uF[2];uniform float uPh[2];uniform vec3 uC[2];uniform vec3 uE[2];
uniform float uWave,uShift,uGain,uReach,uChaos;
uniform vec4 uKeep[8];uniform int uNK,uLight;uniform float uGlass;uniform vec3 uGlassC;
out vec4 o;
float hash(float n){return fract(sin(n*127.1)*43758.5453);}
float noise(float x){return .6*sin(x)+.3*sin(2.17*x+1.3)+.1*sin(4.31*x+2.1);}
float sdBox(vec2 p,vec2 b){vec2 d=abs(p)-b;return length(max(d,0.))+min(max(d.x,d.y),0.);}
void main(){
vec2 p=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y)/uK;
float best=1e9,sd=0.,u=0.;
for(int i=0;i<3;i++){
vec2 a=uS[i].xy,ab=uS[i].zw-a;
float l2=max(dot(ab,ab),1e-4),t=clamp(dot(p-a,ab)/l2,0.,1.),d=length(p-a-ab*t);
if(d<best){best=d;sd=ab.x*(p.y-a.y)-ab.y*(p.x-a.x)<0.?-d:d;u=uSU[i]+t*sqrt(l2);}
}
for(int i=0;i<2;i++){
vec4 A=uA[i],B=uB[i];
if(B.w<.5)continue;
vec2 q=p-A.xy;
float rr=length(q),rel=mod((atan(q.y,q.x)-A.w)*sign(B.x),6.2831853);
if(rel>abs(B.x))continue;
float d=abs(rr-A.z);
if(d<best){best=d;sd=B.z*(A.z-rr);u=B.y+rel*A.z;}
}
if(best>uReach){o=vec4(0.);return;}
float keep=1.,txt=0.,lane=0.,rim=0.,dk=float(1-uLight),bl=uLight==1?.3:1.;
for(int i=0;i<8;i++){
if(i>=uNK)break;
vec4 r=uKeep[i];
float rr=min(r.w,18.),b=sdBox(p-r.xy,r.zw-rr)-rr;
keep=min(keep,mix(.3,1.,smoothstep(-6.,40.,b)));
txt=max(txt,1.-smoothstep(4.,28.,b));
}
float gs=uGlass*txt;
keep=mix(keep,mix(.75,1.,keep),uGlass);
vec3 c=vec3(0.);
float lw=max(.5*uK,.8);
for(int k=0;k<2;k++){
vec4 f=uF[k];
float s=sd-f.x-f.a*sin(6.2831853*u/uWave+uPh[k]-uShift);
float seed=float(k)*31.;
float br=1.+uChaos*.5*noise(u*.006+seed-uShift*.5);
float g=f.z*br,w=f.y*br,t=abs(s)/w;
float e=(abs(s)-w-10.)*uK,gk=gs*(1.-smoothstep(-.8,.8,e));
lane=max(lane,gk);rim=max(rim,gs*exp(-e*e/1.4));
float fade=smoothstep(1.6,3.2,g*uK)*(1.-.65*gk);
float base=floor(s/g+.5);
for(int n=-2;n<=2;n++){
float idx=base+float(n),h1=hash(idx+seed),h2=hash(idx*1.37+seed+7.);
float j=(h1-.5)*.56*g*(.6+.4*sin(u*.004+idx));
j+=uChaos*1.8*g*noise(u*(.004+.006*h2)+idx*2.3-uShift*(.3+.5*h1));
float dpx=abs(s-idx*g-j)*uK,tl=abs(idx*g)/w,hot=step(.88,h2);
vec3 col=mix(uC[k],uE[k],smoothstep(.25,1.,tl));
c+=mix(col,vec3(1.),(.35+.4*hot)*dk)*exp(-dpx*dpx/(lw*lw))*(.5*uK/lw)
*(.3+.7*h1+1.6*hot)*(1.-smoothstep(.55,1.,tl))*fade*2.2*clamp(g/3.4,.6,1.);
}
for(int m=0;m<3;m++){
float fm=float(m)*7.1+seed;
float off=(hash(fm*3.1)-.5)*w*1.2
+uChaos*(40.+70.*hash(fm*5.7))*noise(u*(.002+.003*hash(fm))+fm*4.-uShift*.4);
float dpx=abs(s-off)*uK;
c+=mix(uE[k],vec3(1.),.3*dk)*exp(-dpx*dpx/(lw*lw))*(.5*uK/lw)*1.8*uChaos*(.5+.5*hash(fm*9.));
}
vec3 body=mix(uC[k],uE[k],smoothstep(.25,1.,t));
c+=body*(1.-smoothstep(.55,1.,t))*(.07+.3*(1.-fade))*bl;
c+=body*exp(-max(abs(s)-w*.4,0.)*.045)*.11*bl;
}
if(uLight==1){
float m=max(c.r,max(c.g,c.b)),a=(1.-exp(-m*uGain*keep*1.15))*.92;
o=vec4(pow(c/max(m,1e-4),vec3(2.2))*.5*a,a);
}else{
c=1.-exp(-c*uGain*keep);
o=vec4(c,max(c.r,max(c.g,c.b)));
}
float a=.3*lane;
o=vec4(o.rgb*(1.-a)+mix(uGlassC,vec3(1.),uLight==1?.6:.07)*a,o.a*(1.-a)+a);
a=rim*(uLight==1?.55:.16);
o=o*(1.-a)+a;
}`;

/** Text that dims the strands behind it, per scene. */
const KEEP: Record<string, string> = {
  hero: '#hero-name, #hero-copy',
  statement: '#statement .w',
  cases: '#track .panel h3, #track .panel p',
  about: '#about h2, #about p, #about dt, #about dd',
  how: '#how h2, #how h3, #how p, #how .dur',
  testimonials: '#testimonials h2, #testimonials .quote > *',
  contact: '#contact h2, #contact .lead, #contact .reach, #contact form',
};
const box = (sel: string) => document.querySelector(sel)?.getBoundingClientRect();

const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const narrow = matchMedia('(max-width: 820px)');
const dark = matchMedia('(prefers-color-scheme: dark)');
const isLight = () => (root.dataset['theme'] ? root.dataset['theme'] === 'light' : !dark.matches);
const noop = () => {};

export interface Strands {
  layout: () => void;
  read: () => () => void;
}

function program(gl: WebGL2RenderingContext): WebGLProgram | undefined {
  const pr = gl.createProgram();
  for (const [type, src] of [
    [gl.VERTEX_SHADER, VS],
    [gl.FRAGMENT_SHADER, FS],
  ] as const) {
    const sh = gl.createShader(type);
    if (!sh) return;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    gl.attachShader(pr, sh);
  }
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  return pr;
}

/** Text rows of the scenes in view, merged into at most 8 boxes: centre x, y, half width, height. */
function keepBoxes(kinds: string[]) {
  const sel = kinds
    .map((k) => KEEP[k])
    .filter(Boolean)
    .join(', ');
  if (!sel) return [];
  const boxes: { left: number; right: number; top: number; bottom: number }[] = [];
  for (const e of document.querySelectorAll(sel)) {
    const r = e.getBoundingClientRect();
    if (r.width === 0 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth)
      continue;
    const hit = boxes.find(
      (b) =>
        Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top) >
          0.5 * Math.min(r.height, b.bottom - b.top) &&
        r.left < b.right + 40 &&
        r.right > b.left - 40,
    );
    if (!hit) boxes.push({ left: r.left, right: r.right, top: r.top, bottom: r.bottom });
    else
      Object.assign(hit, {
        left: Math.min(hit.left, r.left),
        right: Math.max(hit.right, r.right),
        top: Math.min(hit.top, r.top),
        bottom: Math.max(hit.bottom, r.bottom),
      });
  }
  return boxes
    .slice(0, 8)
    .flatMap((b) =>
      [b.left + b.right, b.top + b.bottom, b.right - b.left, b.bottom - b.top].map((v) => v / 2),
    );
}

export function start(): Strands | undefined {
  const cv = document.createElement('canvas');
  cv.className = 'strand-layer';
  cv.setAttribute('aria-hidden', 'true');
  const gl = cv.getContext('webgl2', {
    premultipliedAlpha: true,
    antialias: false,
    powerPreference: 'low-power',
    failIfMajorPerformanceCaveat: true,
  });
  if (!gl) return;
  // A software renderer would spend whole frames on the shader.
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = String(gl.getParameter(dbg ? dbg.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
  if (/swiftshader|llvmpipe|software|basic render/i.test(renderer)) return;
  const first = program(gl);
  if (!first) return;
  let prog = first;
  let locs: Record<string, WebGLUniformLocation | null> = {};
  const at = (n: string) => (locs[n] ??= gl.getUniformLocation(prog, n));

  const css = getComputedStyle(root);
  const pal: Palette = Object.fromEntries(
    [...SCENES, 'rest'].map((k) => [k, parseOklch(css.getPropertyValue(`--strand-${k}`))]),
  );
  const SG = new Float32Array(12);
  const SU = new Float32Array(3);
  const AA = new Float32Array(8);
  const AB = new Float32Array(8);
  let els: HTMLElement[] = [];
  let k = 1;
  let H = 0;
  let lost = false;
  let on = false;
  let light = false;
  let glass: number[] = [];

  const sync = () => {
    on = !lost && !reduce.matches;
    light = isLight();
    // Glass tint: the contact field color of the current theme.
    glass = parseOklch(getComputedStyle(root).getPropertyValue('--ink-scene'))[0] ?? [0, 0, 0];
    cv.hidden = !on;
    root.classList.toggle('strands-on', on);
  };

  // H: the canvas height, 100lvh like CSS vh. innerHeight changes while the iOS toolbar slides.
  const layout = () => {
    els = [...document.querySelectorAll<HTMLElement>('main section[id]')].filter(
      (s) => !s.parentElement?.closest('section'),
    );
    k = Math.min(devicePixelRatio, 2);
    H = cv.clientHeight;
    cv.width = Math.round(cv.clientWidth * k);
    cv.height = Math.round(H * k);
    gl.viewport(0, 0, cv.width, cv.height);
  };

  const read = () => {
    if (!on) return noop;
    // Measured every frame: a section that renders late (content-visibility) changes size.
    const sections = els.map((e) => {
      const r = e.getBoundingClientRect();
      return { id: e.id, top: r.top + scrollY, bottom: r.bottom + scrollY };
    });
    const s = blend(sections, scrollY, innerWidth, H, narrow.matches, pal, box);
    const keep = keepBoxes(s.keep);
    return () => {
      const rt = route(s.pts, s.R, reach(s));
      SG.fill(1e5);
      SU.fill(0);
      AB.fill(0);
      rt.segments.forEach(([a, b, u0], i) => {
        SG.set([a[0], a[1], b[0], b[1]], i * 4);
        SU[i] = u0;
      });
      rt.arcs.forEach((A, i) => {
        AA.set([A.C[0], A.C[1], A.r, A.a0], i * 4);
        AB.set([A.dl, A.u, A.sg, 1], i * 4);
      });
      gl.uniform2f(at('uRes'), cv.width, cv.height);
      gl.uniform1f(at('uK'), k);
      gl.uniform4fv(at('uS'), SG);
      gl.uniform1fv(at('uSU'), SU);
      gl.uniform4fv(at('uA'), AA);
      gl.uniform4fv(at('uB'), AB);
      gl.uniform4fv(
        at('uF'),
        s.f.flatMap((f) => [f.o, f.w, f.g, f.a]),
      );
      gl.uniform1fv(
        at('uPh'),
        s.f.map((f) => f.ph),
      );
      gl.uniform3fv(
        at('uC'),
        s.f.flatMap((f) => f.c),
      );
      gl.uniform3fv(
        at('uE'),
        s.f.flatMap((f) => f.e),
      );
      gl.uniform1f(at('uWave'), s.wave);
      gl.uniform1f(at('uShift'), s.shift);
      gl.uniform1f(at('uGain'), s.gain);
      gl.uniform1f(at('uChaos'), s.chaos);
      gl.uniform1f(
        at('uReach'),
        Math.max(...s.f.map((f) => Math.abs(f.o) + f.w * 1.5 + f.a)) + 80 + 110 * s.chaos,
      );
      gl.uniform4fv(
        at('uKeep'),
        Float32Array.from({ length: 32 }, (_, i) => keep[i] ?? 0),
      );
      gl.uniform1i(at('uNK'), keep.length / 4);
      gl.uniform1f(at('uGlass'), s.glass);
      gl.uniform1i(at('uLight'), light ? 1 : 0);
      gl.uniform3fv(at('uGlassC'), glass);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
  };

  // A hidden canvas measures 0 × 0: size it again whenever it comes back.
  const redraw = () => {
    sync();
    if (on) layout();
    read()();
  };
  cv.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    lost = true;
    sync();
  });
  cv.addEventListener('webglcontextrestored', () => {
    const p = program(gl);
    lost = !p;
    if (p) prog = p;
    locs = {};
    layout();
    redraw();
  });
  new MutationObserver(redraw).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  dark.addEventListener('change', redraw);
  reduce.addEventListener('change', redraw);

  document.body.prepend(cv);
  sync();
  layout();
  return { layout, read };
}
