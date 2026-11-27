import { useEffect, useRef } from "react";
import type { Signal } from "../../scroll/signal";
import type { Camera } from "./camera";
import { media } from "../../media";
import { placeVideoOn } from "./placeLoop";

/**
 * The sea that carries the page from Diamante to the portrait.
 *
 * A WebGL layer over the whole stage, drawn only while the wave is on
 * screen. Scroll drives `wash` (0..1): the sea comes up from below over
 * Diamante and the name, fills the screen, and goes back down, leaving the
 * portrait. The sea is footage of foam rising over deep water (Storyblocks
 * 355192518); its edge is drawn (an organic line with a rim of fresh foam),
 * so it never fails, and the densest foam of the footage is always pinned
 * just under it.
 *
 * Under the shallows by the edge, the picture beneath (Diamante's own video
 * frame on the way in, the portrait on the way out) is drawn bent by the
 * water's surface and darkened. Ahead of the wave the land is shaded; behind
 * it, on the way out, the portrait is wet for a moment and dries.
 *
 * Where there is no sea, the canvas is clear and the page shows through.
 */

/** The sea: a 7 s seamless loop (its last second dissolves into its first).
    AV1 where the browser decodes it (about 4 MB on desktop, 2.6 MB on the
    phone); otherwise H.264 at phone size (6.7 MB). */
export function waterSource(phone: boolean, canPlay: (type: string) => string): string {
  if (canPlay('video/mp4; codecs="av01.0.08M.10"')) return phone ? media("sea-1080.av1.mp4") : media("sea-1440.av1.mp4");
  return media("sea-1080.h264.mp4");
}

const VERT = `#version 300 es
in vec2 a; out vec2 v;
void main(){ v = a * .5 + .5; gl_Position = vec4(a, 0., 1.); }`;

