"use client";

import type { ReactNode } from "react";
import { Heart } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { TemplateOrnamentsProps } from "./ornament-types";

export type RomancePattern =
  "cover" | "story" | "venue" | "schedule" | "dress" | "gifts" | "rsvp" | "footer";
type Motif =
  | "stars"
  | "loveLetter"
  | "together"
  | "bells"
  | "cheers"
  | "confetti"
  | "bow"
  | "pearls"
  | "present"
  | "arrow"
  | "envelope"
  | "key"
  | "rings";

const drawings: Record<Motif, ReactNode> = {
  stars: (
    <>
      <path d="M95 15c1 25-7 36-25 39 22 0 25 17 25 39 3-25 8-35 28-39-22-2-26-17-28-39ZM35 82c0 15-5 22-18 24 14 1 18 9 18 24 1-15 6-23 19-24-14-2-18-9-19-24Z" />
      <path d="m155 25 2 15m-9-7 16-1m-27 71 2 12m-7-6 13-1" />
      <circle cx="55" cy="25" r="1.5" />
      <circle cx="173" cy="85" r="2" />
    </>
  ),
  loveLetter: (
    <>
      <path d="m37 30 111 15-13 89-111-17ZM37 30l46 60 65-45M25 115l45-37m30 4 35 51" />
      <path d="M82 105c-17-13-20-26-11-29 8-2 12 6 12 6s7-7 13-2c8 8-2 17-14 25Z" />
      <path d="m161 31 8-9m-4 25 13-1M17 48 4 43" />
    </>
  ),
  together: (
    <>
      <path d="M64 105C18 76 3 36 27 22c23-12 41 14 41 14s19-26 37-11c25 20 8 52-41 80Z" />
      <path d="M121 134c-39-25-48-56-27-68 18-10 32 12 32 12s17-20 33-7c23 17 6 44-38 63Z" />
      <path d="M66 106c2 27 27 50 67 49 22-1 42-13 54-25" />
    </>
  ),
  bells: (
    <>
      <path d="M39 42c-19 8-18 34-33 47l55 17c-4-23 13-46-3-58M37 41l5-11 15 4 2 13M18 101c0 14 20 19 25 6M103 47c21 5 24 30 40 40l-51 26c1-24-18-43-4-55M105 46l-7-10-13 7 1 14M114 109c2 14-18 21-24 10" />
      <path d="M65 43c-8-33-45-43-40-24 4 13 23 19 40 24 16-30 53-43 45-22-5 13-24 19-45 22ZM66 43c-2 40 5 69 31 94" />
    </>
  ),
  cheers: (
    <>
      <path d="m32 21 39 8-14 40c-6 16-30 10-28-8ZM45 76l-8 38m-19-4 38 8M121 32l-36 15 20 37c9 15 31 4 25-11ZM118 91l16 36m-17 7 35-15" />
      <path d="m31 47 31 6m34 16 31-12M80 4v13m-9-6 17 1m-7 91 2 13m-9-6 17-1" />
    </>
  ),
  confetti: (
    <>
      <path d="M10 30c40-17 73 19 45 34-20 11-24-20-2-18 36 3 65 44 43 67-22 22-44-4-23-12 24-9 58 10 73 38M129 12c-17 22 9 28 16 14s-16-21-18-3M168 65c-28 8-8 35 5 19s-13-26-24-11" />
      <path d="m14 94 7 12m93-60 10-9m-9 113-1 12m69-43-11-3m-91-98 8-4" />
    </>
  ),
  bow: (
    <>
      <path d="M96 66C62 20 5 24 20 52c10 20 40 22 75 15 27-45 81-52 68-23-10 22-41 24-67 22Z" />
      <path d="M87 66c-13 25-22 53-46 78l25-9 12 21c12-24 15-52 17-83 8 30 10 53 33 75l2-22 25 6c-20-21-37-43-52-66M87 64c4-7 14-6 17 0l-1 11-16 1Z" />
    </>
  ),
  pearls: (
    <>
      <path
        d="M12 115c71 64 151-10 110-69C99 12 47 43 68 71c20 25 56-9 83-16"
        strokeDasharray="0.1 8"
        strokeWidth="2.8"
      />
      <path d="M166 77c-22-16-15-33 0-22 17-13 27 4 0 22Z" />
      <path d="m30 30 1 15m-8-7 15-1" />
    </>
  ),
  present: (
    <>
      <path d="m35 61 112-13 8 23L40 87ZM44 87l9 62 94-11-3-63M89 56l10 88M35 101l115-14" />
      <path d="M87 55c-26-38-57-31-48-16 7 11 23 15 48 16 13-37 43-45 39-27-3 14-19 24-39 27ZM86 57 64 94l18-8 10 11m-1-40 28 32-2-14 16 3" />
    </>
  ),
  arrow: (
    <>
      <path d="m16 122 154-91M146 28l26 1-12 26M18 122 9 104m9 18-22-3M36 112l-9-20m9 20-23-3" />
      <path d="M92 83C62 66 60 39 77 35c16-4 24 14 24 14s9-18 23-11c19 10 4 33-32 45Z" />
    </>
  ),
  envelope: (
    <>
      <path d="M29 59 100 8l72 54-10 91-141-9ZM29 59l65 57 78-54M23 140l51-44m46 4 42 50M45 74l6-37 94 8 2 36" />
      <path d="M99 133c-16-10-15-25-3-19 7-10 21-3 3 19Z" />
      <path d="M66 54l60 5m-63 7 55 5" />
    </>
  ),
  key: (
    <>
      <path d="M100 67c-36-21-44-52-24-58 16-6 26 13 26 13s11-20 26-9c21 15 9 39-28 54ZM100 66l-46 73m14-23 17 10-8 11-17-10m22-34 19 11-8 11-19-10" />
      <path d="m140 53 9 9m-10 0 9-9M25 43l2 14m-9-7 15-1" />
    </>
  ),
  rings: (
    <>
      <ellipse cx="76" cy="91" rx="36" ry="45" transform="rotate(-22 76 91)" />
      <ellipse cx="123" cy="91" rx="36" ry="45" transform="rotate(22 123 91)" />
      <path d="m56 48 11-17 21 2 8 19-20 14ZM67 31l9 35 12-33m-32 15 40 4M136 34l2 16m-9-8 16-1" />
    </>
  ),
};

