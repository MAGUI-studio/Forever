"use client";

import {useEffect,useRef,useState} from "react";
import {motion,useReducedMotion} from "framer-motion";
import {ArrowUp,ArrowUpRight,Heart,Plus} from "lucide-react";
import {useWedding} from "../WeddingProvider";
import {useSiteCopy} from "../useSiteCopy";
import {formatCurrency} from "@/lib/utils";
import type {GiftItem} from "@/types/wedding";
import {PixModal} from "../PixModal";
import {romanceAssets} from "@/config/templates/romance-assets";
import {ContemporaryRomanceAccent,ContemporaryRomanceOrnaments} from "./ContemporaryRomanceOrnaments";
import {RomanceFooterHearts} from "./RomanceFooterHearts";
import {RomancePhoto,RomanceReveal} from "./RomanceMotion";

export function ContemporaryRomanceDressCode(){
 const copy=useSiteCopy();
 return <section id="dress-code" className="relative isolate overflow-hidden px-6 py-20 sm:px-12 sm:py-32 lg:px-20">
  <ContemporaryRomanceOrnaments pattern="dress"/>
  <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-12 lg:gap-16">
   <div className="relative lg:col-span-5 lg:col-start-1 lg:row-start-1"><RomancePhoto src={romanceAssets.dress} className="aspect-[4/5] w-[90%] grayscale"/><span aria-hidden="true" className="absolute -bottom-8 right-0 w-32 -rotate-12 text-[var(--forever-primary)]"><ContemporaryRomanceAccent/></span></div>
   <RomanceReveal className="lg:col-span-6 lg:col-start-7 lg:row-start-1"><p className="mb-6 text-[10px] uppercase tracking-[0.25em] text-[var(--forever-accent)]">{copy("romance.dress.eyebrow")}</p><h2 className="font-serif text-5xl font-light leading-[1.02] tracking-[-0.035em] sm:text-7xl">{copy("romance.dress.title")}</h2><p className="mt-8 max-w-xl font-serif text-2xl font-light leading-relaxed sm:text-3xl">{copy("romance.dress.description")}</p><div className="mt-10 flex items-start gap-4 border-t border-[var(--forever-primary)]/20 pt-7"><Heart aria-hidden="true" size={18} strokeWidth={1} className="mt-1 shrink-0 text-[var(--forever-primary)]"/><p className="max-w-md text-sm leading-7 text-[var(--forever-accent)]">{copy("romance.dress.note")}</p></div></RomanceReveal>
  </div>
 </section>;
}