const FRAG = `#version 300 es
precision highp float;
in vec2 v; out vec4 o;
uniform sampler2D water, place, portrait;
uniform vec2 res, placeSz, portSz, vidSz;
uniform vec3 cam;          // the portrait's camera: scale, x, y (px)
uniform float rise, fall, after, t, placeZoom;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++){ s += a * noise(p); p *= 2.03; a *= .5; } return s; }
vec2 cover(vec2 uv, vec2 img, float zoom){
  float sr = res.x / res.y, ir = img.x / img.y;
  vec2 s = sr > ir ? vec2(1., ir / sr) : vec2(sr / ir, 1.);
  return .5 + (uv - .5) * s / zoom;
}
vec3 under(vec2 uv){
  if (after < .5) return texture(place, cover(uv, placeSz, placeZoom)).rgb;
  vec2 px = uv * res;
  return texture(portrait, clamp(((px - cam.yz) / cam.x) / portSz, 0., 1.)).rgb;
}
void main(){
  vec2 uv = vec2(v.x, 1. - v.y);
  float aspect = res.x / res.y;
  float front = after < .5 ? mix(1.08, -.16, rise) : mix(-.16, 1.08, fall);
  float edge = front + (fbm(vec2(uv.x * aspect * 2.2, t * .25)) - .5) * .16
                     + sin(uv.x * aspect * 9. + t * 1.3) * .008
                     + (noise(vec2(uv.x * aspect * 38., t * .8)) - .5) * .012;  // a ragged line, not a curve
  float d = uv.y - edge;                    // > 0 under water

  // the footage, its densest foam pinned just under the edge
  float w = aspect * vidSz.y / vidSz.x;
  vec2 wu = vec2(uv.x, .56 + d / w);
  float beyond = smoothstep(.85, 1.15, wu.y);
  // past the clip's end: mirrored (seamless at the join), then turned the
  // other way across too, so the water below never folds into a symmetric
  // pattern
  float flip = 0.;
  if (wu.y > 1.) { float k = mod(wu.y - 1., .8); flip = smoothstep(.02, .14, min(k, .8 - k)); wu.y = k < .4 ? 1. - k : .6 + (k - .4); }
  vec3 wc = texture(water, wu).rgb;
  if (flip > 0.) wc = mix(wc, texture(water, vec2(1. - wu.x, 1.6 - wu.y)).rgb, flip);
  // far from the crest: darker, deeper water that keeps some of its texture
  // (a heavier blur read as a smear on the phone)
  wc = mix(wc, textureLod(water, wu, 2.5).rgb * vec3(.5, .64, .68), beyond * .85);
  // refraction from the water's broad shapes: the gradient of the full
  // detail jumped pixel to pixel and showed as grain under the crest
  // (central differences on a blurred level: screen derivatives move in 2x2
  // blocks and broke the portrait under the shallows into squares)
  vec2 tx = 6. / vidSz;
  float lum = dot(textureLod(water, wu, 2.).rgb, vec3(.33));
  vec2 g = vec2(dot(textureLod(water, wu + vec2(tx.x, 0.), 3.).rgb - textureLod(water, wu - vec2(tx.x, 0.), 3.).rgb, vec3(.33)),
                dot(textureLod(water, wu + vec2(0., tx.y), 3.).rgb - textureLod(water, wu - vec2(0., tx.y), 3.).rgb, vec3(.33))) * .25;
  float shallow = 1. - smoothstep(0., .18, d);
  vec3 bent = under(uv + g * .05 * shallow) * .72;
  // where the foam hides what is under the water: from its broad shapes,
  // pixel-sharp it switched on and off pixel by pixel (grain in the shallows)
  float foam = smoothstep(.38, .9, mix(dot(wc, vec3(.33)), lum, .75));
  // the foam line: its thickness and brightness drift along the crest, and
  // it breaks into lace in places instead of running as one even band
  float along = fbm(vec2(uv.x * aspect * 4.5, t * .35));
  float thick = .008 + .04 * along;
  // (one octave, a few pixels wide: finer noise read as grain)
  float lace = smoothstep(.3, .7, noise(vec2(uv.x * aspect * 26., d * 70. - t * 1.2)));
  float rim = smoothstep(0., .004, d) * (1. - smoothstep(thick * .35, thick, d)) * mix(.3, 1., lace) * (.5 + .5 * along);
  float depth = smoothstep(0., .16, d);
  vec3 sea = mix(bent * vec3(.55, .78, .8), wc, max(depth, foam));
  sea = mix(sea, vec3(.95, .98, 1.), rim * .85);
  float inSea = smoothstep(-.002, .004, d);

  // on land: the shade the wave throws ahead, or the wet it leaves behind
  // (light and short: deeper, it read as a dark smear on the town)
  float ahead = after < .5 ? .12 * exp(min(d, 0.) * 28.) : 0.;
  float wet = after > .5 ? .22 * exp(min(d, 0.) * 7.) : 0.;
  float landA = max(ahead, wet) * (1. - inSea);
  // loose spray just ahead of the crest, thrown up where the foam is thick
  vec2 cell = uv * res / 9.;
  vec2 id = floor(cell);
  float h = hash(id + floor(t * 3.) * 17.);
  float drop = step(.975, h) * (1. - smoothstep(.12, .38, length(fract(cell) - .5)));
  float spray = drop * (d < 0. ? exp(d * 40.) : 0.) * (.4 + along) * .9 * (1. - inSea);
  vec3 sheen = vec3(.05, .07, .08) * smoothstep(.55, .9, fbm(uv * 30. + t * .2)) * (after > .5 ? exp(min(d, 0.) * 7.) : 0.);
  // premultiplied: the sea opaque, the land darkened (and glinting) a little
  o = vec4(sea * inSea + sheen * (1. - inSea) + vec3(.95, .98, 1.) * spray, min(1., inSea + landA + spray));
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
  return s;
}

/** Soft: the scroll already eases the whole passage in and out, so a
    second steep curve here bunched the crossing into half a second. */
const soft = (x: number) => 0.5 * x + 0.25 * (1 - Math.cos(Math.PI * x));
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** Where the sea is at wash `w`: drawn only strictly inside (0, 1); rising
    over Diamante up to the middle, going back off the portrait after it. */
export function seaPhase(w: number) {
  const rise = soft(clamp01(w / 0.46));
  return { on: w > 0 && w < 1, after: w >= 0.5, rise, fall: soft(clamp01((w - 0.54) / 0.46)), placeZoom: 1 + 0.08 * rise };
}

export function SeaWash({
  wash,
  camera,
  portraitSrc,
  portraitSize,
  phone,
}: {
  /** 0 before the wave, 1 once the sea has gone back and the portrait shows. */
  wash: Signal<number>;
  camera: Signal<Camera>;
  portraitSrc: string;
  portraitSize: { width: number; height: number };
  phone: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const stage = canvas?.parentElement;
    if (!canvas || !stage) return;
    const gl = canvas.getContext("webgl2", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return;

    let prog: WebGLProgram;
    try {
      prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.bindAttribLocation(prog, 0, "a");
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    } catch {
      return;
    }
    gl.useProgram(prog);
    const U = (n: string) => gl.getUniformLocation(prog, n);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const tex = (unit: number, name: string, mip: boolean) => {
      const t = gl.createTexture()!;
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([5, 7, 10, 255]));
      gl.uniform1i(U(name), unit);
      return t;
    };
    const T = { water: tex(0, "water", true), place: tex(1, "place", false), portrait: tex(2, "portrait", false) };
    const upload = (unit: number, t: WebGLTexture, src: TexImageSource, mip: boolean) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      if (mip) gl.generateMipmap(gl.TEXTURE_2D);
    };
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    // The sea: fetched once the page has settled, never with the first paint.
    const water = document.createElement("video");
    water.muted = true;
    // CORS: its frames go into WebGL, and the file may be on the media domain
    water.crossOrigin = "anonymous";
    water.loop = true;
    water.playsInline = true;
    water.preload = "auto";
    let disposed = false;
    const loadWater = () => {
      if (disposed || water.src) return;
      water.src = waterSource(phone, (t) => water.canPlayType(t));
      water.load();
    };
    // after Diamante's own video has what it needs to play through (it is
    // the first thing seen), or 3 s at most; a scroll into the sea before
    // that fetches it at once (draw)
    const placeVideo = stage.querySelector<HTMLVideoElement>(".city-place-video");
    let idle: number | undefined;
    const soon = () => {
      if (idle !== undefined || disposed) return;
      idle = "requestIdleCallback" in window ? window.requestIdleCallback(loadWater, { timeout: 2000 }) : window.setTimeout(loadWater, 300);
    };
    const wait = window.setTimeout(soon, 3000);
    if (placeVideo && placeVideo.readyState < 4) placeVideo.addEventListener("canplaythrough", soon, { once: true });
    else soon();

    const portrait = new Image();
    portrait.decoding = "async";
    // into WebGL, possibly from the media domain
    portrait.crossOrigin = "anonymous";
    portrait.onload = () => {
      upload(2, T.portrait, portrait, false);
    };
    portrait.src = portraitSrc;

    // Diamante under the shallows: its own video frame, or its poster
    const placeSource = () => {
      const vid = placeVideoOn(stage);
      if (vid && vid.readyState >= 2 && getComputedStyle(vid).display !== "none") return vid;
      const img = stage.querySelector<HTMLImageElement>(".city-place-photo");
      return img && img.complete && img.naturalWidth ? img : null;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(stage.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(stage.clientHeight * dpr));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(stage);

    const t0 = performance.now();
    let frame = 0;

    const draw = (now: number) => {
      frame = 0;
      const sea = seaPhase(wash.get());
      const on = sea.on;
      canvas.style.visibility = on ? "visible" : "hidden";
      if (!on) {
        if (!water.paused) water.pause();
        return;
      }
      loadWater();
      if (water.paused) void water.play().catch(() => {});
      const W = canvas.width;
      const H = canvas.height;
      const dpr = W / Math.max(1, stage.clientWidth);
      gl.viewport(0, 0, W, H);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (water.readyState >= 2) upload(0, T.water, water, true);
      const after = sea.after;
      const src = !after ? placeSource() : null;
      let placeSz: [number, number] = [16, 9];
      if (src) {
        upload(1, T.place, src, false);
        placeSz = src instanceof HTMLVideoElement ? [src.videoWidth, src.videoHeight] : [src.naturalWidth, src.naturalHeight];
      }
      const c = camera.get();
      gl.uniform2f(U("res"), W, H);
      gl.uniform2f(U("placeSz"), placeSz[0], placeSz[1]);
      gl.uniform2f(U("portSz"), portraitSize.width, portraitSize.height);
      gl.uniform2f(U("vidSz"), water.videoWidth || 1440, water.videoHeight || 2560);
      gl.uniform3f(U("cam"), c.scale * dpr, c.x * dpr, c.y * dpr);
      gl.uniform1f(U("rise"), sea.rise);
      gl.uniform1f(U("fall"), sea.fall);
      gl.uniform1f(U("after"), after ? 1 : 0);
      gl.uniform1f(U("placeZoom"), sea.placeZoom);
      gl.uniform1f(U("t"), (now - t0) / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      frame = requestAnimationFrame(draw);
    };
    const kick = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const off = wash.on("change", kick);
    kick();

    return () => {
      disposed = true;
      off();
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.clearTimeout(wait);
      placeVideo?.removeEventListener("canplaythrough", soon);
      if (idle !== undefined) {
        if ("cancelIdleCallback" in window) window.cancelIdleCallback(idle);
        else window.clearTimeout(idle);
      }
      water.pause();
      water.removeAttribute("src");
      water.load();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [wash, camera, portraitSrc, portraitSize, phone]);

  return <canvas ref={ref} className="city-sea" aria-hidden="true" style={{ visibility: "hidden" }} />;
}
