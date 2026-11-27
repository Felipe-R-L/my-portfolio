import { CUES, MUSIC, PLAYLIST, type Cue } from "./cues";
import { render } from "./synth";

/**
 * The site's sound. Off by default and off until the visitor turns it on:
 * nothing plays, loads or creates an AudioContext before that click, so a
 * visitor who never asks for sound pays nothing for it. The choice is
 * remembered on this device.
 *
 * Music runs through a low gain and fades in and out; cues are short buffers
 * decoded once. Everything pauses while the tab is hidden.
 */

const KEY = "frl-sound";
const MUSIC_KEY = "frl-music";
const TRACK_KEY = "frl-track";
type Listener = (on: boolean) => void;

let on = read();
/** The music within the sound: the visitor can mute it and keep the rest. */
let musicOn = remembered(MUSIC_KEY) !== "off";
let track = Math.min(PLAYLIST.length - 1, Math.max(0, Number(remembered(TRACK_KEY)) || 0));
/** Bumped on every change, for React (useSyncExternalStore). */
let version = 0;
const listeners = new Set<Listener>();
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicGain: GainNode | null = null;
let music: HTMLAudioElement | null = null;
const buffers = new Map<Cue, AudioBuffer>();
/** Loops (the wind): a source that runs while its level is above zero. */
const loops = new Map<Cue, { gain: GainNode; src: AudioBufferSourceNode | null }>();
const levels = new Map<Cue, number>();
const lastPlayed = new Map<Cue, number>();

