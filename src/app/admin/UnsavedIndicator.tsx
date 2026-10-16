"use client";

import { useId, useState } from "react";
import { createPortal } from "react-dom";
import { PencilSimpleIcon } from "@phosphor-icons/react";

export function UnsavedIndicator({ changed }: { changed: boolean }) {
  const id = useId();
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  if (!changed) return null;
  function show(element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    setPosition({
      left: Math.max(100, Math.min(window.innerWidth - 100, rect.left + rect.width / 2)),
      top: rect.bottom + 6,
    });
  }
  return (
    <>
      <button
        type="button"
        aria-label="Alteração não salva"
        aria-describedby={position ? id : undefined}
        className="ml-1.5 inline-flex size-4 align-middle items-center justify-center rounded-full bg-sky-100 text-sky-700 focus-visible:outline-1 focus-visible:outline-offset-1"
        onPointerEnter={(event) => show(event.currentTarget)}
        onPointerLeave={() => setPosition(null)}
        onFocus={(event) => show(event.currentTarget)}
        onBlur={() => setPosition(null)}
        onClick={(event) => {
          event.preventDefault();
          show(event.currentTarget);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") setPosition(null);
        }}
      >
        <PencilSimpleIcon size={11} weight="fill" aria-hidden="true" />
      </button>
      {position &&
        createPortal(
          <span
            id={id}
            role="tooltip"
            className="wedding-tooltip"
            style={{
              ...position,
              backgroundColor: "#e0f2fe",
              color: "#0369a1",
              boxShadow: "0 4px 16px #0369a11a",
            }}
          >
            Alteração não salva
          </span>,
          document.body,
        )}
    </>
  );
}
