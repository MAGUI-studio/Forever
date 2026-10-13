"use client";

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
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { AdminButton } from "./AdminButton";

interface GalleryUploaderProps {
  currentPhotos: GalleryPhoto[];
  onPhotosChange: (photos: GalleryPhoto[]) => void;
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
  user,
  slug,
}: GalleryUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [isCleaning, setIsCleaning] = useState(false);

  // Clean up object URLs when staged files change or component unmounts
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

      // Automatically purge previous UploadThing photos from storage
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

      onPhotosChange(newPhotos);
      setStaged([]);
      setProgress(0);
      setSuccess(
        `${newPhotos.length} fotos enviadas com sucesso! As fotos anteriores foram removidas do storage.`,
      );
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

    // Validate maximum count
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
          `O arquivo "${file.name}" não é suportado. Aceitamos APENAS imagens PNG ou WebP.`,
        );
        return;
      }
      if (file.size > MAX_GALLERY_FILE_SIZE_BYTES) {
        setError(
          `O arquivo "${file.name}" tem ${(file.size / (1024 * 1024)).toFixed(2)}MB, excedendo o limite de 1MB por foto.`,
        );
        return;
      }
      validated.push({
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    // Replace staged files
    setStaged((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return validated;
    });
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      processFiles(e.target.files);
    }
    // reset input value so same files can be chosen again if needed
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

  async function handleResetToSample() {
    if (
      !window.confirm(
        "Deseja restaurar as fotos de exemplo? As fotos enviadas atualmente serão removidas da galeria e do storage.",
      )
    ) {
      return;
    }

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

    onPhotosChange([]);
    setSuccess("Fotos de exemplo restauradas com sucesso.");
  }

  const hasCustomUploads = currentPhotos.some((p) => isUploadThingUrl(p.url));
  const activePhotos = currentPhotos.length ? currentPhotos : placeholderGallery;

  return (
    <div className="space-y-6">
      {/* Header and Guidelines */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-2xl text-[var(--forever-ink,#3D2501)]">
            Fotos do casal
          </h2>
          {hasCustomUploads && (
            <button
              type="button"
              disabled={isUploading || isCleaning}
              onClick={handleResetToSample}
              className="inline-flex items-center gap-1.5 text-xs text-[var(--forever-accent,#80654E)] transition-colors hover:text-[var(--forever-primary,#5D613C)]"
            >
              <RefreshCw size={13} className={isCleaning ? "animate-spin" : ""} />
              Restaurar fotos de exemplo
            </button>
          )}
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-[var(--forever-accent,#80654E)]">
          Envie as {MAX_GALLERY_PHOTOS} fotos oficiais do casamento para a galeria.
          Ao enviar fotos novas, as fotos antigas são removidas automaticamente do
          storage para não acumular arquivos desnecessários.
        </p>
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
          className="flex items-start gap-2.5 rounded-xl border border-[#5d613c30] bg-[#edf0e3] p-3.5 text-xs text-[var(--forever-primary,#5D613C)]"
        >
          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[var(--forever-primary,#5D613C)]" />
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

      {/* Custom Romantic File Dropzone (NOT default HTML) */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
          dragActive
            ? "border-[var(--forever-primary,#5D613C)] bg-[var(--forever-hover-tint,#5d613c0a)] ring-4 ring-[var(--forever-hover-tint,#5d613c12)]"
            : "border-[var(--forever-hover-border,#5d613c30)] bg-[var(--forever-sand-card,#fffdfa)] hover:border-[var(--forever-primary,#5D613C)] hover:bg-[var(--forever-hover-tint,#5d613c05)]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/webp"
          multiple
          disabled={isUploading}
          onChange={handleFileSelect}
          className="sr-only"
        />

        <div className="flex size-14 items-center justify-center rounded-full bg-[var(--forever-sand,#EFECE6)] text-[var(--forever-primary,#5D613C)] transition-transform duration-300 group-hover:scale-110">
          {isUploading ? (
            <Loader2 size={24} className="animate-spin text-[var(--forever-primary,#5D613C)]" />
          ) : (
            <UploadCloud size={26} strokeWidth={1.75} />
          )}
        </div>

        <p className="mt-3 text-sm font-medium text-[var(--forever-ink,#3D2501)]">
          <span className="text-[var(--forever-primary,#5D613C)] underline decoration-[var(--forever-primary,#5D613C)]/40 underline-offset-4">
            Clique para selecionar as fotos
          </span>{" "}
          ou arraste até aqui
        </p>

        <p className="mt-1 text-xs text-[var(--forever-accent,#80654E)]">
          Selecione as fotos que irão estampar a galeria dos noivos
        </p>

        {/* Requirements Badges */}
        <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--forever-sand,#EFECE6)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--forever-accent,#80654E)]">
            Apenas PNG ou WebP
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--forever-sand,#EFECE6)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--forever-accent,#80654E)]">
            Máximo 1MB por foto
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--forever-sand,#EFECE6)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--forever-accent,#80654E)]">
            Até 6 fotos
          </span>
        </div>
      </div>

      {/* Staged Files Preview (Before Upload) */}
      {staged.length > 0 && (
        <div className="rounded-2xl border border-[var(--forever-hover-border,#5d613c30)] bg-[var(--forever-sand-card,#fffdfa)] p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[var(--forever-primary,#5D613C)]" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--forever-primary,#5D613C)]">
                Fotos prontas para upload ({staged.length}/{MAX_GALLERY_PHOTOS})
              </h3>
            </div>
            {!isUploading && (
              <button
                type="button"
                onClick={() => setStaged([])}
                className="text-xs text-[var(--forever-accent,#80654E)] hover:text-red-600"
              >
                Limpar seleção
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {staged.map((item, index) => (
              <div
                key={item.previewUrl}
                className="group relative aspect-square overflow-hidden rounded-xl border border-[#5d613c20] bg-neutral-100"
              >
                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  className="size-full object-cover"
                />

                {/* Badge format + size */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-[10px] text-white">
                  <p className="truncate font-medium">{item.file.name}</p>
                  <p className="text-[9px] text-neutral-300">
                    {formatBytes(item.file.size)} • {item.file.type.split("/")[1]?.toUpperCase()}
                  </p>
                </div>

                {/* Remove button */}
                {!isUploading && (
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

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-[var(--forever-primary,#5D613C)]">
                <span className="flex items-center gap-1.5 font-medium">
                  <Loader2 size={13} className="animate-spin" />
                  Enviando fotos e sincronizando com o site…
                </span>
                <span className="font-semibold">{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--forever-sand,#EFECE6)]">
                <div
                  className="h-full rounded-full bg-[var(--forever-primary,#5D613C)] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
            <AdminButton
              disabled={isUploading || staged.length === 0}
              onClick={handleUploadClick}
              className="w-full sm:w-auto"
            >
              {isUploading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Enviando {staged.length} {staged.length === 1 ? "foto" : "fotos"}…
                </>
              ) : (
                <>
                  <UploadCloud size={16} />
                  Enviar {staged.length} {staged.length === 1 ? "foto" : "fotos"} para a galeria
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
            <ImageIcon size={16} className="text-[var(--forever-accent,#80654E)]" />
            <span className="text-xs font-medium text-[var(--forever-primary,#5D613C)]">
              Fotos atuais na galeria ({activePhotos.length}/{MAX_GALLERY_PHOTOS})
            </span>
          </div>
          <span className="text-[11px] text-[var(--forever-accent,#80654E)]">
            {hasCustomUploads ? "Fotos enviadas pelos noivos" : "Fotos ilustrativas de exemplo"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {activePhotos.map((photo, index) => (
            <div
              key={photo.id}
              className="group relative aspect-square overflow-hidden rounded-xl border border-[#5d613c20] bg-neutral-100 shadow-sm"
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
    </div>
  );
}
