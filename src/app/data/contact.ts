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
