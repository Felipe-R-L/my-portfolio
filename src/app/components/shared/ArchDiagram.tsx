import { useTranslation } from "react-i18next";

import { eyebrow, eyebrowShape } from "./cardType";

/** Filled slots out of the total, purely illustrative of a queue mid-drain. */
const QUEUE_TOTAL = 8;
const QUEUE_FILLED = 4;

function Node({
  title,
  note,
  live = false,
  children,
}: {
  title: string;
  note: string;
  live?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={
        live
          ? "rounded-xl border border-[color-mix(in_oklab,var(--zone-b-1)_42%,transparent)] bg-[color-mix(in_oklab,var(--zone-b-1)_9%,transparent)] px-4 py-3"
          : "rounded-xl border border-white/15 bg-white/[0.035] px-4 py-3"
      }
    >
      <b className="block text-sm font-medium text-white tracking-tight">{title}</b>
      <span className="text-xs text-gray-400">{note}</span>
      {children}
    </div>
  );
}

function Link({ label }: { label: string }) {
  return (
    <div className={`flex items-center gap-2.5 pl-4 ${eyebrow}`}>
      <span aria-hidden="true" className="w-px h-4 bg-white/15" />
      {label}
    </div>
  );
}

/**
 * Dallas Sync has no deploy and a private repo, so there is no screen to show.
 * Its value was never the screen — it is the offline-first sync. This renders
 * that flow in the slot a screenshot would occupy, rather than inventing a
 * mockup of a product the visitor cannot verify.
 */
export function ArchDiagram({ tKey }: { tKey: string }) {
  const { t } = useTranslation();
  const a = (key: string) => t(`${tKey}.arch.${key}`);

  return (
    <div className="h-full min-h-[300px] p-6 md:p-8 flex flex-col justify-center gap-3 bg-[#07070c]">
      <span
        className={`self-start inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-[color-mix(in_oklab,var(--zone-b-1)_40%,transparent)] bg-[color-mix(in_oklab,var(--zone-b-1)_10%,transparent)] ${eyebrowShape} text-[var(--zone-b-1)]`}
      >
        <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-[var(--zone-b-1)]" />
        {a("offline")}
      </span>

      <span className={eyebrow}>{a("caption")}</span>

      <Node live title={a("step1_title")} note={a("step1_note")} />
      <Link label={a("link1")} />

      <Node title={a("step2_title")} note={`${QUEUE_FILLED} ${a("step2_note")}`}>
        <div aria-hidden="true" className="flex gap-1 mt-2.5">
          {Array.from({ length: QUEUE_TOTAL }, (_, i) => (
            <span
              key={i}
              className={`h-[5px] flex-1 rounded-sm ${
                i < QUEUE_FILLED ? "bg-[var(--zone-b-1)]" : "bg-white/12"
              }`}
            />
          ))}
        </div>
      </Node>
      <Link label={a("link2")} />

      <Node title={a("step3_title")} note={a("step3_note")} />
    </div>
  );
}
