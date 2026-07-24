import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Globe, ShoppingCart, Zap, Bot, Layers } from "lucide-react";

import MobileCarousel from "./shared/MobileCarousel";
import { Section } from "./shared/Section";
import { SectionHeading } from "./shared/SectionHeading";
import { GlowCard } from "./shared/GlowCard";

/**
 * The four icon tints used to be four unrelated hues (cyan, pink, emerald,
 * orange). They now step along the warm zone's own ramp, so the row reads as
 * one set rather than four competing badges.
 */
const SERVICES = [
  { id: "landing_pages", icon: Globe, tint: "var(--zone-b-1)" },
  { id: "ecommerce", icon: ShoppingCart, tint: "var(--zone-b-2)" },
  { id: "ai", icon: Bot, tint: "var(--zone-b-1)" },
  { id: "api", icon: Zap, tint: "var(--zone-b-2)" },
] as const;

type Service = (typeof SERVICES)[number];

export function Services() {
  const { t } = useTranslation();

  return (
    <Section id="services" className="overflow-hidden">
      {/* Static decorative glows — no animation, so no per-frame repaint of a 120px blur */}
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 w-[50rem] h-[50rem] bg-[color-mix(in_oklab,var(--zone-b-1)_5%,transparent)] rounded-full filter blur-[120px] pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-[color-mix(in_oklab,var(--zone-b-2)_5%,transparent)] rounded-full filter blur-[120px] pointer-events-none"
      />

      <div className="relative z-10">
        <SectionHeading
          icon={Layers}
          accent="warm"
          align="center"
          showBar={false}
          title={`${t("services.title_part1")} ${t("services.title_part2")}`}
        >
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed mt-4">
            {t("services.description")}
          </p>
        </SectionHeading>

        {/* Desktop Grid */}
        <div className="hidden md:grid grid-cols-2 auto-rows-fr gap-8 max-w-5xl mx-auto">
          {SERVICES.map((service, idx) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: idx * 0.1 }}
              className="flex"
            >
              <ServiceCard service={service} t={t} />
            </motion.div>
          ))}
        </div>

        {/* Mobile Carousel */}
        <div className="md:hidden -mx-[var(--gutter)]">
          <MobileCarousel>
            {SERVICES.map((service) => (
              <ServiceCard key={service.id} service={service} t={t} />
            ))}
          </MobileCarousel>
        </div>
      </div>
    </Section>
  );
}

function ServiceCard({ service, t }: { service: Service; t: TFunction }) {
  const Icon = service.icon;
  return (
    <GlowCard
      glowColor="color-mix(in oklab, var(--zone-b-1) 20%, transparent)"
      spotlightColor="color-mix(in oklab, var(--zone-b-1) 5%, transparent)"
      glowRadius={200}
      className="w-full h-full"
      contentClassName="h-full p-8 flex flex-col items-start text-left"
    >
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
        style={{ background: `color-mix(in oklab, ${service.tint} 18%, transparent)` }}
        className="p-3 rounded-xl border border-white/5 mb-6"
      >
        <Icon className="w-6 h-6 text-white" aria-hidden="true" />
      </motion.div>

      <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">
        {t(`services.items.${service.id}.title`)}
      </h3>

      <p className="text-gray-400 text-base leading-relaxed flex-1">
        {t(`services.items.${service.id}.description`)}
      </p>
    </GlowCard>
  );
}
