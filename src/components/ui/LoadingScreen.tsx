"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

/** Covers the admin until the page's initial data is ready. */
export function LoadingScreen({icon,background,description,style}:{icon:ReactNode;background:ReactNode;description:string;style?:CSSProperties}) {
  const reducedMotion = useReducedMotion();
  const [slowDescription, setSlowDescription] = useState<string | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => setSlowDescription(description), 10000);
    return () => clearTimeout(timer);
  }, [description]);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);

  return (
    <div style={style} role="status" aria-live="polite" aria-busy="true" className="fixed inset-0 z-[100] flex min-h-svh items-center justify-center overflow-hidden bg-[var(--forever-paper,#F1F1F1)] px-6 text-[var(--forever-primary,#5D613C)]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.08]">
        {background}
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute -right-[18%] top-1/2 flex size-[min(100vw,780px)] -translate-y-1/2 rotate-[-14deg] items-center justify-center opacity-[0.055] sm:-right-[8%] [&_svg]:h-full! [&_svg]:w-full! [&_img]:h-full! [&_img]:w-full! [&_img]:object-contain">{icon}</div>
      <div className="relative flex w-full max-w-xl flex-col items-center py-12 text-center">
        <p className="mb-5 text-[10px] font-medium uppercase tracking-[0.3em] opacity-75">Cada detalhe, com carinho</p>
        <h1 className="font-serif text-[clamp(36px,6vw,56px)] leading-tight tracking-tight text-[var(--forever-ink,#3D2501)]">Preparando seu espaço</h1>
        <motion.p key={description} initial={reducedMotion ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mt-6 min-h-12 max-w-sm text-sm leading-relaxed text-[var(--forever-accent,#80654E)]">{description}</motion.p>
        <div aria-hidden="true" className="mt-5 h-px w-16 bg-current opacity-30 motion-safe:animate-pulse motion-safe:[animation-duration:2s]" />
        {slowDescription === description && <p className="mt-2 max-w-xs text-xs leading-relaxed text-[var(--forever-accent,#80654E)]">Está levando um pouquinho mais de tempo. Seguimos preparando tudo para você…</p>}

      </div>
    </div>
  );
}
