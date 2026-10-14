"use client";

import {useEffect,useMemo,useRef,useState} from "react";
import {motion,useReducedMotion} from "framer-motion";
import {ArrowUp,ArrowUpDown,ArrowUpRight,Heart,Plus,Search,X} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { CaretDownIcon, CheckIcon } from "@phosphor-icons/react";
import {useWedding} from "../WeddingProvider";
import {useSiteCopy} from "../useSiteCopy";
import {formatCurrency} from "@/lib/utils";
import type {GiftItem} from "@/types/wedding";
import {PixModal} from "../PixModal";
import {romanceAssets} from "@/config/templates/romance-assets";
import {resolveTemplateImage} from "@/lib/template-images";
import {ContemporaryRomanceAccent,ContemporaryRomanceOrnaments} from "./ContemporaryRomanceOrnaments";
import {RomanceFooterHearts} from "./RomanceFooterHearts";
import {RomancePhoto,RomanceReveal} from "./RomanceMotion";

export function ContemporaryRomanceDressCode(){
 const {config}=useWedding();
 const copy=useSiteCopy();
 const dressImage=resolveTemplateImage(config,"contemporary-romance","dress");
 return <section id="dress-code" className="relative isolate overflow-hidden px-6 py-20 sm:px-12 sm:py-32 lg:px-20">
  <ContemporaryRomanceOrnaments pattern="dress"/>
  <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-12 lg:gap-16">
   <div className="relative lg:col-span-5 lg:col-start-1 lg:row-start-1"><RomancePhoto src={dressImage} className="aspect-[4/5] w-[90%] grayscale"/><span aria-hidden="true" className="absolute -bottom-8 right-0 w-32 -rotate-12 text-[var(--forever-primary)]"><ContemporaryRomanceAccent/></span></div>
   <RomanceReveal className="lg:col-span-6 lg:col-start-7 lg:row-start-1"><p className="mb-6 text-[10px] uppercase tracking-[0.25em] text-[var(--forever-accent)]">{copy("romance.dress.eyebrow")}</p><h2 className="font-serif text-5xl font-light leading-[1.02] tracking-[-0.035em] sm:text-7xl">{copy("romance.dress.title")}</h2><p className="mt-8 max-w-xl font-serif text-2xl font-light leading-relaxed sm:text-3xl">{copy("romance.dress.description")}</p><div className="mt-10 flex items-start gap-4 border-t border-[var(--forever-primary)]/20 pt-7"><Heart aria-hidden="true" size={18} strokeWidth={1} className="mt-1 shrink-0 text-[var(--forever-primary)]"/><p className="max-w-md text-sm leading-7 text-[var(--forever-accent)]">{copy("romance.dress.note")}</p></div></RomanceReveal>
  </div>
 </section>;
}

type RomanceSortOption = "default" | "price-asc" | "price-desc";
const romanceSortOptions: { id: RomanceSortOption; label: string; desc: string }[] = [
  { id: "default", label: "Ordem padrão", desc: "Seleção curada pelos noivos" },
  { id: "price-asc", label: "Menor valor", desc: "Valores do menor para o maior" },
  { id: "price-desc", label: "Maior valor", desc: "Valores do maior para o menor" },
];

