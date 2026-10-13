"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { User } from "firebase/auth";
import { isUploadThingUrl } from "@/config/gallery";
import { isCustomImageUrl } from "@/lib/template-images";
import { useUploadThing } from "@/lib/uploadthing";
import {
  UploadCloud,
  Camera,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Check,
} from "lucide-react";
import { AdminButton } from "./AdminButton";
import { ConfirmModal } from "./ConfirmModal";

export const MAX_SINGLE_IMAGE_SIZE_BYTES = 1024 * 1024; // 1MB
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
  const [progress, setProgress] = useState(0);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [stagedFile, setStagedFile] = useState<{ file: File; previewUrl: string } | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean staged preview object URL on unmount
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

      // 1. Purge previous custom file if stored on UploadThing
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

      // 2. Automatically save immediately to Firestore
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
        err.message ||
          "Não foi possível enviar a foto. Verifique o formato e tente novamente.",
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

  const hasCustomUpload = isCustomImageUrl(currentUrl);
  const displayUrl = hasCustomUpload ? (currentUrl || defaultUrl) : defaultUrl;
  const isBusy = isUploading || isAutoSaving || isCleaning;

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--forever-hover-border,#5d613c20)] bg-[var(--forever-sand-card,#fffdfa)] p-4 shadow-2xs">
      {/* Label and Reset Action */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Camera size={16} className="text-[var(--forever-primary,#5D613C)]" />
            <h3 className="text-xs font-semibold text-[var(--forever-primary,#5D613C)]">
              {label}
            </h3>
          </div>
          {description && (
            <p className="mt-1 text-[11px] leading-relaxed text-[var(--forever-accent,#80654E)]">
              {description}
            </p>
          )}
        </div>
        {hasCustomUpload && (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => setShowResetModal(true)}
            className="inline-flex shrink-0 items-center gap-1 text-[11px] text-[var(--forever-accent,#80654E)] transition-colors hover:text-[var(--forever-primary,#5D613C)] disabled:opacity-50"
            title="Restaurar foto original do template"
          >
            <RefreshCw size={12} className={isCleaning ? "animate-spin" : ""} />
            Restaurar original
          </button>
        )}
      </div>

      {/* Subtle Auto-save Reassurance */}
      <div className="flex items-center gap-2 rounded-xl border border-[var(--forever-hover-border,#5d613c15)] bg-[var(--forever-hover-tint,#5d613c05)] px-3 py-2 text-[11px] text-[var(--forever-primary,#5D613C)]">
        <Sparkles size={13} className="shrink-0 text-[var(--forever-primary,#5D613C)]" />
        <p className="leading-tight">
          <span className="font-semibold">Salvamento automático:</span> ao enviar uma nova foto, ela é salva automaticamente no site.
        </p>
      </div>

      {/* Error & Success Alerts */}
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
          className="flex items-start gap-2 rounded-xl border border-[#5d613c30] bg-[#edf0e3] p-2.5 text-xs text-[var(--forever-primary,#5D613C)]"
        >
          <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[var(--forever-primary,#5D613C)]" />
          <div className="flex-1 leading-relaxed">{success}</div>
          <button
            type="button"
            onClick={() => setSuccess("")}
            className="text-[var(--forever-primary,#5D613C)] hover:opacity-75"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Current Image Thumbnail & Status */}
      {displayUrl && !stagedFile && (
        <div className="flex items-center gap-3 rounded-xl border border-[#5d613c18] bg-white p-2.5">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-[#5d613c10]">
            <Image
              src={displayUrl}
              alt={label}
              fill
              unoptimized
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-[var(--forever-ink,#3D2501)]">
              {hasCustomUpload ? "Foto personalizada salva" : "Foto padrão do template"}
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--forever-accent,#80654E)]">
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

      {/* Staged File Ready to Upload */}
      {stagedFile && (
        <div className="rounded-xl border border-[var(--forever-primary,#5D613C)]/30 bg-[#edf0e3]/40 p-3">
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
              <p className="truncate text-xs font-semibold text-[var(--forever-ink,#3D2501)]">
                {stagedFile.file.name}
              </p>
              <p className="text-[11px] text-[var(--forever-accent,#80654E)]">
                {(stagedFile.file.size / 1024).toFixed(0)} KB · Pronto para envio
              </p>
            </div>
            <button
              type="button"
              disabled={isBusy}
              onClick={handleCancelStaged}
              className="text-[var(--forever-accent,#80654E)] hover:text-red-600 disabled:opacity-50"
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

      {/* Upload Dropzone (When not staging a file) */}
      {!stagedFile && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !isBusy && fileInputRef.current?.click()}
          className={`group relative flex flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center transition-all cursor-pointer ${
            dragActive
              ? "border-[var(--forever-primary,#5D613C)] bg-[var(--forever-hover-tint,#5d613c0a)] ring-2 ring-[var(--forever-hover-tint,#5d613c12)]"
              : "border-[var(--forever-hover-border,#5d613c25)] bg-white/70 hover:border-[var(--forever-primary,#5D613C)] hover:bg-[var(--forever-hover-tint,#5d613c05)]"
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

          <div className="flex size-10 items-center justify-center rounded-full bg-[var(--forever-sand,#EFECE6)] text-[var(--forever-primary,#5D613C)] transition-transform duration-200 group-hover:scale-110">
            {isBusy ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <UploadCloud size={20} strokeWidth={1.75} />
            )}
          </div>

          <p className="mt-2 text-xs font-medium text-[var(--forever-ink,#3D2501)]">
            <span className="text-[var(--forever-primary,#5D613C)] underline decoration-[var(--forever-primary,#5D613C)]/40 underline-offset-4">
              Clique para selecionar
            </span>{" "}
            ou arraste a foto aqui
          </p>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
            <span className="inline-flex items-center rounded-full bg-[var(--forever-sand,#EFECE6)] px-2 py-0.5 text-[10px] font-medium text-[var(--forever-accent,#80654E)]">
              Apenas PNG ou WebP
            </span>
            <span className="inline-flex items-center rounded-full bg-[var(--forever-sand,#EFECE6)] px-2 py-0.5 text-[10px] font-medium text-[var(--forever-accent,#80654E)]">
              Máximo 1MB
            </span>
          </div>
        </div>
      )}

      {/* Busy Progress Bar */}
      {isBusy && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-[var(--forever-primary,#5D613C)]">
            <span className="flex items-center gap-1.5 font-medium">
              <Loader2 size={12} className="animate-spin" />
              {isUploading
                ? "Enviando foto para a nuvem…"
                : isAutoSaving
                ? "Salvando alterações no site…"
                : "Atualizando foto…"}
            </span>
            <span className="font-semibold">{isUploading ? `${progress}%` : <Check size={13} />}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--forever-sand,#EFECE6)]">
            <div
              className="h-full rounded-full bg-[var(--forever-primary,#5D613C)] transition-all duration-300"
              style={{ width: isUploading ? `${progress}%` : "100%" }}
            />
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
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
