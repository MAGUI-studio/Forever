"use client";
import { foreverTheme } from "@/config/brand";
import { useOptionalWedding } from "@/components/wedding/WeddingProvider";
import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import {ForeverBackground} from "@/components/forever/ForeverBackground";
import { WeddingOrnaments } from "@/components/wedding/WeddingOrnaments";
export function AdminDialog({
  open,
  onClose,
  title,
  description,
  busy = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  busy?: boolean;
  children: ReactNode;
}) {
  const wedding = useOptionalWedding();
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!value && !busy) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[300] bg-black/45 backdrop-blur-sm" />
        <Dialog.Content
          style={foreverTheme}
          onEscapeKeyDown={(e) => {
            if (busy) e.preventDefault();
          }}
          onPointerDownOutside={(e) => {
            if (busy) e.preventDefault();
          }}
          className="admin-wedding fixed! top-1/2 left-1/2 z-[310] min-h-0! max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[var(--wedding-radius)] border border-[#722f3720] bg-[#fffdfa]! p-6 shadow-xl sm:p-8"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden opacity-20"
          >
            {wedding?<WeddingOrnaments variant="floral" tone="paper" />:<ForeverBackground/>}
          </div>
          <div className="relative">
            <Dialog.Close
              disabled={busy}
              aria-label="Fechar"
              className="absolute top-0 right-0 rounded-[var(--wedding-radius)] p-2 text-[var(--forever-primary,#722F37)] hover:bg-[#722F370d] focus-visible:outline-2"
            >
              <X size={20} />
            </Dialog.Close>
            <p className="admin-eyebrow pr-10">{wedding?"Cada detalhe, com carinho":"Forever Studio"}</p>
            <Dialog.Title className="mt-3 pr-10 font-serif text-4xl text-[var(--forever-ink,#161616)]">
              {title}
            </Dialog.Title>
            <Dialog.Description className="mt-3 text-sm text-[var(--forever-accent,#77736c)]">
              {description}
            </Dialog.Description>
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
