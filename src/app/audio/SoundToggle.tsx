import { useTranslation } from "react-i18next";
import { sound } from "./sound";
import { useSoundOn } from "./useSound";
import "./SoundToggle.css";

/** Sound on or off: four bars, still and flat when off, a slow swell when on. */
export function SoundToggle({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  const on = useSoundOn();
  return (
    <button
      type="button"
      className={`sound-toggle ${className}`}
      aria-pressed={on}
      title={t("nav.sound")}
      onClick={() => sound.toggle()}
    >
      <span className="sr-only">{t("nav.sound")}</span>
      <span className="sound-bars" aria-hidden="true" data-on={on || undefined}>
        <i />
        <i />
        <i />
        <i />
      </span>
    </button>
  );
}
