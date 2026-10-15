"use client";

import type { ReactNode } from "react";
import type { Guest } from "@/types/guests";
import { ChatTextIcon } from "@phosphor-icons/react";
import { TooltipButton } from "./TooltipButton";

export function GuestMessage({ name, message }: { name: string; message: string }) {
  return <TooltipButton type="button" title={message} aria-label={`Recado de ${name}`} className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-[#722F37] transition-colors hover:bg-[#722F37]/5 focus-visible:outline-2 focus-visible:outline-[#722F37]">
    <ChatTextIcon size={15} weight="fill" aria-hidden="true" />
  </TooltipButton>;
}

export function GuestNames({ guests, renderMeta }: { guests: Guest[]; renderMeta?: (guest: Guest) => ReactNode }) {
  const others = guests.slice(3);
  return <span className="inline-flex flex-nowrap items-center gap-x-1 whitespace-nowrap text-[13px] leading-relaxed text-neutral-600">
    {guests.slice(0, 3).map((guest, index) => <span key={guest.id} className="inline-flex items-center">
      <span><span className="uppercase">{guest.name}</span>{guest.child && <span className="text-[11px] text-neutral-400"> (Criança)</span>}</span>
      {renderMeta?.(guest)}
      {index < Math.min(guests.length, 3) - 1 && <span>,</span>}
    </span>)}
    {others.length > 0 && <TooltipButton type="button" title={others.map(guest => guest.name.toLocaleUpperCase("pt-BR")).join(", ")} aria-label={`Ver mais ${others.length} convidados`} className="inline-flex min-h-6 items-center justify-center rounded-md bg-neutral-100 px-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-200 focus-visible:outline-2 focus-visible:outline-neutral-500">+{others.length}</TooltipButton>}
  </span>;
}
