import type { ReactNode } from "react";

type SectionDividerProps = {
  title: string;
  count: number;
  actions?: ReactNode;
};

export function SectionDivider({title, count, actions}: SectionDividerProps) {
  return <div className="flex flex-wrap items-center gap-4 py-2 text-[var(--forever-primary,#722F37)]">
    <h3 className="shrink-0 text-sm font-semibold">{title}</h3>
    <span className="h-px min-w-4 flex-1 bg-[var(--forever-primary,#722F37)]/20" aria-hidden="true" />
    {actions && <div className="order-last flex w-full items-center gap-2 sm:order-none sm:w-auto">{actions}</div>}
    <span className="shrink-0 text-xs tabular-nums">{count} {count === 1 ? "convite" : "convites"}</span>
  </div>;
}
