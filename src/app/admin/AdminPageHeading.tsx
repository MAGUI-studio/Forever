import type { ReactNode } from "react";

type AdminPageHeadingProps = {
  eyebrow?: string;
  context?: string;
  title: ReactNode;
  accent?: string;
  description: ReactNode;
  loading?: boolean;
};

/** Shared page title, context and description for administration pages. */
export function AdminPageHeading({ eyebrow = "Espaço dos noivos", context, title, accent, description, loading = false }: AdminPageHeadingProps) {
  return <div className="min-w-0 space-y-1">
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-neutral-500 sm:text-xs">
      <span className="font-semibold uppercase tracking-wider">{eyebrow}</span>
      {context && <><span className="text-neutral-300" aria-hidden="true">·</span><span>{context}</span></>}
    </div>
    <h1 className="font-serif text-3xl font-normal leading-tight text-[#161616] sm:text-4xl">{title}{accent && <> <em className="italic text-[#722F37]">{accent}</em></>}</h1>
    <p className="text-xs text-neutral-500 sm:text-sm">{loading ? <span className="inline-block h-3 w-32 animate-pulse rounded bg-neutral-200 motion-reduce:animate-none" aria-label="Carregando resumo" /> : description}</p>
  </div>;
}