function read() {
  try {
    return localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
}

function remembered(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function remember(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode */
  }
}

function notify() {
  version++;
  listeners.forEach((l) => l(on));
}

function write(value: boolean) {
  try {
    localStorage.setItem(KEY, value ? "on" : "off");
  } catch {
    /* private mode: the choice just isn't remembered */
  }
}

function graph() {
  if (ctx) return ctx;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  master = ctx.createGain();
  master.connect(ctx.destination);
  musicGain = ctx.createGain();
  musicGain.gain.value = 0;
  musicGain.connect(master);
  for (const name of Object.keys(CUES) as Cue[]) void load(name);
  if (PLAYLIST.length) {
    music = new Audio();
    music.crossOrigin = "anonymous";
    music.preload = "auto";
    music.src = PLAYLIST[track].src;
    // one track after another, round the list
    music.addEventListener("ended", () => sound.next());
    ctx.createMediaElementSource(music).connect(musicGain);
  }
  document.addEventListener("visibilitychange", onVisibility);
  return ctx;
}

async function load(name: Cue) {
  const { src, synth } = CUES[name];
  if (!ctx || buffers.has(name)) return;
  if (synth) {
    const data = render(synth, ctx.sampleRate);
    const buffer = ctx.createBuffer(1, data.length, ctx.sampleRate);
    buffer.copyToChannel(data, 0);
    buffers.set(name, buffer);
    return;
  }
  if (!src) return;
  try {
    const data = await (await fetch(src)).arrayBuffer();
    buffers.set(name, await ctx.decodeAudioData(data));
    if (CUES[name].loop) applyLevel(name);
  } catch {
    /* a missing cue stays silent */
  }
}

/** Bring a loop to its asked level, starting its source the first time. */
function applyLevel(name: Cue) {
  if (!ctx || !master) return;
  const buffer = buffers.get(name);
  if (!buffer) return;
  let l = loops.get(name);
  if (!l) {
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(master);
    l = { gain, src: null };
    loops.set(name, l);
  }
  const level = on ? (levels.get(name) ?? 0) : 0;
  if (level > 0 && !l.src) {
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.connect(l.gain);
    src.start();
    l.src = src;
  }
  const g = l.gain.gain;
  g.cancelScheduledValues(ctx.currentTime);
  g.setValueAtTime(g.value, ctx.currentTime);
  // a short ramp: the level follows the scroll without zipper noise
  g.linearRampToValueAtTime(CUES[name].volume * level, ctx.currentTime + 0.25);
}

function fadeMusic(to: number, seconds: number) {
  if (!ctx || !musicGain) return;
  const g = musicGain.gain;
  g.cancelScheduledValues(ctx.currentTime);
  g.setValueAtTime(g.value, ctx.currentTime);
  g.linearRampToValueAtTime(to, ctx.currentTime + seconds);
}

function start() {
  const c = graph();
  if (!c) return;
  void c.resume();
  if (music && musicOn) {
    void music.play().catch(() => {});
    fadeMusic(MUSIC.volume, 1.6);
  }
  for (const name of levels.keys()) applyLevel(name);
}

function stop() {
  if (!ctx) return;
  fadeMusic(0, 0.5);
  for (const name of loops.keys()) applyLevel(name);
  window.setTimeout(() => {
    if (on) return;
    music?.pause();
    void ctx?.suspend();
  }, 550);
}

function onVisibility() {
  if (!on || !ctx) return;
  if (document.hidden) {
    music?.pause();
    void ctx.suspend();
  } else {
    void ctx.resume();
    if (music && musicOn) void music.play().catch(() => {});
  }
}

export const sound = {
  get on() {
    return on;
  },
  /** Must be called from a user gesture (a click) the first time. */
  set(value: boolean) {
    if (value === on) return;
    on = value;
    write(value);
    if (value) start();
    else stop();
    notify();
  },
  get version() {
    return version;
  },
  get musicOn() {
    return musicOn;
  },
  /** The track now (index into PLAYLIST). */
  get track() {
    return track;
  },
  /** Music on or off, the other sounds unchanged. */
  setMusic(value: boolean) {
    if (value === musicOn) return;
    musicOn = value;
    remember(MUSIC_KEY, value ? "on" : "off");
    if (on && music) {
      if (value) {
        void music.play().catch(() => {});
        fadeMusic(MUSIC.volume, 0.8);
      } else {
        fadeMusic(0, 0.4);
        window.setTimeout(() => !musicOn && music?.pause(), 450);
      }
    }
    notify();
  },
  /** The next track (or the one before, with -1), faded across. */
  next(dir = 1) {
    track = (track + dir + PLAYLIST.length) % PLAYLIST.length;
    remember(TRACK_KEY, String(track));
    const el = music;
    if (el) {
      const swap = () => {
        el.src = PLAYLIST[track].src;
        if (on && musicOn) {
          void el.play().catch(() => {});
          fadeMusic(MUSIC.volume, 0.8);
        }
      };
      if (on && musicOn && !el.paused) {
        fadeMusic(0, 0.3);
        window.setTimeout(swap, 320);
      } else swap();
    }
    notify();
  },
  toggle() {
    sound.set(!on);
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => void listeners.delete(l);
  },
  /** Set a loop's level, 0 to 1 (the wind under the hero). Cheap to call
      every frame: nothing happens until the level actually changes. */
  level(name: Cue, value: number) {
    const v = Math.round(Math.max(0, Math.min(1, value)) * 50) / 50;
    if (levels.get(name) === v) return;
    levels.set(name, v);
    if (on && ctx) applyLevel(name);
  },
  /** Play a cue if sound is on. `pan` runs from -1 (left) to 1 (right). */
  play(name: Cue, opts: { volume?: number; pan?: number; rate?: number } = {}) {
    if (!on || !ctx || !master || ctx.state !== "running") return;
    const buffer = buffers.get(name);
    if (!buffer) return;
    // the same cue fired twice in a breath sounds like a glitch
    const now = ctx.currentTime;
    if (now - (lastPlayed.get(name) ?? -1) < 0.08) return;
    lastPlayed.set(name, now);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = opts.rate ?? 1;
    const gain = ctx.createGain();
    gain.gain.value = CUES[name].volume * (opts.volume ?? 1);
    let node: AudioNode = gain;
    if (opts.pan && "createStereoPanner" in ctx) {
      const p = ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, opts.pan));
      gain.connect(p);
      node = p;
    }
    node.connect(master);
    src.connect(gain);
    src.start();
  },
};

/**
 * A remembered "on" from an earlier visit cannot start audio by itself (the
 * browser needs a gesture), so the first interaction of the visit resumes it.
 */
if (typeof window !== "undefined" && on) {
  const resume = () => {
    window.removeEventListener("pointerdown", resume);
    window.removeEventListener("keydown", resume);
    if (on) start();
  };
  window.addEventListener("pointerdown", resume, { once: true });
  window.addEventListener("keydown", resume, { once: true });
}
