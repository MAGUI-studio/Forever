"use client";
import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import {useWedding} from "./WeddingProvider";
import { generatePixPayload } from "@/lib/pix";
import { formatCurrency } from "@/lib/utils";
import { GiftItem } from "@/types/wedding";
import { X, CreditCard, QrCode } from "lucide-react";
export function PixModal({gift,customAmount,onClose}:{gift:GiftItem|null;customAmount?:number|null;onClose:()=>void}) {
  const {config:weddingConfig,path}=useWedding();
  const [tab,setTab]=useState<"pix"|"card">("pix");
  const [notice,setNotice]=useState("");
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{ const el=dialog.current; el?.showModal(); return ()=>el?.close(); },[]);
  const {pix,creditCard}=weddingConfig;
  const amount=customAmount ?? gift?.price ?? 0;
  // Fixed-price gifts require their own links; a generic link must not claim to charge this amount.
  const candidate=creditCard?.enabled ? (gift ? gift.creditCardUrl : creditCard.defaultPaymentLink) : undefined;
  const cardUrl=candidate && /^https:\/\/[^\s]+$/i.test(candidate) ? candidate : undefined;
  const payload=pix.key && amount>0 ? generatePixPayload({pixKey:pix.key,receiverName:pix.receiverName,city:pix.city,amount,description:(gift?.title ?? "Presente").slice(0,25)}) : "";
  return <dialog ref={dialog} onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose();}} className="m-auto w-[calc(100%-2rem)] max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-0 bg-[#F1F1F1] text-[#3D2501] backdrop:bg-black/70">
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex justify-between gap-4"><div><p className="text-xs tracking-widest uppercase text-[#5D613C]">Presentear os noivos</p><h3 className="font-serif text-3xl mt-2">{gift?.title ?? "Cota livre"}</h3><p className="font-serif text-3xl mt-2">{formatCurrency(amount)}</p></div><button onClick={onClose} aria-label="Fechar"><X/></button></div>
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Forma de pagamento">
        <button aria-pressed={tab==="pix"} onClick={()=>setTab("pix")} className="border border-[#C7B79D] rounded-full p-3 flex justify-center gap-2"><QrCode size={18}/>PIX</button>
        <button aria-pressed={tab==="card"} onClick={()=>setTab("card")} className="border border-[#C7B79D] rounded-full p-3 flex justify-center gap-2"><CreditCard size={18}/>Cartão</button>
      </div>
      {tab==="pix" ? payload ? <div className="space-y-5 text-center">
        <QRCodeSVG value={payload} size={180} marginSize={4} className="mx-auto"/>
        <p className="text-sm">Titular: {pix.receiverName}</p>
        <button className="bg-[#3D2501] text-[#F5F5DA] rounded-full py-3 px-6" onClick={async()=>{try{await navigator.clipboard.writeText(payload);setNotice("Código PIX copiado.");}catch{setNotice("Não foi possível copiar. Selecione o código abaixo.");}}}>Copiar código PIX</button>
        <textarea readOnly aria-label="Código PIX" value={payload} className="guest-input text-xs"/>
        <p role="status">{notice}</p>
      </div> : <p className="text-[#80654E] leading-relaxed">O PIX estará disponível em breve. Os dados de recebimento ainda estão sendo preparados pelos noivos.</p> : cardUrl ? <div className="space-y-5">
        <p className="text-[#80654E] text-sm leading-relaxed">Continue no checkout do {creditCard?.providerName}. Confira o valor, o titular, as taxas e as condições de parcelamento antes de pagar.</p>
        <a href={cardUrl} target="_blank" rel="noopener noreferrer" className="block text-center bg-[#3D2501] text-[#F5F5DA] rounded-full py-4">{gift ? "Pagar " + formatCurrency(amount) + " no cartão" : "Continuar no checkout"}</a>
        {!gift && <p className="text-sm text-[#80654E]">Informe ou confira o valor escolhido no checkout. O valor digitado aqui não é enviado automaticamente ao provedor.</p>}
      </div> : <p className="text-[#80654E] leading-relaxed">O pagamento com cartão estará disponível em breve. Estamos preparando o link deste presente.</p>}
      <p className="text-xs text-[#80654E] border-t border-[#C7B79D] pt-4">Os presentes são cotas simbólicas. Sua presença é o nosso maior presente.</p>
    </div>
  </dialog>;
}