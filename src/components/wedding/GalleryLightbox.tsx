"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { GalleryPhoto } from "@/types/wedding";

export function GalleryLightbox({
  photos,
  index,
  onIndexChange,
  onClose,
}: {
  photos: GalleryPhoto[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const selected = index % photos.length,
    photo = photos[selected];
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  const move = (direction: number) =>
    onIndexChange((selected + direction + photos.length) % photos.length);
  return (
    <dialog
      ref={dialog}
      aria-label="Fotos do casal"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          move(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-[#161616]/95 p-6 text-white backdrop:bg-black/70 open:grid open:place-items-center"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar foto"
        className="absolute right-4 top-4 z-10 flex size-12 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
      >
        <X size={22} />
      </button>
      {photos.length > 1 && (
        <button
          type="button"
          onClick={() => move(-1)}
          aria-label="Foto anterior"
          className="absolute left-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 hover:bg-black/75 sm:left-6"
        >
          <ChevronLeft size={24} />
        </button>
      )}
      <div className="w-full max-w-6xl">
        <div className="relative h-[75dvh] w-full">
          <Image
            src={photo.url}
            alt={photo.caption || `Foto ${selected + 1} da galeria`}
            unoptimized
            fill
            sizes="100vw"
            className="object-contain"
          />
        </div>
        <p aria-live="polite" className="mt-5 text-center text-xs text-white/70">
          {selected + 1} / {photos.length}
          {photo.caption && (
            <span className="ml-4 font-serif text-lg text-white">{photo.caption}</span>
          )}
        </p>
      </div>
      {photos.length > 1 && (
        <button
          type="button"
          onClick={() => move(1)}
          aria-label="Próxima foto"
          className="absolute right-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 hover:bg-black/75 sm:right-6"
        >
          <ChevronRight size={24} />
        </button>
      )}
    </dialog>
  );
}
