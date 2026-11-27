import { useSyncExternalStore } from "react";
import { sound } from "./sound";

export function useSoundOn() {
  return useSyncExternalStore(sound.subscribe, () => sound.on, () => false);
}
