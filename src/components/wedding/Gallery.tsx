"use client";

import {useState} from "react";
import {Heart} from "lucide-react";
import {motion,useReducedMotion} from "framer-motion";
import {useWedding} from "./WeddingProvider";
import {useSiteCopy} from "./useSiteCopy";
import {WeddingOrnaments} from "./WeddingOrnaments";
import {GalleryLightbox} from "./GalleryLightbox";
import {galleryPhotos,galleryEnabled,resolveGalleryStyle} from "@/config/gallery";
import {GalleryGridDispatcher} from "./GalleryStyles";
import {RomanceReveal} from "./templates/RomanceMotion";
import type {GalleryStyle} from "@/types/wedding";

const floatingHearts=[
  {className:"left-[5%] top-[12%]",size:18,delay:0},
  {className:"right-[7%] top-[20%]",size:26,delay:1.5},
  {className:"left-[9%] bottom-[16%]",size:14,delay:3},
  {className:"right-[11%] bottom-[9%]",size:20,delay:0.8},
  {className:"left-[46%] top-[5%]",size:12,delay:2.2},
  {className:"left-[30%] bottom-[4%]",size:16,delay:4},
];

export function Gallery({
  forceStyle,
  forceTemplate,
}:{
  forceStyle?: GalleryStyle;
  forceTemplate?: "botanical-classic" | "contemporary-romance";
} = {}){
  const {config,templateId:activeTemplate}=useWedding();
  const copy=useSiteCopy();
  const reduced=useReducedMotion();
  const [selected,setSelected]=useState<number|null>(null);

  if(!galleryEnabled(config)) return null;

  const currentTemplate = forceTemplate ?? activeTemplate;
  const style = forceStyle ?? resolveGalleryStyle(config, currentTemplate);
  const photos = galleryPhotos(config);

  if(currentTemplate === "contemporary-romance") {
    return (
      <section id="galeria" className="relative isolate overflow-hidden bg-[color-mix(in_srgb,var(--forever-sand)_18%,#fffdfa)] px-6 py-20 text-[var(--forever-ink)] sm:px-12 sm:py-28 lg:px-20">
        {/* Efeito de corações flutuantes no fundo se for estilo romântico/relicário */}
        {style === "relicario" && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 text-[var(--forever-primary)]">
            {floatingHearts.map(heart=>(
              <motion.span
                key={heart.className}
                className={`absolute opacity-25 ${heart.className}`}
                animate={reduced?undefined:{y:[0,-10,0],rotate:[-6,6,-6]}}
                transition={{duration:7,delay:heart.delay,repeat:Infinity,ease:"easeInOut"}}
              >
                <Heart size={heart.size} strokeWidth={1.2} fill="currentColor" fillOpacity={0.25}/>
              </motion.span>
            ))}
          </div>
        )}

        <div className="relative mx-auto max-w-5xl">
          <RomanceReveal className="mx-auto mb-16 max-w-2xl text-center sm:mb-20">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--forever-primary)]">{copy("romance.gallery.eyebrow")}</p>
            <h2 className="mt-5 font-serif text-5xl font-light italic leading-[1.05] tracking-[-0.02em] sm:text-7xl">{copy("romance.gallery.title")}</h2>
            <div aria-hidden="true" className="mx-auto mt-7 flex w-40 items-center gap-3 text-[var(--forever-primary)]">
              <span className="h-px flex-1 bg-current opacity-30"/>
              <Heart size={14} strokeWidth={1.4} fill="currentColor"/>
              <span className="h-px flex-1 bg-current opacity-30"/>
            </div>
            <p className="mx-auto mt-7 max-w-lg text-sm leading-8 text-[var(--forever-accent)]">{copy("romance.gallery.description")}</p>
          </RomanceReveal>

          <GalleryGridDispatcher style={style} photos={photos} onSelectPhoto={setSelected} />
        </div>

        {selected!==null && (
          <GalleryLightbox photos={photos} index={selected} onIndexChange={setSelected} onClose={()=>setSelected(null)}/>
        )}
      </section>
    );
  }

  // Fallback: Botanical Classic
  return (
    <section id="galeria" className="relative isolate overflow-hidden px-6 py-20 text-[var(--forever-ink)] sm:px-12 sm:py-28 lg:px-20">
      <WeddingOrnaments variant="floral" tone="paper"/>
      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-2xl space-y-5 text-center">
          <p className="cinema-eyebrow text-[var(--forever-primary)]">{copy("botanical.gallery.eyebrow")}</p>
          <h2 className="font-serif text-5xl font-light italic tracking-tight sm:text-7xl">{copy("botanical.gallery.title")}</h2>
          <p className="text-sm leading-7 text-[var(--forever-accent)]">{copy("botanical.gallery.description")}</p>
        </div>

        <GalleryGridDispatcher style={style} photos={photos} onSelectPhoto={setSelected} />
      </div>

      {selected!==null && (
        <GalleryLightbox photos={photos} index={selected} onIndexChange={setSelected} onClose={()=>setSelected(null)}/>
      )}
    </section>
  );
}
