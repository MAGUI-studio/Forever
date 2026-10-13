"use client";
import {useSiteCopy} from "./useSiteCopy";
import {useEffect,useRef,useState} from "react";
import {motion,useReducedMotion} from "framer-motion";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import {WeddingOrnaments} from "./WeddingOrnaments";
import {useWedding} from "./WeddingProvider";
import {formatCurrency} from "@/lib/utils";
import type {GiftItem} from "@/types/wedding";
import {PixModal} from "./PixModal";
import {ArrowUpRight,Gift,Plus} from "lucide-react";

export function GiftList(){
 const copy=useSiteCopy();
 const {config}=useWedding();
 const gifts=config.gifts;
 const [visibleCount,setVisibleCount]=useState(6);
 const [selectedGift,setSelectedGift]=useState<GiftItem|null>(null);
 const [catalogHeight,setCatalogHeight]=useState<number|null>(null);
 const grid=useRef<HTMLDivElement>(null);
 const reduced=useReducedMotion();
 const visibleGifts=gifts.slice(0,visibleCount);
 const remaining=Math.max(0,gifts.length-visibleCount);
 useEffect(()=>{
  const element=grid.current;if(!element)return;
  const observer=new ResizeObserver(([entry])=>setCatalogHeight(entry.contentRect.height));
  observer.observe(element);return ()=>observer.disconnect();
 },[visibleGifts.length]);
 return <section id="presentes" className="cinematic-section relative overflow-hidden w-full py-16 sm:py-24 px-6 sm:px-12 lg:px-20 bg-[#F1F1F1] text-[#3D2501]">
  <WeddingOrnaments variant="hearts" tone="paper"/>
  <div className="relative z-10 max-w-7xl mx-auto space-y-12 sm:space-y-16">
   <div className="text-center max-w-3xl mx-auto space-y-5">
    <p data-cinema-copy className="cinema-eyebrow text-[#5D613C]">{copy("gifts.text2")}</p>
    <h2 className="font-serif text-5xl sm:text-7xl font-light tracking-[-0.04em] leading-[1.08]">{copy("gifts.heading")}</h2>
    <p data-cinema-copy className="font-serif italic text-xl sm:text-2xl text-[#80654E]">{copy("gifts.text5")}</p>
    <p data-cinema-copy className="text-sm sm:text-base text-[#80654E] font-light leading-[1.8] max-w-2xl mx-auto">{copy("gifts.text6")}</p>
   </div>
   {!gifts.length?<p role="status" className="py-12 text-center font-serif text-xl text-[#80654E]">A lista de presentes ainda está vazia. Em breve os noivos poderão compartilhar suas escolhas por aqui.</p>:<>
    <motion.div initial={false} animate={{height:catalogHeight??"auto"}} transition={{duration:reduced?0:0.65,ease:[0.22,1,0.36,1]}} onAnimationComplete={()=>ScrollTrigger.refresh()} className="overflow-hidden">
     <div id="gift-catalog" ref={grid} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-12">
            {visibleGifts.map((gift, index) => (
              <motion.div
                key={gift.id}
                initial={reduced ? false : { opacity: 0, y: 24, filter: "blur(3px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: reduced ? 0 : 0.55, delay: reduced ? 0 : (index % 6) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="cinema-gift group flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">

                  {/* Foto com Zoom Suave */}
                  <div className="relative rounded-t-[3.5rem] rounded-b-2xl aspect-[4/3] overflow-hidden bg-[#C7B79D]/15">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {gift.image ? <img
                      src={gift.image}
                      alt={gift.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    /> : <div className="flex h-full items-center justify-center text-[#5D613C]"><Gift size={48} strokeWidth={1} aria-hidden="true"/></div>}
                  </div>

                  {/* Categoria & Título */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-[#5D613C] block font-semibold">
                      {gift.categoryLabel}
                    </span>
                    <h4 className="font-serif text-xl sm:text-2xl font-light text-[#3D2501] line-clamp-2 group-hover:text-[#5D613C] transition-colors">
                      {gift.title}
                    </h4>
                    <p className="text-xs text-[#80654E] font-light line-clamp-2 leading-relaxed">
                      {gift.description}
                    </p>
                  </div>
                </div>

                {/* Preço e Botão */}
                <div className="pt-3 flex items-baseline justify-between">
                  <span className="font-serif text-xl font-light text-[#80654E]">
                    {gift.price ? formatCurrency(gift.price) : copy("gifts.text19")}
                  </span>

                  <button
                    onClick={() => {
                      if (gift.price) setSelectedGift(gift);
                    }}
                    disabled={!gift.price} className="disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1 text-xs font-mono uppercase tracking-[0.15em] text-[#5D613C] hover:text-[#3D2501] font-semibold transition-colors group/btn"
                  >
                    <span>{copy("gifts.text14")}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                  </button>
                </div>
              </motion.div>
            ))}
     </div>
    </motion.div>
    <div className="flex flex-col items-center gap-4">
     <p role="status" aria-live="polite" aria-atomic="true" className="text-xs tracking-wide text-[#80654E]">{visibleGifts.length} de {gifts.length} presentes</p>
     {remaining>0&&<motion.button type="button" aria-controls="gift-catalog" onClick={()=>setVisibleCount(current=>Math.min(current+6,gifts.length))} whileHover={reduced?undefined:{y:-2}} whileTap={reduced?undefined:{scale:0.98}} className="cinema-button bg-[#3D2501] text-[#F1F1F1] hover:bg-[#5D613C] gap-3"><Plus size={17}/>{visibleCount===6?"Ver mais presentes":"Mostrar mais "+Math.min(6,remaining)}</motion.button>}
    </div>
   </>}
  </div>
  {selectedGift&&<PixModal gift={selectedGift} onClose={()=>setSelectedGift(null)}/>}
 </section>;
}
