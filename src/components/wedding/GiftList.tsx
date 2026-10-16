"use client";
import Image from "next/image";
import {useSiteCopy} from "./useSiteCopy";
import {useEffect,useMemo,useRef,useState} from "react";
import {motion,useReducedMotion} from "framer-motion";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import {WeddingOrnaments} from "./WeddingOrnaments";
import {useWedding} from "./WeddingProvider";
import {formatCurrency} from "@/lib/utils";
import type {GiftItem} from "@/types/wedding";
import {PixModal} from "./PixModal";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { CaretDownIcon, CheckIcon } from "@phosphor-icons/react";
import { ArrowUpDown, ArrowUpRight, Plus, Search, X } from "lucide-react";

type SortOption = "default" | "price-asc" | "price-desc";

const sortOptions: { id: SortOption; label: string; desc: string }[] = [
  { id: "default", label: "Ordem padrão", desc: "Seleção curada pelos noivos" },
  { id: "price-asc", label: "Menor valor", desc: "Do mais acessível ao maior" },
  { id: "price-desc", label: "Maior valor", desc: "Do maior valor ao menor" },
];

export function GiftList(){
 const copy=useSiteCopy();
 const {config,templateId}=useWedding();
 const gifts=config.gifts;
 const [visibleCount,setVisibleCount]=useState(6);
 const [selectedGift,setSelectedGift]=useState<GiftItem|null>(null);
 const [searchQuery,setSearchQuery]=useState("");
 const [sortBy,setSortBy]=useState<SortOption>("default");
 const [catalogHeight,setCatalogHeight]=useState<number|null>(null);
 const grid=useRef<HTMLDivElement>(null);
 const reduced=useReducedMotion();

 const currentSort = sortOptions.find(o => o.id === sortBy) || sortOptions[0];

 const filteredGifts=useMemo(()=>{
  const normalize=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  let list=gifts;
  const q=normalize(searchQuery.trim());
  if(q){
   list=list.filter(item=>
    normalize(item.title).includes(q)||
    normalize(item.description??"").includes(q)||
    normalize(item.categoryLabel??"").includes(q)
   );
  }
  if(sortBy==="price-asc"){
   list=[...list].sort((a,b)=>(a.price??0)-(b.price??0));
  }else if(sortBy==="price-desc"){
   list=[...list].sort((a,b)=>(b.price??0)-(a.price??0));
  }
  return list;
 },[gifts,searchQuery,sortBy]);

 const visibleGifts=filteredGifts.slice(0,visibleCount);
 const remaining=Math.max(0,filteredGifts.length-visibleCount);

 useEffect(()=>{
  setVisibleCount(6);
 },[searchQuery,sortBy]);

 useEffect(()=>{
  const element=grid.current;if(!element)return;
  const observer=new ResizeObserver(([entry])=>setCatalogHeight(entry.contentRect.height));
  observer.observe(element);return ()=>observer.disconnect();
 },[visibleGifts.length]);

 return <section id="presentes" className="cinematic-section relative overflow-hidden w-full py-16 sm:py-24 px-6 sm:px-12 lg:px-20 bg-[var(--page-background,#F1F1F1)] text-[#3D2501]">
  <WeddingOrnaments variant="hearts" tone="paper"/>
  <div className="relative z-10 max-w-7xl mx-auto space-y-12 sm:space-y-16">
   <div className="gift-intro text-center max-w-3xl mx-auto space-y-5">
    <p data-cinema-copy className="cinema-eyebrow text-[#5D613C]">{copy("gifts.text2")}</p>
    <h2 className="font-serif text-5xl sm:text-7xl font-light tracking-[-0.04em] leading-[1.08]">{copy("gifts.heading")}</h2>
    <p data-cinema-copy className="font-serif italic text-xl sm:text-2xl text-[#80654E]">{copy("gifts.text5")}</p>
    <p data-cinema-copy className="text-sm sm:text-base text-[#80654E] font-light leading-[1.8] max-w-2xl mx-auto">{copy("gifts.text6")}</p>
   </div>

   {!gifts.length?<p role="status" className="py-12 text-center font-serif text-xl text-[#80654E]">A lista de presentes ainda está vazia. Em breve os noivos poderão compartilhar suas escolhas por aqui.</p>:<>
    <div className="gift-toolbar flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 max-w-4xl mx-auto">
      {/* Busca personalizada no estilo do template */}
      <div className="relative flex-1 group">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5D613C] pointer-events-none transition-colors group-focus-within:text-[#3D2501]" aria-hidden="true"/>
        <input
          type="text"
          value={searchQuery}
          onChange={e=>setSearchQuery(e.target.value)}
          placeholder="Buscar presente, cota ou categoria…"
          aria-label="Buscar na lista de presentes"
          className="w-full rounded-[var(--wedding-radius)] border border-[#5d613c20] bg-[#fffdfa] pl-11 pr-10 py-3 text-sm font-sans text-[#3D2501] placeholder-[#80654E]/50 shadow-[0_1px_3px_#3d250106] outline-none transition-all hover:border-[#5D613C]/40 focus:border-[#5D613C] focus:ring-2 focus:ring-[#5D613C]/15"
        />
        {searchQuery&&(
          <button
            type="button"
            onClick={()=>setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex size-6 items-center justify-center rounded-full text-[#80654E] hover:bg-[#5d613c15] hover:text-[#3D2501] transition-colors"
            aria-label="Limpar busca"
          >
            <X size={14}/>
          </button>
        )}
      </div>

      {/* Dropdown de ordenação sem padrão do HTML (Radix customizado) */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className="inline-flex min-h-[48px] shrink-0 items-center justify-between gap-3 rounded-[var(--wedding-radius)] border border-[#5d613c20] bg-[#fffdfa] px-4 py-2.5 text-xs font-mono uppercase tracking-[0.14em] text-[#3D2501] shadow-[0_1px_3px_#3d250106] transition-all hover:border-[#5D613C]/50 hover:bg-[#fffdfa] focus-visible:outline-2 focus-visible:outline-[#5D613C] cursor-pointer"
            aria-label="Opções de ordenação dos presentes"
          >
            <span className="flex items-center gap-2">
              <ArrowUpDown size={15} className="text-[#5D613C] shrink-0" aria-hidden="true" />
              <span className="text-[#80654E] font-serif italic normal-case text-sm">Ordenar:</span>
              <span className="font-semibold text-[#5D613C]">{currentSort.label}</span>
            </span>
            <CaretDownIcon size={14} weight="bold" className="text-[#80654E] transition-transform duration-200" aria-hidden="true" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="gift-sort-menu z-50 min-w-56 overflow-hidden rounded-[var(--wedding-radius)] border border-[#5d613c25] bg-[#fffdfa] p-1.5 shadow-[0_16px_40px_#3d250118] animate-in fade-in-0 zoom-in-95"
        >
          <DropdownMenu.Label className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-[#80654E]">
            Ordenar presentes
          </DropdownMenu.Label>
          <DropdownMenu.Separator className="my-1 h-px bg-[#5d613c15]" />
          {sortOptions.map((option) => {
            const isSelected = sortBy === option.id;
            return (
              <DropdownMenu.Item
                key={option.id}
                onSelect={() => setSortBy(option.id)}
                className={
                  "group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-xs outline-none transition-colors " +
                  (isSelected
                    ? "gift-sort-selected bg-[#5D613C] text-[#fffdfa] shadow-xs"
                    : "text-[#3D2501] hover:bg-[#5d613c12] focus:bg-[#5d613c12]")
                }
              >
                <div>
                  <p className={"font-semibold " + (isSelected ? "text-[#fffdfa]" : "text-[#3D2501]")}>{option.label}</p>
                  <p className={"text-[10px] " + (isSelected ? "text-[#fffdfa]/85" : "text-[#80654E]")}>{option.desc}</p>
                </div>
                {isSelected && <CheckIcon size={15} weight="bold" className="shrink-0 ml-2 text-[#fffdfa]" />}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>

    {!filteredGifts.length?(
     <div className="py-16 text-center space-y-4">
      <p className="font-serif text-2xl text-[#80654E]">Nenhum presente encontrado{searchQuery?` para "${searchQuery}"`:""}.</p>
      <button
       type="button"
       onClick={()=>{setSearchQuery("");setSortBy("default");}}
       className="cinema-button bg-[#5D613C] text-white hover:bg-[#4e5232] text-xs px-6 py-2.5"
      >
       Limpar busca
      </button>
     </div>
    ):(
     <>
      <motion.div initial={false} animate={{height:catalogHeight??"auto"}} transition={{duration:reduced?0:0.65,ease:[0.22,1,0.36,1]}} onAnimationComplete={()=>ScrollTrigger.refresh()} className="overflow-hidden">
       <div id="gift-catalog" ref={grid} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-12">
        {visibleGifts.map((gift, index) => (
          <motion.div
            key={gift.id}
            initial={reduced ? false : { opacity: 0, y: 24, filter: "blur(3px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: reduced ? 0 : 0.55, delay: reduced ? 0 : (index % 6) * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="gift-card group flex flex-col justify-between gap-6 rounded-[var(--wedding-radius)] border border-[#5d613c15] bg-[#fffdfa] p-6"
          >
            <div className="space-y-3">
              {templateId==="minimalist-modern"&&gift.image&&<div className="minimal-gift-photo"><Image src={gift.image} alt={gift.title} fill sizes="(min-width: 1760px) 400px, (min-width: 900px) 30vw, (min-width: 640px) 45vw, 90vw" className="object-cover"/></div>}
              <div className="space-y-1">
                <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-[#5D613C] block font-semibold">
                  {gift.categoryLabel}
                </span>
                <h4 className="font-serif text-xl sm:text-2xl font-light text-[#3D2501] group-hover:text-[#5D613C] transition-colors">
                  {gift.title}
                </h4>
                <p className="text-xs text-[#80654E] font-light line-clamp-2 leading-relaxed">
                  {gift.description}
                </p>
              </div>
            </div>

            <div className="pt-3 flex items-baseline justify-between">
              <span className="font-serif text-xl font-light text-[#80654E]">
                {formatCurrency(gift.price??0)}
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
       <p role="status" aria-live="polite" aria-atomic="true" className="text-xs tracking-wide text-[#80654E]">{visibleGifts.length} de {filteredGifts.length} presentes{searchQuery?" encontrados":""}</p>
       {remaining>0&&<motion.button type="button" aria-controls="gift-catalog" onClick={()=>setVisibleCount(current=>Math.min(current+6,filteredGifts.length))} whileHover={reduced?undefined:{y:-2}} whileTap={reduced?undefined:{scale:0.98}} className="cinema-button bg-[#3D2501] text-[#F1F1F1] hover:bg-[#5D613C] gap-3"><Plus size={17}/>{visibleCount===6?"Ver mais presentes":"Mostrar mais "+Math.min(6,remaining)}</motion.button>}
      </div>
     </>
    )}
   </>}
  </div>
  {selectedGift&&<PixModal gift={selectedGift} onClose={()=>setSelectedGift(null)}/>}
 </section>;
}
