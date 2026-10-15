"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export function TooltipButton({ title, children, onPointerEnter, onPointerLeave, onFocus, onBlur, onClick, ...props }: ComponentProps<"button">) {
  const id = useId();
  const ref = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [position, setPosition] = useState<{ left: number; top: number; above: boolean; arrowOffset: number } | null>(null);
  const [open, setOpen] = useState(false);
  const reducedMotion = useReducedMotion();
  const clearTimer = () => { if (closeTimer.current) clearTimeout(closeTimer.current); };
  const hide = () => { clearTimer(); setOpen(false); };
  const scheduleHide = () => { clearTimer(); closeTimer.current = setTimeout(() => setOpen(false), 100); };

  function show() {
    clearTimer();
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || !title || props.disabled) return;
    const center = rect.left + rect.width / 2;
    const halfWidth = Math.min(130, (window.innerWidth - 24) / 2);
    const left = Math.max(halfWidth + 12, Math.min(window.innerWidth - halfWidth - 12, center));
    const above = window.innerHeight - rect.bottom < 160 && rect.top > 160;
    setPosition({ left, top: above ? rect.top - 10 : rect.bottom + 10, above, arrowOffset: center - left });
    setOpen(true);
  }

  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => { window.removeEventListener("scroll", close, true); window.removeEventListener("resize", close); };
  }, [open]);

  return <>
    <button {...props} ref={ref} aria-describedby={[props["aria-describedby"], open && title ? id : null].filter(Boolean).join(" ") || undefined}
      onPointerEnter={event => { show(); onPointerEnter?.(event); }} onPointerLeave={event => { scheduleHide(); onPointerLeave?.(event); }}
      onFocus={event => { show(); onFocus?.(event); }} onBlur={event => { hide(); onBlur?.(event); }}
      onClick={event => { hide(); onClick?.(event); }} onKeyDown={event => { if (event.key === "Escape") hide(); props.onKeyDown?.(event); }}
    >{children}</button>
    {position && createPortal(<span className="wedding-tooltip-anchor" style={{ left: position.left, top: position.top, transform: `translate(-50%, ${position.above ? "-100%" : "0"})` }}>
      <AnimatePresence>
        {open && title && <motion.span key={id} id={id} role="tooltip" className="wedding-tooltip" data-side={position.above ? "top" : "bottom"}
          style={{ "--tooltip-arrow-offset": `${position.arrowOffset}px` } as React.CSSProperties}
          initial={{ opacity: 0, y: reducedMotion ? 0 : position.above ? 4 : -4, scale: reducedMotion ? 1 : .98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: reducedMotion ? 0 : position.above ? 2 : -2, scale: reducedMotion ? 1 : .98 }}
          transition={{ duration: reducedMotion ? 0 : .18, ease: [.22, 1, .36, 1] }}
          onPointerEnter={clearTimer} onPointerLeave={scheduleHide}
        >{title}</motion.span>}
      </AnimatePresence>
    </span>, document.body)}
  </>;
}
