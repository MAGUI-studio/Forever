"use client";
import {useEffect,useRef,useState} from "react";
import type {User} from "firebase/auth";
import type {EventLocation} from "@/types/wedding";
import {WeddingInput} from "@/components/ui/WeddingInput";
import {LocationMap,type LocationPoint} from "@/components/ui/LocationMap";
import {readApiResponse} from "@/lib/api-response";

type Candidate=LocationPoint&{label:string};
export function VenueAddressEditor({value,onChange,user,slug}:{value:EventLocation;onChange:(value:EventLocation)=>void;user:User|null;slug:string}){
  const latest=useRef(value);latest.current=value;
  const [message,setMessage]=useState(""),[busy,setBusy]=useState(false),[candidates,setCandidates]=useState<Candidate[]>([]);
  const version=useRef(0),request=useRef<AbortController|null>(null);
  useEffect(()=>()=>request.current?.abort(),[]);
  function edit(patch:Partial<EventLocation>){version.current++;request.current?.abort();setBusy(false);setCandidates([]);setMessage("");onChange({...latest.current,...patch,coordinates:null});}
  useEffect(()=>{
    const cep=value.postalCode;
    if(!cep||cep.length!==8)return;
    const controller=new AbortController(),stamp=version.current;
    const timer=setTimeout(async()=>{
      setMessage("Buscando endereço pelo CEP…");
      try{
        const response=await fetch(`https://viacep.com.br/ws/${cep}/json/`,{signal:controller.signal});
        if(!response.ok)throw new Error();
        const data=await response.json();
        if(controller.signal.aborted||stamp!==version.current)return;
        if(data.erro){setMessage("CEP não encontrado. Preencha o endereço manualmente.");return;}
        onChange({...latest.current,address:[data.logradouro,data.bairro].filter(Boolean).join(" — "),cityState:`${data.localidade} — ${data.uf}`,coordinates:null});
        setMessage("Endereço encontrado. Acrescente o número e localize no mapa.");
      }catch{if(!controller.signal.aborted)setMessage("Não foi possível consultar o CEP. Você pode preencher manualmente.");}
    },500);
    return ()=>{clearTimeout(timer);controller.abort();};
  // Only a new postal code should trigger lookup, never another address edit.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[value.postalCode]);
  async function locate(){
    if(!user)return;
    const stamp=version.current,controller=new AbortController();request.current?.abort();request.current=controller;setBusy(true);setMessage("");setCandidates([]);
    try{
      const result=await readApiResponse(await fetch("/api/admin/geocode",{method:"POST",signal:controller.signal,headers:{Authorization:"Bearer "+await user.getIdToken(),"x-wedding-slug":slug,"Content-Type":"application/json"},body:JSON.stringify({address:value.address,cityState:value.cityState,postalCode:value.postalCode??""})}));
      if(controller.signal.aborted||stamp!==version.current)return;
      setCandidates(result.candidates);setMessage(result.candidates.length?"Selecione o resultado correto e confira o marcador.":"Nenhum resultado encontrado. Marque o ponto diretamente no mapa.");
    }catch(error){if(!controller.signal.aborted)setMessage((error as Error).message);}
    finally{if(!controller.signal.aborted)setBusy(false);}
  }
  function pin({latitude,longitude}:LocationPoint){version.current++;request.current?.abort();setBusy(false);setCandidates([]);onChange({...latest.current,coordinates:{latitude,longitude},googleMapsUrl:`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,wazeUrl:`https://www.waze.com/ul?ll=${latitude},${longitude}&navigate=yes`});setMessage("Localização selecionada. Salve as alterações para aplicar ao site.");}
  return <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-4">
    <div><h3 className="text-sm font-medium">Endereço e localização</h3><p className="mt-1 text-xs leading-relaxed text-neutral-500">Busque pelo CEP, acrescente o número e confira onde os convidados devem chegar.</p></div>
    <label className="block text-xs font-medium">CEP<WeddingInput className="mt-2" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" value={(value.postalCode??"").replace(/^(\d{5})(\d)/,"$1-$2")} onChange={e=>edit({postalCode:e.target.value.replace(/\D/g,"").slice(0,8)})}/></label>
    <label className="block text-xs font-medium">Endereço completo, número e complemento<WeddingInput className="mt-2" value={value.address} onChange={e=>edit({address:e.target.value})}/></label>
    <label className="block text-xs font-medium">Cidade e estado<WeddingInput className="mt-2" value={value.cityState} onChange={e=>edit({cityState:e.target.value})}/></label>
    <button type="button" disabled={busy||!user||value.address.length<3||value.cityState.length<3} onClick={locate} className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm text-[#722f37] transition-colors hover:bg-neutral-50 disabled:opacity-50">{busy?"Localizando…":"Localizar endereço no mapa"}</button>
    <p role="status" className="text-xs leading-relaxed text-neutral-500">{message||"Você também pode clicar no mapa ou arrastar o marcador para ajustar a entrada do local."}</p>
    {candidates.length>0&&<ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-200">{candidates.map((candidate,index)=><li key={index}><button type="button" onClick={()=>pin(candidate)} className="w-full px-3 py-3 text-left text-xs leading-relaxed transition-colors hover:bg-neutral-50">{candidate.label}</button></li>)}</ul>}
    <LocationMap point={value.coordinates} onChange={pin}/>
    {value.coordinates&&<button type="button" onClick={()=>edit({})} className="text-xs text-neutral-500 underline underline-offset-4">Remover mapa do site</button>}
  </div>;
}
