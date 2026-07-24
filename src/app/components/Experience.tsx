import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Terminal } from "lucide-react";

import { OMD_PRODUCTS, type Product } from "../data/projects";
import { Section } from "./shared/Section";
import { SectionHeading } from "./shared/SectionHeading";
import { AmbientOrbs, type Orb } from "./shared/AmbientOrbs";
import { ProjectVisual } from "./shared/ProjectVisual";
import { StackTags } from "./shared/StackTags";
import { CardLink, CardNote } from "./shared/CardLink";
import {
  bodyLead,
  cardTitle,
  employerName,
  eyebrow,
  footnote,
  leadBox,
  statValue,
} from "./shared/cardType";

const ORBS: Orb[] = [
  {
    className:
      "top-1/2 left-0 -translate-y-1/2 w-[30rem] h-[30rem] bg-[color-mix(in_oklab,var(--zone-a-1)_18%,transparent)] mix-blend-screen filter blur-[130px]",
    x: [0, 25, -15, 0],
    y: [0, -20, 15, 0],
    duration: 14,
  },
  {
    className:
      "top-1/4 right-0 w-[40rem] h-[40rem] bg-[color-mix(in_oklab,var(--zone-a-2)_16%,transparent)] mix-blend-screen filter blur-[150px]",
    x: [0, -30, 20, 0],
    y: [0, 15, -25, 0],
    duration: 16,
    delay: 2,
  },
];

const BASE = "experience.omd";

function ProductRow({ product, index }: { product: Product; index: number }) {
  const { t } = useTranslation();
  const k = (key: string) => `${BASE}.${product.id}.${key}`;
  const name = t(k("name"));

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="grid md:grid-cols-[1.15fr_1fr] border-t border-white/10 first:border-t-0"
    >
      <div className="relative bg-[#07070c] min-h-[240px]">
        <ProjectVisual
          visual={product.visual}
          alt={name}
          sizes="(max-width: 767px) 100vw, 52vw"
          fit="framed"
          note={product.visual.kind === "lockup" ? t(k("no_public_page")) : undefined}
        />
      </div>

      <div className={`${leadBox} border-t md:border-t-0 md:border-l border-white/10`}>
        {/* The second item takes the section's own accent, mirroring the status
            chip on the warm project cards, so the two card families read as one
            grammar in two temperatures. */}
        <div className={`flex flex-wrap items-center gap-2.5 ${eyebrow}`}>
          <span>{t(k("category"))}</span>
          <span aria-hidden="true" className="w-[3px] h-[3px] rounded-full bg-gray-600" />
          <span className="text-[var(--zone-a-1)]">{t(k("contribution"))}</span>
        </div>

        <h4 className={cardTitle}>{name}</h4>

        <p className={bodyLead}>{t(k("description"))}</p>

        {product.metrics && (
          <div>
            <dl className="grid grid-cols-3 gap-4">
              {product.metrics.map((metric) => (
                <div key={metric.labelKey}>
                  <dd className={statValue}>{metric.value}</dd>
                  <dt className={`${eyebrow} mt-1`}>{t(k(`metrics.${metric.labelKey}`))}</dt>
                </div>
              ))}
            </dl>
            {/* These figures are OMD's own published numbers, so the card is
                required to say where they come from. */}
            <p className={`mt-3 ${footnote}`}>{t(k("metrics_source"))}</p>
          </div>
        )}

        <StackTags items={product.stack} more={product.stackMore} />

        <div className="flex flex-wrap gap-2.5 pt-1">
          <CardLink
            tone="cold"
            href={product.url}
            label={t(k("visit"))}
            ariaLabel={t(k("visit_aria"))}
          />
          <CardNote>{t(k("private"))}</CardNote>
        </div>
      </div>
    </motion.article>
  );
}

export function Experience() {
  const { t } = useTranslation();

  return (
    <Section id="experience">
      <AmbientOrbs orbs={ORBS} />

      <SectionHeading
        icon={Terminal}
        accent="cold"
        title={t("experience.title_part1")}
        subtitle={t("experience.title_part2")}
      >
        <p className="mt-4 text-gray-400 max-w-2xl leading-relaxed">{t("experience.lead")}</p>
      </SectionHeading>

      {/* One employer block holding both products, rather than two disconnected
          cards that would read as two separate jobs. */}
      <div className="relative z-10 rounded-3xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <header className="px-6 md:px-8 py-7 border-b border-white/10 bg-gradient-to-b from-[color-mix(in_oklab,var(--zone-a-1)_8%,transparent)] to-transparent">
          <p className="text-xs text-gray-400 tabular-nums">{t(`${BASE}.period`)}</p>
          {/* The company used to render at the same 30px as the products
              nested under it, so the block read flat. It now sits a clear step
              above them. */}
          <h3 className={`${employerName} mt-1.5 mb-2`}>{t(`${BASE}.company`)}</h3>
          <p className="text-sm font-medium text-[var(--zone-a-1)]">
            {t(`${BASE}.role`)} · {t(`${BASE}.role_detail`)}
          </p>
        </header>

        {OMD_PRODUCTS.map((product, idx) => (
          <ProductRow key={product.id} product={product} index={idx} />
        ))}
      </div>
    </Section>
  );
}
