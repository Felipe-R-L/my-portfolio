import React, { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { Mail, Send, MessageSquare } from "lucide-react";

import { Section } from "./shared/Section";
import { SectionHeading } from "./shared/SectionHeading";
import { SocialLinks } from "./shared/SocialLinks";
import { GlowCard } from "./shared/GlowCard";

const FIELD_CLASS =
  "w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[color-mix(in_oklab,var(--zone-b-1)_55%,transparent)] transition-colors";
// Raised from text-white/40 (3.79:1 on the card background) to clear WCAG AA.
const LABEL_CLASS =
  "text-xs font-bold text-white/70 uppercase tracking-widest ml-1";

export function Contact() {
  const { t } = useTranslation();
  const fieldId = useId();
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");

    const subject = `Portfolio Contact from ${formData.name}`;
    const body = `${formData.message}\n\nFrom: ${formData.name} (${formData.email})`;
    window.location.href = `mailto:leone.feliper@gmail.com?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;

    setTimeout(() => setStatus("sent"), 1000);
  };

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

        <div className="grid lg:grid-cols-5 gap-12 items-start">
          {/* Contact Info & Socials */}
          <div className="lg:col-span-2 space-y-12">
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">{t("contact.cta_title")}</h3>
              <p className="text-gray-400 text-lg leading-relaxed mb-8">{t("contact.cta_desc")}</p>

              <a
                href="mailto:leone.feliper@gmail.com"
                className="flex items-center space-x-4 text-gray-300 hover:text-white transition-colors group"
              >
                <span className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:border-[color-mix(in_oklab,var(--zone-b-1)_55%,transparent)] transition-colors">
                  <Mail className="w-6 h-6" aria-hidden="true" />
                </span>
                <span className="text-lg md:text-xl font-light break-all">
                  leone.feliper@gmail.com
                </span>
              </a>
            </div>

            <div className="space-y-6">
              {/* Raised from text-white/40 (3.7:1 on #030305) to clear WCAG AA. */}
              <h4 className="text-sm font-bold text-white/70 uppercase tracking-[0.2em]">
                {t("contact.social_title")}
              </h4>
              <SocialLinks variant="panel" />
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3">
            <GlowCard
              glowColor="color-mix(in oklab, var(--zone-b-1) 45%, transparent)"
              spotlightColor="color-mix(in oklab, var(--zone-b-1) 10%, transparent)"
              className=""
              contentClassName="p-8 md:p-10"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor={`${fieldId}-name`} className={LABEL_CLASS}>
                      {t("contact.form.name")}
                    </label>
                    <input
                      id={`${fieldId}-name`}
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      placeholder={t("contact.form.placeholder_name")}
                      className={FIELD_CLASS}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor={`${fieldId}-email`} className={LABEL_CLASS}>
                      {t("contact.form.email")}
                    </label>
                    <input
                      id={`${fieldId}-email`}
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder={t("contact.form.placeholder_email")}
                      className={FIELD_CLASS}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor={`${fieldId}-message`} className={LABEL_CLASS}>
                    {t("contact.form.message")}
                  </label>
                  <textarea
                    id={`${fieldId}-message`}
                    name="message"
                    required
                    rows={5}
                    placeholder={t("contact.form.placeholder_message")}
                    className={`${FIELD_CLASS} resize-none`}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full bg-[var(--zone-b-1)] hover:brightness-110 text-[#231603] font-bold py-5 rounded-xl flex items-center justify-center gap-3 transition-all shadow-[0_6px_24px_-6px_color-mix(in_oklab,var(--zone-b-1)_60%,transparent)] disabled:opacity-70"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {status === "sending" ? (
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                      />
                      {t("contact.form.sending")}
                    </span>
                  ) : status === "sent" ? (
                    t("contact.form.sent")
                  ) : (
                    <>
                      <Send className="w-5 h-5" aria-hidden="true" />
                      {t("contact.form.send")}
                    </>
                  )}
                </motion.button>

                <p aria-live="polite" className="sr-only">
                  {status === "sending"
                    ? t("contact.form.sending")
                    : status === "sent"
                      ? t("contact.form.sent")
                      : ""}
                </p>
              </form>
            </GlowCard>
          </div>
        </div>
      </div>
    </Section>
  );
}
