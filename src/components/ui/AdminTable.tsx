"use client";

import type { ReactNode } from "react";

export function AdminTable({
  label,
  header,
  children,
  minWidth = 720,
}: {
  label: string;
  header: ReactNode;
  children: ReactNode;
  minWidth?: number;
}) {
  return (
    <div className="overflow-x-auto">
      <table
        aria-label={label}
        className="admin-data-table w-max border-collapse bg-white text-left text-sm"
        style={{ minWidth: `max(100%, ${minWidth}px)` }}
      >
        <thead>
          <tr className="border-b border-neutral-100 bg-neutral-50/60 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
            {header}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">{children}</tbody>
      </table>
    </div>
  );
}

export function AdminTableDetails({
  id,
  expanded,
  colSpan,
  children,
}: {
  id: string;
  expanded: boolean;
  colSpan: number;
  children: ReactNode;
}) {
  return (
    <tr className="guest-details-row">
      <td colSpan={colSpan} className="guest-details-cell">
        <div
          id={id}
          className="guest-details-collapse"
          data-expanded={expanded}
          aria-hidden={!expanded}
          inert={!expanded}
        >
          <div className="guest-details-clip">
            <div className="guest-details-spacing">{children}</div>
          </div>
        </div>
      </td>
    </tr>
  );
}

export function shouldToggleTableRow(target: EventTarget) {
  return (
    target instanceof Element &&
    !target.closest(
      "button, a, input, select, textarea, [role=menuitem], [role=menu], [data-radix-popper-content-wrapper]",
    ) &&
    !window.getSelection()?.toString()
  );
}
