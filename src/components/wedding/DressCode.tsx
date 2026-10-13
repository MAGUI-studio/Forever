"use client";
import {useSiteCopy} from "./useSiteCopy";

import { WeddingOrnaments } from "./WeddingOrnaments";



export function DressCode() {
  const copy=useSiteCopy();
  return (
    <section id="dress-code" className="cinematic-section relative z-10 -mt-[2px] overflow-hidden bg-[#F1F1F1] text-[#3D2501] px-6 sm:px-12 lg:px-20 pt-12 sm:pt-16 pb-16 sm:pb-24">
      <WeddingOrnaments variant="floral" tone="paper" />
      <div className="relative z-10 max-w-6xl mx-auto space-y-12 sm:space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-5">
          <p data-cinema-copy className="cinema-eyebrow text-[#5D613C]">{copy("dressCode.text1")}</p>
          <h2 className="font-serif text-5xl sm:text-7xl font-light tracking-[-0.04em] leading-[1.08]">{copy("dressCode.heading")}</h2>
          <p data-cinema-copy className="font-serif italic text-xl sm:text-2xl text-[#80654E]">{copy("dressCode.text4")}</p>
        </div>

        <div data-cinema-copy className="text-center max-w-2xl mx-auto space-y-4">
          <p className="cinema-eyebrow text-[#5D613C]">{copy("dressCode.text5")}</p>
          <h3 className="font-serif text-4xl sm:text-5xl font-light">{copy("dressCode.text6")}</h3>
          <div className="pt-5 space-y-6">
            <p className="font-serif text-2xl sm:text-3xl text-[#3D2501]">{copy("dressCode.text7")}</p>
            <div className="grid grid-cols-2 gap-5 sm:gap-8 max-w-md mx-auto">
              {[{ name: copy("dressCode.color1"), fill: "#FFFFFF", stroke: "#AFA493" }, { name: copy("dressCode.color2"), fill: "#80654E", stroke: "#3D2501" }].map(color => (
                <div key={color.name} className="space-y-3">
                  <div className="relative rounded-t-full rounded-b-3xl bg-[#E8E4DD]/60 px-3 pt-6 pb-4 ring-1 ring-[#3D2501]/10">
                    <svg aria-hidden="true" viewBox="0 0 160 150" className="w-full h-auto" fill={color.fill} stroke={color.stroke} strokeWidth="1.6" strokeLinejoin="round">
                      {/* Tailored jacket and trousers, beside a midi dress. */}
                      <path d="M 26,18 L 38,12 L 50,18 L 63,27 L 68,83 L 56,85 L 51,45 L 51,88 L 24,88 L 24,45 L 19,85 L 7,83 L 12,27 Z" />
                      <path d="M 27,88 L 49,88 L 53,137 L 41,137 L 38,101 L 35,137 L 23,137 Z" />
                      <path d="M 26,18 L 34,39 L 38,30 L 42,39 L 50,18 M 38,30 L 38,86" fill="none" />
                      <path d="M 27,55 L 32,55 M 44,55 L 49,55" fill="none" />
                      <path d="M 106,18 L 113,18 Q 119,30 125,18 L 132,18 L 137,46 L 130,61 Q 133,91 150,130 Q 119,144 88,130 Q 105,91 108,61 L 101,46 Z" />
                      <path d="M 108,61 L 130,61 M 112,78 L 105,129 M 126,78 L 134,129" fill="none" />
                    </svg>
                    <span className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-full bg-[#9C443D] text-white shadow-sm">
                      <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m6 6 12 12 M18 6 6 18" /></svg>
                    </span>
                  </div>
                  <p className="font-serif text-2xl">{color.name}<span className="block font-sans text-[10px] tracking-[0.18em] uppercase font-medium text-[#9C443D] mt-1">{copy("dressCode.text8")}</span></p>
                </div>
              ))}
            </div>
            <p className="text-sm text-[#80654E] leading-relaxed">{copy("dressCode.text9")}</p>
          </div>
        </div>

      </div>
    </section>
  );
}
