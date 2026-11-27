import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";

import "../../src/app/i18n/config";
import { MiniPlayer } from "../../src/app/audio/MiniPlayer";
import { PLAYLIST } from "../../src/app/audio/cues";
import { sound } from "../../src/app/audio/sound";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("the music player", () => {
  it("is not there while the sound is off, and steps through the list when on", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);
    act(() => root.render(<MiniPlayer />));
    expect(el.querySelector(".mini-player")).toBeNull();

    act(() => sound.set(true));
    const title = () => el.querySelector(".mini-player-title")?.textContent;
    expect(title()).toBe(PLAYLIST[sound.track].title);
    const before = sound.track;
    act(() => (el.querySelectorAll(".mini-player button")[1] as HTMLButtonElement).click());
    expect(sound.track).toBe((before + 1) % PLAYLIST.length);
    expect(title()).toBe(PLAYLIST[sound.track].title);

    act(() => (el.querySelector(".mini-player button") as HTMLButtonElement).click());
    expect(sound.musicOn).toBe(false);
    expect(el.querySelector(".mini-player button")?.getAttribute("aria-pressed")).toBe("true");

    act(() => sound.set(false));
    expect(el.querySelector(".mini-player")).toBeNull();
    act(() => root.unmount());
    el.remove();
  });
});
