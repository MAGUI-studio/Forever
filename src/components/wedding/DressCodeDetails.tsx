"use client";

import {useWedding} from "./WeddingProvider";

/** All template variants read the same fields edited in DressCodeEditor. */
export function DressCodeDetails() {
 const {config}=useWedding();
 const dress=config.dressCode;
 return <div className="space-y-8">
  {(dress.dos.length>0||dress.donts.length>0)&&<div className="grid gap-8 sm:grid-cols-2">
   {([{items:dress.dos,title:"Para aproveitar"},{items:dress.donts,title:"Um pedido com carinho"}]).map(({items,title})=>items.length>0&&<div key={title}><h3 className="mb-4 font-serif text-2xl text-[var(--forever-primary)]">{title}</h3><ul className="space-y-3 text-sm leading-7 text-[var(--forever-accent)]">{items.map((text,index)=><li key={index}>{text}</li>)}</ul></div>)}
  </div>}
  {dress.palette.length>0&&<div><p className="mb-5 text-[10px] uppercase tracking-[0.2em] text-[var(--forever-accent)]">Cores para inspirar o seu look</p><ul className="flex flex-wrap gap-6">{dress.palette.map((color,index)=><li key={`${color.name}-${index}`} className="flex max-w-32 flex-col items-center gap-3 text-center text-xs text-[var(--forever-ink)]"><span aria-hidden="true" className="block h-14 w-10 rounded-t-full rounded-b-lg" style={{backgroundColor:color.hex}}/>{color.name}</li>)}</ul></div>}
 </div>;
}
