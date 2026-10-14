"use client";
import {useEffect,useRef} from "react";
import Image from "next/image";
import {useWedding} from "./WeddingProvider";
import {formatCurrency} from "@/lib/utils";
import type {GiftItem} from "@/types/wedding";
import {ExternalLink,Gift,ShieldCheck,X} from "lucide-react";

/** Gifts always use the couple's single external, open-amount payment link. */
export function PixModal({gift,customAmount,onClose}:{gift:GiftItem|null;customAmount?:number|null;onClose:()=>void}) {
 const {config}=useWedding();
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const element=dialog.current;element?.showModal();return ()=>element?.close();},[]);
 const amount=customAmount??gift?.price;
 const link=config.giftPaymentLink;
 const validLink=link&&/^https:\/\/[^\s]+$/i.test(link)?link:undefined;
 return <dialog id="pagamento-presente" ref={dialog} onCancel={onClose} onClick={event=>{if(event.target===event.currentTarget)onClose();}} className="m-auto w-[calc(100%-2rem)] max-w-lg max-h-[90vh] overflow-y-auto rounded-[var(--wedding-radius)] bg-[#fffdfa] p-6 text-[var(--forever-ink,#3D2501)] backdrop:bg-black/60 sm:p-8">
  <header className="flex items-start justify-between gap-4"><div><Gift size={24} strokeWidth={1} className="mb-4 text-[var(--forever-primary,#5D613C)]"/><p className="text-[10px] uppercase tracking-[0.2em] text-[var(--forever-accent,#80654E)]">Um presente com carinho</p><h3 className="mt-2 font-serif text-3xl">{gift?.title||"Presente de valor livre"}</h3></div><button type="button" aria-label="Fechar" onClick={onClose} className="rounded-full p-2 text-[var(--forever-accent,#80654E)] hover:bg-[var(--forever-hover-tint,#5d613c08)]"><X size={20}/></button></header>
  {amount!==undefined&&amount>0&&<div className="mt-6 rounded-[var(--wedding-radius)] bg-[#5d613c08] p-4"><p className="text-xs text-[var(--forever-accent,#80654E)]">Valor sugerido para este presente</p><p className="mt-1 font-serif text-3xl text-[var(--forever-primary,#5D613C)]">{formatCurrency(amount)}</p></div>}
  <p className="my-6 text-sm leading-relaxed text-[var(--forever-accent,#80654E)]">Você será direcionado para o link de pagamento dos noivos. Informe {amount!==undefined&&amount>0?formatCurrency(amount):"o valor desejado"} na página de pagamento e escolha uma das formas disponíveis.</p>
  {validLink?<a href={validLink} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center justify-center gap-2 rounded-[var(--wedding-radius)] bg-[var(--forever-primary,#5D613C)] px-5 py-3 text-sm text-white transition-colors hover:bg-[var(--forever-primary-hover,#4b4f30)]">Ir para o pagamento<ExternalLink size={16}/></a>:<p role="status" className="rounded-xl bg-[#5d613c08] p-4 text-sm text-[var(--forever-accent,#80654E)]">O link de pagamento ainda não foi configurado pelos noivos.</p>}
  <div className="mt-5 rounded-[var(--wedding-radius)] border border-[#5d613c15] bg-[#5d613c05] p-3.5 sm:p-4">
   <div className="flex items-center justify-between gap-3">
    <div className="flex items-center gap-2 text-xs font-medium text-[var(--forever-ink,#3D2501)]">
     <ShieldCheck size={16} className="shrink-0 text-[#009EE3]" aria-hidden="true" />
     <span>Pagamento 100% seguro via</span>
    </div>
    <Image src="/utils/logo_mercado_pago.svg" alt="Mercado Pago" width={115} height={30} className="h-6 w-auto shrink-0 object-contain" />
   </div>
   <p className="mt-2 text-[11px] leading-relaxed text-[var(--forever-accent,#80654E)]">
    A transação é realizada diretamente no ambiente seguro do <strong>Mercado Pago</strong>. Nosso site não coleta nem armazena nenhuma informação bancária ou do seu cartão.
   </p>
  </div>
 </dialog>;
}
