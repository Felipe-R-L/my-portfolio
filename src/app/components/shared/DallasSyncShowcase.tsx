import { useId, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Camera, Sparkles, UserCheck, Receipt, Package, ShieldCheck, Database } from "lucide-react";

import { ArchDiagram } from "./ArchDiagram";
import { eyebrow, eyebrowShape, footnote } from "./cardType";

/**
 * Dallas Sync does too much for a bullet list, and the app sits behind a login
 * with a real motel's money in it, so a screenshot is out. Each tab draws one
 * capability as a diagram instead. Nothing here shows real figures: the BI tab
 * is an illustrative pattern and says so.
 */

const TABS = ["offline", "invoice", "bi", "tenants"] as const;
type Tab = (typeof TABS)[number];

const BASE = "projects.dallas_sync.showcase";

export function DallasSyncShowcase() {
  const { t } = useTranslation();
  const [active, setActive] = useState<Tab>("offline");
  const reduce = useReducedMotion();
  const id = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Roving focus, per the WAI-ARIA tabs pattern.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = TABS.indexOf(active);
    const next =
      e.key === "ArrowRight" ? (i + 1) % TABS.length
      : e.key === "ArrowLeft" ? (i - 1 + TABS.length) % TABS.length
      : e.key === "Home" ? 0
      : e.key === "End" ? TABS.length - 1
      : -1;
    if (next < 0) return;
    e.preventDefault();
    setActive(TABS[next]);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="h-full flex flex-col bg-[#07070c]">
      <div
        role="tablist"
        aria-label={t(`${BASE}.label`)}
        onKeyDown={onKeyDown}
        className="grid grid-cols-2 sm:flex gap-1 p-2 border-b border-white/10"
      >
        {TABS.map((tab, i) => {
          const selected = tab === active;
          return (
            <button
              key={tab}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              id={`${id}-tab-${tab}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${id}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab)}
              className={`relative shrink-0 px-3.5 py-2 rounded-lg text-center text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[var(--zone-b-1)] ${
                selected ? "text-[#231603]" : "text-gray-400 hover:text-white"
              }`}
            >
              {selected && (
                <motion.span
                  layoutId={reduce ? undefined : `${id}-pill`}
                  className="absolute inset-0 rounded-lg bg-[var(--zone-b-1)]"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              <span className="relative">{t(`${BASE}.tabs.${tab}`)}</span>
            </button>
          );
        })}
      </div>

      <div
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${active}`}
        className="relative flex-1 min-h-[360px] lg:min-h-[510px] flex flex-col"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 flex flex-col"
          >
            <div className="flex-1 grid items-center">
              {active === "offline" && <ArchDiagram tKey="projects.dallas_sync" />}
              {active === "invoice" && <InvoiceFlow />}
              {active === "bi" && <BiSketch />}
              {active === "tenants" && <TenantMap />}
            </div>
            <p className="px-6 md:px-8 pb-6 text-sm text-gray-300 font-light leading-relaxed">
              {t(`${BASE}.captions.${active}`)}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Invoice read by AI: photo → AI → human check → expense + stock      */
/* ------------------------------------------------------------------ */

function Step({
  icon: Icon,
  title,
  note,
  accent = false,
}: {
  icon: typeof Camera;
  title: string;
  note: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl px-4 py-3 border ${
        accent
          ? "border-[color-mix(in_oklab,var(--zone-b-1)_42%,transparent)] bg-[color-mix(in_oklab,var(--zone-b-1)_9%,transparent)]"
          : "border-white/15 bg-white/[0.035]"
      }`}
    >
      <Icon className="w-4 h-4 mt-0.5 shrink-0 text-[var(--zone-b-1)]" aria-hidden="true" />
      <div>
        <b className="block text-sm font-medium text-white tracking-tight">{title}</b>
        <span className="text-xs text-gray-400">{note}</span>
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <span aria-hidden="true" className="block w-px h-4 ml-6 bg-white/20" />
  );
}

function InvoiceFlow() {
  const { t } = useTranslation();
  const k = (key: string) => t(`${BASE}.invoice.${key}`);

  return (
    <div className="p-6 md:p-8 grid sm:grid-cols-[auto_1fr] gap-6 items-center">
      {/* A receipt drawn as a skeleton: the three fields the AI reads are the
          only highlighted lines. */}
      <div
        aria-hidden="true"
        className="hidden sm:block w-36 rounded-lg bg-[#f3efe6] p-3 shadow-2xl rotate-[-4deg] text-[#2a2418]"
      >
        <div className="h-2 w-16 rounded bg-[#2a2418]/70 mb-1.5" />
        <div className="h-1.5 w-24 rounded bg-[#2a2418]/25 mb-3" />
        <div className="rounded px-1 -mx-1 ring-2 ring-[var(--zone-b-1)] bg-[color-mix(in_oklab,var(--zone-b-1)_25%,transparent)] mb-2">
          <div className="h-1.5 w-20 rounded bg-[#2a2418]/60 my-1" />
        </div>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex justify-between gap-2 mb-1.5">
            <div className="h-1.5 flex-1 rounded bg-[#2a2418]/25" />
            <div className="h-1.5 w-6 rounded bg-[#2a2418]/40" />
          </div>
        ))}
        <div className="rounded px-1 -mx-1 ring-2 ring-[var(--zone-b-1)] bg-[color-mix(in_oklab,var(--zone-b-1)_25%,transparent)] mt-3 flex justify-between">
          <div className="h-2 w-8 rounded bg-[#2a2418]/70 my-1" />
          <div className="h-2 w-10 rounded bg-[#2a2418]/80 my-1" />
        </div>
        <div className="mt-3 grid grid-cols-[repeat(14,1fr)] gap-px h-5">
          {Array.from({ length: 14 }, (_, i) => (
            <span key={i} className={i % 3 ? "bg-[#2a2418]/80" : "bg-transparent"} />
          ))}
        </div>
      </div>

      <div className="flex flex-col">
        <Step icon={Camera} title={k("photo_title")} note={k("photo_note")} />
        <Arrow />
        <Step icon={Sparkles} accent title={k("ai_title")} note={k("ai_note")} />
        <Arrow />
        <Step icon={UserCheck} title={k("check_title")} note={k("check_note")} />
        <Arrow />
        <div className="grid grid-cols-2 gap-2">
          <Step icon={Receipt} title={k("expense_title")} note={k("expense_note")} />
          <Step icon={Package} title={k("stock_title")} note={k("stock_note")} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* BI: occupancy heatmap + suites ranked, with illustrative data       */
/* ------------------------------------------------------------------ */

const HOURS = 12; // two-hour buckets

/** A plausible motel week: busy late evenings, busier at the weekend. */
function intensity(day: number, bucket: number) {
  const hour = bucket * 2;
  const evening = hour >= 18 || hour <= 2 ? 1 : hour >= 12 ? 0.55 : 0.18;
  const weekend = day >= 4 ? 1.25 : 1;
  const wobble = 0.75 + 0.25 * Math.sin(day * 3.1 + bucket * 1.7);
  return Math.min(1, evening * weekend * wobble);
}

/** Suite numbers and relative bar lengths, both made up for the sketch. */
const SUITES = [
  ["302", 1],
  ["101", 0.82],
  ["201", 0.67],
  ["301", 0.58],
  ["102", 0.41],
] as const;

function BiSketch() {
  const { t } = useTranslation();
  const days = t(`${BASE}.bi.days`, { returnObjects: true }) as string[];
  const k = (key: string) => t(`${BASE}.bi.${key}`);

  return (
    <div className="p-6 md:p-8 grid md:grid-cols-[1.5fr_1fr] gap-6 items-center" aria-hidden="true">
      <div>
        <p className={`mb-3 ${eyebrow}`}>{k("heatmap")}</p>
        <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
          {days.map((day, d) => (
            <div key={day} className="contents">
              <span className="text-[11px] text-gray-500 leading-none self-center w-7">{day}</span>
              <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${HOURS}, 1fr)` }}>
                {Array.from({ length: HOURS }, (_, h) => {
                  const v = intensity(d, h);
                  return (
                    <span
                      key={h}
                      className="aspect-square rounded-[3px]"
                      style={{
                        background: `color-mix(in oklab, var(--zone-b-1) ${Math.round(v * 85)}%, rgb(255 255 255 / 0.05))`,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className={`mb-3 ${eyebrow}`}>{k("suites")}</p>
        <div className="flex flex-col gap-2.5">
          {SUITES.map(([suite, w]) => (
            <div key={suite} className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-8 tabular-nums">{suite}</span>
              <span className="h-2 rounded-full bg-white/10 flex-1 overflow-hidden">
                <span
                  className="block h-full rounded-full bg-gradient-to-r from-[color-mix(in_oklab,var(--zone-b-1)_60%,transparent)] to-[var(--zone-b-1)]"
                  style={{ width: `${w * 100}%` }}
                />
              </span>
            </div>
          ))}
        </div>
        <p className={`mt-4 ${footnote}`}>{k("illustrative")}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Many motels, one database, isolated by row-level security           */
/* ------------------------------------------------------------------ */

function TenantMap() {
  const { t } = useTranslation();
  const k = (key: string) => t(`${BASE}.tenants.${key}`);
  const motels = ["A", "B", "C"];

  return (
    <div className="p-6 md:p-8 flex flex-col items-center justify-center gap-4" aria-hidden="true">
      <div className="grid grid-cols-3 gap-3 w-full max-w-md">
        {motels.map((m) => (
          <div
            key={m}
            className="rounded-xl border border-white/15 bg-white/[0.035] px-3 py-3 text-center"
          >
            <b className="block text-sm font-medium text-white">{k("motel")} {m}</b>
            <span className="text-[11px] text-gray-400">{k("devices")}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 w-full max-w-md">
        {motels.map((m) => (
          <span key={m} className="mx-auto w-px h-5 bg-[color-mix(in_oklab,var(--zone-b-1)_60%,transparent)]" />
        ))}
      </div>

      <div
        className={`flex items-center gap-2 px-3.5 py-2 rounded-full border border-[color-mix(in_oklab,var(--zone-b-1)_45%,transparent)] bg-[color-mix(in_oklab,var(--zone-b-1)_12%,transparent)] ${eyebrowShape} text-[var(--zone-b-1)]`}
      >
        <ShieldCheck className="w-4 h-4" />
        {k("shield")}
      </div>

      <span className="w-px h-5 bg-white/20" />

      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-white/[0.035] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Database className="w-4 h-4 text-gray-300" />
          <b className="text-sm font-medium text-white">{k("database")}</b>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {motels.map((m, i) => (
            <div key={m} className="rounded-lg border border-dashed border-white/15 p-2 flex flex-col gap-1">
              {Array.from({ length: 3 }, (_, r) => (
                <span
                  key={r}
                  className="h-1.5 rounded-sm"
                  style={{
                    background: `color-mix(in oklab, var(--zone-b-1) ${30 + i * 20}%, rgb(255 255 255 / 0.06))`,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-gray-400">{k("billing")}</p>
      </div>
    </div>
  );
}