export function ContemporaryRomanceGifts(){
 const {config}=useWedding();const copy=useSiteCopy();const reduced=useReducedMotion();
 const [count,setCount]=useState(6),[gift,setGift]=useState<GiftItem|null>(null),[height,setHeight]=useState<number|null>(null);
 const grid=useRef<HTMLDivElement>(null);
 const visible=config.gifts.slice(0,count);
 useEffect(()=>{const element=grid.current;if(!element)return;const observer=new ResizeObserver(([entry])=>setHeight(entry.contentRect.height));observer.observe(element);return ()=>observer.disconnect();},[visible.length]);
 return <section id="presentes" className="relative isolate overflow-hidden px-6 py-16 sm:px-12 sm:py-24 lg:px-20">
  <ContemporaryRomanceOrnaments pattern="gifts"/>
  <div className="relative mx-auto max-w-7xl"><RomanceReveal className="mb-12 grid items-end gap-8 border-b border-[var(--forever-primary)]/20 pb-10 lg:mb-16 lg:grid-cols-[1.2fr_0.8fr]"><div><p className="mb-6 text-[10px] uppercase tracking-[0.25em] text-[var(--forever-accent)]">{copy("romance.gifts.eyebrow")}</p><h2 className="max-w-3xl font-serif text-5xl font-light leading-[1.02] tracking-[-0.035em] sm:text-7xl">{copy("romance.gifts.title")}</h2></div><p className="max-w-lg text-sm leading-8 text-[var(--forever-accent)]">{copy("romance.gifts.description")}</p></RomanceReveal>
  {!config.gifts.length?<p role="status" className="py-12 text-center font-serif text-2xl text-[var(--forever-accent)]">A lista de presentes ainda está vazia. Em breve os noivos compartilharão suas escolhas por aqui.</p>:<>
   <motion.div initial={false} animate={{height:height??"auto"}} transition={{duration:reduced?0:0.65,ease:[0.22,1,0.36,1]}} className="overflow-hidden"><div id="romance-gift-catalog" ref={grid} className="grid gap-x-10 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">{visible.map((item,index)=><motion.article key={item.id} initial={reduced?false:{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:0.15}} transition={{duration:reduced?0:0.7,delay:(index%3)*0.08,ease:[0.22,1,0.36,1]}} className="group flex min-h-72 flex-col justify-between gap-8 border-b border-[var(--forever-primary)]/20 py-8"><div><div className="mb-5 flex items-baseline gap-4"><span aria-hidden="true" className="font-serif text-4xl italic text-[var(--forever-primary)]/35">{String(index+1).padStart(2,"0")}</span><p className="text-[9px] uppercase tracking-[0.2em] text-[var(--forever-accent)]">{item.categoryLabel}</p></div><h3 className="font-serif text-2xl font-light leading-snug text-[var(--forever-primary)] sm:text-3xl">{item.title}</h3>{item.description&&<p className="mt-3 text-xs leading-7 text-[var(--forever-accent)]">{item.description}</p>}</div><div className="flex flex-wrap items-center justify-between gap-3"><span className="font-serif text-xl text-[var(--forever-accent)]">{formatCurrency(item.price??0)}</span><button type="button" disabled={!item.price} onClick={()=>setGift(item)} className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-[10px] uppercase tracking-[0.15em] text-[var(--forever-primary)] transition-colors hover:bg-[var(--forever-primary)]/5 disabled:opacity-40">Presentear<ArrowUpRight size={15} strokeWidth={1} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"/></button></div></motion.article>)}</div></motion.div>
   <div className="mt-12 flex flex-col items-center gap-5"><p role="status" aria-live="polite" className="text-xs text-[var(--forever-accent)]">{visible.length} de {config.gifts.length} presentes</p>{count<config.gifts.length&&<button type="button" aria-controls="romance-gift-catalog" onClick={()=>setCount(current=>current+6)} className="inline-flex min-h-12 items-center gap-3 rounded-full border border-[var(--forever-primary)]/30 px-8 text-xs text-[var(--forever-primary)] transition-colors hover:bg-[var(--forever-primary)]/5"><Plus size={15}/>Ver mais presentes</button>}</div>
  </>}
  </div>{gift&&<PixModal gift={gift} onClose={()=>setGift(null)}/>}
 </section>;
}

export function ContemporaryRomanceFooter(){
 const {config}=useWedding();const copy=useSiteCopy();
 return <footer className="cinema-footer relative isolate overflow-hidden bg-[#32151C] px-6 pb-6 pt-20 text-white sm:px-12 sm:pt-28 lg:px-20">
  <div aria-hidden="true" className="absolute inset-0 -z-20"><RomancePhoto src={romanceAssets.footer} className="h-full w-full" sizes="100vw"/></div><div aria-hidden="true" className="absolute inset-0 -z-10 bg-[#2A1119]/80"/><RomanceFooterHearts/>
  <div className="relative mx-auto max-w-7xl"><RomanceReveal className="mx-auto py-12 text-center"><p className="mx-auto max-w-2xl font-serif text-4xl font-light italic leading-[1.12] tracking-[-0.025em] sm:text-6xl lg:text-7xl">{copy("romance.footer.message")}</p><p className="mt-12 font-serif text-[clamp(2.5rem,6.8vw,8rem)] font-light leading-[1.1] tracking-[-0.04em]">{config.couple.partner1} <span className="mx-2 italic text-white/55">&</span> {config.couple.partner2}</p>{config.couple.hashtag&&<p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-white/60">{config.couple.hashtag}</p>}</RomanceReveal><div className="mt-10 flex flex-wrap items-center justify-between gap-5 border-t border-white/25 pt-6 text-[10px] tracking-wide text-white/70"><p>{config.couple.locationSummary}</p><button type="button" onClick={()=>window.scrollTo({top:0,behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"})} className="inline-flex min-h-11 items-center gap-3 text-white/85 transition-colors hover:text-white">Voltar ao início<ArrowUp size={14}/></button></div></div>
 </footer>;
}
