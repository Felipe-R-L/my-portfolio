import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Route } from "lucide-react";

import { Section } from "./shared/Section";
import { SectionHeading } from "./shared/SectionHeading";
import { eyebrowShape } from "./shared/cardType";

/**
 * Someone hiring a freelancer for the first time mostly wants to know what
 * happens after they send the first message. Four numbered steps answer that
 * before they have to ask, and step two is the same "free draft" offer used in
 * outreach messages, so the site and the pitch say the same thing.
 */
const STEPS = ["talk", "draft", "build", "launch"] as const;

export function Process() {
  const { t } = useTranslation();

  return (
    <Section id="process">
      <SectionHeading
        icon={Route}
        accent="warm"
        title={t("process.title_part1")}
        subtitle={t("process.title_part2")}
      >
        <p className="mt-4 text-gray-400 max-w-2xl leading-relaxed">{t("process.lead")}</p>
      </SectionHeading>

      <ol className="relative z-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {STEPS.map((step, idx) => (
          <motion.li
            key={step}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.02] p-6"
          >
            <span
              className={`${eyebrowShape} text-[var(--zone-b-1)] tabular-nums`}
              aria-hidden="true"
            >
              {String(idx + 1).padStart(2, "0")}
            </span>
            <h3 className="text-xl font-bold text-white tracking-[-0.025em] leading-[1.15]">
              {t(`process.steps.${step}.title`)}
            </h3>
            <p className="text-sm md:text-[15px] text-gray-300 font-light leading-[1.7]">
              {t(`process.steps.${step}.description`)}
            </p>
          </motion.li>
        ))}
      </ol>
    </Section>
  );
}
