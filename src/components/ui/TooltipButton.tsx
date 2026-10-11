"use client";
import {useId, useRef, useState, type ComponentProps} from "react";
import {createPortal} from "react-dom";

export function TooltipButton({title, children, onPointerEnter, onPointerLeave, onFocus, onBlur, onClick, ...props}: ComponentProps<"button">) {
  const id = useId();
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<{left: number; top: number} | null>(null);
  function show() {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setPosition({left:Math.max(140, Math.min(window.innerWidth - 140, rect.left + rect.width / 2)), top:rect.bottom + 8});
  }
  return <><button {...props} ref={ref} aria-describedby={position && title ? id : undefined}
    onPointerEnter={e => {show(); onPointerEnter?.(e);}} onPointerLeave={e => {setPosition(null); onPointerLeave?.(e);}}
    onFocus={e => {show(); onFocus?.(e);}} onBlur={e => {setPosition(null); onBlur?.(e);}}
    onClick={e => {setPosition(null); onClick?.(e);}} onKeyDown={e => {if(e.key === "Escape") setPosition(null); props.onKeyDown?.(e);}}
  >{children}</button>{position && title && createPortal(<span id={id} role="tooltip" className="wedding-tooltip" style={{left:position.left,top:position.top}}>{title}</span>,document.body)}</>;
}
