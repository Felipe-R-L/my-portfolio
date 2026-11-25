import { useEffect, useRef } from "react";
import type { Signal } from "../../scroll/signal";
import type { Camera } from "./camera";

/**
 * The photo, alive. Once the city scene settles on the portrait, this WebGL
 * canvas takes over drawing it and adds two things:
 *
 * - Colour, poured in by the pointer. The pointer deposits "ink" into a small
 *   field texture; every frame the ink spreads a little, is carried round by
 *   a slow swirl of noise and evaporates, so the trail behaves like oil
 *   moving on water rather than paint sprayed on a wall. Its edge wobbles
 *   with animated noise but stays knife-sharp: colour or not, no halo.
 * - Depth, as two layers. A matte cuts the person out of the photo; he
 *   shifts as one rigid piece with the pointer while the city shifts less,
 *   the other way. Nothing is warped, so his face never squashes, and the
 *   thin strip uncovered behind him is filled from the nearest city pixel
 *   rather than from him, so he never doubles.
 *
 * With nothing applied the canvas draws exactly what the <img> under it shows
 * (same camera, same pixels), so taking over is invisible. It only runs while
 * the photo holds; without WebGL2 it never starts and the plain photo stays.
 */


/** Ink field resolution, as a fraction of the screen. */
const FIELD_SCALE = 1 / 4;
/** Ink brush radius, as a fraction of the screen height. */
const BRUSH_DESKTOP = 0.13;
const BRUSH_PHONE = 0.11;
/** Pointer-driven lean of the whole picture at full offset, in uv (the
    shader applies half of it): a few dozen pixels, enough to feel depth. */
const PARALLAX = { x: 0.016, y: 0.01 };

const VERT = `#version 300 es
in vec2 a;
out vec2 v;
void main() { v = a * 0.5 + 0.5; gl_Position = vec4(a, 0.0, 1.0); }`;

// Ashima simplex noise (MIT).
const NOISE = `
vec3 m289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 m289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 perm(vec3 x) { return m289(((x * 34.0) + 1.0) * x); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = m289(i);
  vec3 p = perm(perm(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}`;

/** Ink field: spread, swirl, evaporate, and take new ink along the stroke. */
const FIELD = `#version 300 es
precision highp float;
in vec2 v;
out vec4 o;
uniform sampler2D prev;
uniform vec2 res;
uniform vec2 a;
uniform vec2 b;
uniform float brush;
uniform float ink;
uniform float aspect;
uniform float t;
${NOISE}
float seg(vec2 p, vec2 s0, vec2 s1) {
  vec2 pa = p - s0, ba = s1 - s0;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h);
}
void main() {
  // a slow curl-noise current carries the ink round
  float e = 0.02;
  vec2 q = v * vec2(aspect, 1.0) * 2.2 + vec2(0.0, t * 0.06);
  float n0 = snoise(q);
  vec2 curl = vec2(snoise(q + vec2(0.0, e)) - n0, -(snoise(q + vec2(e, 0.0)) - n0)) / e;
  vec2 src = v - curl * 0.0009;

  vec2 px = 1.0 / res;
  float c = texture(prev, src).r;
  float nb = (texture(prev, src + vec2(px.x, 0.0)).r + texture(prev, src - vec2(px.x, 0.0)).r
            + texture(prev, src + vec2(0.0, px.y)).r + texture(prev, src - vec2(0.0, px.y)).r) * 0.25;
  float val = mix(c, nb, 0.22);           // spread
  val = max(val * 0.993 - 0.0011, 0.0);   // evaporate, slowly: the colour lingers

  if (ink > 0.0) {
    vec2 sc = vec2(aspect, 1.0);
    float d = seg(v * sc, a * sc, b * sc);
    val += ink * exp(-(d * d) / (brush * brush));
  }
  o = vec4(min(val, 1.0), 0.0, 0.0, 1.0);
}`;

