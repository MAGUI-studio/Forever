"use client";
import {RequiredMark,RequiredFieldsNotice} from "@/components/ui/RequiredFields";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { ArrowUpRight, ArrowLeft, Check, Heart, Loader2 } from "lucide-react";
import { PurchaseAccountForm } from "./PurchaseAccountForm";
import type { AccountValues } from "./account-schema";
import { ForeverDatePicker } from "@/components/ui/ForeverDatePicker";
import { weddingAddress } from "@/lib/wedding-address";
import { clientAuth } from "@/lib/firebase/client";
import { readApiResponse } from "@/lib/api-response";
import { ForeverLogo } from "@/components/forever/ForeverLogo";
import { PLAN_PRICING } from "@/config/pricing";
import type { WeddingPlan } from "@/config/forever";

type Wedding = {slug:string;plan:WeddingPlan|null;partner1:string;partner2:string;weddingDate:string;status:string;expired:boolean};
const input="mt-2 h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none focus:border-[#722F37] focus:ring-2 focus:ring-[#722F3710]";
const button="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#722F37] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#5B252C] disabled:opacity-50";
export function PurchaseFlow({confirmation=false}:{confirmation?:boolean}) {
 const router=useRouter(), params=useSearchParams();
 const plan:WeddingPlan=params.get("plan") === "foreverPro" ? "foreverPro" : "essencial";
 const sessionId=params.get("session_id");
 const [user,setUser]=useState<User|null>(null),[ready,setReady]=useState(false),[loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [existing,setExisting]=useState<Wedding|null>(null),[mode,setMode]=useState<"create"|"login">("create");
 const [partner1,setPartner1]=useState(""),[partner2,setPartner2]=useState(""),[date,setDate]=useState(""),[slug,setSlug]=useState("");
 const [showAddress,setShowAddress]=useState(false);
 const [addressCheck,setAddressCheck]=useState<{value:string;status:"available"|"taken"|"invalid"|"checking"|"error"}>({value:"",status:"checking"});
 const [addressRetry,setAddressRetry]=useState(0);
 const automaticAddress=weddingAddress(partner1,partner2);
 const needsAddress=showAddress || (!!partner1.trim() && !!partner2.trim() && !automaticAddress);
 const candidate=slug || automaticAddress;
 const addressAvailable=addressCheck.value === candidate && addressCheck.status === "available";
 const [confirmed,setConfirmed]=useState<{slug:string;plan:WeddingPlan}|null>(null),[paymentState,setPaymentState]=useState("waiting");
 async function api(path:string,method="GET",data?:unknown,account=user) {
  if(!account)throw new Error("Entre na sua conta para continuar.");
  return readApiResponse(await fetch(path,{method,headers:{Authorization:`Bearer ${await account.getIdToken()}`,"Content-Type":"application/json"},...(data?{body:JSON.stringify(data)}:{})}),{redirectOnPlanRequired:false});
 }
 useEffect(()=>onAuthStateChanged(clientAuth(),account=>{setUser(account);setReady(true);setError("");setExisting(null);setLoading(!!account && !confirmation);}),[confirmation]);
 useEffect(()=>{
  if(!user || confirmation)return;
  let active=true;
  void api("/api/contratacao","GET",undefined,user).then(data=>{if(!active)return;setExisting(data.wedding);if(!params.get("plan") && (data.pendingPlan === "essencial" || data.pendingPlan === "foreverPro"))router.replace(`/contratar?plan=${data.pendingPlan}`);if(data.wedding?.plan)router.replace(data.wedding.expired ? `/${data.wedding.slug}/acesso-expirado` : `/${data.wedding.slug}/painel`);}).catch(error=>{if(active)setError(error.message);}).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[user,confirmation]);
 useEffect(()=>{
  if(!confirmation || !user || !sessionId)return;
  let active=true;let timer:ReturnType<typeof setTimeout>;let attempts=0;
  async function check(){
   try{const data=await api(`/api/contratacao/pagamento?session_id=${encodeURIComponent(sessionId!)}`);if(!active)return;if(data.confirmed){setConfirmed({slug:data.slug,plan:data.plan});return;}setPaymentState(data.status === "expired" || data.status === "failed" || data.status === "open" ? data.status : "waiting");if(data.status === "expired" || data.status === "failed")return;}
   catch(error){if(active)setError(error instanceof Error?error.message:"Não foi possível consultar o pagamento.");}
   if(active && ++attempts<60)timer=setTimeout(check,3000);
  }
  void check();return()=>{active=false;clearTimeout(timer);};
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[confirmation,user,sessionId]);
 useEffect(()=>{
  if(!user || existing || confirmation || !candidate)return;
  let active=true;
  const timer=setTimeout(async()=>{
   setAddressCheck({value:candidate,status:"checking"});
   try{const data=await api(`/api/contratacao/endereco?slug=${encodeURIComponent(candidate)}`);if(!active)return;setAddressCheck({value:candidate,status:data.available ? "available" : data.reason === "taken" ? "taken" : "invalid"});if(!data.available)setShowAddress(true);}
   catch{if(active)setAddressCheck({value:candidate,status:"error"});}
  },400);
  return()=>{active=false;clearTimeout(timer);};
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[candidate,user,existing,confirmation,addressRetry]);
 async function authenticate({email,password}:AccountValues){
  setBusy(true);setError("");
  try{if(mode === "create")await createUserWithEmailAndPassword(clientAuth(),email,password);else await signInWithEmailAndPassword(clientAuth(),email,password);}
  catch(error){const code=(error as {code?:string}).code;setError(code === "auth/email-already-in-use" ? "Este e-mail já tem uma conta. Clique em Entre para continuar." : code === "auth/weak-password" ? "Use uma senha com pelo menos 8 caracteres." : "Não foi possível entrar ou criar a conta. Confira o e-mail e a senha.");}
  finally{setBusy(false);}
 }
 async function checkout(event:React.FormEvent){
  event.preventDefault();if(!existing && !date){setError("Escolha a data do casamento para continuar.");return;}if(!existing && !addressAvailable){setShowAddress(true);return;}setBusy(true);setError("");
  try{let target=existing?.slug;if(!target){const created=await api("/api/contratacao","POST",{partner1,partner2,weddingDate:date,...(slug ? {slug} : {})});target=created.slug;setExisting({slug:target!,plan:null,partner1,partner2,weddingDate:date,status:"draft",expired:false});}const data=await api("/api/checkout","POST",{plan,action:"new",weddingSlug:target});if(!data.url)throw new Error("Não foi possível abrir o pagamento.");window.location.assign(data.url);}
  catch(error){if((error as {code?:string}).code === "ADDRESS_TAKEN" || (error as {code?:string}).code === "ADDRESS_INVALID"){setShowAddress(true);setAddressCheck({value:candidate,status:"taken"});}setError(error instanceof Error?error.message:"Não foi possível continuar.");setBusy(false);}
 }
 const price=PLAN_PRICING[plan];
 return <main className="min-h-svh bg-neutral-100 px-4 py-6 text-neutral-900 sm:px-7 sm:py-10"><div className="mx-auto max-w-5xl">
  <header className="mb-8 flex items-center justify-between gap-4 sm:mb-12"><Link href="/" aria-label="Página inicial Forever"><ForeverLogo className="w-36 sm:w-44" /></Link><Link href="/" className="group inline-flex items-center gap-2 text-xs text-neutral-500 hover:text-[#722F37]"><ArrowLeft size={14} className="transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:transform-none" aria-hidden="true" />Voltar ao início</Link></header>
  <div className={confirmation ? "mx-auto max-w-xl" : "grid gap-8 lg:grid-cols-[0.85fr_1fr] lg:gap-12"}>
  {!confirmation && <aside className="order-last lg:order-first lg:py-6">
   <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#722F37]">Um começo cheio de significado</p>
   <h2 className="mt-4 max-w-sm font-serif text-4xl leading-[1.1] sm:text-5xl">A história é de vocês.<br /><em className="text-[#722F37]">O cuidado é nosso.</em></h2>
   <p className="mt-4 max-w-sm text-sm leading-relaxed text-neutral-500">Um espaço para reunir quem vocês amam e cuidar de cada detalhe do grande dia.</p>
   <div className="relative mt-7 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
    <Heart size={110} className="pointer-events-none absolute -bottom-8 -right-6 -rotate-12 text-neutral-900 opacity-[0.035]" aria-hidden="true" />
    <div className="relative flex items-center justify-between gap-3"><p className="text-xs font-semibold text-[#722F37]">{price.name}</p><Link href={plan === "essencial" ? "/contratar?plan=foreverPro" : "/contratar?plan=essencial"} className="text-[11px] text-neutral-500 underline underline-offset-4 hover:text-[#722F37]">Trocar plano</Link></div>
    <div className="relative mt-4 flex flex-wrap items-baseline gap-2"><strong className="text-3xl font-semibold tracking-tight">{price.formattedPrice}</strong><span className="text-xs text-neutral-400">pagamento único</span></div>
    <ul className="relative mt-5 space-y-2.5 border-t border-neutral-100 pt-4 text-xs text-neutral-600">{[plan === "essencial" ? "Até 50 convidados no evento" : "Convidados ilimitados", "Site personalizado e convites digitais", "Confirmações, recados e lista de presentes", ...(plan === "foreverPro" ? ["Mesas, equipe e controle de chegada"] : [])].map(item=><li key={item} className="flex items-start gap-2"><Check size={14} className="shrink-0 text-[#722F37]" aria-hidden="true" />{item}</li>)}</ul>
   </div>
   <ol aria-label="Etapas da contratação" className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-neutral-400">{["Sua conta","O casamento","Pagamento"].map((label,index)=><li key={label} aria-current={(!user && index === 0) || (!!user && index === 1) ? "step" : undefined} className={`flex items-center gap-1.5 ${(!user && index === 0) || (!!user && index === 1) ? "font-medium text-neutral-800" : ""}`}><span className="grid size-5 place-items-center rounded-full border border-current text-[10px]">{index+1}</span>{label}</li>)}</ol>
  </aside>}
  <section className="order-first self-start rounded-2xl lg:order-last border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
  <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">{confirmation ? "Sua contratação" : user ? "02 · O casamento" : "01 · Sua conta"}</p>
  <h1 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">{confirmed ? "Seu próximo capítulo começa aqui." : confirmation ? "Confirmando seu pagamento." : user ? "Vamos conhecer o casal?" : mode === "create" ? "Crie seu espaço na Forever." : "Que bom ter você de volta."}</h1>
  <p className="mt-3 text-sm leading-relaxed text-neutral-500">{confirmed ? "Seu plano foi ativado. Agora é hora de deixar tudo com a cara de vocês." : confirmation ? "A ativação acontece após a confirmação oficial do Stripe." : user ? "Falta pouco. Confirme os dados de vocês antes de continuar para o pagamento." : mode === "create" ? "Comece pela sua conta. Depois, vamos preparar o casamento de vocês." : "Entre para continuar sua contratação com tudo no mesmo lugar."}</p>
  {error && <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
  {!ready && <p role="status" className="mt-6 text-sm text-neutral-500">Verificando sua conta…</p>}
  {ready && !user && <PurchaseAccountForm mode={mode} onModeChange={next=>{setMode(next);setError("");}} busy={busy} onSubmit={authenticate} />}
  {user && !confirmation && <form onSubmit={checkout} className="mt-6 space-y-5"><RequiredFieldsNotice/>
   <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500"><span>Conta: {user.email}</span><button type="button" disabled={busy} onClick={()=>void signOut(clientAuth())} className="underline underline-offset-4">Usar outra conta</button></div>
   {loading ? <p role="status" className="text-sm text-neutral-500">Buscando seu casamento…</p> : <>
    {existing ? <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"><p className="text-sm font-medium">{existing.partner1} &amp; {existing.partner2}</p><p className="mt-2 text-xs leading-relaxed text-neutral-500">Finalize a contratação para liberar o mesmo casamento. Convites, configurações e confirmações continuam preservados.</p></div> : <div className="grid gap-4 sm:grid-cols-2">
     <label className="text-xs">Nome da primeira pessoa<RequiredMark/><input required maxLength={80} value={partner1} onChange={e=>{if(weddingAddress(e.target.value,partner2)!==automaticAddress){setSlug("");setShowAddress(false);}setPartner1(e.target.value);setError("");}} className={input} /></label>
     <label className="text-xs">Nome da segunda pessoa<RequiredMark/><input required maxLength={80} value={partner2} onChange={e=>{if(weddingAddress(partner1,e.target.value)!==automaticAddress){setSlug("");setShowAddress(false);}setPartner2(e.target.value);setError("");}} className={input} /></label>
     <div className="text-xs sm:col-span-2"><span className="font-medium text-neutral-700">Data do casamento<RequiredMark/></span><ForeverDatePicker label="Data do casamento" required value={date} onChange={value=>{setDate(value);setError("");}} min={new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date())} disabled={busy} /></div>
     {needsAddress && <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 sm:col-span-2">
      <p className="text-xs leading-relaxed text-neutral-600">{automaticAddress ? `O endereço ${automaticAddress} não está disponível. Escolham uma alternativa para o site de vocês.` : "Escolham um endereço para o site de vocês."}</p>
      <label htmlFor="wedding-address" className="mt-4 block text-xs font-medium text-neutral-700">Endereço do casamento<RequiredMark/></label>
      <input id="wedding-address" required pattern="[a-z0-9]+(-[a-z0-9]+)*" minLength={3} maxLength={80} placeholder="mari-e-lucas" value={slug} onChange={e=>{setSlug(e.target.value.toLowerCase().trim());setError("");}} aria-describedby="address-feedback" aria-invalid={addressCheck.value === candidate && (addressCheck.status === "taken" || addressCheck.status === "invalid")} className={input} />
      <p id="address-feedback" role="status" className="mt-2 text-xs text-neutral-500">{!slug ? "Use letras sem acentos, números e hífens." : addressCheck.value !== candidate || addressCheck.status === "checking" ? "Verificando disponibilidade…" : addressCheck.status === "available" ? "Disponível! Esse será o endereço do seu site." : addressCheck.status === "taken" ? "Esse endereço também está em uso. Tente outro." : addressCheck.status === "invalid" ? "Use de 3 a 80 caracteres: letras sem acentos, números e hífens. Não use nomes reservados." : "Não foi possível verificar agora."}</p>
     </div>}
     {addressCheck.status === "error" && addressCheck.value === candidate && <button type="button" onClick={()=>setAddressRetry(value=>value+1)} className="text-left text-xs text-[#722F37] underline sm:col-span-2">Tentar verificar o endereço novamente</button>}
    </div>}
    <div className="grid gap-3 sm:grid-cols-2">{(["essencial","foreverPro"] as const).map(key=><Link key={key} href={`/contratar?plan=${key}`} aria-current={plan === key ? "true" : undefined} className={`rounded-xl border p-4 ${plan === key ? "border-[#722F37] bg-[#722F3705]" : "border-neutral-200"}`}><p className="text-sm font-semibold">{PLAN_PRICING[key].name}</p><p className="mt-1 text-xs text-neutral-500">{key === "essencial" ? "Até 50 convidados" : "Convidados ilimitados e organização"}</p><p className="mt-3 text-lg font-semibold">{PLAN_PRICING[key].formattedPrice}<span className="ml-2 text-[10px] font-normal text-neutral-400">pagamento único</span></p></Link>)}</div>
    {params.get("cancelled") && <p className="text-xs text-neutral-500">O pagamento não foi concluído. Você pode continuar quando quiser.</p>}
    <button disabled={busy || loading || !!existing?.plan || (!existing && (!addressAvailable || (needsAddress && !slug)))} className={button}>{busy ? <Loader2 size={17} className="animate-spin" /> : <ArrowUpRight size={17} />}{busy ? "Preparando pagamento…" : `Continuar para pagamento · ${price.formattedPrice}`}</button><p className="flex items-center justify-center gap-2 text-xs text-neutral-500">Pagamento processado pela<Image src="/utils/logo_stripe.svg" width={48} height={20} alt="Stripe" className="h-5 w-auto" /></p>
   </>}
  </form>}
  {user && confirmation && <div className="mt-6 space-y-4">{confirmed ? <><p className="flex items-center gap-2 text-sm text-neutral-700"><Check size={18} className="text-[#722F37]" />{PLAN_PRICING[confirmed.plan].name} ativado</p><Link href={`/${confirmed.slug}/editar-site`} className={button}>Personalizar meu site<ArrowUpRight size={17} /></Link><Link href={`/${confirmed.slug}/convidados`} className="block rounded-xl border border-neutral-200 px-4 py-3 text-center text-sm">Adicionar meus convidados</Link><Link href={`/${confirmed.slug}/painel`} className="block text-center text-xs text-neutral-500 underline">Ir para o painel</Link></> : <><p role="status" className="flex items-center gap-2 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-600"><Loader2 size={18} className="shrink-0 animate-spin text-[#722F37]" />{!sessionId ? "Não encontramos a sessão deste pagamento." : paymentState === "expired" ? "Esta sessão de pagamento expirou." : paymentState === "failed" ? "O pagamento não foi aprovado. Volte à contratação para tentar novamente." : paymentState === "open" ? "O pagamento ainda não foi concluído. Volte à contratação para continuar." : "Aguardando confirmação. Não é necessário pagar novamente."}</p><button type="button" onClick={()=>window.location.reload()} className="text-sm text-[#722F37] underline">Consultar novamente</button><Link href="/contratar" className="block text-xs text-neutral-500 underline">Voltar à contratação</Link></>}</div>}
 </section></div><p className="mt-8 text-center text-[11px] text-neutral-400">Forever · Uma criação MAGUI.studio</p></div></main>;
}
