"use client";
import {useSiteCopy} from "./useSiteCopy";

import { useRef } from "react";
import Image from "next/image";
import { useScroll } from "framer-motion";
import { ArrowUpRight, Heart, Navigation } from "lucide-react";
import { WeddingOrnaments, WeddingBranch } from "./WeddingOrnaments";
import {useWedding} from "./WeddingProvider";

export function Events() {
  const copy=useSiteCopy();
  const {config:weddingConfig,path}=useWedding();
  const section = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start end", "end start"] });
  const { ceremony } = weddingConfig;

  return (
    <section ref={section} id="eventos" className="cinematic-section relative overflow-hidden w-full pt-8 sm:pt-12 pb-16 sm:pb-24 px-6 sm:px-12 lg:px-20 bg-[#5D613C] text-[#F1F1F1] [&_a:focus-visible]:outline-[#F1F1F1] [&_button:focus-visible]:outline-[#F1F1F1] [&_[tabindex]:focus-visible]:outline-[#F1F1F1]">
      <WeddingOrnaments progress={scrollYProgress} variant="venue" />
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center space-y-5 max-w-4xl mx-auto mb-10 sm:mb-14">
          <p data-cinema-copy className="cinema-eyebrow text-[#F1F1F1]/80">{copy("events.text1")}</p>
          <h2 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-light tracking-[-0.04em] leading-[1.05]">{copy("events.text2")}<span className="italic text-[#C7B79D]">{copy("events.text3")}</span>{copy("events.text4")}</h2>
          <p data-cinema-copy className="font-serif italic text-xl sm:text-2xl text-[#F1F1F1]/80 leading-relaxed">{copy("events.text5")}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-center">
          <div data-cinema-copy>
            <div
              className="relative w-full max-w-xl mx-auto rounded-t-[45%] rounded-b-[2rem] border border-[#C7B79D]/65 bg-white/5 p-3 sm:p-4 shadow-[0_24px_70px_-30px_#17130D80]">
              <div aria-hidden="true" className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#C7B79D] z-10"><Heart size={20} strokeWidth={1.2} /></div>
              <div className="relative aspect-[4/5] w-full rounded-t-[45%] rounded-b-[1.5rem] overflow-hidden ring-1 ring-[#F1F1F1]/25 bg-[#C7B79D]/20">
                <Image src={ceremony.image || "/detalhes/mesa.jpg"} unoptimized alt={ceremony.placeName} fill sizes="(min-width: 1024px) 42vw, 90vw" className="object-cover" />
              </div>
              <div aria-hidden="true" className="absolute -left-7 -bottom-3 w-16 sm:w-20 -rotate-[30deg] text-[#C7B79D] pointer-events-none z-10"><WeddingBranch /></div>
            </div>
          </div>
          <div className="space-y-8 sm:space-y-9">
            <div className="space-y-5">
              <p data-cinema-copy className="cinema-eyebrow text-[#C7B79D]">{copy("events.text6")}</p>
              <h3 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-light tracking-[-0.035em]">{ceremony.placeName}</h3>
              <p data-cinema-copy className="text-base sm:text-lg font-light text-[#F1F1F1]/80 leading-[1.8] max-w-lg">{copy("events.text7")}</p>
            </div>

            <dl data-cinema-sequence className="grid grid-cols-2 gap-6 sm:gap-10">
              <div className="space-y-3">
                <dt className="cinema-eyebrow text-[#F1F1F1]/80">{copy("events.text8")}</dt>
                <dd className="font-serif text-3xl sm:text-4xl text-[#C7B79D]">{new Date(weddingConfig.couple.weddingDate).toLocaleDateString("pt-BR",{day:"numeric",month:"short",year:"numeric",timeZone:"America/Sao_Paulo"}).replace(" de "," ").replace(" de "," ").replace(".","")}<span className="block font-sans text-xs sm:text-sm text-[#F1F1F1]/80 mt-2">{new Date(weddingConfig.couple.weddingDate).toLocaleDateString("pt-BR",{weekday:"long",timeZone:"America/Sao_Paulo"}).replace(/^./,c=>c.toUpperCase())}</span></dd>
              </div>
              <div className="space-y-3">
                <dt className="cinema-eyebrow text-[#F1F1F1]/80">{copy("events.text9")}</dt>
                <dd className="font-serif text-3xl sm:text-4xl text-[#C7B79D]">{ceremony.time}<span className="block font-sans text-xs sm:text-sm text-[#F1F1F1]/80 mt-2">{copy("events.text10")}</span></dd>
              </div>
            </dl>

            <div data-cinema-copy className="space-y-3">
              <p className="cinema-eyebrow text-[#F1F1F1]/80">{copy("events.text11")}</p>
              <address className="not-italic text-base sm:text-lg font-light leading-[1.8]">{ceremony.address}<br /><span className="text-[#F1F1F1]/80">{ceremony.cityState}</span></address>
              {ceremony.websiteUrl&&<a href={ceremony.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs text-[#C7B79D] hover:text-[#F1F1F1] py-2">{copy("events.text12")}<ArrowUpRight size={15} /></a>}
            </div>

            <div data-cinema-copy className="space-y-5">
              <div className="flex flex-wrap gap-3">
                <a href={ceremony.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="cinema-button bg-[#C7B79D] text-[#3D2501] hover:bg-[#F1F1F1] gap-2"><Navigation size={15} />{copy("events.text13")}</a>
                {ceremony.wazeUrl && <a href={ceremony.wazeUrl} target="_blank" rel="noopener noreferrer" className="cinema-button bg-[#C7B79D]/25 text-[#F1F1F1] hover:bg-[#C7B79D]/50 gap-2">{copy("events.text14")}<ArrowUpRight size={15} /></a>}
              </div>
            </div>
          </div>
        </div>
      </div>
      <svg aria-hidden="true" viewBox="0 0 1000 100" preserveAspectRatio="none" className="absolute inset-x-0 -bottom-px block w-full h-12 sm:h-16 pointer-events-none z-20 overflow-visible">
        <path fill="#F1F1F1" d="M 0,35 C 180,95 350,100 520,62 C 700,20 840,5 1000,30 L 1000,104 L 0,104 Z" />
      </svg>
    </section>
  );
}