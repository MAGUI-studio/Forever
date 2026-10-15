"use client";
import { useFeedbackToasts } from "@/components/ui/ForeverToaster";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { User } from "firebase/auth";
import type { GalleryPhoto } from "@/types/wedding";
import {
  MAX_GALLERY_PHOTOS,
  MAX_GALLERY_FILE_SIZE_BYTES,
  ALLOWED_GALLERY_MIME_TYPES,
  ALLOWED_GALLERY_EXTENSIONS,
  isUploadThingUrl,
  placeholderGallery,
} from "@/config/gallery";
import { useUploadThing } from "@/lib/uploadthing";
import {
  UploadCloud,
  Image as ImageIcon,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sparkles,
  Camera,
  Check,
} from "lucide-react";
import { AdminButton } from "./AdminButton";
import { ConfirmModal } from "./ConfirmModal";

interface GalleryUploaderProps {
  currentPhotos: GalleryPhoto[];
  onPhotosChange: (photos: GalleryPhoto[]) => void;
  onPhotosSave?: (photos: GalleryPhoto[]) => Promise<void>;
  user: User | null;
  slug: string;
}

interface StagedFile {
  file: File;
  previewUrl: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function isValidFileType(file: File): boolean {
  if (ALLOWED_GALLERY_MIME_TYPES.includes(file.type as any)) return true;
  const name = file.name.toLowerCase();
  return ALLOWED_GALLERY_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export function GalleryUploader({
  currentPhotos,
  onPhotosChange,
  onPhotosSave,
  user,
  slug,
}: GalleryUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  useFeedbackToasts(error, success);
  const [progress, setProgress] = useState<number>(0);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // Revoke preview object URLs when unmounted or changed
  useEffect(() => {
    return () => {
      staged.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [staged]);

  const { startUpload, isUploading } = useUploadThing("galleryUploader", {
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

      // 1. Purge previous UploadThing files from cloud storage
      const oldUploadThingUrls = currentPhotos
        .map((p) => p.url)
        .filter((url) => isUploadThingUrl(url));

      if (oldUploadThingUrls.length > 0 && user) {
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
            body: JSON.stringify({ urls: oldUploadThingUrls }),
          });
        } catch (cleanupErr) {
          console.warn("Aviso ao remover fotos antigas da nuvem:", cleanupErr);
        } finally {
          setIsCleaning(false);
        }
      }

      const newPhotos: GalleryPhoto[] = res.map((file, index) => ({
        id: file.key || `uploaded-${Date.now()}-${index}`,
        url: file.url || (file as any).ufsUrl,
        caption: "",
        aspect: "square",
      }));

      // 2. Automatically save immediately to Firestore
      try {
        setIsAutoSaving(true);
        if (onPhotosSave) {
          await onPhotosSave(newPhotos);
        } else {
          onPhotosChange(newPhotos);
        }
        setSuccess(
          `${newPhotos.length} fotos enviadas e salvas com sucesso no site!`,
        );
      } catch (saveErr) {
        onPhotosChange(newPhotos);
        setError(
          "As fotos foram enviadas, mas houve uma oscilação ao salvar automaticamente. Clique em 'Salvar alterações' no topo para confirmar.",
        );
      } finally {
        setIsAutoSaving(false);
        setStaged([]);
        setProgress(0);
      }
    },
    onUploadError: (err) => {
      setError(
        err.message ||
          "Não foi possível enviar as fotos. Verifique a conexão e tente novamente.",
      );
      setProgress(0);
    },
  });

