"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Heart, Maximize2 } from "lucide-react";
import type { GalleryPhoto, GalleryStyle } from "@/types/wedding";

export interface GalleryLayoutProps {
  photos: GalleryPhoto[];
  onSelectPhoto: (index: number) => void;
}

function SatinBow({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 72 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M36 19C25 5 7 4 9 15c2 10 15 10 27 4Z" fill="currentColor" fillOpacity="0.16" />
      <path d="M36 19c11-14 29-15 27-4-2 10-15 10-27 4Z" fill="currentColor" fillOpacity="0.16" />
      <path d="M15 13c5 1 10 3 15 5M57 13c-5 1-10 3-15 5" />
      <path d="M33 22 24 44l6-3 4 5 2-24M39 22l9 22-6-3-4 5-2-24" />
      <rect x="32" y="15" width="8" height="9" rx="3.5" fill="currentColor" />
    </svg>
  );
}

function WashiTape({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute -top-3.5 left-1/2 z-20 h-7 w-28 -translate-x-1/2 rounded-xs bg-[var(--forever-sand)]/75 shadow-[0_2px_6px_rgba(0,0,0,0.08)] backdrop-blur-xs border-y border-dashed border-white/40 ${className}`}
    >
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-60" />
    </div>
  );
}

export function PolaroidGalleryGrid({ photos, onSelectPhoto }: GalleryLayoutProps) {
  const reduced = useReducedMotion();
  return (
    <div className="columns-2 gap-5 px-2 sm:gap-8 sm:px-4 lg:columns-3">
      {photos.map((photo, index) => (
        <motion.figure
          key={photo.id}
          initial={reduced ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: reduced ? 0 : 0.8, delay: (index % 3) * 0.08 }}
          className="mb-7 break-inside-avoid sm:mb-10"
        >
          <button
            type="button"
            onClick={() => onSelectPhoto(index)}
            aria-label={`Ampliar foto ${index + 1}`}
            className={`group block w-full border border-[var(--forever-sand)]/35 bg-[#fffdfa] p-2.5 pb-10 shadow-[0_8px_24px_#3d25010b] transition-all duration-500 focus-visible:outline-[var(--forever-primary)] motion-safe:hover:rotate-0 motion-safe:hover:scale-[1.02] sm:p-4 sm:pb-16 ${
              index % 3 === 0 ? "-rotate-2" : index % 3 === 1 ? "rotate-2" : "rotate-1"
            }`}
          >
            <span
              className={`relative block overflow-hidden ${index % 4 === 1 ? "aspect-[4/3]" : "aspect-[3/4]"}`}
            >
              <Image
                src={photo.url}
                alt={photo.caption || `Foto ${index + 1} da galeria`}
                unoptimized
                fill
                sizes="(min-width: 1024px) 33vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <span className="absolute bottom-2 right-2 flex size-8 items-center justify-center rounded-full bg-[#fffdfa]/90 text-[var(--forever-primary)] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 shadow-xs">
                <Maximize2 size={14} />
              </span>
            </span>
          </button>
        </motion.figure>
      ))}
    </div>
  );
}

export function RelicarioGalleryGrid({ photos, onSelectPhoto }: GalleryLayoutProps) {
  const reduced = useReducedMotion();
  return (
    <ul className="grid grid-cols-2 gap-x-5 gap-y-16 pb-16 sm:gap-x-10 lg:grid-cols-3 lg:gap-x-14 lg:gap-y-20">
      {photos.map((photo, index) => {
        const oval = index % 3 === 1;
        const shape = oval ? "rounded-full" : "rounded-t-full rounded-b-[2rem]";
        const inner = oval ? "rounded-full" : "rounded-t-full rounded-b-[1.5rem]";
        return (
          <li
            key={photo.id}
            className={`${index % 2 === 1 ? "translate-y-12" : ""} ${index % 3 === 1 ? "lg:translate-y-16" : "lg:translate-y-0"}`}
          >
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 36, scale: 0.94 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={
                reduced
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 90, damping: 16, delay: (index % 3) * 0.12 }
              }
              className="relative"
            >
              {oval && (
                <SatinBow className="absolute -top-7 left-1/2 z-10 w-16 -translate-x-1/2 text-[var(--forever-primary)] sm:-top-9 sm:w-20" />
              )}
              <button
                type="button"
                onClick={() => onSelectPhoto(index)}
                aria-label={`Ampliar foto ${index + 1}`}
                className={`group relative block w-full bg-[#fffdfa] p-2 shadow-[0_22px_45px_-24px_color-mix(in_srgb,var(--forever-primary)_55%,transparent)] transition-transform duration-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--forever-primary)] motion-safe:hover:-translate-y-2 sm:p-3 ${shape}`}
              >
                <span className={`relative block aspect-[3/4] overflow-hidden ${inner}`}>
                  <Image
                    src={photo.url}
                    alt={photo.caption || `Foto ${index + 1} do casal`}
                    unoptimized
                    fill
                    sizes="(min-width: 1024px) 30vw, 45vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span
                    aria-hidden="true"
                    className={`absolute inset-1.5 border border-white/70 sm:inset-2.5 ${inner}`}
                  />
                </span>
                <span
                  aria-hidden="true"
                  className="absolute -bottom-4 left-1/2 flex size-9 -translate-x-1/2 items-center justify-center rounded-full bg-[#fffdfa] text-[var(--forever-primary)] shadow-[0_6px_16px_-6px_color-mix(in_srgb,var(--forever-primary)_60%,transparent)] transition-transform duration-300 group-hover:scale-125 sm:size-10"
                >
                  <Heart size={15} strokeWidth={1.4} fill="currentColor" />
                </span>
              </button>
            </motion.div>
          </li>
        );
      })}
    </ul>
  );
}

