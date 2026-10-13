"use client";

import { useEffect, type CSSProperties, type ReactNode } from "react";

/** Covers the admin until the page's initial data is ready. */
export function LoadingScreen({icon,background,description,style}:{icon:ReactNode;background:ReactNode;description:string;style?:CSSProperties}) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);

  return (
    <div style={style} role="status" aria-live="polite" aria-busy="true" className="fixed inset-0 z-[100] flex min-h-svh items-center justify-center overflow-hidden bg-[var(--forever-paper,#F1F1F1)] px-6 text-[var(--forever-primary,#5D613C)]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-20">
        {background}
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute size-[min(85vw,520px)] rounded-full bg-[#fffdfa]/80 blur-3xl" />
      <div className="relative flex w-full max-w-md flex-col items-center text-center">
        <div aria-hidden="true" className="relative mb-8 flex size-24 items-center justify-center sm:size-28">
          <div className="absolute inset-0 rounded-full border border-current opacity-10" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-current border-r-current/20 motion-safe:animate-spin motion-safe:[animation-duration:2.4s]" />
          <div className="flex size-16 items-center justify-center rounded-full bg-[#fffdfa] shadow-[0_6px_24px_#5d613c0a] sm:size-20">
            <span className="flex items-center justify-center motion-safe:animate-pulse motion-safe:[animation-duration:3s]">{icon}</span>
          </div>
        </div>
        <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.3em] opacity-75">Cada detalhe, com carinho</p>
        <h1 className="font-serif text-[clamp(30px,6vw,42px)] leading-tight tracking-tight text-[var(--forever-ink,#3D2501)]">Preparando seu espaço</h1>
        <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--forever-accent,#80654E)]">{description}</p>
        <div aria-hidden="true" className="mt-7 flex items-center gap-2">
          {[0, 1, 2].map(index => <span key={index} className="size-1.5 rounded-full bg-current opacity-40 motion-safe:animate-bounce motion-safe:[animation-duration:1.4s]" style={{ animationDelay: `${index * 160}ms` }} />)}
        </div>
      </div>
    </div>
  );
}