export function ContemporaryRomanceGifts(){
 const {config}=useWedding();const copy=useSiteCopy();const reduced=useReducedMotion();
 const [count,setCount]=useState(6),[gift,setGift]=useState<GiftItem|null>(null),[height,setHeight]=useState<number|null>(null);
 const [searchQuery,setSearchQuery]=useState("");
 const [sortBy,setSortBy]=useState<RomanceSortOption>("default");
 const grid=useRef<HTMLDivElement>(null);

 const currentSort = romanceSortOptions.find(o => o.id === sortBy) || romanceSortOptions[0];

 const filtered=useMemo(()=>{
  const normalize=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  let list=config.gifts;
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
 },[config.gifts,searchQuery,sortBy]);

 const visible=filtered.slice(0,count);

 useEffect(()=>{
  setCount(6);
 },[searchQuery,sortBy]);

 useEffect(()=>{const element=grid.current;if(!element)return;const observer=new ResizeObserver(([entry])=>setHeight(entry.contentRect.height));observer.observe(element);return ()=>observer.disconnect();},[visible.length]);
 return <section id="presentes" className="relative isolate overflow-hidden px-6 py-16 sm:px-12 sm:py-24 lg:px-20">
  <ContemporaryRomanceOrnaments pattern="gifts"/>
  <div className="relative mx-auto max-w-7xl"><RomanceReveal className="mb-12 grid items-end gap-8 border-b border-[var(--forever-primary)]/20 pb-10 lg:mb-16 lg:grid-cols-[1.2fr_0.8fr]"><div><p className="mb-6 text-[10px] uppercase tracking-[0.25em] text-[var(--forever-accent)]">{copy("romance.gifts.eyebrow")}</p><h2 className="max-w-3xl font-serif text-5xl font-light leading-[1.02] tracking-[-0.035em] sm:text-7xl">{copy("romance.gifts.title")}</h2></div><p className="max-w-lg text-sm leading-8 text-[var(--forever-accent)]">{copy("romance.gifts.description")}</p></RomanceReveal>
  {!config.gifts.length?<p role="status" className="py-12 text-center font-serif text-2xl text-[var(--forever-accent)]">A lista de presentes ainda está vazia. Em breve os noivos compartilharão suas escolhas por aqui.</p>:<>
   <div className="mb-12 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-[var(--forever-primary)]/20 pb-8">
    {/* Busca no estilo editorial do template */}
    <div className="relative flex-1 max-w-lg group">
     <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--forever-primary)]/50 transition-colors group-focus-within:text-[var(--forever-primary)]" aria-hidden="true">
      <Search size={16} strokeWidth={1.5} />
     </span>
     <input
      type="text"
      value={searchQuery}
      onChange={e=>setSearchQuery(e.target.value)}
      placeholder="Buscar na lista de presentes…"
      aria-label="Buscar na lista de presentes"
      className="w-full rounded-full border border-[var(--forever-primary)]/25 bg-white/70 backdrop-blur-sm pl-11 pr-10 py-3 text-xs tracking-wider text-[var(--forever-primary)] placeholder-[var(--forever-accent)]/50 outline-none transition-all hover:border-[var(--forever-primary)]/50 focus:border-[var(--forever-primary)] focus:bg-white focus:ring-2 focus:ring-[var(--forever-primary)]/15"
     />
     {searchQuery&&(
      <button
       type="button"
       onClick={()=>setSearchQuery("")}
       className="absolute right-3.5 top-1/2 -translate-y-1/2 flex size-6 items-center justify-center rounded-full text-[var(--forever-accent)] hover:bg-[var(--forever-primary)]/10 hover:text-[var(--forever-primary)] transition-colors"
       aria-label="Limpar busca"
      >
       <X size={14}/>
      </button>
     )}
    </div>

    {/* Dropdown de ordenação sem padrão do HTML (Radix customizado no estilo Romance) */}
    <DropdownMenu.Root>
     <DropdownMenu.Trigger asChild>
      <button
       type="button"
       className="inline-flex min-h-[46px] items-center justify-between gap-3 rounded-full border border-[var(--forever-primary,#722F37)]/25 bg-white/70 backdrop-blur-sm px-5 py-2.5 text-[11px] uppercase tracking-[0.16em] text-[var(--forever-primary,#722F37)] transition-all hover:border-[var(--forever-primary,#722F37)] hover:bg-white focus-visible:outline-2 focus-visible:outline-[var(--forever-primary,#722F37)] cursor-pointer shadow-xs"
       aria-label="Ordenar presentes"
      >
       <span className="flex items-center gap-2">
        <ArrowUpDown size={14} strokeWidth={1.5} className="text-[var(--forever-primary,#722F37)] shrink-0" aria-hidden="true" />
        <span className="text-[var(--forever-accent,#82656C)] font-serif italic normal-case text-sm">Ordenar:</span>
        <span className="font-medium">{currentSort.label}</span>
       </span>
       <CaretDownIcon size={13} weight="bold" className="text-[var(--forever-accent,#82656C)] ml-1" aria-hidden="true" />
      </button>
     </DropdownMenu.Trigger>
     <DropdownMenu.Content
      align="end"
      sideOffset={8}
      className="z-50 min-w-56 overflow-hidden rounded-2xl border border-[var(--forever-primary,#722F37)]/20 bg-[#FAF7F5] p-2 shadow-[0_16px_40px_rgba(50,21,28,0.14)] backdrop-blur-md animate-in fade-in-0 zoom-in-95"
     >
      <DropdownMenu.Label className="px-3 py-1.5 text-[9px] uppercase tracking-[0.25em] text-[var(--forever-accent,#82656C)]">
       Classificar por
      </DropdownMenu.Label>
      <DropdownMenu.Separator className="my-1.5 h-px bg-[var(--forever-primary,#722F37)]/15" />
      {romanceSortOptions.map((option) => {
       const isSelected = sortBy === option.id;
       return (
        <DropdownMenu.Item
         key={option.id}
         onSelect={() => setSortBy(option.id)}
         className={
          "flex cursor-pointer items-center justify-between rounded-xl px-3.5 py-2.5 text-xs outline-none transition-colors " +
          (isSelected
           ? "bg-[#722F37] text-white shadow-xs"
           : "text-[#302329] hover:bg-[#722F37]/10 focus:bg-[#722F37]/10")
         }
        >
         <div>
          <p className={"font-medium tracking-wide " + (isSelected ? "text-white" : "text-[#302329]")}>{option.label}</p>
          <p className={"text-[10px] " + (isSelected ? "text-white/85" : "text-[var(--forever-accent,#82656C)]")}>{option.desc}</p>
         </div>
         {isSelected && <CheckIcon size={14} weight="bold" className="shrink-0 ml-2 text-white" />}
        </DropdownMenu.Item>
       );
      })}
     </DropdownMenu.Content>
    </DropdownMenu.Root>
   </div>
   {!filtered.length?(
    <div className="py-16 text-center space-y-4">
     <p className="font-serif text-2xl text-[var(--forever-accent)]">Nenhum presente encontrado{searchQuery?` para "${searchQuery}"`:""}.</p>
     <button
      type="button"
      onClick={()=>{setSearchQuery("");setSortBy("default");}}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--forever-primary)]/30 px-6 text-xs text-[var(--forever-primary)] transition-colors hover:bg-[var(--forever-primary)]/5"
     >
      Limpar busca
     </button>
    </div>
   ):(
    <>
     <motion.div initial={false} animate={{height:height??"auto"}} transition={{duration:reduced?0:0.65,ease:[0.22,1,0.36,1]}} className="overflow-hidden"><div id="romance-gift-catalog" ref={grid} className="grid gap-x-10 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">{visible.map((item,index)=><motion.article key={item.id} initial={reduced?false:{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:0.15}} transition={{duration:reduced?0:0.7,delay:(index%3)*0.08,ease:[0.22,1,0.36,1]}} className="group flex min-h-72 flex-col justify-between gap-8 border-b border-[var(--forever-primary)]/20 py-8"><div><div className="mb-5 flex items-baseline gap-4"><span aria-hidden="true" className="font-serif text-4xl italic text-[var(--forever-primary)]/35">{String(index+1).padStart(2,"0")}</span><p className="text-[9px] uppercase tracking-[0.2em] text-[var(--forever-accent)]">{item.categoryLabel}</p></div><h3 className="font-serif text-2xl font-light leading-snug text-[var(--forever-primary)] sm:text-3xl">{item.title}</h3>{item.description&&<p className="mt-3 text-xs leading-7 text-[var(--forever-accent)]">{item.description}</p>}</div><div className="flex flex-wrap items-center justify-between gap-3"><span className="font-serif text-xl text-[var(--forever-accent)]">{formatCurrency(item.price??0)}</span><button type="button" disabled={!item.price} onClick={()=>setGift(item)} className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-[10px] uppercase tracking-[0.15em] text-[var(--forever-primary)] transition-colors hover:bg-[var(--forever-primary)]/5 disabled:opacity-40">Presentear<ArrowUpRight size={15} strokeWidth={1} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"/></button></div></motion.article>)}</div></motion.div>
     <div className="mt-12 flex flex-col items-center gap-5"><p role="status" aria-live="polite" className="text-xs text-[var(--forever-accent)]">{visible.length} de {filtered.length} presentes{searchQuery?" encontrados":""}</p>{count<filtered.length&&<button type="button" aria-controls="romance-gift-catalog" onClick={()=>setCount(current=>current+6)} className="inline-flex min-h-12 items-center gap-3 rounded-full border border-[var(--forever-primary)]/30 px-8 text-xs text-[var(--forever-primary)] transition-colors hover:bg-[var(--forever-primary)]/5"><Plus size={15}/>Ver mais presentes</button>}</div>
    </>
   )}
  </>}
  </div>{gift&&<PixModal gift={gift} onClose={()=>setGift(null)}/>}
 </section>;
}

