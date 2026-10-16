"use client";

import type {DressCodeInfo} from "@/types/wedding";
import {WeddingInput,WeddingTextarea} from "@/components/ui/WeddingInput";
import {Plus,Trash2} from "lucide-react";

export function DressCodeEditor({value,onChange}:{value:DressCodeInfo;onChange:(value:DressCodeInfo)=>void}) {
  const update=(patch:Partial<DressCodeInfo>)=>onChange({...value,...patch});
  return <div className="site-editor-wide space-y-7">
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="text-xs font-medium">Título do dress code<WeddingInput maxLength={500} className="mt-2" value={value.title} onChange={event=>update({title:event.target.value})}/></label>
      <label className="text-xs font-medium">Descrição e tipo de traje<WeddingTextarea maxLength={500} className="mt-2" rows={3} value={value.description} onChange={event=>update({description:event.target.value})}/></label>
    </div>
    {([{key:"dos",label:"Recomendações de traje"},{key:"donts",label:"Pedidos aos convidados"}] as const).map(({key,label})=><fieldset key={key} className="space-y-3">
      <legend className="mb-3 text-sm font-medium">{label}</legend>
      {value[key].map((text,index)=><div key={index} className="flex items-start gap-3"><WeddingTextarea maxLength={500} aria-label={`${label}: item ${index+1}`} rows={2} value={text} onChange={event=>update({[key]:value[key].map((item,i)=>i===index?event.target.value:item)})}/><button type="button" aria-label={`Remover item ${index+1} de ${label.toLowerCase()}`} onClick={()=>update({[key]:value[key].filter((_,i)=>i!==index)})} className="flex size-11 shrink-0 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"><Trash2 size={16}/></button></div>)}
      <button type="button" disabled={value[key].length>=30} onClick={()=>update({[key]:[...value[key],""]})} className="inline-flex min-h-11 items-center gap-2 text-xs text-[#722F37] disabled:opacity-40"><Plus size={15}/>Adicionar orientação</button>
    </fieldset>)}
    <fieldset className="space-y-4">
      <legend className="mb-3 text-sm font-medium">Cores sugeridas para os trajes</legend>
      <p className="text-xs leading-6 text-neutral-500">As cores abaixo são as que aparecem no site. Remova todas para ocultar a paleta.</p>
      {value.palette.map((color,index)=><div key={index} className="flex items-center gap-3">
        <input type="color" aria-label={`Selecionar cor ${index+1}`} value={color.hex} onChange={event=>update({palette:value.palette.map((item,i)=>i===index?{...item,hex:event.target.value}:item)})} className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-neutral-200 bg-white p-1"/>
        <WeddingInput maxLength={500} aria-label={`Nome da cor ${index+1}`} placeholder="Nome da cor" value={color.name} onChange={event=>update({palette:value.palette.map((item,i)=>i===index?{...item,name:event.target.value}:item)})}/>
        <span className="hidden text-xs text-neutral-500 sm:inline">{color.hex}</span>
        <button type="button" aria-label={`Remover cor ${index+1}`} onClick={()=>update({palette:value.palette.filter((_,i)=>i!==index)})} className="flex size-11 shrink-0 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"><Trash2 size={16}/></button>
      </div>)}
      <button type="button" disabled={value.palette.length>=12} onClick={()=>update({palette:[...value.palette,{name:"",hex:"#808080"}]})} className="inline-flex min-h-11 items-center gap-2 text-xs text-[#722F37] disabled:opacity-40"><Plus size={15}/>Adicionar cor</button>
    </fieldset>
  </div>;
}
