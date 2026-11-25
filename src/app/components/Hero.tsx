import { About } from "./About";
import { HeroCity } from "./hero/HeroCity";
import { HeroPhoto } from "./hero/HeroPhoto";
import { readHeroVariant } from "./hero/HeroParts";
import "./Hero.css";

/**
 * The top of the page, through "who I am". Two compositions while we choose
 * one, picked with `?hero=`:
 *
 * - `cidade` (default): the surname is a window onto the Campinas skyline,
 *   the camera flies through it and pulls back to the portrait, where the
 *   pointer brings back colour and About sits at the foot as a caption.
 * - `foto`: a full-bleed portrait behind the name, then the same short About.
 */
export function Hero() {
  const variant = readHeroVariant();
  if (variant === "foto") {
    return (
      <>
        <HeroPhoto />
        <About />
      </>
    );
  }
  return <HeroCity />;
}