export function ContemporaryRomanceFooter(){
 const {config}=useWedding();const copy=useSiteCopy();
 return <footer className="cinema-footer relative isolate overflow-hidden bg-[var(--forever-paper)] px-6 py-20 text-[var(--forever-ink)] sm:px-12 sm:py-28 lg:px-20 text-center">
  <ContemporaryRomanceOrnaments pattern="footer" tone="paper"/>
  <div className="relative mx-auto max-w-7xl">
   <RomanceReveal className="mx-auto max-w-3xl py-8 text-center">
    <p className="mx-auto max-w-2xl font-serif text-4xl font-light italic leading-[1.15] tracking-[-0.025em] text-[var(--forever-primary)] sm:text-6xl lg:text-7xl">
     {copy("romance.footer.message")}
    </p>
    <p className="mt-10 font-serif text-[clamp(2.5rem,6.8vw,8rem)] font-light leading-[1.1] tracking-[-0.04em] text-[var(--forever-ink)]">
     {config.couple.partner1} <span className="mx-2 italic font-light text-[var(--forever-primary)]">&</span> {config.couple.partner2}
    </p>
    {config.couple.hashtag && (
     <p className="mt-4 text-[11px] font-mono uppercase tracking-[0.25em] text-[var(--forever-accent)]">
      {config.couple.hashtag}
     </p>
    )}
   </RomanceReveal>
   <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-5 border-t border-[var(--forever-primary)]/15 pt-8 text-xs tracking-wide text-[var(--forever-accent)]">
    <p className="font-mono text-[11px] uppercase tracking-widest">{config.couple.locationSummary}</p>
    <button
     type="button"
     onClick={()=>window.scrollTo({top:0,behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"})}
     className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--forever-primary)]/20 px-6 py-2.5 text-xs uppercase tracking-[0.15em] text-[var(--forever-primary)] transition-all hover:border-[var(--forever-primary)] hover:bg-[var(--forever-primary)]/5 cursor-pointer"
    >
     <span>Voltar ao início</span>
     <ArrowUp size={14}/>
    </button>
   </div>
  </div>
 </footer>;
}
