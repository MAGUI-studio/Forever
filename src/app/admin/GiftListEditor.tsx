"use client";

import {UnsavedIndicator} from "./UnsavedIndicator";
import { Gift, Link2, Plus, Trash2, ChevronDown } from "lucide-react";
import type { GiftItem } from "@/types/wedding";
import { WeddingInput, WeddingTextarea } from "@/components/ui/WeddingInput";
import { WeddingSelect } from "@/components/ui/WeddingSelect";
import { AdminButton } from "./AdminButton";

export function GiftListEditor({gifts,paymentLink,savedGifts,savedPaymentLink,onGiftsChange,onPaymentLinkChange,allowImages=false}:{savedGifts?:GiftItem[];savedPaymentLink?:string;allowImages?:boolean;gifts:GiftItem[];paymentLink:string;onGiftsChange:(gifts:GiftItem[])=>void;onPaymentLinkChange:(link:string)=>void}) {
  const changed=(gift:GiftItem,key:keyof GiftItem)=>!!savedGifts&&JSON.stringify(savedGifts.find(item=>item.id===gift.id)?.[key])!==JSON.stringify(gift[key]);
  const categories = Array.from(new Set([
    "Presentes", "Casa nova", "Eletrodomésticos", "Eletroportáteis",
    "Cama, mesa e banho", "Decoração", "Utensílios de cozinha", "Para servir",
    "Tecnologia", "Lua de mel", "Experiências", "Personalizados", "Outros",
    ...gifts.map(gift=>gift.categoryLabel||gift.category).filter(Boolean),
  ]));
  function update(id:string,change:Partial<GiftItem>) {
    onGiftsChange(gifts.map(gift=>gift.id===id?{...gift,...change}:gift));
  }
  const required=<span className="ml-1 text-red-600">*</span>;
  return <section className="space-y-5">
    <div className="rounded-[var(--wedding-radius)] border border-[#722f3720] bg-[#722f3705] p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[#722F37]"><Link2 size={16}/>Pagamento dos presentes</div>
      <label className="block text-sm text-[#722F37]">Link único de pagamento<UnsavedIndicator changed={savedPaymentLink!==undefined&&savedPaymentLink!==paymentLink}/>{gifts.length>0&&required}<WeddingInput type="url" required={gifts.length>0} value={paymentLink} onChange={event=>onPaymentLinkChange(event.target.value)} placeholder="https://" className="mt-2"/></label>
      <p className="mt-3 text-xs leading-relaxed text-[#77736c]">Crie no Mercado Pago ou em outro provedor um link sem valor fixo e sem prazo de validade. Todos os presentes usarão esse link, e o convidado informará o valor ao pagar.</p>
      <p className="mt-2 text-xs leading-relaxed text-[#77736c]">Você administra os recebimentos e as taxas diretamente no provedor.</p>
    </div>
    <details className="group/gift-list rounded-[var(--wedding-radius)] border border-[#722f3720]"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forever-focus,#722F37)] [&::-webkit-details-marker]:hidden">
      <div><p className="text-[10px] uppercase tracking-[0.2em] text-[#77736c]">Escolhidos com carinho</p><h2 className="mt-2 font-serif text-2xl text-[#161616]">Lista de presentes</h2></div>
      <span className="flex shrink-0 items-center gap-2"><span className="inline-flex items-center gap-2 rounded-full bg-[#722f3708] px-3 py-2 text-xs text-[#722F37]"><Gift size={14}/>{gifts.length} {gifts.length===1?"presente":"presentes"}</span><ChevronDown size={17} className="text-[#722F37] transition-transform duration-300 group-open/gift-list:rotate-180" aria-hidden="true"/></span>
    </summary><div className="space-y-5 border-t border-[#722f3715] p-4">
    <p className="text-xs text-[#77736c]">Campos marcados com <span className="text-red-600">*</span> são obrigatórios.</p>
    {!gifts.length&&<div className="rounded-[var(--wedding-radius)] border border-dashed border-[#722f3730] px-5 py-7 text-center"><Gift size={26} strokeWidth={1} className="mx-auto mb-3 text-[#722F37]"/><p className="text-sm text-[#161616]">Sua lista ainda está vazia</p><p className="mt-2 text-xs leading-relaxed text-[#77736c]">Adicione o primeiro presente para começar.</p></div>}
    {gifts.map((gift,index)=><article key={gift.id} className="overflow-hidden rounded-[var(--wedding-radius)] border border-neutral-200/80 bg-white">
      <header className="flex items-center justify-between gap-3 border-b border-[#722f3715] px-4 py-3">
        <div className="flex min-w-0 items-center gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#722f370d] text-xs text-[#722F37]">{String(index+1).padStart(2,"0")}</span><h3 className="truncate text-sm font-medium text-[#544b3b]">{gift.title.trim()||"Novo presente"}</h3></div>
        <button type="button" aria-label={"Remover "+(gift.title.trim()||"presente "+(index+1))} onClick={()=>onGiftsChange(gifts.filter(item=>item.id!==gift.id))} className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs text-[#a15d53] transition-colors hover:bg-[#a15d530d] focus-visible:outline-2 focus-visible:outline-offset-2"><Trash2 size={14}/><span>Remover</span></button>
      </header>
      <div className="space-y-4 p-4">
        <label className="block text-sm text-[#544b3b]">Nome do presente{required}<UnsavedIndicator changed={changed(gift,"title")}/><WeddingInput required className="mt-2" value={gift.title} placeholder="Ex.: Computador gamer" onChange={event=>update(gift.id,{title:event.target.value})}/></label>
        <div className="grid grid-cols-1 gap-4 min-[1600px]:grid-cols-2">
          <label className="block text-sm text-[#544b3b]">Valor sugerido (R$){required}<UnsavedIndicator changed={changed(gift,"price")}/><WeddingInput type="number" min="0.01" step="0.01" required className="mt-2" value={gift.price??""} placeholder="5000,00" onChange={event=>update(gift.id,{price:event.target.value?Number(event.target.value):undefined})}/></label>
          <label className="block text-sm text-[#544b3b]">Categoria<UnsavedIndicator changed={changed(gift,"category")||changed(gift,"categoryLabel")}/><WeddingSelect label="Categoria do presente" className="mt-2" value={gift.categoryLabel||gift.category} options={categories.map(category=>({value:category,label:category}))} onValueChange={category=>update(gift.id,{category,categoryLabel:category})}/></label>
        </div>
        {allowImages&&<label className="block text-sm text-[#544b3b]">Imagem (URL)<UnsavedIndicator changed={changed(gift,"image")}/><WeddingInput className="mt-2" value={gift.image} placeholder="https://" onChange={event=>update(gift.id,{image:event.target.value})}/></label>}
        <label className="block text-sm text-[#544b3b]">Descrição<UnsavedIndicator changed={changed(gift,"description")}/><WeddingTextarea rows={3} className="mt-2" value={gift.description??""} placeholder="Conte um pouco sobre esse presente…" onChange={event=>update(gift.id,{description:event.target.value})}/></label>
      </div>
    </article>)}
    <AdminButton variant="ghost" className="w-full border border-dashed border-[#722f3740]" disabled={gifts.length>=300} onClick={()=>onGiftsChange([...gifts,{id:crypto.randomUUID(),title:"",category:"Presentes",categoryLabel:"Presentes",image:""}])}><Plus size={16}/>Adicionar presente</AdminButton>
  </div></details></section>;
}