type Mark = { motif: Motif; className: string; drift?: number };

const compositions: Record<RomancePattern, Mark[]> = {
  cover: [{ motif: "stars", className: "right-[5%] bottom-[10%] w-28 opacity-[0.2]" }],
  story: [
    {
      motif: "loveLetter",
      className: "-right-10 top-14 w-36 rotate-[18deg] opacity-[0.12] sm:w-44",
      drift: 9,
    },
    { motif: "together", className: "-left-12 bottom-8 w-48 -rotate-12 opacity-[0.1] sm:w-64" },
  ],
  venue: [
    {
      motif: "bells",
      className: "-left-8 bottom-12 w-36 -rotate-12 opacity-[0.13] sm:w-52",
      drift: 6,
    },
  ],
  schedule: [
    { motif: "cheers", className: "-left-6 top-8 w-32 -rotate-12 opacity-[0.13] sm:w-44" },
    { motif: "confetti", className: "-right-8 bottom-6 w-40 opacity-[0.15] sm:w-60", drift: 10 },
  ],
  dress: [
    {
      motif: "bow",
      className: "-right-6 top-[7%] w-44 rotate-12 opacity-[0.12] sm:w-60",
      drift: 6,
    },
    { motif: "pearls", className: "-left-10 bottom-[6%] w-56 -rotate-12 opacity-[0.15] sm:w-72" },
  ],
  gifts: [
    { motif: "present", className: "-right-8 bottom-6 w-40 rotate-12 opacity-[0.12] sm:w-52" },
    { motif: "arrow", className: "-left-8 top-16 w-44 -rotate-6 opacity-[0.11] sm:w-56", drift: 8 },
  ],
  rsvp: [
    {
      motif: "envelope",
      className: "-left-10 top-[5%] w-36 -rotate-[18deg] opacity-[0.1] sm:w-48",
    },
    {
      motif: "key",
      className: "-right-8 bottom-[8%] w-32 rotate-[22deg] opacity-[0.12] sm:w-44",
      drift: 7,
    },
  ],
  footer: [
    { motif: "rings", className: "left-[3%] bottom-8 w-32 rotate-6 opacity-[0.15] sm:w-44" },
    { motif: "stars", className: "left-[30%] top-8 w-20 opacity-[0.12]" },
  ],
};

export function ContemporaryRomanceAccent() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 220 170"
      fill="none"
      className="h-auto w-full"
      stroke="currentColor"
      strokeWidth="1.05"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {drawings.together}
    </svg>
  );
}
export function ContemporaryRomanceOrnaments({
  tone = "paper",
  variant = "hearts",
  pattern,
}: TemplateOrnamentsProps & { pattern?: RomancePattern }) {
  const reduced = useReducedMotion();
  const selected =
    pattern ??
    (
      {
        botanical: "story",
        floral: "gifts",
        hearts: "cover",
        vows: "rsvp",
        venue: "venue",
      } as const
    )[variant];
  return (
    <div
      data-wedding-ornaments={`romance-${selected}`}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${tone !== "paper" ? "text-white" : "text-[var(--forever-primary,#722F37)]"}`}
    >
      {compositions[selected].map(({ motif, className, drift }, index) => (
        <motion.div
          key={motif}
          className={`absolute ${className}`}
          animate={reduced || !drift ? undefined : { y: [0, -drift, 0] }}
          transition={{ duration: 12 + index * 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg
            data-romance-motif={motif}
            viewBox="0 0 220 170"
            fill="none"
            className="h-auto w-full"
            stroke="currentColor"
            strokeWidth="1.05"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {drawings[motif]}
          </svg>
        </motion.div>
      ))}
    </div>
  );
}
export function ContemporaryRomanceLoadingIcon() {
  return <Heart aria-hidden="true" size={30} strokeWidth={1} />;
}
