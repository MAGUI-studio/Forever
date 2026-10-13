"use client";

import { useRef } from "react";
import { Heart } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

import type { TemplateOrnamentsProps } from "./ornament-types";

export function BotanicalClassicOrnaments({ progress, variant = "botanical", tone = "olive", venue = false }: TemplateOrnamentsProps) {
  const frame = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: frame, offset: ["start end", "end start"] });
  const reduced = useReducedMotion();
  const branchY = useTransform(progress ?? scrollYProgress, [0, 1], [24, -24]);
  const heartY = useTransform(progress ?? scrollYProgress, [0, 1], [-14, 14]);
  const design = venue ? "venue" : variant;
  const floral = design === "floral";
  const sideSize = design === "hearts" ? "w-20 sm:w-28 lg:w-36" : "w-32 sm:w-44 lg:w-60";
  const color = tone === "paper" ? "text-[#80654E] opacity-45" : tone === "photo" ? "text-[#F1F1F1] opacity-50" : "text-[#C7B79D]";

  return (
    <div ref={frame} data-wedding-ornaments={design} aria-hidden="true" className={`absolute inset-0 pointer-events-none overflow-hidden ${color}`}>
      <motion.div style={reduced ? undefined : { y: branchY }} className={`absolute ${design === "venue" ? "-left-12 sm:-left-8 top-[35%]" : "-left-8 sm:left-3 bottom-8 sm:bottom-10"} ${sideSize} opacity-25`}>
        {design === "hearts" ? <Heart className="w-full h-auto -rotate-12" strokeWidth={0.6} /> : floral ? <WeddingFlowers /> : <BotanicalClassicBranch />}
      </motion.div>
      <motion.div style={reduced ? undefined : { y: heartY }} className={`absolute ${design === "venue" ? "-right-10 sm:-right-4 bottom-8" : "-right-8 sm:right-3 top-16 sm:top-24"} ${sideSize} opacity-25`}>
        <div className={design === "hearts" ? "rotate-12" : "rotate-180"}>
          {design === "hearts" ? <Heart className="w-full h-auto" strokeWidth={0.6} /> : design === "vows" || floral ? <WeddingFlowers /> : <BotanicalClassicBranch />}
        </div>
      </motion.div>
      <motion.div style={reduced ? undefined : { y: heartY }} className="absolute left-[10%] sm:left-[16%] top-[20%] opacity-30 -rotate-12">
        <Heart className="w-6 h-6 sm:w-9 sm:h-9" strokeWidth={0.9} />
      </motion.div>
      <motion.div style={reduced ? undefined : { y: branchY }} className="absolute right-[10%] sm:right-[17%] bottom-[12%] opacity-30 rotate-12">
        {floral ? <WeddingFlowers compact /> : <Heart className="w-5 h-5 sm:w-8 sm:h-8" strokeWidth={0.9} />}
      </motion.div>
    </div>
  );
}


function WeddingFlowers({ compact = false }: { compact?: boolean }) {
  return <svg viewBox="0 0 200 360" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={compact ? "w-10 sm:w-14 h-auto" : "w-full h-auto"}>
    <path d="M60 350C112 257 117 199 107 81M95 252C78 205 56 184 40 165M109 207C148 176 158 145 165 122" />
    <path d="M82 298C41 288 21 261 30 235C65 242 86 267 82 298ZM98 260C138 269 170 240 172 215C139 217 110 232 98 260Z" />
    {[[107, 64, 1], [36, 150, .75], [166, 104, .7]].map(([x, y, scale]) => <g key={x} transform={`translate(${x} ${y}) scale(${scale})`}>
      {[0, 60, 120, 180, 240, 300].map(angle => <ellipse key={angle} cx="0" cy="-22" rx="13" ry="22" transform={`rotate(${angle})`} />)}
      <circle r="9" />
    </g>)}
  </svg>;
}
export function BotanicalClassicBranch() {
  return (
    <svg viewBox="0 0 200 400" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-auto">
      <path d="M32 386C74 331 85 283 104 229S141 128 149 33" />
      <path d="M62 335C21 329 5 301 12 275C43 278 67 303 62 335Z" />
      <path d="M70 316C112 324 146 300 149 268C116 267 85 286 70 316Z" />
      <path d="M86 274C50 263 34 237 39 211C68 216 88 239 86 274Z" />
      <path d="M94 252C130 262 165 242 173 210C144 206 111 220 94 252Z" />
      <path d="M110 214C75 196 65 169 77 142C104 154 118 183 110 214Z" />
      <path d="M119 190C151 202 182 183 192 153C163 145 136 159 119 190Z" />
      <path d="M135 146C107 126 100 102 109 77C134 89 143 118 135 146Z" />
      <path d="M142 117C168 122 189 102 191 76C167 75 148 91 142 117Z" />
      <path d="M148 66C127 50 125 26 138 8C155 21 157 45 148 66Z" />
    </svg>
  );
}