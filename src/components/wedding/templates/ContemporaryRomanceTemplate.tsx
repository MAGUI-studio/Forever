"use client";

import {useEffect,useRef} from "react";
import {MotionConfig,motion,useReducedMotion} from "framer-motion";
import {ArrowDown,ArrowUpRight,Heart,Navigation,GlassWater,Music2} from "lucide-react";
import {useWedding} from "../WeddingProvider";
import {useSiteCopy} from "../useSiteCopy";
import {RSVPSection} from "../RSVPSection";
import {romanceAssets} from "@/config/templates/romance-assets";
import {resolveTemplateImage} from "@/lib/template-images";
import {ContemporaryRomanceDressCode,ContemporaryRomanceGifts,ContemporaryRomanceFooter} from "./ContemporaryRomanceSections";
import {ContemporaryRomanceOrnaments} from "./ContemporaryRomanceOrnaments";
import {RomanceCountdown} from "./RomanceCountdown";
import {RomanceGarland} from "./RomanceGarland";
import {ContemporaryRomanceGallery} from "./ContemporaryRomanceGallery";
import {galleryEnabled} from "@/config/gallery";
import {RomancePhoto,RomanceReveal} from "./RomanceMotion";

const button="inline-flex min-h-12 items-center justify-center gap-3 rounded-full px-7 py-3 text-[11px] tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-4";
const eyebrow="text-[10px] uppercase tracking-[0.25em]";

