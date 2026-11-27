import { SkipForward, Volume2, VolumeX } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PLAYLIST } from "./cues";
import { sound } from "./sound";
import { useSoundVersion } from "./useSound";
import "./MiniPlayer.css";

/**
 * The music, in a corner: what is playing, mute it, the next one. Only there
 * while the sound is on (the nav's toggle turns the sound itself on and off).
 */
export function MiniPlayer() {
  const { t } = useTranslation();
  useSoundVersion();
  if (!sound.on || !PLAYLIST.length) return null;
  const track = PLAYLIST[sound.track];
  const musicOn = sound.musicOn;
  return (
    <section className="mini-player glass-dark" aria-label={t("player.label")} data-muted={!musicOn || undefined}>
      <button
        type="button"
        className="mini-player-btn"
        aria-pressed={!musicOn}
        aria-label={musicOn ? t("player.mute") : t("player.unmute")}
        title={musicOn ? t("player.mute") : t("player.unmute")}
        onClick={() => sound.setMusic(!musicOn)}
      >
        {musicOn ? <Volume2 size={14} aria-hidden="true" /> : <VolumeX size={14} aria-hidden="true" />}
      </button>
      <p className="mini-player-track" aria-live="polite">
        <span className="mini-player-title">{track.title}</span>
        <span className="mini-player-artist"> · {track.artist}</span>
      </p>
      <button
        type="button"
        className="mini-player-btn"
        aria-label={t("player.next")}
        title={t("player.next")}
        onClick={() => sound.next()}
      >
        <SkipForward size={13} aria-hidden="true" />
      </button>
    </section>
  );
}
