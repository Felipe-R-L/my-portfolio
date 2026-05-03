import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { Mail, Send, MessageSquare } from "lucide-react";
import SpotlightCard from "./react-bits/SpotlightCard";
import BorderGlow from "./react-bits/BorderGlow";
import SplitText from "./react-bits/SplitText";

const XIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.49h2.039L6.486 3.24H4.298l13.311 17.403z" />
  </svg>
);

export function Contact() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");

    // Construct mailto link as a fallback or use a real service later
    const subject = `Portfolio Contact from ${formData.name}`;
    const body = `${formData.message}\n\nFrom: ${formData.name} (${formData.email})`;
    window.location.href = `mailto:leone.feliper@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    setTimeout(() => setStatus("sent"), 1000);
  };

  const socials = [
    {
      icon: "https://cdn.simpleicons.org/github/white",
      href: "https://github.com/Felipe-R-L",
      label: "GitHub",
      color: "hover:scale-110",
    },
    {
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/linkedin/linkedin-original.svg",
      href: "https://linkedin.com/in/felipe-rodrigues-leone",
      label: "LinkedIn",
      color: "hover:scale-110",
    },
    {
      icon: "https://cdn.simpleicons.org/x/white",
      href: "https://x.com/rfelipe_jpg",
      label: "X",
      color: "hover:scale-110",
    },
  ];

  return (
    <section className="py-24 px-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[60rem] bg-blue-600/10 rounded-full filter blur-[150px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center flex-wrap gap-y-4 mb-6">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="mr-4 text-blue-500"
            >
              <MessageSquare className="w-12 h-12" />
            </motion.div>

            <SplitText
              text={t("contact.title_part1")}
              delay={30}
              className="text-4xl md:text-5xl font-bold text-white tracking-tighter uppercase"
            />

            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
                delay: 0.1,
              }}
              className="mx-6 w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.8)]"
            />

            <span className="text-white/40">
              <SplitText
                text={t("contact.title_part2")}
                delay={30}
                className="text-4xl md:text-5xl font-bold tracking-tighter uppercase"
              />
            </span>
          </div>

          <motion.div
            className="w-24 h-1 bg-blue-500/50 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)]"
            initial={{ width: 0 }}
            whileInView={{ width: 96 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          />
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-12 items-start">
          {/* Contact Info & Socials */}
          <div className="lg:col-span-2 space-y-12">
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">
                {t("contact.cta_title")}
              </h3>
              <p className="text-gray-400 text-lg leading-relaxed mb-8">
                {t("contact.cta_desc")}
              </p>

              <div className="flex items-center space-x-4 text-gray-300 hover:text-white transition-colors group">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:border-blue-500/50 transition-colors">
                  <Mail className="w-6 h-6" />
                </div>
                <span className="text-lg md:text-xl font-light break-all">
                  leone.feliper@gmail.com
                </span>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-bold text-white/40 uppercase tracking-[0.2em]">
                {t("contact.social_title")}
              </h4>
              <div className="flex gap-4">
                {socials.map((social, idx) => (
                  <motion.a
                    key={idx}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-4 rounded-2xl bg-white/[0.03] border border-white/5 ${social.color} transition-all duration-300 group hover:bg-white/[0.08] hover:border-white/20`}
                    whileHover={{ y: -5, scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <img
                      src={social.icon}
                      alt={social.label}
                      className="w-7 h-7"
                    />
                  </motion.a>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3">
            <BorderGlow glowColor="rgba(59, 130, 246, 0.5)" glowRadius={300}>
              <SpotlightCard
                className="p-8 md:p-10"
                spotlightColor="rgba(59, 130, 246, 0.1)"
              >
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">
                        {t("contact.form.name")}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={t("contact.form.placeholder_name")}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-white/10 focus:outline-none focus:border-blue-500/50 transition-colors"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">
                        {t("contact.form.email")}
                      </label>
                      <input
                        type="email"
                        required
                        placeholder={t("contact.form.placeholder_email")}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-white/10 focus:outline-none focus:border-blue-500/50 transition-colors"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">
                      {t("contact.form.message")}
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder={t("contact.form.placeholder_message")}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-white/10 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={status === "sending"}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {status === "sending" ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t("contact.form.sending")}
                      </span>
                    ) : status === "sent" ? (
                      t("contact.form.sent")
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        {t("contact.form.send")}
                      </>
                    )}
                  </motion.button>
                </form>
              </SpotlightCard>
            </BorderGlow>
          </div>
        </div>
      </div>
    </section>
  );
}
