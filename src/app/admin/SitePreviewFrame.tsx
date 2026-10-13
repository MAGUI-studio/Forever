"use client";
import {useEffect,useState} from "react";
import {onAuthStateChanged} from "firebase/auth";
import {clientAuth} from "@/lib/firebase/client";
import {readApiResponse} from "@/lib/api-response";
import {useWedding,WeddingProvider} from "@/components/wedding/WeddingProvider";
import {WeddingSite} from "@/components/wedding/WeddingSite";
import {weddingConfigSchema} from "@/lib/wedding-schema";
import {templateIds,copySections,type CopySection,type TemplateId} from "@/config/templates/registry";
import type {WeddingConfig} from "@/types/wedding";
import {resolveModules} from "@/config/modules";
import type {WeddingModules} from "@/config/modules";
import type {WeddingTheme} from "@/types/forever";
export function SitePreviewFrame(){const {slug}=useWedding();const [session,setSession]=useState<{modules:Partial<WeddingModules>;theme:WeddingTheme}|null>(null),[draft,setDraft]=useState<{config:WeddingConfig;templateId:TemplateId}|null>(null),[error,setError]=useState("");
 useEffect(()=>{let active=true;const unsubscribe=onAuthStateChanged(clientAuth(),async user=>{if(!user){setError("Entre no painel para visualizar o site.");return;}try{const data=await readApiResponse(await fetch("/api/admin/session",{headers:{Authorization:"Bearer "+await user.getIdToken(),"x-wedding-slug":slug}}));if(data.role!=="admin"||!resolveModules(data.wedding.modules).siteEditor)throw Error("Acesso exclusivo da administração.");if(active){setSession({modules:data.wedding.modules??{},theme:data.wedding.theme});}}catch(e){if(active)setError((e as Error).message);}});return ()=>{active=false;unsubscribe();};},[slug]);
 useEffect(()=>{if(!session)return;function message(event:MessageEvent){if(event.origin!==window.location.origin||event.source!==window.parent||event.data?.slug!==slug)return;if(event.data.type==="forever:preview-update"){const config=weddingConfigSchema.safeParse(event.data.config);if(config.success&&templateIds.includes(event.data.templateId))setDraft({config:config.data,templateId:event.data.templateId});}if(event.data.type==="forever:preview-scroll"){const target=String(event.data.anchor??"");if(!/^[a-zA-Z0-9.#_-]+$/.test(target))return;document.querySelector(target.startsWith(".")?target:"#"+target)?.scrollIntoView({behavior:"smooth",block:"start"});}}
 function select(event:MouseEvent){const element=event.target instanceof Element?event.target:null;const section=element?.closest("section[id],footer,.cinema-transition");if(section){const anchor=section.id||(section.tagName==="FOOTER"?".cinema-footer":".cinema-transition");window.parent.postMessage({type:"forever:preview-select",slug,anchor},window.location.origin);}const link=element?.closest("a");if(link&&!link.getAttribute("href")?.startsWith("#"))event.preventDefault();}
 function submit(event:Event){event.preventDefault();event.stopImmediatePropagation();}
 window.addEventListener("message",message);document.addEventListener("click",select,true);document.addEventListener("submit",submit,true);window.parent.postMessage({type:"forever:preview-ready",slug},window.location.origin);return ()=>{window.removeEventListener("message",message);document.removeEventListener("click",select,true);document.removeEventListener("submit",submit,true);};},[session,slug]);
 const hasDraft=!!draft;
 useEffect(()=>{window.scrollTo({top:0,behavior:"instant"});},[draft?.templateId]);
 useEffect(()=>{
  if(!hasDraft||!session)return;
  let frame=0,lastSection="",until=0;
  const selectors=Object.entries(copySections).map(([key,value])=>({key:key as CopySection,selector:value.anchor.startsWith(".")?value.anchor:"#"+value.anchor}));
  function measure(){
   frame=0;
   const x=window.innerWidth/2,y=window.innerHeight*.45;
   const visible=document.elementsFromPoint(x,y);
   let active:CopySection|undefined;
   for(const element of visible){
    const closest=element.closest(selectors.map(item=>item.selector).join(","));
    const match=closest?selectors.find(item=>closest.matches(item.selector)):undefined;
    if(match){active=match.key;break;}
   }
   if(active&&active!==lastSection){lastSection=active;window.parent.postMessage({type:"forever:preview-select",slug,section:active},window.location.origin);}
   if(performance.now()<until)frame=requestAnimationFrame(measure);
  }
  function schedule(){until=performance.now()+1200;if(!frame)frame=requestAnimationFrame(measure);}
  window.addEventListener("scroll",schedule,{passive:true});window.addEventListener("resize",schedule);document.addEventListener("click",schedule);
  schedule();
  return ()=>{cancelAnimationFrame(frame);window.removeEventListener("scroll",schedule);window.removeEventListener("resize",schedule);document.removeEventListener("click",schedule);};
 },[hasDraft,session,slug]);
 if(error)return <p role="alert" className="p-6 text-sm text-red-700">{error}</p>;if(!draft||!session)return <p role="status" className="p-6 text-sm text-[#5D613C]">Preparando a prévia…</p>;return <WeddingProvider slug={slug} config={draft.config} templateId={draft.templateId} theme={session.theme} modules={session.modules} preview><WeddingSite/></WeddingProvider>;
}
