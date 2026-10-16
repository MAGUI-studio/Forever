"use client";
import { useFeedbackToasts } from "@/components/ui/ForeverToaster";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { User } from "firebase/auth";
import { isUploadThingUrl } from "@/config/gallery";

import { useUploadThing } from "@/lib/uploadthing";
import {
  Info,
  UploadCloud,
  Camera,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
} from "lucide-react";
import { AdminButton } from "./AdminButton";
import { UploadProgress } from "./UploadProgress";
import { ConfirmModal } from "./ConfirmModal";

export const MAX_SINGLE_IMAGE_SIZE_BYTES = 1024 * 1024;
export const ALLOWED_SINGLE_IMAGE_MIMES = ["image/png", "image/webp"] as const;
export const ALLOWED_SINGLE_IMAGE_EXTS = [".png", ".webp"] as const;

interface SingleImageUploaderProps {
  label: string;
  description?: string;
  currentUrl?: string;
  defaultUrl?: string;
  onImageChange: (url: string) => void;
  onImageSave?: (url: string) => Promise<void>;
  user: User | null;
  slug: string;
}

export function SingleImageUploader({
  label,
  description,
  currentUrl,
  defaultUrl = "",
  onImageChange,
  onImageSave,
  user,
  slug,
}: SingleImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  useFeedbackToasts(error, success);
  const [progress, setProgress] = useState(0);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [stagedFile, setStagedFile] = useState<{ file: File; previewUrl: string } | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (stagedFile) {
        URL.revokeObjectURL(stagedFile.previewUrl);
      }
    };
  }, [stagedFile]);

  const { startUpload, isUploading } = useUploadThing("singleImageUploader", {
    headers: async (): Promise<Record<string, string>> => {
      if (!user) return {};
      const token = await user.getIdToken();
      return {
        Authorization: `Bearer ${token}`,
        "x-wedding-slug": slug,
      };
    },
    onUploadProgress: (p) => {
      setProgress(p);
    },
    onClientUploadComplete: async (res) => {
      if (!res || res.length === 0) return;

      const uploaded = res[0];
      const newUrl = uploaded.url || (uploaded as any).ufsUrl;

      const oldUrl = currentUrl;
      if (oldUrl && isUploadThingUrl(oldUrl) && oldUrl !== newUrl && user) {
        try {
          setIsCleaning(true);
          const token = await user.getIdToken();
          await fetch("/api/admin/gallery/cleanup", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "x-wedding-slug": slug,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ urls: [oldUrl] }),
          });
        } catch (cleanupErr) {
          console.warn("Aviso ao remover foto anterior:", cleanupErr);
        } finally {
          setIsCleaning(false);
        }
      }

      try {
        setIsAutoSaving(true);
        if (onImageSave) {
          await onImageSave(newUrl);
        } else {
          onImageChange(newUrl);
        }
        setSuccess("Foto enviada e salva com sucesso no site!");
      } catch (saveErr) {
        onImageChange(newUrl);
        setError(
          "A foto foi enviada, mas houve uma oscilação ao salvar automaticamente. Clique em 'Salvar alterações' no topo para confirmar.",
        );
      } finally {
        setIsAutoSaving(false);
        if (stagedFile) {
          URL.revokeObjectURL(stagedFile.previewUrl);
          setStagedFile(null);
        }
        setProgress(0);
      }
    },
    onUploadError: (err) => {
      setError(
        err.message || "Não foi possível enviar a foto. Verifique o formato e tente novamente.",
      );
      setProgress(0);
    },
  });

  function processFile(file: File) {
    setError("");
    setSuccess("");

    const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "");
    const isValidMime = (ALLOWED_SINGLE_IMAGE_MIMES as readonly string[]).includes(file.type);
    const isValidExt = (ALLOWED_SINGLE_IMAGE_EXTS as readonly string[]).includes(ext);

    if (!isValidMime && !isValidExt) {
      setError("Formato não suportado. Envie apenas imagens em PNG ou WebP.");
      return;
    }

    if (file.size > MAX_SINGLE_IMAGE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setError(`A foto ultrapassa o limite de 1MB (arquivo tem ${sizeMb}MB).`);
      return;
    }

    if (stagedFile) {
      URL.revokeObjectURL(stagedFile.previewUrl);
    }
    const previewUrl = URL.createObjectURL(file);
    setStagedFile({ file, previewUrl });
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDrag(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === "dragenter" || event.type === "dragover") {
      setDragActive(true);
    } else if (event.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }

  async function handleConfirmUpload() {
    if (!stagedFile || isBusy) return;
    setError("");
    setSuccess("");
    await startUpload([stagedFile.file]);
  }

  function handleCancelStaged() {
    if (stagedFile) {
      URL.revokeObjectURL(stagedFile.previewUrl);
      setStagedFile(null);
    }
    setError("");
  }

  async function executeResetToDefault() {
    setShowResetModal(false);
    const oldUrl = currentUrl;
    if (oldUrl && isUploadThingUrl(oldUrl) && user) {
      try {
        setIsCleaning(true);
        const token = await user.getIdToken();
        await fetch("/api/admin/gallery/cleanup", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "x-wedding-slug": slug,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ urls: [oldUrl] }),
        });
      } catch (err) {
        console.warn("Erro ao remover foto da nuvem:", err);
      } finally {
        setIsCleaning(false);
      }
    }

    try {
      setIsAutoSaving(true);
      if (onImageSave) {
        await onImageSave("");
      } else {
        onImageChange("");
      }
      setSuccess("Foto original restaurada e salva no site.");
    } catch {
      onImageChange("");
    } finally {
      setIsAutoSaving(false);
    }
  }

  const hasCustomUpload = Boolean(currentUrl?.trim());
  const displayUrl = currentUrl || defaultUrl;
  const isBusy = isUploading || isAutoSaving || isCleaning;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Camera size={16} className="text-[var(--forever-primary,#722F37)]" />
            <h3 className="text-xs font-semibold text-[var(--forever-primary,#722F37)]">{label}</h3>
          </div>
          {description && (
            <p className="mt-1 text-[11px] leading-relaxed text-[var(--forever-accent,#77736c)]">
              {description}
            </p>
          )}
        </div>
        {hasCustomUpload && (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => setShowResetModal(true)}
            className="inline-flex shrink-0 items-center gap-1 text-[11px] text-[var(--forever-accent,#77736c)] transition-colors hover:text-[var(--forever-primary,#722F37)] disabled:opacity-50"
            title="Restaurar foto original do template"
          >
            <RefreshCw size={12} className={isCleaning ? "animate-spin" : ""} />
            Restaurar original
          </button>
        )}
      </div>

      <div className="relative isolate overflow-hidden rounded-2xl border border-[#CFDCE5] bg-[#F0F5F8] px-4 py-3 text-xs text-[#405E74]">
        <Info
          aria-hidden="true"
          size={76}
          strokeWidth={1.25}
          className="pointer-events-none absolute -right-2 top-1/2 -z-10 -translate-y-1/2 -rotate-12 text-[#54758F]/10"
        />
        <p className="relative leading-relaxed">
          <span className="font-semibold">Salvamento automático:</span> ao enviar uma nova foto, ela
          é salva automaticamente no site.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700"
        >
          <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-600" />
          <div className="flex-1 leading-relaxed">{error}</div>
          <button
            type="button"
            onClick={() => setError("")}
            className="text-red-500 hover:text-red-700"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl border border-[#722f3730] bg-[#fbf4f5] p-2.5 text-xs text-[var(--forever-primary,#722F37)]"
        >
          <CheckCircle2
            size={15}
            className="mt-0.5 shrink-0 text-[var(--forever-primary,#722F37)]"
          />
          <div className="flex-1 leading-relaxed">{success}</div>
          <button
            type="button"
            onClick={() => setSuccess("")}
            className="text-[var(--forever-primary,#722F37)] hover:opacity-75"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {displayUrl && !stagedFile && (
        <div className="flex items-center gap-3 rounded-xl border border-[#722f3718] bg-white p-2.5">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-[#722f3710]">
            <Image src={displayUrl} alt={label} fill unoptimized className="object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-[var(--forever-ink,#161616)]">
              {hasCustomUpload ? "Foto personalizada salva" : "Foto padrão do template"}
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--forever-accent,#77736c)]">
              {hasCustomUpload ? "Enviada pelos noivos" : "Ilustração original"}
            </p>
          </div>
          <AdminButton
            type="button"
            variant="ghost"
            disabled={isBusy}
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 text-xs min-h-9 px-3"
          >
            Trocar foto
          </AdminButton>
        </div>
      )}

      {stagedFile && (
        <div className="rounded-xl border border-[var(--forever-primary,#722F37)]/30 bg-[#fbf4f5] p-3">
          <div className="flex items-center gap-3">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-black/10">
              <Image
                src={stagedFile.previewUrl}
                alt="Prévia"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-[var(--forever-ink,#161616)]">
                {stagedFile.file.name}
              </p>
              <p className="text-[11px] text-[var(--forever-accent,#77736c)]">
                {(stagedFile.file.size / 1024).toFixed(0)} KB · Pronto para envio
              </p>
            </div>
            <button
              type="button"
              disabled={isBusy}
              onClick={handleCancelStaged}
              className="text-[var(--forever-accent,#77736c)] hover:text-red-600 disabled:opacity-50"
              title="Cancelar"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-3 flex gap-2">
            <AdminButton
              type="button"
              disabled={isBusy}
              onClick={() => void handleConfirmUpload()}
              className="flex-1 text-xs"
            >
              {isBusy ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Salvando…
                </>
              ) : (
                <>
                  <UploadCloud size={14} />
                  Enviar e salvar foto
                </>
              )}
            </AdminButton>
            <AdminButton
              type="button"
              variant="ghost"
              disabled={isBusy}
              onClick={handleCancelStaged}
              className="text-xs"
            >
              Cancelar
            </AdminButton>
          </div>
        </div>
      )}

      {!stagedFile && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !isBusy && fileInputRef.current?.click()}
          className={`group relative flex flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center transition-all cursor-pointer ${
            dragActive
              ? "border-[var(--forever-primary,#722F37)] bg-[var(--forever-hover-tint,#722f370a)] ring-2 ring-[var(--forever-hover-tint,#722f3712)]"
              : "border-[var(--forever-hover-border,#722f3725)] bg-white/70 hover:border-[var(--forever-primary,#722F37)] hover:bg-[var(--forever-hover-tint,#722f3705)]"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/webp"
            disabled={isBusy}
            onChange={handleFileSelect}
            className="sr-only"
          />

          <div className="flex size-10 items-center justify-center rounded-full bg-[var(--forever-sand,#EFECE6)] text-[var(--forever-primary,#722F37)] transition-transform duration-200 group-hover:scale-110">
            {isBusy ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <UploadCloud size={20} strokeWidth={1.75} />
            )}
          </div>

          <p className="mt-2 text-xs font-medium text-[var(--forever-ink,#161616)]">
            <span className="text-[var(--forever-primary,#722F37)] underline decoration-[var(--forever-primary,#722F37)]/40 underline-offset-4">
              Clique para selecionar
            </span>{" "}
            ou arraste a foto aqui
          </p>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
            <span className="inline-flex items-center rounded-full bg-[var(--forever-sand,#EFECE6)] px-2 py-0.5 text-[10px] font-medium text-[var(--forever-accent,#77736c)]">
              Apenas PNG ou WebP
            </span>
            <span className="inline-flex items-center rounded-full bg-[var(--forever-sand,#EFECE6)] px-2 py-0.5 text-[10px] font-medium text-[var(--forever-accent,#77736c)]">
              Máximo 1MB
            </span>
          </div>
        </div>
      )}

      {isBusy && (
        <UploadProgress
          isUploading={isUploading}
          isAutoSaving={isAutoSaving}
          progress={progress}
          variant="single"
        />
      )}

      <ConfirmModal
        open={showResetModal}
        onOpenChange={setShowResetModal}
        title="Restaurar foto original?"
        description="A foto personalizada enviada será substituída pela imagem padrão do template e a alteração será salva automaticamente no site."
        confirmLabel="Restaurar foto"
        onConfirm={executeResetToDefault}
        isBusy={isBusy}
      />
    </div>
  );
}
