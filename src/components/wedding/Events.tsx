"use client";
import {venueMapUrl} from "@/lib/wedding-settings";
import {VenuePhotoMap} from "./VenuePhotoMap";
import {useSiteCopy} from "./useSiteCopy";

import { useRef } from "react";
import Image from "next/image";
import { useScroll } from "framer-motion";
import { ArrowUpRight, Heart, Navigation } from "lucide-react";
import { WeddingOrnaments, WeddingBranch } from "./WeddingOrnaments";
import {useWedding} from "./WeddingProvider";
import { resolveTemplateImage } from "@/lib/template-images";

export function Events() {
  const copy=useSiteCopy();
  const {config:weddingConfig}=useWedding();
  const section = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start end", "end start"] });
  const separate=weddingConfig.sameVenue===false;
  const venues=separate?[weddingConfig.ceremony,weddingConfig.party]:[weddingConfig.ceremony];
  const venueImage = resolveTemplateImage(weddingConfig, "botanical-classic", "venue");

  return (
    <section ref={section} id="eventos" className="cinematic-section relative overflow-hidden w-full pt-10 sm:pt-16 pb-24 sm:pb-36 rounded-b-[2.5rem] sm:rounded-b-[4rem] px-6 sm:px-12 lg:px-20 bg-[#5D613C] text-[#F1F1F1] [&_a:focus-visible]:outline-[#F1F1F1] [&_button:focus-visible]:outline-[#F1F1F1] [&_[tabindex]:focus-visible]:outline-[#F1F1F1]">
      <WeddingOrnaments progress={scrollYProgress} variant="venue" />
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-12 sm:mb-16">
          <p data-cinema-copy className="cinema-eyebrow text-[#F1F1F1]/80">{copy("events.text1")}</p>
          <h2 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-light tracking-[-0.035em] leading-[1.08]">{copy("events.text2")}<span className="italic text-[#C7B79D]">{copy("events.text3")}</span>{copy("events.text4")}</h2>
          <p data-cinema-copy className="mx-auto max-w-xl text-sm sm:text-base text-[#F1F1F1]/80 leading-relaxed">{separate?"Dois lugares especiais para celebrar o nosso grande dia.":copy("events.text5")}</p>
        </div>

        {venues.map((ceremony,index)=>{const mapUrl=venueMapUrl(ceremony);return <div key={index} className="grid lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-start [&+div]:mt-16 sm:[&+div]:mt-24">
          <div data-cinema-copy className={index===1?"lg:order-2":""}>
            <div
              className="relative w-full max-w-xl mx-auto rounded-t-[45%] rounded-b-[2rem] border border-[#C7B79D]/65 bg-white/5 p-3 sm:p-4 shadow-[0_24px_70px_-30px_#17130D80]">
              <div aria-hidden="true" className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#C7B79D] z-10"><Heart size={20} strokeWidth={1.2} /></div>
              <VenuePhotoMap point={ceremony.coordinates} label={ceremony.placeName} className="aspect-[4/5] w-full rounded-t-[45%] rounded-b-[1.5rem] ring-1 ring-[#F1F1F1]/25 bg-[#C7B79D]/20">
                <Image src={index===1?ceremony.image||venueImage:venueImage} unoptimized alt={ceremony.placeName} fill sizes="(min-width: 1024px) 42vw, 90vw" className="object-cover" />
              </VenuePhotoMap>
              <div aria-hidden="true" className="absolute -left-7 -bottom-3 w-16 sm:w-20 -rotate-[30deg] text-[#C7B79D] pointer-events-none z-10"><WeddingBranch /></div>
            </div>
          </div>
          <div className={"space-y-7 sm:space-y-8 lg:pt-4 "+(index===1?"lg:order-1":"")}>
            <div className="space-y-4">
              <p data-cinema-copy className="cinema-eyebrow text-[#C7B79D]">{separate?(index===0?"Cerimônia":"Festa e recepção"):copy("events.text6")}</p>
              <h3 className="font-serif text-4xl sm:text-5xl font-light leading-[1.12] tracking-[-0.025em] break-words">{ceremony.placeName}</h3>
              <p data-cinema-copy className="text-sm sm:text-base text-[#F1F1F1]/80 leading-[1.8] max-w-lg">{separate?(index===0?"O lugar onde vamos dizer o nosso sim.":"Depois da cerimônia, esperamos você aqui para continuar a celebração."):copy("events.text7")}</p>
            </div>

            <dl data-cinema-sequence className="grid grid-cols-2 gap-6 sm:gap-8 border-y border-[#F1F1F1]/20 py-6 sm:py-7">
              <div className="space-y-3">
                <dt className="cinema-eyebrow text-[#F1F1F1]/80">{copy("events.text8")}</dt>
                <dd className="font-serif text-3xl sm:text-4xl text-[#C7B79D]">{new Date(weddingConfig.couple.weddingDate).toLocaleDateString("pt-BR",{day:"numeric",month:"short",year:"numeric",timeZone:"America/Sao_Paulo"}).replace(" de "," ").replace(" de "," ").replace(".","")}<span className="block font-sans text-xs sm:text-sm text-[#F1F1F1]/80 mt-2">{new Date(weddingConfig.couple.weddingDate).toLocaleDateString("pt-BR",{weekday:"long",timeZone:"America/Sao_Paulo"}).replace(/^./,c=>c.toUpperCase())}</span></dd>
              </div>
              <div className="space-y-3">
                <dt className="cinema-eyebrow text-[#F1F1F1]/80">{copy("events.text9")}</dt>
                <dd className="font-serif text-3xl sm:text-4xl text-[#C7B79D]">{ceremony.time?ceremony.time.replace(":","h"):"Após a cerimônia"}<span className="block font-sans text-xs sm:text-sm text-[#F1F1F1]/80 mt-2">{separate?(index===0?"Início da cerimônia":"Início da festa"):copy("events.text10")}</span></dd>
              </div>
            </dl>

            <div data-cinema-copy className="space-y-3">
              <p className="cinema-eyebrow text-[#F1F1F1]/80">{copy("events.text11")}</p>
              <address className="not-italic text-base leading-[1.8]">{ceremony.address}<br /><span className="text-sm text-[#F1F1F1]/80">{ceremony.cityState}</span></address>
              {ceremony.websiteUrl&&<a href={ceremony.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs text-[#C7B79D] hover:text-[#F1F1F1] py-2">{copy("events.text12")}<ArrowUpRight size={15} /></a>}
            </div>

            <div data-cinema-copy className="space-y-5">
              <div className="flex flex-wrap gap-3">
                {mapUrl&&<a href={mapUrl} target="_blank" rel="noopener noreferrer" className="cinema-button bg-[#C7B79D] text-[#3D2501] hover:bg-[#F1F1F1] gap-2"><Navigation size={15} />{copy("events.text13")}</a>}
              </div>
            </div>
          </div>
        </div>;})}
      </div>
    </section>
  );
}
