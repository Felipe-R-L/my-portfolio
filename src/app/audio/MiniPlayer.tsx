import { SkipForward } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PLAYLIST } from "./cues";
import { sound } from "./sound";
import { useSoundVersion } from "./useSound";
import "./SoundToggle.css";
import "./MiniPlayer.css";

/** How far down the page a visitor who left the sound off has to go before
    the invitation folds away into a dot. */
const FOLD_AT = 48;

/**
 * The sound, in a corner. It is the only switch for it.
 * - Off, on arrival: a small invitation, the bars swelling, "turn the sound
 *   on". Nothing plays until it is clicked.
 * - Off, and the visitor went on scrolling anyway (or turned it off): a dot
 *   in the same place, still a button.
 * - On: the bars (click to turn everything off), what is playing, the next.
 */
export function MiniPlayer() {
  const { t } = useTranslation();
  useSoundVersion();
  const on = sound.on;
  const [folded, setFolded] = useState(false);

  // the sea under the music, the whole way down (only heard with the sound on)
  useEffect(() => {
    sound.level("sea", 1);
    return () => sound.level("sea", 0);
  }, []);

  useEffect(() => {
    if (on || folded) return;
    const check = () => window.scrollY > FOLD_AT && setFolded(true);
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, [on, folded]);

  // On a phone the corner is over the text as it scrolls by: the dot steps
  // out of the way going down and comes back going up (like a phone's own
  // address bar), and so does the player. The invitation stays put.
  const [away, setAway] = useState(false);
  useEffect(() => {
    if (!on && !folded) {
      setAway(false);
      return;
    }
    const phone = window.matchMedia?.("(max-width: 767px)");
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 6) return;
      setAway(!!phone?.matches && y > last);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [on, folded]);

  if (!PLAYLIST.length) return null;

  const turnOn = () => {
    sound.setMusic(true);
    sound.set(true);
  };
  const turnOff = () => {
    setFolded(true);
    sound.set(false);
  };

  if (!on) {
    return (
      <section
        className="mini-player glass-dark"
        data-state={folded ? "dot" : "invite"}
        data-away={away || undefined}
        aria-label={t("player.label")}
      >
        <button
          type="button"
          className="mini-player-invite"
          aria-pressed="false"
          aria-label={t("player.on")}
          title={t("player.on")}
          onClick={turnOn}
        >
          <Bars live={!folded} />
          <span className="mini-player-cta" aria-hidden="true">
            {t("player.on")}
          </span>
        </button>
      </section>
    );
  }

  const track = PLAYLIST[sound.track];
  return (
    <section
      className="mini-player glass-dark"
      data-state="on"
      data-away={away || undefined}
      aria-label={t("player.label")}
    >
      <button
        type="button"
        className="mini-player-btn"
        aria-pressed="true"
        aria-label={t("player.off")}
        title={t("player.off")}
        onClick={turnOff}
      >
        <Bars live />
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

/** Four bars: swelling while there is (or could be) sound, flat in the dot. */
function Bars({ live }: { live: boolean }) {
  return (
    <span className="sound-bars" aria-hidden="true" data-on={live || undefined}>
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}
