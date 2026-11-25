import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Check, Clock3, Lock, Sparkles, Wifi, WifiOff } from "lucide-react";

/**
 * Dallas Sync sits behind a login with a real motel's money in it, so a
 * screenshot is out. Each tab instead draws a small, made-up screen of the
 * product doing one thing, in the words a motel owner would use. No
 * architecture terms: the people who hire for this care that the front desk
 * keeps working, not how the queue drains.
 *
 * Each screen plays once when its tab opens (motion that answers the click),
 * and reduced-motion visitors get the finished state.
 */

const TABS = ["offline", "invoice", "bi", "tenants"] as const;
type Tab = (typeof TABS)[number];

const BASE = "projects.dallas_sync.showcase";
const EASE = [0.16, 1, 0.3, 1] as const;

export function DallasSyncShowcase() {
  const { t } = useTranslation();
  const [active, setActive] = useState<Tab>("offline");
  const reduce = useReducedMotion() ?? false;
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
    <div className="h-full flex flex-col bg-[#07080d]">
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
        className="relative flex-1 min-h-[400px] lg:min-h-[500px] flex flex-col"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            {/* The drawing is decoration; the caption below says the same thing in words. */}
            <div className="flex-1 grid place-items-center p-5 md:p-8" aria-hidden="true">
              {active === "offline" && <FrontDesk reduce={reduce} />}
              {active === "invoice" && <InvoiceToEntry reduce={reduce} />}
              {active === "bi" && <OwnerPanel reduce={reduce} />}
              {active === "tenants" && <Motels reduce={reduce} />}
            </div>
            <div className="px-6 md:px-8 pb-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <p className="max-w-[60ch] text-[15px] text-gray-200 leading-relaxed">
                {t(`${BASE}.captions.${active}`)}
              </p>
              <p className="text-xs text-gray-500">{t(`${BASE}.illustrative`)}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                          */
/* ------------------------------------------------------------------ */

/** A product window: the frame every drawing sits in, so they read as screens. */
function Screen({
  title,
  status,
  children,
  className = "",
}: {
  title: string;
  status?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`w-full rounded-2xl border border-white/10 bg-[#0d1018] shadow-[0_24px_50px_-28px_rgb(0_0_0/0.9)] overflow-hidden ${className}`}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-white/[0.07]">
        <span className="text-[13px] font-medium text-gray-200">{title}</span>
        {status}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

const pop = (reduce: boolean, delay: number) =>
  reduce
    ? {}
    : {
        initial: { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.45, delay, ease: EASE },
      };

/* ------------------------------------------------------------------ */
/* Works without internet: the front desk's suite board                */
/* ------------------------------------------------------------------ */

type SuiteState = "free" | "busy" | "cleaning";

const SUITES: [string, SuiteState][] = [
  ["101", "busy"],
  ["102", "free"],
  ["103", "cleaning"],
  ["104", "busy"],
  ["201", "free"],
  ["202", "busy"],
  ["203", "free"],
  ["204", "busy"],
];

const SUITE_STYLE: Record<SuiteState, string> = {
  free: "border-white/10 bg-white/[0.03] text-gray-400",
  busy: "border-[color-mix(in_oklab,var(--zone-a-1)_45%,transparent)] bg-[color-mix(in_oklab,var(--zone-a-1)_16%,transparent)] text-white",
  cleaning:
    "border-[color-mix(in_oklab,var(--zone-b-1)_40%,transparent)] bg-[color-mix(in_oklab,var(--zone-b-1)_12%,transparent)] text-[var(--zone-b-1)]",
};

function FrontDesk({ reduce }: { reduce: boolean }) {
  const { t } = useTranslation();
  const k = (key: string) => t(`${BASE}.offline.${key}`);
  // Starts offline, comes back online after the three actions have queued.
  const [online, setOnline] = useState(reduce);

  useEffect(() => {
    if (reduce) return;
    const timer = window.setTimeout(() => setOnline(true), 2600);
    return () => window.clearTimeout(timer);
  }, [reduce]);

  const actions = [k("action_checkin"), k("action_order"), k("action_payment")];

  return (
    <Screen
      className="max-w-lg"
      title={k("screen")}
      status={
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors duration-500 ${
            online
              ? "bg-emerald-400/12 text-emerald-300"
              : "bg-[color-mix(in_oklab,var(--zone-b-1)_14%,transparent)] text-[var(--zone-b-1)]"
          }`}
        >
          {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {online ? k("online") : k("offline")}
        </span>
      }
    >
      <div className="grid grid-cols-4 gap-2">
        {SUITES.map(([n, state]) => (
          <div
            key={n}
            className={`rounded-lg border px-2 py-2.5 text-center text-sm font-semibold tabular-nums ${SUITE_STYLE[state]}`}
          >
            {n}
          </div>
        ))}
      </div>

      <ul className="mt-4 flex flex-col gap-1.5">
        {actions.map((label, i) => (
          <motion.li
            key={label}
            {...pop(reduce, 0.4 + i * 0.5)}
            className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.035] px-3 py-2 text-[13px] text-gray-200"
          >
            {label}
            <span className="relative w-4 h-4 shrink-0">
              <AnimatePresence initial={false}>
                {online ? (
                  <motion.span
                    key="done"
                    className="absolute inset-0 grid place-items-center text-emerald-300"
                    initial={reduce ? false : { scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.35, delay: reduce ? 0 : i * 0.18, ease: EASE }}
                  >
                    <Check className="w-4 h-4" strokeWidth={2.5} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="wait"
                    className="absolute inset-0 grid place-items-center text-gray-500"
                    exit={{ opacity: 0 }}
                  >
                    <Clock3 className="w-4 h-4" />
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </motion.li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
        <Legend className="bg-[color-mix(in_oklab,var(--zone-a-1)_55%,transparent)]" label={k("busy")} />
        <Legend className="bg-white/20" label={k("free")} />
        <Legend className="bg-[color-mix(in_oklab,var(--zone-b-1)_70%,transparent)]" label={k("cleaning")} />
      </div>
    </Screen>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-sm ${className}`} />
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Invoice by photo: a paper receipt becomes a filled-in entry          */
/* ------------------------------------------------------------------ */

function InvoiceToEntry({ reduce }: { reduce: boolean }) {
  const { t } = useTranslation();
  const k = (key: string) => t(`${BASE}.invoice.${key}`);
  const items = t(`${BASE}.invoice.items`, { returnObjects: true }) as string[];

  const fields: [string, string][] = [
    [k("supplier_label"), k("supplier")],
    [k("total_label"), k("total")],
    [k("due_label"), k("due")],
  ];

  return (
    <div className="w-full max-w-xl grid sm:grid-cols-[auto_auto_1fr] items-center gap-4 sm:gap-5">
      {/* The paper. Sans-serif on cream, slightly crooked, as it arrives. */}
      <motion.div
        {...(reduce
          ? {}
          : {
              initial: { opacity: 0, rotate: -9, y: 10 },
              animate: { opacity: 1, rotate: -4, y: 0 },
              transition: { duration: 0.6, ease: EASE },
            })}
        className="justify-self-center w-44 rotate-[-4deg] rounded-md bg-[#f3efe6] px-3.5 py-3 text-[#2a2418] shadow-[0_20px_40px_-18px_rgb(0_0_0/0.9)]"
      >
        <p className="text-[11px] font-bold leading-tight">{k("supplier")}</p>
        <p className="text-[9px] opacity-60 mb-2">{k("receipt_kind")}</p>
        {items.map((item) => (
          <p key={item} className="text-[10px] leading-relaxed border-b border-dashed border-[#2a2418]/15">
            {item}
          </p>
        ))}
        <p className="mt-2 flex justify-between text-[11px] font-bold">
          <span>{k("total_label")}</span>
          <span className="tabular-nums">{k("total")}</span>
        </p>
      </motion.div>

      <motion.span
        {...pop(reduce, 0.5)}
        className="justify-self-center grid place-items-center w-9 h-9 rounded-full bg-[color-mix(in_oklab,var(--zone-b-1)_16%,transparent)] text-[var(--zone-b-1)] rotate-90 sm:rotate-0"
      >
        <Sparkles className="w-4 h-4" />
      </motion.span>

      <Screen title={k("entry_title")}>
        <dl className="flex flex-col gap-2">
          {fields.map(([label, value], i) => (
            <motion.div
              key={label}
              {...pop(reduce, 0.8 + i * 0.25)}
              className="flex items-baseline justify-between gap-3 rounded-md bg-white/[0.035] px-3 py-1.5"
            >
              <dt className="text-xs text-gray-400">{label}</dt>
              <dd className="text-[13px] font-medium text-white tabular-nums">{value}</dd>
            </motion.div>
          ))}
          <motion.div {...pop(reduce, 1.6)} className="flex items-center justify-between gap-3 px-3 pt-1">
            <span className="text-xs text-gray-400">{k("to_stock")}</span>
            <span className="rounded-md bg-[var(--zone-b-1)] px-3 py-1.5 text-xs font-bold text-[#231603]">
              {k("confirm")}
            </span>
          </motion.div>
        </dl>
      </Screen>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Owner's panel: when the motel fills up, which suites earn the most   */
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
const RANKING = [
  ["204", 1],
  ["101", 0.82],
  ["202", 0.67],
  ["104", 0.58],
  ["201", 0.41],
] as const;

function OwnerPanel({ reduce }: { reduce: boolean }) {
  const { t } = useTranslation();
  const days = t(`${BASE}.bi.days`, { returnObjects: true }) as string[];
  const k = (key: string) => t(`${BASE}.bi.${key}`);

  return (
    <Screen title={k("screen")} className="max-w-2xl">
      <div className="grid md:grid-cols-[1.5fr_1fr] gap-6 items-start">
        <div>
          <p className="mb-3 text-xs text-gray-400">{k("heatmap")}</p>
          <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
            {days.map((day, d) => (
              <div key={day} className="contents">
                <span className="text-[11px] text-gray-500 leading-none self-center w-7">{day}</span>
                <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${HOURS}, 1fr)` }}>
                  {Array.from({ length: HOURS }, (_, h) => {
                    const v = intensity(d, h);
                    return (
                      <motion.span
                        key={h}
                        {...(reduce
                          ? {}
                          : {
                              initial: { opacity: 0 },
                              animate: { opacity: 1 },
                              transition: { duration: 0.4, delay: (d + h) * 0.025 },
                            })}
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
          <p className="mb-3 text-xs text-gray-400">{k("suites")}</p>
          <div className="flex flex-col gap-2.5">
            {RANKING.map(([suite, w], i) => (
              <div key={suite} className="flex items-center gap-3">
                <span className="text-xs text-gray-300 w-8 tabular-nums">{suite}</span>
                <span className="h-2 rounded-full bg-white/10 flex-1 overflow-hidden">
                  <motion.span
                    className="block h-full rounded-full bg-[var(--zone-b-1)]"
                    style={{ width: `${w * 100}%`, transformOrigin: "left" }}
                    {...(reduce
                      ? {}
                      : {
                          initial: { scaleX: 0 },
                          animate: { scaleX: 1 },
                          transition: { duration: 0.7, delay: 0.3 + i * 0.08, ease: EASE },
                        })}
                  />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* Many motels: same system, each screen only shows its own            */
/* ------------------------------------------------------------------ */

/** Made-up motels, each with its own hue and its own board. */
const MOTELS = [
  { name: "Aurora", hue: "var(--zone-a-1)", busy: [0, 2, 3, 5] },
  { name: "Oásis", hue: "#34d399", busy: [1, 2, 4] },
  { name: "Lua", hue: "var(--zone-b-1)", busy: [0, 1, 3, 4, 5] },
] as const;

function Motels({ reduce }: { reduce: boolean }) {
  const { t } = useTranslation();
  const k = (key: string) => t(`${BASE}.tenants.${key}`);

  return (
    <div className="w-full max-w-2xl flex flex-col items-center gap-5">
      <div className="w-full grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-3">
        {MOTELS.map((motel, i) => (
          <div key={motel.name} className="contents">
            {i > 0 && (
              <motion.span
                {...pop(reduce, 0.5 + i * 0.15)}
                className="hidden sm:grid justify-self-center place-items-center w-7 h-7 rounded-full bg-white/[0.06] text-gray-300"
              >
                <Lock className="w-3.5 h-3.5" />
              </motion.span>
            )}
            <motion.div {...pop(reduce, i * 0.15)}>
              <Screen title={`${k("motel")} ${motel.name}`}>
                <div className="grid grid-cols-3 gap-1.5">
                  {Array.from({ length: 6 }, (_, s) => {
                    const busy = (motel.busy as readonly number[]).includes(s);
                    return (
                      <span
                        key={s}
                        className="h-6 rounded-md border"
                        style={{
                          borderColor: busy
                            ? `color-mix(in oklab, ${motel.hue} 50%, transparent)`
                            : "rgb(255 255 255 / 0.08)",
                          background: busy
                            ? `color-mix(in oklab, ${motel.hue} 20%, transparent)`
                            : "rgb(255 255 255 / 0.02)",
                        }}
                      />
                    );
                  })}
                </div>
              </Screen>
            </motion.div>
          </div>
        ))}
      </div>
      <motion.p
        {...pop(reduce, 0.9)}
        className="inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-3.5 py-1.5 text-[13px] text-gray-200"
      >
        <Lock className="w-3.5 h-3.5 text-[var(--zone-b-1)]" />
        {k("shield")}
      </motion.p>
    </div>
  );
}
