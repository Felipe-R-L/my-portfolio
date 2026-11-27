import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";

import "../../src/app/i18n/config";
import { MiniPlayer } from "../../src/app/audio/MiniPlayer";
import { PLAYLIST } from "../../src/app/audio/cues";
import { sound } from "../../src/app/audio/sound";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("the sound corner", () => {
  it("invites, folds to a dot on scroll, turns the sound on and off, steps through the list", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);
    const player = () => el.querySelector(".mini-player");
    act(() => root.render(<MiniPlayer />));
    expect(player()?.getAttribute("data-state")).toBe("invite");

    // scrolled on with the sound still off: a dot in the same place
    act(() => {
      Object.defineProperty(window, "scrollY", { value: 200, configurable: true });
      window.dispatchEvent(new Event("scroll"));
    });
    expect(player()?.getAttribute("data-state")).toBe("dot");

    // the dot is still the switch
    act(() => (el.querySelector(".mini-player button") as HTMLButtonElement).click());
    expect(sound.on).toBe(true);
    expect(player()?.getAttribute("data-state")).toBe("on");
    const title = () => el.querySelector(".mini-player-title")?.textContent;
    expect(title()).toBe(PLAYLIST[sound.track].title);
    const before = sound.track;
    act(() => (el.querySelectorAll(".mini-player button")[1] as HTMLButtonElement).click());
    expect(sound.track).toBe((before + 1) % PLAYLIST.length);
    expect(title()).toBe(PLAYLIST[sound.track].title);

    // off from the player: back to the dot, not the invitation
    act(() => (el.querySelector(".mini-player button") as HTMLButtonElement).click());
    expect(sound.on).toBe(false);
    expect(player()?.getAttribute("data-state")).toBe("dot");
    act(() => root.unmount());
    el.remove();
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
  });
});
