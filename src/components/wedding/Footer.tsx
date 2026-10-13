"use client";


import { WeddingOrnaments } from "./WeddingOrnaments";
import {useWedding} from "./WeddingProvider";
import { ArrowUp } from "lucide-react";

export function Footer() {
  const {config:weddingConfig,path}=useWedding();
  const { couple } = weddingConfig;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };

  return (
    <footer className="cinema-footer w-full bg-[#F1F1F1] text-[#1A1715] py-20 sm:py-32 px-6 sm:px-12 lg:px-20 text-center relative overflow-hidden">
      <WeddingOrnaments variant="floral" tone="paper" />
      <div className="relative z-10 w-full space-y-10">
        <div className="space-y-3">
          <span className="text-[11px] font-mono tracking-[0.35em] uppercase text-[#8C6D46] block">
            {couple.hashtag}
          </span>
          <h2 className="font-serif text-5xl sm:text-7xl lg:text-9xl font-light tracking-tight leading-none text-[#1A1715]">
            <span>{couple.partner1}</span>
            <span className="font-serif italic font-light text-[#8C6D46] px-4">&amp;</span>
            <span>{couple.partner2}</span>
          </h2>
        </div>

        <p className="text-[#73685B] text-sm sm:text-base font-light leading-relaxed">
          Agradecemos por caminhar conosco e fazer parte da celebração mais importante de nossas vidas. Nos vemos no altar!
        </p>

        <div className="pt-2">
          <button
            onClick={scrollToTop}
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-[#1A1715] hover:text-[#8C6D46] border border-[#1A1715]/20 hover:border-[#8C6D46] px-8 py-3.5 rounded-full transition-colors"
          >
            <ArrowUp className="w-3.5 h-3.5 text-[#8C6D46]" />
            <span>Voltar ao Início</span>
          </button>
        </div>

        <p className="text-[11px] font-mono uppercase tracking-widest text-[#8C8276] pt-8">
          {couple.locationSummary.toUpperCase()} · {new Date(couple.weddingDate).toLocaleDateString("pt-BR",{day:"numeric",month:"long",year:"numeric",timeZone:"America/Sao_Paulo"}).toUpperCase()}
        </p>
      </div>
    </footer>
  );
}
