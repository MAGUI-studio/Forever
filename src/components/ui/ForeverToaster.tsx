"use client";

import { useEffect } from "react";
import { Toaster, toast } from "sonner";
import { CheckCircle2, AlertCircle, Info, Loader2, X, type LucideIcon } from "lucide-react";

type NoticeKind = "success" | "error" | "info" | "loading";
const icons: Record<NoticeKind, LucideIcon> = { success: CheckCircle2, error: AlertCircle, info: Info, loading: Loader2 };

function show(kind: NoticeKind, title: string, description?: string, id?: string | number) {
  const Icon = icons[kind];
  return toast.custom((toastId) => (
    <div className={`forever-toast forever-toast--${kind}`}>
      <Icon className="forever-toast-watermark" aria-hidden="true" />
      <div className="forever-toast-copy"><p className="forever-toast-title">{title}</p>{description && <p className="forever-toast-description">{description}</p>}</div>
      <button type="button" className="forever-toast-close" onClick={() => toast.dismiss(toastId)} aria-label="Fechar notificação"><X size={15} /></button>
    </div>
  ), { id, duration: kind === "loading" ? Infinity : kind === "error" ? 6500 : 4000 });
}

export const notify = {
  success: (title: string, description?: string, id?: string | number) => show("success", title, description, id),
  error: (title: string, description?: string, id?: string | number) => show("error", title, description, id),
  info: (title: string, description?: string, id?: string | number) => show("info", title, description, id),
  loading: (title: string) => show("loading", title),
  dismiss: (id: string | number) => toast.dismiss(id),
};

/** Keep field errors in place while also announcing the result in the shared toaster. */
export function useFeedbackToasts(error: string, success = "") {
  useEffect(() => { if (error) notify.error("Não foi possível concluir", error, "forever-error"); }, [error]);
  useEffect(() => { if (success) notify.success("Tudo certo!", success, "forever-success"); }, [success]);
}

export function ForeverToaster() {
  return <Toaster position="top-right" offset={24} mobileOffset={16} visibleToasts={3} gap={12} containerAriaLabel="Notificações Forever" />;
}
