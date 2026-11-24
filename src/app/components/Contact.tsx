import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { Mail, MessageSquare, MessageCircle } from "lucide-react";

import { Section } from "./shared/Section";
import { SectionHeading } from "./shared/SectionHeading";
import { SocialLinks } from "./shared/SocialLinks";
import { EMAIL, whatsappHref } from "../data/contact";

/**
 * Two direct channels and nothing to fill in. The old form only built a
 * mailto: link, so it was the e-mail button with extra steps.
 */
export function Contact() {
  const { t } = useTranslation();
  const whatsapp = whatsappHref(t("contact.whatsapp_message"));

  return (
    <Section id="contact" className="overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[60rem] bg-[color-mix(in_oklab,var(--zone-b-2)_9%,transparent)] rounded-full filter blur-[150px] pointer-events-none"
      />

      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <SectionHeading
            icon={MessageSquare}
            iconMotion="rock"
            accent="warm"
            title={t("contact.title_part1")}
            subtitle={t("contact.title_part2")}
          />
        </motion.div>

        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-12 lg:gap-16 items-start">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">
              {t("contact.cta_title")}
            </h3>
            <p className="text-gray-400 text-lg leading-relaxed mb-10 max-w-xl">
              {t("contact.cta_desc")}
            </p>

            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
              {whatsapp && (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-3 px-7 py-4 rounded-full bg-[var(--zone-b-1)] hover:brightness-110 text-[#231603] font-bold text-lg transition-all shadow-[0_10px_30px_-10px_color-mix(in_oklab,var(--zone-b-1)_70%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--zone-b-1)]"
                >
                  <MessageCircle className="w-5 h-5" aria-hidden="true" />
                  {t("contact.whatsapp_cta")}
                </a>
              )}

              <a
                href={`mailto:${EMAIL}`}
                className="inline-flex items-center justify-center gap-3 px-7 py-4 rounded-full border border-white/20 hover:border-white/45 hover:bg-white/5 text-white font-medium text-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                <Mail className="w-5 h-5" aria-hidden="true" />
                <span className="break-all">{EMAIL}</span>
              </a>
            </div>
          </div>

          {/* Networking has its own invitation, so a fellow developer or a
              potential partner does not have to read the client pitch as
              addressed to them. */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-7 md:p-8">
            <h4 className="text-lg font-bold text-white mb-2">{t("contact.network_title")}</h4>
            <p className="text-gray-400 text-[15px] leading-relaxed font-light mb-6">
              {t("contact.network_desc")}
            </p>
            <SocialLinks variant="panel" />
          </div>
        </div>
      </div>
    </Section>
  );
}
