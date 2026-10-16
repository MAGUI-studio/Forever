"use client";
import { useSiteCopy } from "./useSiteCopy";

import { WeddingOrnaments } from "./WeddingOrnaments";
import { useWedding } from "./WeddingProvider";
import { ArrowUp } from "lucide-react";

export function Footer() {
  const copy = useSiteCopy();
  const { config: weddingConfig } = useWedding();
  const { couple } = weddingConfig;

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  };

  return (
    <footer className="cinema-footer w-full bg-[var(--page-background,#F1F1F1)] text-[#1A1715] py-20 sm:py-32 px-6 sm:px-12 lg:px-20 text-center relative overflow-hidden">
      <WeddingOrnaments variant="floral" tone="paper" />
      <div className="relative z-10 w-full space-y-10">
        <div className="space-y-3">
          <span className="text-[11px] font-mono tracking-[0.35em] uppercase text-[#8C6D46] block">
            {couple.hashtag}
          </span>
          <h2 className="mx-auto flex max-w-6xl flex-wrap items-baseline justify-center gap-x-3 gap-y-2 font-serif text-5xl sm:gap-x-5 sm:text-7xl lg:text-9xl font-light tracking-tight leading-[1.1] text-[#1A1715]">
            <span className="min-w-0 break-words [overflow-wrap:anywhere]">{couple.partner1}</span>
            <span className="font-serif italic font-light text-[#8C6D46]">
              {copy("footer.text1")}
            </span>
            <span className="min-w-0 break-words [overflow-wrap:anywhere]">{couple.partner2}</span>
          </h2>
        </div>

        <p className="text-[#73685B] text-sm sm:text-base font-light leading-relaxed">
          {copy("footer.text2")}
        </p>

        <div className="pt-2">
          <button
            onClick={scrollToTop}
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-[#1A1715] hover:text-[#8C6D46] border border-[#1A1715]/20 hover:border-[#8C6D46] px-8 py-3.5 rounded-full transition-colors"
          >
            <ArrowUp className="w-3.5 h-3.5 text-[#8C6D46]" />
            <span>{copy("footer.text3")}</span>
          </button>
        </div>

        <p className="text-[11px] font-mono uppercase tracking-widest text-[#8C8276] pt-8">
          {couple.locationSummary.toUpperCase()}
          {copy("footer.text4")}
          {new Date(couple.weddingDate)
            .toLocaleDateString("pt-BR", {
              day: "numeric",
              month: "long",
              year: "numeric",
              timeZone: "America/Sao_Paulo",
            })
            .toUpperCase()}
        </p>
      </div>
    </footer>
  );
}