export function ContemporaryRomanceTemplate(){
 const {config,modules}=useWedding();
 const copy=useSiteCopy();
 const reduced=useReducedMotion();
 const names=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{
  const element=names.current,parent=element?.parentElement;
  if(!element||!parent)return;
  let disposed=false,lastWidth=0;
  function fit(){
   if(disposed||!element)return;
   element.style.fontSize="";
   const style=getComputedStyle(element),base=parseFloat(style.fontSize),gap=parseFloat(style.columnGap)||0;
   const width=Array.from(element.children).reduce((total,child)=>total+child.scrollWidth,0)+gap*(element.children.length-1);
   if(width>element.clientWidth)element.style.fontSize=`${base*element.clientWidth/width*0.98}px`;
  }
  const observer=new ResizeObserver(([entry])=>{if(entry.contentRect.width!==lastWidth){lastWidth=entry.contentRect.width;fit();}});
  observer.observe(parent);void document.fonts.ready.then(fit);
  return ()=>{disposed=true;observer.disconnect();};
 },[config.couple.partner1,config.couple.partner2]);
 const {couple,ceremony}=config;
 const date=new Date(couple.weddingDate);
 const validDate=!Number.isNaN(date.getTime());
 const dateLabel=validDate?date.toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric",timeZone:"America/Sao_Paulo"}):"";
 const showGifts=modules.gifts;
 const showRsvp=modules.rsvp;
 const moments=[Heart,GlassWater,Music2];
 const heroImage = resolveTemplateImage(config, "contemporary-romance", "hero");
 const storyImage = resolveTemplateImage(config, "contemporary-romance", "story");
 const detailImage = resolveTemplateImage(config, "contemporary-romance", "detail");
 const venueImage = resolveTemplateImage(config, "contemporary-romance", "venue");
 const scheduleImage = resolveTemplateImage(config, "contemporary-romance", "schedule");
 return <MotionConfig reducedMotion="user"><main data-wedding-template="contemporary-romance" className="w-full overflow-x-hidden bg-[var(--forever-paper)] text-[var(--forever-ink)]">
  <section id="inicio" className="relative isolate flex min-h-[95svh] flex-col justify-between overflow-hidden bg-[#32151C] px-6 pb-8 pt-7 text-white sm:px-12 lg:min-h-svh lg:px-20">
   <div aria-hidden="true" className="absolute inset-0 -z-20"><RomancePhoto src={heroImage} preload sizes="100vw" className="h-full w-full"/></div>
   <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[#2A1119]/50"/>
   <ContemporaryRomanceOrnaments pattern="cover" tone="photo"/>
   <div className="relative mx-auto my-auto w-full max-w-7xl py-16 text-center sm:py-24">
    <RomanceReveal delay={0.2}><p className={`${eyebrow} mx-auto mb-10 max-w-md leading-6 text-white/85`}>{copy("romance.hero.eyebrow")}</p></RomanceReveal>
    <h1 ref={names} className="flex flex-nowrap items-baseline justify-center gap-x-[0.18em] whitespace-nowrap font-serif text-[clamp(2rem,7.5vw,9rem)] font-light leading-[1.1] tracking-[-0.04em]">
     <motion.span className="inline-block" initial={reduced?false:{opacity:0,y:45}} animate={{opacity:1,y:0}} transition={{duration:1.5,delay:0.35,ease:[0.22,1,0.36,1]}}>{couple.partner1}</motion.span>
     <motion.span className="inline-block text-[0.65em] italic text-white/75" initial={reduced?false:{opacity:0}} animate={{opacity:1}} transition={{duration:1.4,delay:0.6}}>&</motion.span>
     <motion.span className="inline-block italic" initial={reduced?false:{opacity:0,y:45}} animate={{opacity:1,y:0}} transition={{duration:1.5,delay:0.75,ease:[0.22,1,0.36,1]}}>{couple.partner2}</motion.span>
    </h1>
    {couple.headline&&<RomanceReveal delay={0.3}><p className="mx-auto mt-9 max-w-sm font-serif text-xl italic leading-relaxed text-white/90 sm:text-2xl">{couple.headline}</p></RomanceReveal>}
    <RomanceReveal delay={0.45} className="mt-10 flex flex-wrap justify-center gap-3">{showRsvp&&<a href="#rsvp" className={`${button} bg-white text-[#722F37] hover:bg-white/85`}>Confirmar presença<ArrowUpRight size={15}/></a>}{showGifts&&<a href="#presentes" className={`${button} border border-white/50 text-white hover:bg-white/10`}>Lista de presentes</a>}</RomanceReveal>
    {validDate&&<RomanceCountdown date={couple.weddingDate}/>}
   </div>
   <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-6 border-t border-white/25 pt-6 sm:flex-row"><div className="flex flex-wrap justify-center gap-x-7 gap-y-2 text-[10px] uppercase tracking-[0.2em] text-white/85">{dateLabel&&<span>{dateLabel}</span>}{ceremony.time&&<span>{ceremony.time}</span>}{couple.locationSummary&&<span>{couple.locationSummary}</span>}</div><a href={couple.story?"#historia":"#eventos"} aria-label="Ver os detalhes do casamento" className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/40 transition-colors hover:bg-white/10"><ArrowDown size={16} strokeWidth={1}/></a></div>
  </section>

  {couple.story&&<section id="historia" className="relative isolate px-6 py-20 sm:px-12 sm:py-32 lg:px-20">
   <ContemporaryRomanceOrnaments pattern="story"/>
   <div className="relative mx-auto max-w-7xl">
    <RomanceReveal className="mb-12 grid items-end gap-6 border-b border-[var(--forever-primary)]/20 pb-8 lg:mb-20 lg:grid-cols-[1.3fr_0.7fr]"><div><p className={`${eyebrow} mb-5 text-[var(--forever-accent)]`}>{copy("romance.story.eyebrow")}</p><h2 className="max-w-3xl font-serif text-5xl font-light leading-[1.02] tracking-[-0.035em] sm:text-7xl lg:text-8xl">{couple.story.title}</h2></div>{couple.story.sinceYear&&<p className="font-serif text-2xl italic text-[var(--forever-primary)] lg:text-right">Desde {couple.story.sinceYear}</p>}</RomanceReveal>
    <div className="grid items-start gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
     <div className="relative pb-10"><RomancePhoto src={storyImage} className="aspect-[4/5] w-[90%] rounded-t-[45%]"/><RomancePhoto src={detailImage} className="absolute! -bottom-6 right-0 aspect-[3/4] w-[44%] border-[7px] border-[var(--forever-paper)] shadow-[0_12px_35px_#30232912]" sizes="(min-width: 1024px) 20vw, 40vw"/><div aria-hidden="true" className="absolute -left-3 -top-6 -rotate-12 text-[var(--forever-primary)]"><Heart size={42} strokeWidth={0.8}/></div></div>
     <div className="pt-4 lg:pt-10"><RomanceReveal><blockquote className="mb-10 font-serif text-4xl italic leading-[1.15] tracking-[-0.02em] text-[var(--forever-primary)] sm:text-5xl lg:text-6xl">{copy("romance.story.closing")}</blockquote></RomanceReveal><div className="divide-y divide-[var(--forever-primary)]/15">{couple.story.text.map((paragraph,index)=><RomanceReveal key={index} delay={0.05*(index%3)} className="grid grid-cols-[auto_1fr] gap-6 py-7"><span aria-hidden="true" className="pt-1 font-serif text-2xl italic text-[var(--forever-primary)]/45">{String(index+1).padStart(2,"0")}</span><div>{couple.story?.moments?.[index]&&<p className={`${eyebrow} mb-3 text-[var(--forever-accent)]`}>{couple.story.moments[index]}</p>}<p className="text-sm font-light leading-8 sm:text-base">{paragraph}</p></div></RomanceReveal>)}</div></div>
    </div>
   </div>
  </section>}

  {galleryEnabled(config)&&<ContemporaryRomanceGallery/>}
  <RomanceGarland/>
  <section id="eventos" className="relative isolate overflow-hidden px-6 py-20 sm:px-12 sm:py-32 lg:px-20">
   <ContemporaryRomanceOrnaments pattern="venue"/>
   <div className="relative mx-auto max-w-7xl">
    <RomanceReveal className="mb-12 max-w-3xl"><p className={`${eyebrow} mb-5 text-[var(--forever-accent)]`}>{copy("romance.events.eyebrow")}</p><h2 className="font-serif text-5xl font-light leading-[1.02] tracking-[-0.035em] sm:text-7xl lg:text-8xl">{copy("romance.events.title")}</h2><p className="mt-6 max-w-xl text-sm leading-8 text-[var(--forever-accent)]">{copy("romance.events.description")}</p></RomanceReveal>
    <div className="relative grid items-center gap-0 lg:grid-cols-12">
     <RomancePhoto src={venueImage} className="aspect-[4/3] w-full lg:col-span-8 lg:col-start-5 lg:row-start-1 lg:aspect-[4/5]" sizes="(min-width: 1024px) 65vw, 100vw"/>
     <RomanceReveal className="relative z-10 -mt-12 mr-6 border border-[var(--forever-primary)]/15 bg-[var(--forever-paper)] p-7 sm:mr-14 sm:p-10 lg:col-span-6 lg:col-start-1 lg:row-start-1 lg:mr-0 lg:mt-16 lg:p-12">
      <p className={`${eyebrow} mb-6 text-[var(--forever-accent)]`}>A celebração</p><h3 className="font-serif text-4xl font-light leading-tight text-[var(--forever-primary)] sm:text-5xl">{ceremony.placeName}</h3><p className="mt-5 text-sm leading-7 text-[var(--forever-accent)]">{copy("romance.events.details")}</p>
      <dl className="my-8 grid grid-cols-2 gap-5 border-y border-[var(--forever-primary)]/20 py-6"><div><dt className={`${eyebrow} text-[var(--forever-accent)]`}>Data</dt><dd className="mt-3 font-serif text-xl">{dateLabel}</dd></div><div><dt className={`${eyebrow} text-[var(--forever-accent)]`}>Horário</dt><dd className="mt-3 font-serif text-2xl">{ceremony.time}</dd></div></dl>
      <address className="text-sm not-italic leading-7">{ceremony.address}<br/>{ceremony.cityState}</address><p className="mt-4 font-serif text-lg italic text-[var(--forever-accent)]">{copy("romance.events.note")}</p>
      <div className="mt-7 flex flex-wrap gap-3">{ceremony.googleMapsUrl&&<a target="_blank" rel="noopener noreferrer" href={ceremony.googleMapsUrl} className={`${button} bg-[var(--forever-primary)] text-white hover:bg-[#5B252C]`}><Navigation size={14}/>Como chegar</a>}{ceremony.wazeUrl&&<a target="_blank" rel="noopener noreferrer" href={ceremony.wazeUrl} className={`${button} border border-[var(--forever-primary)]/30 hover:bg-[var(--forever-primary)]/5`}>Abrir no Waze</a>}{ceremony.websiteUrl&&<a target="_blank" rel="noopener noreferrer" href={ceremony.websiteUrl} className="inline-flex min-h-11 items-center gap-2 text-xs text-[var(--forever-primary)] underline underline-offset-4">Conheça o espaço<ArrowUpRight size={14}/></a>}</div>
     </RomanceReveal>
    </div>
   </div>
  </section>

  <section id="programacao" className="relative isolate overflow-hidden bg-[var(--forever-primary)] px-6 py-20 text-white sm:px-12 sm:py-28 lg:px-20">
   <ContemporaryRomanceOrnaments pattern="schedule" tone="olive"/>
   <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-24"><div><RomanceReveal><p className={`${eyebrow} mb-5 text-white/65`}>{copy("romance.schedule.eyebrow")}</p><h2 className="font-serif text-5xl font-light leading-[1.02] tracking-[-0.035em] sm:text-7xl">{copy("romance.schedule.title")}</h2><p className="mt-6 max-w-lg text-sm leading-8 text-white/70">{copy("romance.schedule.intro")}</p></RomanceReveal><div className="mt-10 divide-y divide-white/20">{moments.map((Icon,index)=><RomanceReveal key={index} delay={index*0.08} className="flex items-start gap-6 py-7"><Icon aria-hidden="true" size={25} strokeWidth={1} className="mt-1 shrink-0 text-white/65"/><div><h3 className="font-serif text-3xl font-light">{copy(`romance.schedule.time${index+1}`)}</h3><p className="mt-3 max-w-md text-sm leading-7 text-white/70">{copy(`romance.schedule.event${index+1}`)}</p></div></RomanceReveal>)}</div></div><div className="relative pl-8 pb-8"><RomancePhoto src={scheduleImage} className="aspect-[3/4] rounded-t-full"/><div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -bottom-0 top-6 -z-10 rounded-t-full border border-white/30"/><p className="absolute -left-2 top-1/2 -translate-y-1/2 [writing-mode:vertical-rl] text-[9px] uppercase tracking-[0.3em] text-white/55">{couple.partner1} & {couple.partner2}</p></div></div>
  </section>
  <ContemporaryRomanceDressCode/>
  {showGifts&&<ContemporaryRomanceGifts/>}
  {showRsvp&&<RSVPSection/>}
  <ContemporaryRomanceFooter/>
 </main></MotionConfig>;
}