function Clothespin({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 40" fill="none" className={className}>
      <rect
        x="5"
        y="4"
        width="4.5"
        height="32"
        rx="1.5"
        fill="#c49a6c"
        stroke="#9a6e43"
        strokeWidth="0.8"
      />
      <rect
        x="10.5"
        y="4"
        width="4.5"
        height="32"
        rx="1.5"
        fill="#d8b284"
        stroke="#9a6e43"
        strokeWidth="0.8"
      />
      <rect
        x="4"
        y="16"
        width="12"
        height="7"
        rx="2"
        fill="#8d633c"
        stroke="#5c3d24"
        strokeWidth="0.8"
      />
      <circle cx="10" cy="19.5" r="1.5" fill="#f5ebe0" />
    </svg>
  );
}

export function VaralGalleryGrid({ photos, onSelectPhoto }: GalleryLayoutProps) {
  const reduced = useReducedMotion();

  const desktopRows = [
    { items: photos.slice(0, 3), offset: 0, tilts: [-2, 1.5, -1.8] },
    { items: photos.slice(3, 6), offset: 3, tilts: [1.8, -1.5, 2] },
  ];

  const mobileRows = [
    { items: photos.slice(0, 2), offset: 0, tilts: [-2, 1.8] },
    { items: photos.slice(2, 4), offset: 2, tilts: [1.5, -1.8] },
    { items: photos.slice(4, 6), offset: 4, tilts: [-1.5, 2] },
  ];

  const renderStringRow = (
    row: { items: GalleryPhoto[]; offset: number; tilts: number[] },
    rowIndex: number,
    isMobile: boolean,
  ) => (
    <div key={rowIndex} className="relative pt-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-1 left-0 right-0 z-0 h-10 overflow-hidden"
      >
        <svg
          viewBox="0 0 1000 40"
          preserveAspectRatio="none"
          className="h-full w-full text-[var(--forever-sand)] opacity-60"
        >
          <path
            d="M 0 10 Q 500 34 1000 10"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="5 3"
            fill="none"
          />
        </svg>

        <div
          className={`absolute top-1 flex justify-between ${isMobile ? "inset-x-6 px-3" : "inset-x-8 px-4 sm:inset-x-16"}`}
        >
          {(isMobile ? [0, 1, 2, 3, 4] : [0, 1, 2, 3, 4, 5, 6, 7]).map((light) => (
            <span
              key={light}
              className="size-2 rounded-full bg-amber-200/90 shadow-[0_0_8px_#fde047] animate-pulse"
              style={{ animationDuration: `${2 + (light % 3) * 0.7}s` }}
            />
          ))}
        </div>
      </div>

      <div
        className={`relative z-10 grid gap-x-5 gap-y-10 ${isMobile ? "grid-cols-2" : "grid-cols-3 sm:gap-x-8 lg:gap-x-12"}`}
      >
        {row.items.map((photo, index) => {
          const realIndex = row.offset + index;
          const tilt = row.tilts[index % row.tilts.length];
          return (
            <motion.div
              key={photo.id}
              initial={reduced ? false : { opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: reduced ? 0 : 0.8, delay: index * 0.12 }}
              animate={reduced ? undefined : { rotate: [tilt - 0.8, tilt + 0.8, tilt - 0.8] }}
              style={{ transformOrigin: "top center" }}
              className="group relative pt-4"
            >
              <Clothespin className="pointer-events-none absolute -top-4 left-1/2 z-20 w-5 -translate-x-1/2 drop-shadow-xs sm:-top-5 sm:w-6" />

              <button
                type="button"
                onClick={() => onSelectPhoto(realIndex)}
                aria-label={`Ampliar foto ${realIndex + 1}`}
                className="block w-full border border-[var(--forever-sand)]/40 bg-[#fffdfa] p-2.5 pb-6 shadow-[0_16px_35px_-10px_rgba(0,0,0,0.18)] transition-all duration-400 focus-visible:outline-[var(--forever-primary)] motion-safe:hover:-translate-y-2 motion-safe:hover:scale-[1.03] motion-safe:hover:shadow-[0_24px_45px_-12px_rgba(0,0,0,0.22)] sm:p-3.5 sm:pb-8"
              >
                <span className="relative block aspect-[3/4] overflow-hidden rounded-xs">
                  <Image
                    src={photo.url}
                    alt={photo.caption || `Foto ${realIndex + 1} do varal`}
                    unoptimized
                    fill
                    sizes={isMobile ? "45vw" : "(min-width: 1024px) 30vw, 45vw"}
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className="absolute bottom-2 right-2 flex size-7 items-center justify-center rounded-full bg-[#fffdfa]/90 text-[var(--forever-primary)] opacity-0 transition-opacity group-hover:opacity-100 shadow-xs">
                    <Maximize2 size={13} />
                  </span>
                </span>
                <span className="mt-2.5 flex items-center justify-center text-[var(--forever-sand)] opacity-60">
                  <Heart size={11} fill="currentColor" />
                </span>
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <div className="space-y-16 sm:hidden">
        {mobileRows.map((row, idx) => renderStringRow(row, idx, true))}
      </div>

      <div className="hidden space-y-24 sm:block">
        {desktopRows.map((row, idx) => renderStringRow(row, idx, false))}
      </div>
    </>
  );
}

export function FilmeGalleryGrid({ photos, onSelectPhoto }: GalleryLayoutProps) {
  const reduced = useReducedMotion();
  const strip1 = photos.slice(0, 3);
  const strip2 = photos.slice(3, 6);
  const strips = [
    { items: strip1, offset: 0, tilt: "-rotate-1 sm:-rotate-2" },
    { items: strip2, offset: 3, tilt: "rotate-1 sm:rotate-2" },
  ];

  return (
    <div className="flex flex-col items-center justify-center gap-10 sm:flex-row sm:items-start sm:gap-10 lg:gap-16">
      {strips.map((strip, stripIndex) => (
        <motion.div
          key={stripIndex}
          initial={reduced ? false : { opacity: 0, y: 35, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: reduced ? 0 : 0.9, delay: stripIndex * 0.15 }}
          className={`w-full max-w-xs transition-transform duration-500 hover:rotate-0 sm:max-w-sm ${strip.tilt}`}
        >
          <div className="relative rounded-xs border border-[#302824] bg-[#231e1c] p-4 text-[#e2d5cb] shadow-[0_24px_50px_-15px_rgba(0,0,0,0.35)] sm:p-5">
            <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2.5 text-[9px] uppercase tracking-[0.25em] text-[#e2d5cb]/70">
              <span className="font-mono">FOREVER 35MM</span>
              <span className="font-mono">EXP {stripIndex + 1}</span>
            </div>

            <div className="relative space-y-3.5 px-3">
              <div
                aria-hidden="true"
                className="absolute -left-1 top-2 bottom-2 flex flex-col justify-between py-1 opacity-40"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <span key={i} className="block h-2 w-1.5 rounded-xs bg-[#fffdfa]/60" />
                ))}
              </div>

              <div
                aria-hidden="true"
                className="absolute -right-1 top-2 bottom-2 flex flex-col justify-between py-1 opacity-40"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <span key={i} className="block h-2 w-1.5 rounded-xs bg-[#fffdfa]/60" />
                ))}
              </div>

              {strip.items.map((photo, subIndex) => {
                const realIndex = strip.offset + subIndex;
                return (
                  <div key={photo.id} className="relative">
                    <button
                      type="button"
                      onClick={() => onSelectPhoto(realIndex)}
                      aria-label={`Ampliar foto ${realIndex + 1}`}
                      className="group relative block aspect-[4/3] w-full overflow-hidden border border-black/60 bg-black/40 focus-visible:outline-2 focus-visible:outline-white/80"
                    >
                      <Image
                        src={photo.url}
                        alt={photo.caption || `Foto ${realIndex + 1} da película`}
                        unoptimized
                        fill
                        sizes="(min-width: 640px) 300px, 80vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
                      <span className="absolute bottom-2 right-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100">
                        <Maximize2 size={12} />
                      </span>
                    </button>
                    <div className="mt-1 flex items-center justify-between text-[8px] font-mono tracking-wider text-[#e2d5cb]/50">
                      <span>FRAME {String(realIndex + 1).padStart(2, "0")}</span>
                      <span>▶</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3.5 border-t border-white/10 pt-2 text-center font-serif text-[11px] italic tracking-widest text-[#e2d5cb]/75">
              amor para sempre
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function MuralGalleryGrid({ photos, onSelectPhoto }: GalleryLayoutProps) {
  const reduced = useReducedMotion();
  const tilts = ["-rotate-2", "rotate-2", "-rotate-1", "rotate-3", "-rotate-2", "rotate-1"];
  const tapeTilts = ["rotate-1", "-rotate-2", "rotate-2", "-rotate-1", "rotate-1", "-rotate-2"];

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-12 px-2 sm:gap-x-10 sm:gap-y-16 lg:grid-cols-3 lg:gap-x-12">
      {photos.map((photo, index) => (
        <motion.div
          key={photo.id}
          initial={reduced ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: reduced ? 0 : 0.8, delay: (index % 3) * 0.1 }}
          className="relative pt-3"
        >
          <WashiTape className={tapeTilts[index % tapeTilts.length]} />

          <button
            type="button"
            onClick={() => onSelectPhoto(index)}
            aria-label={`Ampliar foto ${index + 1}`}
            className={`group block w-full border border-[var(--forever-sand)]/35 bg-[#fffdfa] p-2.5 pb-5 shadow-[0_14px_30px_-10px_rgba(0,0,0,0.12)] transition-all duration-400 focus-visible:outline-[var(--forever-primary)] motion-safe:hover:-translate-y-2 motion-safe:hover:rotate-0 motion-safe:hover:shadow-[0_22px_45px_-12px_rgba(0,0,0,0.18)] sm:p-3.5 sm:pb-7 ${
              tilts[index % tilts.length]
            }`}
          >
            <span className="relative block aspect-[3/4] overflow-hidden rounded-xs">
              <Image
                src={photo.url}
                alt={photo.caption || `Foto afetiva ${index + 1}`}
                unoptimized
                fill
                sizes="(min-width: 1024px) 33vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <span className="absolute bottom-2 right-2 flex size-7 items-center justify-center rounded-full bg-[#fffdfa]/90 text-[var(--forever-primary)] opacity-0 transition-opacity group-hover:opacity-100 shadow-xs">
                <Maximize2 size={13} />
              </span>
            </span>

            <span className="mt-3 flex items-center justify-end px-1 text-[var(--forever-sand)]">
              <Heart size={13} fill="currentColor" opacity={0.65} />
            </span>
          </button>
        </motion.div>
      ))}
    </div>
  );
}

export function GalleryGridDispatcher({
  style,
  photos,
  onSelectPhoto,
}: GalleryLayoutProps & { style: GalleryStyle }) {
  switch (style) {
    case "relicario":
      return <RelicarioGalleryGrid photos={photos} onSelectPhoto={onSelectPhoto} />;
    case "varal":
    case "editorial" as GalleryStyle:
      return <VaralGalleryGrid photos={photos} onSelectPhoto={onSelectPhoto} />;
    case "filme":
      return <FilmeGalleryGrid photos={photos} onSelectPhoto={onSelectPhoto} />;
    case "mural":
      return <MuralGalleryGrid photos={photos} onSelectPhoto={onSelectPhoto} />;
    case "polaroid":
    default:
      return <PolaroidGalleryGrid photos={photos} onSelectPhoto={onSelectPhoto} />;
  }
}
