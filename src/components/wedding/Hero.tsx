"use client";
import {useSiteCopy} from "./useSiteCopy";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import Image from 'next/image';

import {useWedding} from "./WeddingProvider";
import { formatDateBR } from "@/lib/utils";
import { WeddingOrnaments } from "./WeddingOrnaments";
import { Countdown } from "./Countdown";
import { resolveTemplateImage } from "@/lib/template-images";

import { ArrowDown } from "lucide-react";

export function Hero() {
  const copy=useSiteCopy();
  const {config:weddingConfig,path,modules}=useWedding();
  const { couple } = weddingConfig;
  const section = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "14%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 65]);
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.15]);
  const heroImage = resolveTemplateImage(weddingConfig, "botanical-classic", "hero");
  return <section ref={section} id="inicio" className="relative w-full overflow-hidden bg-[#5D613C] px-6 sm:px-12 lg:px-20 pt-8 sm:pt-12 pb-24 sm:pb-36 text-[#F1F1F1]">
    <motion.div style={reducedMotion ? undefined : { y: imageY, scale: imageScale }} className="absolute inset-x-0 -inset-y-[20%] origin-center">
      {heroImage&&<Image unoptimized
        src={heroImage}
        alt=""
        fill
        preload
        sizes="(min-width: 1760px) 1760px, 100vw"
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/2wBDABcQERQRDhcUEhQaGBcbIjklIh8fIkYyNSk5UkhXVVFIUE5bZoNvW2F8Yk5QcptzfIeLkpSSWG2grJ+OqoOPko3/2wBDARgaGiIeIkMlJUONXlBejY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY3/wAARCAAOABgDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAME/8QAIRAAAgEEAgIDAAAAAAAAAAAAAQIDABESMQQhFDIiYYH/xAAXAQADAQAAAAAAAAAAAAAAAAABAgME/8QAGBEBAQEBAQAAAAAAAAAAAAAAAQAhERL/2gAMAwEAAhEDEQA/AMUaRzx4BMJCb99U8VoyoVt9kfeqnAUKsJGfJ7XxAAtoVpESB7ZP7a6teszlTzRkaPjXLSZMygADQpU+THEyJ8pDgfU2AP7SmDIJy//Z"
        className="object-cover object-center"
      />}
    </motion.div>
    <div aria-hidden="true" className="absolute inset-0" style={{background:"linear-gradient(180deg, rgba(43,44,32,0.42) 0%, rgba(35,37,27,0.50) 55%, rgba(73,77,48,0.60) 100%)"}} />

    <WeddingOrnaments progress={scrollYProgress} variant="hearts" tone="photo" />
    <motion.div style={reducedMotion ? undefined : { y: contentY, opacity }} className="relative z-10 text-center flex flex-col items-center gap-9 sm:gap-12 pb-10 sm:pb-14">
      <p className="hero-intro cinema-eyebrow text-white">{copy("hero.text2")}<span className="mx-3">{copy("hero.text3")}</span> {new Date(couple.weddingDate).getFullYear()}</p>
      <h1 className="hero-logo font-serif text-5xl sm:text-7xl lg:text-9xl font-light tracking-tight leading-none text-white">
        <span>{couple.partner1}</span>
        <span className="font-serif italic font-light text-[#C7B79D] px-4">{copy("hero.text4")}</span>
        <span>{couple.partner2}</span>
      </h1>
      <p className="hero-detail whitespace-pre-line font-serif italic text-xl sm:text-3xl font-light leading-relaxed max-w-3xl text-white">{couple.headline}</p>
      <div className="hero-detail flex flex-wrap justify-center gap-x-8 sm:gap-x-12 gap-y-4 text-[10px] sm:text-xs tracking-[0.22em] uppercase text-white">
        <span>{formatDateBR(couple.weddingDate)}</span><span>{couple.locationSummary}</span><span>{weddingConfig.ceremony.time}</span>
      </div>
      <div className="hero-detail py-3"><Countdown targetDateISO={couple.weddingDate} /></div>
      {(modules.rsvp||modules.gifts)&&<div className="hero-detail flex flex-col sm:flex-row gap-4 sm:gap-6 w-full sm:w-auto">
        {modules.rsvp&&<a href="#rsvp" className="cinema-button bg-[#C7B79D] text-[#3D2501] hover:bg-[#F1F1F1]">{copy("hero.text6")}</a>}
        {modules.gifts&&<a href="#presentes" className="cinema-button bg-white/10 text-[#F1F1F1] hover:bg-white/20 backdrop-blur-sm">{copy("hero.text7")}</a>}
      </div>}
    </motion.div>
    <a href="#historia" className="hero-detail relative z-10 flex flex-col items-center gap-3 mx-auto w-fit mt-4 text-white group">
      <span className="text-[9px] uppercase tracking-[0.3em]">{copy("hero.text8")}</span>
      <ArrowDown size={17} strokeWidth={1} className="transition-transform duration-500 group-hover:translate-y-1" />
    </a>
    <svg aria-hidden="true" width="0" height="0" className="absolute pointer-events-none">
      <defs>
        <clipPath id="hero-inverted-heart" clipPathUnits="objectBoundingBox">
          <path d="M 0,1 C 0.12,1 0.14,0.08 0.29,0.08 C 0.39,0.08 0.46,0.48 0.5,0.76 C 0.54,0.48 0.61,0.08 0.71,0.08 C 0.86,0.08 0.88,1 1,1 Z" />
        </clipPath>
      </defs>
    </svg>
    <div data-envelope-edge aria-hidden="true" className="absolute -bottom-px inset-x-0 h-16 sm:h-24 lg:h-28 bg-[#F1F1F1] pointer-events-none z-20" style={{ clipPath: "url(#hero-inverted-heart)" }} />
  </section>;
}