  function processFiles(incomingFiles: FileList | File[]) {
    setError("");
    setSuccess("");

    const fileList = Array.from(incomingFiles);
    if (fileList.length === 0) return;

    if (fileList.length > MAX_GALLERY_PHOTOS) {
      setError(
        `Selecione no máximo ${MAX_GALLERY_PHOTOS} fotos. Aceitamos até ${MAX_GALLERY_PHOTOS} imagens por vez.`,
      );
      return;
    }

    const validated: StagedFile[] = [];
    for (const file of fileList) {
      if (!isValidFileType(file)) {
        setError(
          `O arquivo "${file.name}" não é suportado. Aceitamos exclusivamente imagens em PNG ou WebP.`,
        );
        return;
      }
      if (file.size > MAX_GALLERY_FILE_SIZE_BYTES) {
        setError(
          `O arquivo "${file.name}" tem ${(file.size / (1024 * 1024)).toFixed(2)}MB, ultrapassando o limite de 1MB por foto.`,
        );
        return;
      }
      validated.push({
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    setStaged((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return validated;
    });
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      processFiles(e.target.files);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }

  function removeStagedItem(index: number) {
    setStaged((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleUploadClick() {
    if (staged.length === 0) return;
    setError("");
    setSuccess("");
    const filesToUpload = staged.map((s) => s.file);
    await startUpload(filesToUpload);
  }

  async function executeResetToSample() {
    setShowResetModal(false);
    const oldUploadThingUrls = currentPhotos
      .map((p) => p.url)
      .filter((url) => isUploadThingUrl(url));

    if (oldUploadThingUrls.length > 0 && user) {
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
          body: JSON.stringify({ urls: oldUploadThingUrls }),
        });
      } catch (err) {
        console.warn("Erro ao limpar fotos do storage:", err);
      } finally {
        setIsCleaning(false);
      }
    }

    try {
      setIsAutoSaving(true);
      if (onPhotosSave) {
        await onPhotosSave([]);
      } else {
        onPhotosChange([]);
      }
      setSuccess("Fotos de exemplo restauradas e salvas no site.");
    } catch {
      onPhotosChange([]);
    } finally {
      setIsAutoSaving(false);
    }
  }

  const hasCustomUploads = currentPhotos.some((p) => isUploadThingUrl(p.url));
  const activePhotos = currentPhotos.length ? currentPhotos : placeholderGallery;
  const isBusy = isUploading || isAutoSaving || isCleaning;

  return (
    <div className="space-y-6">
      {/* Header and Auto-Save Reassurance Banner */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Camera size={20} className="text-[var(--forever-primary,#722F37)]" />
            <h2 className="font-serif text-2xl text-[var(--forever-ink,#161616)]">
              Fotos do casal
            </h2>
          </div>
          {hasCustomUploads && (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => setShowResetModal(true)}
              className="inline-flex items-center gap-1.5 text-xs text-[var(--forever-accent,#77736c)] transition-colors hover:text-[var(--forever-primary,#722F37)] disabled:opacity-50"
            >
              <RefreshCw size={13} className={isCleaning ? "animate-spin" : ""} />
              Restaurar fotos de exemplo
            </button>
          )}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-[var(--forever-accent,#77736c)]">
          Envie as {MAX_GALLERY_PHOTOS} fotos oficiais do casamento para ilustrar a galeria dos noivos.
        </p>
      </div>

      {/* Auto-Save Reassurance Card */}
      <div className="flex items-start gap-3 rounded-2xl border border-[var(--forever-hover-border,#722f3725)] bg-[var(--forever-hover-tint,#722f3708)] p-3.5 text-xs text-[var(--forever-primary,#722F37)]">
        <Sparkles size={17} className="mt-0.5 shrink-0 text-[var(--forever-primary,#722F37)]" />
        <div className="leading-relaxed">
          <span className="font-semibold">Salvamento automático:</span> assim que você enviar as fotos, suas alterações serão salvas automaticamente no site.
        </div>
      </div>

      {/* Feedback Messages */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
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
          className="flex items-start gap-2.5 rounded-xl border border-[#722f3730] bg-[#fbf4f5] p-3.5 text-xs text-[var(--forever-primary,#722F37)]"
        >
          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[var(--forever-primary,#722F37)]" />
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

      {/* Custom Romantic File Dropzone (NOT standard HTML) */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isBusy && fileInputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
          dragActive
            ? "border-[var(--forever-primary,#722F37)] bg-[var(--forever-hover-tint,#722f370a)] ring-4 ring-[var(--forever-hover-tint,#722f3712)]"
            : "border-[var(--forever-hover-border,#722f3730)] bg-[var(--forever-sand-card,#fffdfa)] hover:border-[var(--forever-primary,#722F37)] hover:bg-[var(--forever-hover-tint,#722f3705)]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/webp"
          multiple
          disabled={isBusy}
          onChange={handleFileSelect}
          className="sr-only"
        />

        <div className="flex size-14 items-center justify-center rounded-full bg-[var(--forever-sand,#EFECE6)] text-[var(--forever-primary,#722F37)] shadow-xs transition-transform duration-300 group-hover:scale-110">
          {isBusy ? (
            <Loader2 size={24} className="animate-spin text-[var(--forever-primary,#722F37)]" />
          ) : (
            <UploadCloud size={26} strokeWidth={1.75} />
          )}
        </div>

        <p className="mt-3 text-sm font-medium text-[var(--forever-ink,#161616)]">
          <span className="text-[var(--forever-primary,#722F37)] underline decoration-[var(--forever-primary,#722F37)]/40 underline-offset-4">
            Clique para selecionar as fotos
          </span>{" "}
          ou arraste até aqui
        </p>

        <p className="mt-1 text-xs text-[var(--forever-accent,#77736c)]">
          Selecione as imagens em alta resolução do casal
        </p>

        {/* Requirements Badges */}
        <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--forever-sand,#EFECE6)] px-2.5 py-1 text-[11px] font-medium text-[var(--forever-accent,#77736c)]">
            Apenas PNG ou WebP
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--forever-sand,#EFECE6)] px-2.5 py-1 text-[11px] font-medium text-[var(--forever-accent,#77736c)]">
            Máximo 1MB por imagem
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--forever-sand,#EFECE6)] px-2.5 py-1 text-[11px] font-medium text-[var(--forever-accent,#77736c)]">
            Até 6 fotos
          </span>
        </div>
      </div>

      {/* Staged Files Preview (Before Upload) */}
      {staged.length > 0 && (
        <div className="rounded-2xl border border-[var(--forever-hover-border,#722f3730)] bg-[var(--forever-sand-card,#fffdfa)] p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[var(--forever-primary,#722F37)]" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--forever-primary,#722F37)]">
                Fotos prontas para upload ({staged.length}/{MAX_GALLERY_PHOTOS})
              </h3>
            </div>
            {!isBusy && (
              <button
                type="button"
                onClick={() => setStaged([])}
                className="text-xs text-[var(--forever-accent,#77736c)] hover:text-red-600"
              >
                Limpar seleção
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {staged.map((item, index) => (
              <div
                key={item.previewUrl}
                className="group relative aspect-square overflow-hidden rounded-xl border border-[#722f3720] bg-neutral-100"
              >
                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  className="size-full object-cover"
                />

                {/* Badge number */}
                <span className="absolute left-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-white backdrop-blur-xs">
                  Foto {index + 1}
                </span>

                {/* Badge format + size */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-[10px] text-white">
                  <p className="truncate font-medium">{item.file.name}</p>
                  <p className="text-[9px] text-neutral-300">
                    {formatBytes(item.file.size)} • {item.file.type.split("/")[1]?.toUpperCase()}
                  </p>
                </div>

                {/* Remove individual button */}
                {!isBusy && (
                  <button
                    type="button"
                    aria-label={`Remover foto ${item.file.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeStagedItem(index);
                    }}
                    className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-black/60 text-white opacity-90 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Upload and Auto-Save Progress Bar */}
          {isBusy && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-[var(--forever-primary,#722F37)]">
                <span className="flex items-center gap-1.5 font-medium">
                  <Loader2 size={13} className="animate-spin" />
                  {isUploading
                    ? "Enviando fotos para a nuvem…"
                    : isAutoSaving
                    ? "Salvando alterações automaticamente no site…"
                    : "Atualizando galeria…"}
                </span>
                <span className="font-semibold">{isUploading ? `${progress}%` : <Check size={14} />}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--forever-sand,#EFECE6)]">
                <div
                  className="h-full rounded-full bg-[var(--forever-primary,#722F37)] transition-all duration-300"
                  style={{ width: isUploading ? `${progress}%` : "100%" }}
                />
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
            <AdminButton
              disabled={isBusy || staged.length === 0}
              onClick={handleUploadClick}
              className="w-full sm:w-auto"
            >
              {isBusy ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  {isUploading ? "Enviando fotos…" : "Salvando no site…"}
                </>
              ) : (
                <>
                  <UploadCloud size={16} />
                  Enviar {staged.length} {staged.length === 1 ? "foto" : "fotos"} e salvar no site
                </>
              )}
            </AdminButton>
          </div>
        </div>
      )}

      {/* Currently Active Photos in the Site */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon size={16} className="text-[var(--forever-accent,#77736c)]" />
            <span className="text-xs font-medium text-[var(--forever-primary,#722F37)]">
              Fotos ativas no site ({activePhotos.length}/{MAX_GALLERY_PHOTOS})
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] text-[var(--forever-accent,#77736c)]">
            {hasCustomUploads ? (
              <>
                <CheckCircle2 size={12} className="text-emerald-600" />
                Fotos oficiais do casal
              </>
            ) : (
              "Fotos ilustrativas de exemplo"
            )}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {activePhotos.map((photo, index) => (
            <div
              key={photo.id}
              className="group relative aspect-square overflow-hidden rounded-xl border border-[#722f3720] bg-neutral-100 shadow-sm"
            >
              <Image
                src={photo.url}
                alt={`Foto da galeria ${index + 1}`}
                unoptimized
                fill
                sizes="(max-width: 640px) 160px, 200px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
                Foto {index + 1}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        open={showResetModal}
        onOpenChange={setShowResetModal}
        title="Restaurar fotos de exemplo?"
        description="As fotos enviadas atualmente serão substituídas pelas fotos de demonstração da galeria e a alteração será salva automaticamente no site."
        confirmLabel="Restaurar fotos"
        onConfirm={executeResetToSample}
        isBusy={isBusy}
      />
    </div>
  );
}
