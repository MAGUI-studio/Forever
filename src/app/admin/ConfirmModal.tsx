"use client";

import { foreverTheme } from "@/config/brand";
import * as Dialog from "@radix-ui/react-dialog";
import { AdminButton } from "./AdminButton";
import { Loader2, RefreshCw, X } from "lucide-react";
import type { ReactNode } from "react";

interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => Promise<void> | void;
  isBusy?: boolean;
  icon?: ReactNode;
  eyebrow?: string;
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Restaurar",
  cancelLabel = "Cancelar",
  onConfirm,
  isBusy = false,
  icon,
  eyebrow = "Confirmar restauração",
}: ConfirmModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(val) => !isBusy && onOpenChange(val)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#161616]/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200" />
        <Dialog.Content
          style={foreverTheme}
          className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#722f3720] bg-[#fffdfa] p-6 shadow-2xl focus:outline-none animate-in zoom-in-95 fade-in duration-200"
          onEscapeKeyDown={(e) => isBusy && e.preventDefault()}
          onPointerDownOutside={(e) => isBusy && e.preventDefault()}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--forever-hover-tint,#722f3710)] text-[var(--forever-primary,#722F37)]">
                {icon ?? <RefreshCw size={18} strokeWidth={1.75} />}
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--forever-accent,#77736c)]">
                  {eyebrow}
                </p>
                <Dialog.Title className="font-serif text-lg font-normal text-[var(--forever-ink,#161616)]">
                  {title}
                </Dialog.Title>
              </div>
            </div>
            <Dialog.Close
              disabled={isBusy}
              className="rounded-lg p-1 text-[var(--forever-accent,#77736c)] hover:bg-[var(--forever-hover-tint,#722f3710)] hover:text-[var(--forever-ink,#161616)] disabled:opacity-40"
              aria-label="Fechar"
            >
              <X size={18} />
            </Dialog.Close>
          </div>

          <Dialog.Description className="mt-3.5 text-xs leading-relaxed text-[var(--forever-accent,#77736c)]">
            {description}
          </Dialog.Description>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5">
            <AdminButton
              type="button"
              variant="ghost"
              disabled={isBusy}
              onClick={() => onOpenChange(false)}
              className="text-xs min-h-9 px-4"
            >
              {cancelLabel}
            </AdminButton>
            <AdminButton
              type="button"
              disabled={isBusy}
              onClick={async () => {
                await onConfirm();
              }}
              className="text-xs min-h-9 px-4"
            >
              {isBusy && <Loader2 size={13} className="animate-spin" />}
              {confirmLabel}
            </AdminButton>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
