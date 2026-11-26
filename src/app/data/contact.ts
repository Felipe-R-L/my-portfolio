/**
 * Contact channels, in one place so the hero, the contact section and any
 * future page agree on them.
 *
 * WHATSAPP_NUMBER is digits only, with country and area code
 * (e.g. "5516999999999"). While it is empty every WhatsApp button falls back to
 * the #contact section, so the site never ships a link to a placeholder number.
 */
export const WHATSAPP_NUMBER = "5519994799468";

export const EMAIL = "leone.feliper@gmail.com";

/** wa.me link with a pre-filled first message, or null when no number is set. */
export function whatsappHref(message: string): string | null {
  if (!WHATSAPP_NUMBER) return null;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * Availability shown next to the contact button. OFF by default: nothing is
 * shown until Felipe sets `enabled: true` and writes the text for both
 * languages (e.g. "Agenda aberta a partir de março" / "Booking from March").
 * Keep it a fact he can stand behind on the day it is read.
 */
export const AVAILABILITY: { enabled: boolean; text: { pt: string; en: string } } = {
  enabled: false,
  text: { pt: "", en: "" },
};

/** The kinds of project the contact chips offer, each with its own WhatsApp
    message in i18n (`talk.chips.<kind>`). */
export const PROJECT_KINDS = ["site", "loja", "sistema", "outro"] as const;
export type ProjectKind = (typeof PROJECT_KINDS)[number];
