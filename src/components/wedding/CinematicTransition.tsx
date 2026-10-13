"use client";
import {useSiteCopy} from "./useSiteCopy";

import {useWedding} from "./WeddingProvider";
import { useRef } from "react";
import { WeddingOrnaments } from "./WeddingOrnaments";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

export function CinematicTransition() {
  const copy=useSiteCopy();
 const {config}=useWedding();
  const section = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: section, offset: ["start end", "end start"] });
  const dateScale = useTransform(scrollYProgress, [0, 0.45, 1], [0.88, 1, 1.04]);
  const dateY = useTransform(scrollYProgress, [0, 1], [40, -40]);
  return <section ref={section} aria-label={copy("transition.text1")} className="cinema-transition relative overflow-hidden bg-[#5D613C] text-[#F1F1F1] px-6 sm:px-12 lg:px-20 pt-28 sm:pt-40 pb-8 sm:pb-12 text-center">
    <WeddingOrnaments progress={scrollYProgress} />
    <svg aria-hidden="true" width="0" height="0" className="absolute pointer-events-none">
      <defs>
        <clipPath id="transition-heart" clipPathUnits="objectBoundingBox">
          <path d="M 0,0 L 0,1 C 0.12,1 0.14,0.08 0.29,0.08 C 0.39,0.08 0.46,0.48 0.5,0.76 C 0.54,0.48 0.61,0.08 0.71,0.08 C 0.86,0.08 0.88,1 1,1 L 1,0 Z" />
        </clipPath>
      </defs>
    </svg>
    <div data-envelope-top-edge aria-hidden="true" className="absolute -top-px inset-x-0 h-16 sm:h-24 lg:h-28 bg-[#F1F1F1] pointer-events-none z-20" style={{ clipPath: "url(#transition-heart)" }} />
    <div className="relative z-10 space-y-6 sm:space-y-8">
      <p data-cinema-copy className="cinema-eyebrow text-[#C7B79D]">{copy("transition.text2")}</p>
      <h2 className="font-serif italic text-4xl sm:text-6xl lg:text-7xl font-light tracking-tight">{copy("transition.text3")}</h2>
      <motion.p style={reduced ? undefined : { scale: dateScale, y: dateY }} className="font-serif text-[clamp(3.3rem,10vw,10rem)] font-light tracking-[-0.035em] leading-[1.1] py-2 sm:py-4">{new Date(config.couple.weddingDate).toLocaleDateString("pt-BR",{timeZone:"America/Sao_Paulo"}).replaceAll("/",".")}</motion.p>
      <p data-cinema-copy className="font-serif text-xl sm:text-2xl font-light text-[#F1F1F1]/80">{copy("transition.text4")}</p>
    </div>
  </section>;
}
