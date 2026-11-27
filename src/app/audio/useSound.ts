import { useSyncExternalStore } from "react";
import { sound } from "./sound";

export function useSoundOn() {
  return useSyncExternalStore(sound.subscribe, () => sound.on, () => false);
}

/** Re-renders on any change to the sound (on, music, track). */
export function useSoundVersion() {
  return useSyncExternalStore(sound.subscribe, () => sound.version, () => 0);
}
