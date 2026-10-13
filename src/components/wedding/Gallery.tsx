"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {useWedding} from "./WeddingProvider";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

export function Gallery() {
  const {config:weddingConfig,path}=useWedding();
  const { gallery } = weddingConfig;
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  if (!gallery || gallery.length === 0) return null;

  const handlePrev = () => {
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((selectedPhotoIndex - 1 + gallery.length) % gallery.length);
  };

  const handleNext = () => {
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((selectedPhotoIndex + 1) % gallery.length);
  };

  // Alturas orgânicas e dinâmicas estilo Pinterest editorial
  const getPinterestAspect = (index: number) => {
    const aspects = [
      "aspect-[3/4]",   // 0: Retrato vertical elegante
      "aspect-[4/5]",   // 1: Médio vertical
      "aspect-[1/1]",   // 2: Quadrado perfeito
      "aspect-[9/14]",  // 3: Retrato longo Vogue
      "aspect-[4/3]",   // 4: Horizontal clássico
      "aspect-[3/4]",   // 5: Retrato vertical
      "aspect-[1/1]",   // 6: Quadrado
      "aspect-[16/11]", // 7: Paisagem ampla
      "aspect-[4/5]",   // 8: Médio vertical
      "aspect-[9/14]",  // 9: Retrato longo
      "aspect-[3/4]",   // 10: Retrato vertical
      "aspect-[1/1]",   // 11: Quadrado
    ];
    return aspects[index % aspects.length];
  };

  return (
    <section
      id="galeria"
      className="w-full py-20 sm:py-32 px-6 sm:px-12 lg:px-20 bg-[var(--page-background,#F1F1F1)] text-[#1A1715]"
    >
      <div className="w-full space-y-16 sm:space-y-20">
        {/* Cabeçalho Editorial */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-[#1A1715]/15 pb-8">
          <div className="space-y-3">
            <span className="text-[11px] font-mono tracking-[0.35em] uppercase text-[#8C6D46] block">
              [ 02 &bull; MEMÓRIAS &amp; DETALHES ]
            </span>
            <h2 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-light tracking-tight leading-[0.95]">
              Detalhes do Grande Dia
            </h2>
          </div>

          <p className="text-sm sm:text-base text-[#73685B] font-light leading-relaxed">
            Um moodboard visual de flores, alianças e cenários que inspiram o nosso grande dia. Imagens ilustrativas.
          </p>
        </div>

        {/* Pinterest Style Editorial Masonry Grid */}
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 [column-fill:_balance]">
          {gallery.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: (index % 4) * 0.08 }}
              onClick={() => setSelectedPhotoIndex(index)}
              className="break-inside-avoid mb-6 group cursor-pointer relative overflow-hidden bg-[#EFE8DD] transition-all duration-500"
            >
              {/* Imagem com Aspect Ratio Variável */}
              <div className={`w-full overflow-hidden ${getPinterestAspect(index)} relative`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.caption || `Registro ${index + 1}`}
                  className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-700 ease-out"
                />

                {/* Overlay Estilo Pinterest de Alta Costura */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-5 text-white">
                  {/* Topo do Pin: Badge Mono & Ícone */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md font-mono text-[9px] uppercase tracking-[0.25em] text-[#F3E2CE]">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-xs">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  {/* Base do Pin: Legenda Tipográfica */}
                  <div className="space-y-1 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-[#C9A96E] block">
                      29 DE MAIO &bull; 2027
                    </span>
                    <p className="font-serif text-lg sm:text-xl font-light leading-snug drop-shadow-xs">
                      {photo.caption}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox Minimalista em Tela Cheia */}
      <AnimatePresence>
        {selectedPhotoIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#0D0A08]/95 backdrop-blur-xl select-none"
            onClick={() => setSelectedPhotoIndex(null)}
          >
            {/* Fechar */}
            <button
              onClick={() => setSelectedPhotoIndex(null)}
              className="absolute top-8 right-8 p-3 text-white/70 hover:text-white transition-colors"
              aria-label="Fechar galeria"
            >
              <X className="w-7 h-7" />
            </button>

            {/* Anterior */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-6 sm:left-12 p-3 text-white/70 hover:text-white transition-colors"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            {/* Imagem Ampliada */}
            <div
              className="relative max-w-5xl max-h-[85vh] flex flex-col items-center space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gallery[selectedPhotoIndex].url}
                alt={gallery[selectedPhotoIndex].caption || "Foto ampliada"}
                className="max-h-[78vh] w-auto object-contain shadow-2xl"
              />
              <div className="flex items-center gap-6 text-white/80">
                <span className="font-mono text-xs uppercase tracking-widest text-[#C9A96E]">
                  {String(selectedPhotoIndex + 1).padStart(2, "0")} / {String(gallery.length).padStart(2, "0")}
                </span>
                {gallery[selectedPhotoIndex].caption && (
                  <span className="font-serif text-lg font-light text-white">
                    {gallery[selectedPhotoIndex].caption}
                  </span>
                )}
              </div>
            </div>

            {/* Próximo */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-6 sm:right-12 p-3 text-white/70 hover:text-white transition-colors"
              aria-label="Próxima foto"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