/** The picture: black and white, colour where the ink is, shifted by depth. */
const DRAW = `#version 300 es
precision highp float;
in vec2 v;
out vec4 o;
uniform sampler2D bw;
uniform sampler2D col;
uniform sampler2D matte;
uniform sampler2D field;
uniform vec2 stage;
uniform vec3 cam;
uniform vec2 img;
uniform vec2 par;
uniform float t;
uniform float hasCol;
uniform vec2 faceV;
${NOISE}
void main() {
  vec2 frag = vec2(v.x, 1.0 - v.y) * stage;
  vec2 uv = ((frag - cam.yz) / cam.x) / img;

  // Depth: the whole picture leans a little away from the cursor. One
  // layer only: moving him apart from the city would open a hole behind him
  // that the photo cannot fill, and he would be drawn twice.
  vec2 shift = par * vec2(${PARALLAX.x.toFixed(4)}, ${PARALLAX.y.toFixed(4)});
  vec2 pUV = clamp(uv - shift * 0.5, vec2(0.0), vec2(1.0));
  vec2 fgUV = pUV;
  vec2 bgUV = pUV;
  float matteRaw = texture(matte, pUV).r;
  float a = smoothstep(0.35, 0.65, matteRaw);

  // the ink's edge wobbles like a liquid surface
  float n = snoise(v * vec2(stage.x / stage.y, 1.0) * 3.0 + t * 0.25) * 0.06
          + snoise(v * vec2(stage.x / stage.y, 1.0) * 8.0 - t * 0.4) * 0.03;
  float m = texture(field, v + n * 0.01).r + n;

  // A knife edge: the colour switches over about one pixel, antialiased by
  // the field's own screen-space slope. No refraction, no sheen: anything
  // softer reads as the photo bending.
  float aa = max(fwidth(m) * 0.75, 1e-4);
  float mask = smoothstep(0.42 - aa, 0.42 + aa, m) * hasCol;
  // The colour goes only where the ink is, on him and on the city alike,
  // like a brush the cursor carries.
  bgUV = clamp(bgUV, vec2(0.0), vec2(1.0));
  vec3 base = mix(texture(bw, bgUV).rgb, texture(bw, fgUV).rgb, a);
  vec3 tint = mix(texture(col, bgUV).rgb, texture(col, fgUV).rgb, a);
  // The colour photo only lends its hue: the black-and-white keeps the
  // light, so crossing the edge never changes brightness (no bright patch on
  // a forehead, no shirt turning into a flat black block).
  const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);
  vec3 chroma = tint - dot(tint, LUMA);
  // near-black stays black: the noise in the shadows has no colour worth showing
  float lb = dot(base, LUMA);
  // At the matte's fringe (loose curls against the sky) the colour photo is
  // mostly sky, which would draw a blue outline around his hair: there the
  // person keeps only the grey.
  float fringe = mix(1.0, smoothstep(0.7, 0.97, matteRaw), a);
  // The matte also keeps sky between the curls well inside his outline. On
  // him nothing is both bright and blue (skin is warm, hair and shirt dark),
  // so a bright, blue pixel there is sky, and it stays grey.
  float skyOnHim = a * smoothstep(0.0, 0.05, tint.b - tint.r) * smoothstep(0.45, 0.7, lb);
  fringe *= 1.0 - skyOnHim;
  tint = clamp(base + chroma * 1.15 * smoothstep(0.04, 0.22, lb) * fringe, 0.0, 1.0);
  o = vec4(mix(base, tint, mask), 1.0);
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
  return s;
}

function program(gl: WebGL2RenderingContext, frag: string) {
  const p = gl.createProgram()!;
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, frag));
  gl.bindAttribLocation(p, 0, "a");
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? "link");
  const u = (name: string) => gl.getUniformLocation(p, name);
  return { p, u };
}

function texture(gl: WebGL2RenderingContext, source: TexImageSource | null, mip: boolean) {
  const t = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
  if (source) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    if (mip) gl.generateMipmap(gl.TEXTURE_2D);
  } else {
    // 1x1 placeholder until the image arrives
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([128, 128, 128, 255]));
  }
  return t;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function LiquidReveal({
  bwSrc,
  colorSrc,
  matteSrc,
  width,
  height,
  camera,
  active,
  phone,
  face,
}: {
  bwSrc: string;
  colorSrc: string;
  matteSrc: string;
  /** Size of the scene photo the camera moves, in asset pixels. */
  width: number;
  height: number;
  camera: Signal<Camera>;
  active: Signal<boolean>;
  phone: boolean;
  /** Centre of the face in asset pixels: the person turns colour as a whole
      when the ink reaches it. */
  face: { x: number; y: number };
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = canvas?.parentElement;
    if (!canvas || !stage) return;
    const gl = canvas.getContext("webgl2", { antialias: false, premultipliedAlpha: false });
    if (!gl) return; // the plain photo stays

    let disposed = false;
    let frame = 0;
    let running = false;

    let draw: ReturnType<typeof program>;
    let field: ReturnType<typeof program>;
    try {
      draw = program(gl, DRAW);
      field = program(gl, FIELD);
    } catch {
      return;
    }

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // Half-float ink if the GPU can render to it: smoother evaporation.
    const halfFloat = !!gl.getExtension("EXT_color_buffer_float");

    const tex = {
      bw: texture(gl, null, false),
      col: texture(gl, null, false),
      matte: texture(gl, null, false),
    };
    let hasCol = 0;

    // The black-and-white photo is already loaded by the page; colour and
    // the cut-out matte arrive when the browser is idle.
    loadImage(bwSrc).then((img) => {
      if (disposed) return;
      gl.deleteTexture(tex.bw);
      tex.bw = texture(gl, img, true);
    });
    const later = () =>
      Promise.all([loadImage(colorSrc), loadImage(matteSrc)]).then(([c, d]) => {
        if (disposed) return;
        gl.deleteTexture(tex.col);
        gl.deleteTexture(tex.matte);
        tex.col = texture(gl, c, true);
        tex.matte = texture(gl, d, false);
        hasCol = 1;
      });
    const idle = "requestIdleCallback" in window
      ? window.requestIdleCallback(later, { timeout: 2500 })
      : window.setTimeout(later, 1200);

    // Ping-pong ink fields.
    let fw = 1;
    let fh = 1;
    const targets = [0, 1].map(() => ({ tex: gl.createTexture()!, fbo: gl.createFramebuffer()! }));
    const allocField = () => {
      for (const t of targets) {
        gl.bindTexture(gl.TEXTURE_2D, t.tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        if (halfFloat) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, fw, fh, 0, gl.RGBA, gl.HALF_FLOAT, null);
        else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, fw, fh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t.tex, 0);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };
    let read = 0;

    let w = 1;
    let h = 1;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, phone ? 2 : 1.5);
      w = stage.clientWidth;
      h = stage.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      fw = Math.max(2, Math.round(w * FIELD_SCALE));
      fh = Math.max(2, Math.round(h * FIELD_SCALE));
      allocField();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(stage);

    // Pointer: the newest stroke segment, and a smoothed position for depth.
    let stroke: { a: [number, number]; b: [number, number] } | null = null;
    let lastPt: [number, number] | null = null;
    const par = { x: 0, y: 0, tx: 0, ty: 0 };
    let touched = false;

    let lastClient: [number, number] | null = null;
    const push = (x: number, y: number, byHand = true) => {
      const p: [number, number] = [x / w, 1 - y / h];
      // several moves between two frames extend one segment, no gaps
      stroke = stroke ? { a: stroke.a, b: p } : { a: lastPt ?? p, b: p };
      lastPt = p;
      if (!byHand) return;
      par.tx = (x / w) * 2 - 1;
      par.ty = (y / h) * 2 - 1;
    };
    const local = (cx: number, cy: number) => {
      // The picture may be scaled (the exit frame): map back to its own
      // unscaled pixels.
      const r = stage.getBoundingClientRect();
      return [((cx - r.left) * w) / r.width, ((cy - r.top) * h) / r.height] as const;
    };
    // The picture sits under the name's layers, so pointer events never
    // reach it: listen on the window and keep the points that fall on it.
    const onPicture = (cx: number, cy: number, target: EventTarget | null) => {
      const r = stage.getBoundingClientRect();
      if (cx < r.left || cx > r.right || cy < r.top || cy > r.bottom) return false;
      return !(target as Element | null)?.closest?.("[data-no-reveal], nav, a, button");
    };
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      lastClient = [e.clientX, e.clientY];
      if (!active.get()) return;
      if (!onPicture(e.clientX, e.clientY, e.target)) {
        onLeave();
        return;
      }
      push(...local(e.clientX, e.clientY));
    };
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t || !active.get() || !onPicture(t.clientX, t.clientY, e.target)) return;
      touched = true;
      push(...local(t.clientX, t.clientY));
    };
    function onLeave() {
      lastPt = null;
      par.tx = 0;
      par.ty = 0;
    }
    // Scrolling with the mouse held still moves the picture under the cursor
    // without any pointer event: pour where the cursor rests.
    const onScroll = () => {
      if (!active.get() || !lastClient) return;
      const under = document.elementFromPoint(lastClient[0], lastClient[1]);
      if (!onPicture(lastClient[0], lastClient[1], under)) return;
      push(...local(lastClient[0], lastClient[1]));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("touchstart", onTouch, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    const onTouchEnd = () => (lastPt = null);
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    const brush = phone ? BRUSH_PHONE : BRUSH_DESKTOP;
    const t0 = performance.now();

    const tick = (now: number) => {
      frame = 0;
      if (disposed || !running) return;
      const t = (now - t0) / 1000;

      // 1. ink field
      gl.useProgram(field.p);
      gl.bindFramebuffer(gl.FRAMEBUFFER, targets[1 - read].fbo);
      gl.viewport(0, 0, fw, fh);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, targets[read].tex);
      gl.uniform1i(field.u("prev"), 0);
      gl.uniform2f(field.u("res"), fw, fh);
      gl.uniform1f(field.u("aspect"), w / h);
      gl.uniform1f(field.u("t"), t);
      gl.uniform1f(field.u("brush"), brush);
      const s = stroke as { a: [number, number]; b: [number, number] } | null;
      gl.uniform2f(field.u("a"), s ? s.a[0] : 0, s ? s.a[1] : 0);
      gl.uniform2f(field.u("b"), s ? s.b[0] : 0, s ? s.b[1] : 0);
      gl.uniform1f(field.u("ink"), s ? 0.55 : 0);
      stroke = null;
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      read = 1 - read;

      // 2. depth follows the pointer, eased; on a phone it also sways a little
      const sway = phone && !touched ? 1 : 0;
      const tx = par.tx + sway * Math.sin(t * 0.5) * 0.6;
      const ty = par.ty + sway * Math.cos(t * 0.37) * 0.3;
      par.x += (tx - par.x) * 0.06;
      par.y += (ty - par.y) * 0.06;

      // 3. picture
      const c = camera.get();
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(draw.p);
      const bind = (unit: number, name: string, t: WebGLTexture) => {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.uniform1i(draw.u(name), unit);
      };
      bind(0, "bw", tex.bw);
      bind(1, "col", tex.col);
      bind(2, "matte", tex.matte);
      bind(3, "field", targets[read].tex);
      gl.uniform2f(draw.u("stage"), w, h);
      gl.uniform3f(draw.u("cam"), c.scale, c.x, c.y);
      gl.uniform2f(draw.u("img"), width, height);
      // While the canvas drains on the way out, the still photo beneath shows
      // through it; any depth shift left would draw him twice (two chains, two
      // signatures). The shift goes long before the canvas does.
      const op = Number(canvas.style.opacity || 1);
      const depth = hasCol ? op ** 4 : 0;
      gl.uniform2f(draw.u("par"), par.x * depth, par.y * depth);
      gl.uniform1f(draw.u("t"), t);
      gl.uniform1f(draw.u("hasCol"), hasCol);
      gl.uniform2f(draw.u("faceV"), (c.x + face.x * c.scale) / w, 1 - (c.y + face.y * c.scale) / h);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      frame = requestAnimationFrame(tick);
    };

    const setRunning = (on: boolean) => {
      running = on;
      canvas.style.opacity = on ? "1" : "0";
      if (on) {
        // The colour only ever goes where a cursor or a finger goes. (An
        // automatic pour lands in screen space while the photo moves under
        // it, and leaves a stripe across his face.)
        if (!frame) frame = requestAnimationFrame(tick);
      } else {
        cancelAnimationFrame(frame);
        frame = 0;
        lastPt = null;
        allocField(); // start clean next time
      }
    };
    setRunning(active.get());
    const off = active.on("change", setRunning);

    return () => {
      disposed = true;
      off();
      cancelAnimationFrame(frame);
      ro.disconnect();
      if ("cancelIdleCallback" in window) window.cancelIdleCallback(idle as number);
      else window.clearTimeout(idle as number);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchend", onTouchEnd);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [bwSrc, colorSrc, matteSrc, width, height, camera, active, phone, face]);

  return <canvas ref={canvasRef} className="city-reveal" aria-hidden="true" style={{ opacity: 0 }} />;
}
