import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Building2 } from "lucide-react";

import { OMD_PRODUCTS } from "../data/projects";
import { CardLink } from "./shared/CardLink";
import { eyebrow, footnote, statValue } from "./shared/cardType";

/**
 * The freelance homepage condenses the employer work into one band of proof:
 * the same stack and care that runs a platform at scale is what goes into a
 * client's project. The full Experience section stays in the codebase for the
 * job-hunting version of the site.
 */
export function Credibility() {
  const { t } = useTranslation();
  const omdfarm = OMD_PRODUCTS.find((p) => p.id === "omdfarm");
  const k = (key: string) => `experience.omd.omdfarm.${key}`;

  return (
    <section aria-labelledby="credibility-title" className="relative z-10 px-[var(--gutter)] py-10 md:py-14">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="measure rounded-3xl border border-white/10 bg-gradient-to-br from-[color-mix(in_oklab,var(--zone-a-1)_8%,transparent)] to-white/[0.02] p-6 md:p-8 grid lg:grid-cols-[1.3fr_1fr] gap-6 lg:gap-10 items-center"
      >
        <div className="flex flex-col gap-3">
          <div className={`flex items-center gap-2.5 ${eyebrow}`}>
            <Building2 className="w-4 h-4 text-[var(--zone-a-1)]" aria-hidden="true" />
            <span>{t("credibility.eyebrow")}</span>
          </div>
          <h2
            id="credibility-title"
            className="text-xl md:text-2xl font-bold text-white tracking-[-0.025em] leading-[1.25]"
          >
            {t("credibility.title")}
          </h2>
          <p className="text-[15px] md:text-base text-gray-300 font-light leading-[1.7]">
            {t("credibility.description")}
          </p>
          {omdfarm && (
            <div className="pt-1">
              <CardLink
                tone="cold"
                href={omdfarm.url}
                label={t(k("visit"))}
                ariaLabel={t(k("visit_aria"))}
              />
            </div>
          )}
        </div>

        {omdfarm?.metrics && (
          <div>
            <dl className="grid grid-cols-3 gap-4">
              {omdfarm.metrics.map((metric) => (
                <div key={metric.labelKey}>
                  <dd className={statValue}>{metric.value}</dd>
                  <dt className={`${eyebrow} mt-1`}>{t(k(`metrics.${metric.labelKey}`))}</dt>
                </div>
              ))}
            </dl>
            {/* OMD's own published figures, so the source is always shown. */}
            <p className={`mt-3 ${footnote}`}>{t(k("metrics_source"))}</p>
          </div>
        )}
      </motion.div>
    </section>
  );
}
