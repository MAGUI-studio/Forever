"use client";

import { CheckCircleIcon, ClockIcon, XCircleIcon } from "@phosphor-icons/react";
import type { Attendance } from "@/types/guests";

const statusStyles = {
  confirmado: {
    label: "Confirmado",
    icon: CheckCircleIcon,
    colors: "bg-emerald-50 text-emerald-800",
  },
  pendente: { label: "Pendente", icon: ClockIcon, colors: "bg-neutral-100 text-neutral-700" },
  recusado: { label: "Não comparecerá", icon: XCircleIcon, colors: "bg-rose-50 text-rose-800" },
};

export function AttendanceBadge({
  status,
  label,
  className = "",
}: {
  status: Attendance;
  label?: string;
  className?: string;
}) {
  const { icon: Icon, colors, label: defaultLabel } = statusStyles[status];
  return (
    <span
      className={
        "relative isolate inline-flex h-9 w-[180px] shrink-0 items-center justify-center overflow-hidden rounded-[var(--wedding-radius)] px-3 text-xs leading-none whitespace-nowrap " +
        colors +
        " " +
        className
      }
    >
      <Icon
        size={48}
        weight="duotone"
        aria-hidden="true"
        className="pointer-events-none absolute -right-1 top-1/2 -z-10 -translate-y-1/2 -rotate-12 opacity-15"
      />
      <span>{label ?? defaultLabel}</span>
    </span>
  );
}
