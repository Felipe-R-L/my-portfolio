import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Rocket } from "lucide-react";

import { PROJECTS, type Project } from "../data/projects";
import { Section } from "./shared/Section";
import { SectionHeading } from "./shared/SectionHeading";
import { AmbientOrbs, type Orb } from "./shared/AmbientOrbs";
import { ProjectVisual } from "./shared/ProjectVisual";
import { StackTags } from "./shared/StackTags";
import { CardLink, CardNote } from "./shared/CardLink";
import {
  bodyCompact,
  bodyLead,
  cardTitle,
  compactBox,
  eyebrow,
  leadBox,
} from "./shared/cardType";

const ORBS: Orb[] = [
  {
    className:
      "top-40 -left-20 w-[20rem] md:w-[40rem] h-[20rem] md:h-[40rem] bg-[color-mix(in_oklab,var(--zone-b-2)_10%,transparent)] mix-blend-screen filter blur-[60px] md:blur-[140px]",
    x: [0, 15, -20, 0],
    y: [0, -20, 10, 0],
    duration: 16,
  },
  {
    className:
      "bottom-10 -right-20 w-[18rem] md:w-[35rem] h-[18rem] md:h-[35rem] bg-[color-mix(in_oklab,var(--zone-b-1)_9%,transparent)] mix-blend-screen filter blur-[60px] md:blur-[140px]",
    x: [0, -15, 25, 0],
    y: [0, 15, -20, 0],
    duration: 18,
    delay: 3,
  },
];

function Meta({ project }: { project: Project }) {
  const { t } = useTranslation();
  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${eyebrow}`}>
      <span>{t(`projects.${project.id}.category`)}</span>
      <span aria-hidden="true" className="w-[3px] h-[3px] rounded-full bg-gray-600" />
      <span className="text-[var(--zone-b-1)]">{t(`projects.${project.id}.status`)}</span>
    </div>
  );
}

function Links({ project }: { project: Project }) {
  const { t } = useTranslation();
  const name = t(`projects.${project.id}.title`);

  if (!project.url && !project.repo) {
    return <CardNote>{t("projects.labels.private_no_deploy")}</CardNote>;
  }

  return (
    <>
      {project.url && (
        <CardLink
          tone="warm"
          href={project.url}
          label={t("projects.labels.live")}
          ariaLabel={t("projects.labels.live_aria", { name })}
        />
      )}
      {project.repo && (
        <CardLink
          href={project.repo}
          label={t("projects.labels.code")}
          ariaLabel={t("projects.labels.code_aria", { name })}
        />
      )}
    </>
  );
}

/**
 * The lead project gets the full width. With three projects, an even grid says
 * "three interchangeable things"; the asymmetry says which one to look at.
 */
function FeaturedProject({ project }: { project: Project }) {
  const { t } = useTranslation();
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="grid md:grid-cols-[1.2fr_1fr] rounded-3xl border border-white/10 bg-white/[0.02] overflow-hidden"
    >
      <div className="relative bg-[#07070c] min-h-[240px] md:min-h-[300px]">
        <ProjectVisual
          visual={project.visual}
          alt={t(`projects.${project.id}.title`)}
          sizes="(max-width: 767px) 100vw, 55vw"
          tKey={`projects.${project.id}`}
        />
      </div>

      <div className={`${leadBox} border-t md:border-t-0 md:border-l border-white/10`}>
        <Meta project={project} />
        <h3 className={cardTitle}>{t(`projects.${project.id}.title`)}</h3>
        <p className={bodyLead}>{t(`projects.${project.id}.description`)}</p>
        <StackTags items={project.stack} more={project.stackMore} />
        <div className="flex flex-wrap gap-2.5 pt-1">
          <Links project={project} />
        </div>
      </div>
    </motion.article>
  );
}

function CompactProject({ project, index }: { project: Project; index: number }) {
  const { t } = useTranslation();
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.02] overflow-hidden"
    >
      {/*
        A 160px side strip showed a vertical sliver of a 720px-wide capture —
        unreadable, which was the exact problem the old cards had. Full width on
        top gives the captured site's hero enough room to be recognisable.
      */}
      <div className="relative bg-[#07070c] h-44 md:h-48 shrink-0">
        <ProjectVisual
          visual={project.visual}
          alt={t(`projects.${project.id}.title`)}
          sizes="(max-width: 767px) 100vw, 45vw"
          tKey={`projects.${project.id}`}
        />
      </div>

      <div className={`${compactBox} border-t border-white/10`}>
        <Meta project={project} />
        <h3 className={cardTitle}>{t(`projects.${project.id}.title`)}</h3>
        <p className={bodyCompact}>{t(`projects.${project.id}.description`)}</p>
        <StackTags items={project.stack} more={project.stackMore} className="pt-1 mt-auto" />
        <div className="flex flex-wrap gap-2.5 pt-1">
          <Links project={project} />
        </div>
      </div>
    </motion.article>
  );
}

export function Projects() {
  const { t } = useTranslation();
  const featured = PROJECTS.find((p) => p.featured);
  const rest = PROJECTS.filter((p) => !p.featured);

  return (
    <Section id="projects">
      <AmbientOrbs orbs={ORBS} />

      <SectionHeading
        icon={Rocket}
        iconClassName="w-12 h-12 md:w-14 md:h-14"
        accent="warm"
        title={t("projects.title_part1")}
        subtitle={t("projects.title_part2")}
      >
        <p className="mt-4 text-gray-400 max-w-2xl leading-relaxed">{t("projects.lead")}</p>
      </SectionHeading>

      <div className="flex flex-col gap-5 relative z-10">
        {featured && <FeaturedProject project={featured} />}
        <div className="grid md:grid-cols-2 gap-5">
          {rest.map((project, idx) => (
            <CompactProject key={project.id} project={project} index={idx} />
          ))}
        </div>
      </div>
    </Section>
  );
}
