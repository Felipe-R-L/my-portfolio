import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";
import { useTranslation } from "react-i18next";
import { Check, Globe, Lock, Route } from "lucide-react";

import { Section } from "./shared/Section";
import { SectionHeading } from "./shared/SectionHeading";

/**
 * Someone hiring a freelancer for the first time mostly wants to know what
 * happens after they send the first message. Instead of four look-alike text
 * cards, the section draws the journey: a rail that fills as you scroll, and at
 * each stop a tiny scene of what that moment actually looks like from the
 * client's side (a chat, a preview with a quote, progress, the site live).
 *
 * Every stop also says what the client walks away with, and the draft stop
 * carries the decision point, because "nothing starts without your ok" is the
 * sentence that removes the risk of saying yes to step one. Step two is the
 * same free-draft offer used in outreach messages, so site and pitch agree.
 *
 * The scenes are decoration (aria-hidden); the text beside them says the same
 * thing in words. Reduced-motion visitors get the finished state.
 */
const STEPS = ["talk", "draft", "build", "launch"] as const;
type Step = (typeof STEPS)[number];

const EASE = [0.16, 1, 0.3, 1] as const;

export function Process() {
  const { t } = useTranslation();
  const reduce = useReducedMotion() ?? false;
  const listRef = useRef<HTMLOListElement>(null);

  // The rail fills while the rail itself (the top of the list) travels from
  // the lower part of the screen to the upper third, so it is complete while
  // the stops are still in view rather than after they have scrolled away.
  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: ["start 85%", "start 35%"],
  });
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });

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

      <ol
        ref={listRef}
        className="relative z-10 grid gap-12 lg:grid-cols-4 lg:gap-6"
      >
        {/* Desktop rail: one line through the stop markers, first to last,
            filled by scroll position. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute hidden lg:block left-4 right-[calc((100%-4.5rem)/4-1rem)] top-[15px] h-[2px] -translate-y-1/2 rounded-full bg-white/10"
        >
          <motion.div
            style={reduce ? undefined : { scaleX: fill }}
            className="absolute inset-0 origin-left rounded-full bg-gradient-to-r from-[var(--zone-b-1)] to-[var(--zone-b-2)]"
          />
        </div>

        {STEPS.map((step, idx) => (
          <li key={step} className="relative flex flex-col gap-5 pl-12 lg:pl-0">
            {/* Phone rail: each stop draws the segment down to the next one, so
                the line ends at the last stop instead of running past it. */}
            {idx < STEPS.length - 1 && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-[15px] top-10 -bottom-10 w-[2px] -translate-x-1/2 rounded-full bg-white/10 lg:hidden"
              >
                <motion.span
                  initial={reduce ? false : { scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true, margin: "0px 0px -40% 0px" }}
                  transition={{ duration: 0.9, ease: EASE }}
                  className="absolute inset-0 origin-top rounded-full bg-gradient-to-b from-[var(--zone-b-1)] to-[var(--zone-b-2)]"
                />
              </span>
            )}

            {/* The decision point, marked on the desktop rail between the
                draft and the build. */}
            {step === "draft" && (
              <span
                aria-hidden="true"
                className="absolute right-10 top-[15px] z-10 hidden h-7 w-7 -translate-y-1/2 place-items-center rounded-full border border-[var(--zone-b-1)] bg-[#050608] text-[var(--zone-b-1)] lg:grid"
              >
                <Lock className="h-3.5 w-3.5" />
              </span>
            )}

            <StopMarker index={idx} reduce={reduce} />

            <div className="lg:mt-10">
              <Scene step={step} reduce={reduce} />
            </div>

            <div className="flex flex-col gap-2.5">
              <h3 className="text-xl font-bold text-white tracking-[-0.025em] leading-[1.15]">
                {t(`process.steps.${step}.title`)}
              </h3>
              <p className="text-sm md:text-[15px] text-gray-300 font-light leading-[1.7]">
                {t(`process.steps.${step}.description`)}
              </p>

              {step === "draft" && (
                <p className="flex items-center gap-2 text-sm font-medium text-[var(--zone-b-1)]">
                  <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {t("process.gate")}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Stop marker                                                          */
/* ------------------------------------------------------------------ */

/**
 * The step number stays: here the order is the information. It sits on the
 * rail and lights up when its stop scrolls into view.
 */
function StopMarker({ index, reduce }: { index: number; reduce: boolean }) {
  const lit = {
    backgroundColor: "var(--zone-b-1)",
    borderColor: "var(--zone-b-1)",
    color: "#231603",
  };
  return (
    <motion.span
      aria-hidden="true"
      initial={reduce ? lit : { backgroundColor: "#050608", borderColor: "rgba(255,255,255,0.18)", color: "#9ca3af" }}
      whileInView={lit}
      viewport={{ once: true, margin: "0px 0px -25% 0px" }}
      transition={{ duration: 0.4, ease: EASE }}
      className="absolute left-0 top-0 grid h-8 w-8 place-items-center rounded-full border text-[13px] font-semibold tabular-nums"
    >
      {index + 1}
    </motion.span>
  );
}

/* ------------------------------------------------------------------ */
/* Scenes                                                               */
/* ------------------------------------------------------------------ */

function Scene({ step, reduce }: { step: Step; reduce: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="h-[156px] overflow-hidden rounded-2xl border border-white/10 bg-[#0d1018] p-3.5 shadow-[0_24px_50px_-28px_rgb(0_0_0/0.9)]"
    >
      {step === "talk" && <TalkScene reduce={reduce} />}
      {step === "draft" && <DraftScene reduce={reduce} />}
      {step === "build" && <BuildScene reduce={reduce} />}
      {step === "launch" && <LaunchScene reduce={reduce} />}
    </div>
  );
}

/** Plays once, when the scene first comes into view. */
const appear = (reduce: boolean, delay: number) =>
  reduce
    ? {}
    : {
        initial: { opacity: 0, y: 6 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-20% 0px" },
        transition: { duration: 0.45, delay, ease: EASE },
      };

const S = "process.scenes";

function Bubble({
  side,
  children,
  reduce,
  delay,
}: {
  side: "them" | "me";
  children: ReactNode;
  reduce: boolean;
  delay: number;
}) {
  return (
    <motion.div
      {...appear(reduce, delay)}
      className={
        side === "them"
          ? "max-w-[85%] self-start rounded-2xl rounded-bl-md bg-white/[0.07] px-3 py-2 text-[12.5px] leading-snug text-gray-200"
          : "max-w-[85%] self-end rounded-2xl rounded-br-md bg-[color-mix(in_oklab,var(--zone-b-1)_22%,#0d1018)] px-3 py-2 text-[12.5px] leading-snug text-white"
      }
    >
      {children}
    </motion.div>
  );
}

function TalkScene({ reduce }: { reduce: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="flex h-full flex-col justify-end gap-2">
      <Bubble side="them" reduce={reduce} delay={0.1}>
        {t(`${S}.talk.client`)}
      </Bubble>
      <Bubble side="me" reduce={reduce} delay={0.6}>
        {t(`${S}.talk.me`)}
      </Bubble>
    </div>
  );
}

function DraftScene({ reduce }: { reduce: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="grid h-full grid-cols-[1.15fr_1fr] gap-2.5">
      {/* The preview: a wireframe of their page. */}
      <motion.div
        {...appear(reduce, 0.1)}
        className="flex flex-col gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] p-2"
      >
        <div className="flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
        </div>
        <div className="flex-1 rounded bg-[color-mix(in_oklab,var(--zone-b-1)_18%,transparent)]" />
        <div className="h-1.5 w-3/5 rounded-full bg-white/15" />
      </motion.div>

      {/* The quote and the two ways out of it. */}
      <motion.div
        {...appear(reduce, 0.45)}
        className="flex flex-col justify-between rounded-lg border border-white/[0.08] bg-white/[0.02] p-2.5"
      >
        <div>
          <p className="text-[11px] text-gray-400">{t(`${S}.draft.quote`)}</p>
          <div className="mt-1.5 h-1.5 w-2/3 rounded-full bg-white/10" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="flex items-center justify-center gap-1 rounded-md bg-[var(--zone-b-1)] py-1 text-[11px] font-semibold text-[#231603]">
            <Check className="h-3 w-3" strokeWidth={3} />
            {t(`${S}.draft.approve`)}
          </span>
          <span className="rounded-md border border-white/10 py-1 text-center text-[11px] text-gray-300">
            {t(`${S}.draft.adjust`)}
          </span>
        </div>
      </motion.div>
    </div>
  );
}

function BuildScene({ reduce }: { reduce: boolean }) {
  const { t } = useTranslation();
  const stages = ["structure", "content", "review"] as const;
  return (
    <div className="flex h-full flex-col justify-center gap-2">
      {stages.map((stage, i) => {
        const done = i < 2;
        return (
          <motion.div
            key={stage}
            {...appear(reduce, 0.1 + i * 0.3)}
            className="flex items-center gap-2.5 rounded-lg border border-white/[0.07] bg-white/[0.02] px-2.5 py-2"
          >
            {done ? (
              <span className="grid h-4 w-4 place-items-center rounded-full bg-[var(--zone-b-1)]">
                <Check className="h-2.5 w-2.5 text-[#231603]" strokeWidth={3.5} />
              </span>
            ) : (
              <span className="relative grid h-4 w-4 place-items-center">
                {!reduce && (
                  <motion.span
                    className="absolute inset-0 rounded-full border border-[var(--zone-b-1)]"
                    animate={{ scale: [1, 1.5], opacity: [0.8, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
                <span className="h-2 w-2 rounded-full bg-[var(--zone-b-1)]" />
              </span>
            )}
            <span className={`text-[12.5px] ${done ? "text-gray-400" : "text-white"}`}>
              {t(`${S}.build.${stage}`)}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

function LaunchScene({ reduce }: { reduce: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="flex h-full flex-col gap-2.5">
      <motion.div
        {...appear(reduce, 0.1)}
        className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-2"
      >
        <Globe className="h-3.5 w-3.5 text-gray-400" />
        <span className="truncate text-[12.5px] text-gray-200">{t(`${S}.launch.domain`)}</span>
        <span className="ml-auto flex shrink-0 items-center gap-1.5 text-[11px] text-emerald-300">
          <span className="relative flex h-2 w-2">
            {!reduce && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
            )}
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          {t(`${S}.launch.live`)}
        </span>
      </motion.div>
      <div className="mt-auto flex flex-col gap-2">
        <Bubble side="them" reduce={reduce} delay={0.5}>
          {t(`${S}.launch.client`)}
        </Bubble>
        <Bubble side="me" reduce={reduce} delay={0.95}>
          <span className="inline-flex items-center gap-1">
            {t(`${S}.launch.me`)}
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
        </Bubble>
      </div>
    </div>
  );
}
