import {resolveDressCodeStyle} from "../dress-code";
import type {DressCodeStyle} from "@/types/wedding";
import {galleryCopyFields} from "./gallery-copy";
import fields from "./copy-fields.json";
import {romanceFields} from "./romance-copy";
import {proFields} from "./pro-copy";
import type {WeddingModule} from "@/config/modules";
export const templateIds=["botanical-classic","contemporary-romance","minimalist-modern","serene-breeze"] as const;
export type TemplateId=(typeof templateIds)[number];
export const defaultTemplateId:TemplateId="botanical-classic";
export const foreverTemplateId:TemplateId="contemporary-romance";
export const templateCatalog=[
  {
    id: defaultTemplateId,
    name: "Botânico clássico",
    description: "Elegância atemporal e delicadeza floral para celebrar uma história de amor com leveza.",
    image: "/detalhes/aliancas-florais.jpg",
    plan: "essencial" as const,
  },
  {
    id: foreverTemplateId,
    name: "Romance contemporâneo",
    description: "Sua história em destaque, com fotos marcantes e detalhes que unem romance e personalidade.",
    image: "/forever/icon_black.svg",
    plan: "essencial" as const,
  },
  {
    id: "minimalist-modern",
    name: "Minimalista moderno",
    description: "Preto, branco e dourado com tipografia elegante e design contemporâneo.",
    image: "/forever/icon_black.svg",
    plan: "foreverPro" as const,
  },
  {
    id: "serene-breeze",
    isComingSoon: true,
    name: "Brisa serena",
    description: "Tons de azul e linho à beira-mar com atmosfera calma, fresca e poética.",
    image: "/forever/icon_black.svg",
    plan: "foreverPro" as const,
  },
] as const;
export function isTemplateAvailable(id:TemplateId){return templateCatalog.some(template=>template.id===id&&!("isComingSoon" in template&&template.isComingSoon));}
export type CopySection="gallery"|"hero"|"countdown"|"story"|"transition"|"events"|"schedule"|"dressCode"|"gifts"|"rsvp"|"checkout"|"footer";
export const copySections:Record<CopySection,{label:string;anchor:string;module?:WeddingModule}>={gallery:{label:"Galeria do casal",anchor:"galeria"},schedule:{label:"Programação do dia",anchor:"programacao"},hero:{label:"Capa",anchor:"inicio"},countdown:{label:"Contagem regressiva",anchor:"contagem-regressiva"},story:{label:"Nossa história",anchor:"historia"},transition:{label:"O nosso para sempre",anchor:".cinema-transition"},events:{label:"Cerimônia e festa",anchor:"eventos"},dressCode:{label:"Trajes",anchor:"dress-code"},gifts:{label:"Lista de presentes",anchor:"presentes",module:"gifts"},rsvp:{label:"Confirmação de presença",anchor:"rsvp",module:"rsvp"},checkout:{label:"Pagamento dos presentes",anchor:"pagamento-presente",module:"gifts"},footer:{label:"Rodapé",anchor:".cinema-footer"}};
const allCopyFields=[...fields,...romanceFields,...galleryCopyFields,...proFields] as {key:string;section:CopySection;label:string;defaultValue:string;module?:WeddingModule}[];
export const copyDefaults:Record<string,string>=Object.fromEntries(allCopyFields.map(field=>[field.key,field.defaultValue]));
const editableRsvpKeys = new Set(["rsvp.text1", "rsvp.text4"]);
const unusedGiftKeys = new Set(["gifts.text1","gifts.text7","gifts.text8","gifts.text9","gifts.text10","gifts.text11","gifts.text12","gifts.text13","gifts.text15","gifts.text16","gifts.text18","gifts.text19"]);
const fixedActionKeys = new Set(["footer.text3", "checkout.text19", "checkout.text20", "checkout.text21"]);
export const fixedCopyKeys = new Set(allCopyFields.filter(field=>
  !/[\p{L}\p{N}]/u.test(field.defaultValue) ||
  field.section === "checkout" ||
  (field.section === "rsvp" && !editableRsvpKeys.has(field.key)) ||
  field.label === "Texto do botão" || field.label === "Descrição acessível" ||
  field.label === "Unidade do contador" || field.key === "countdown.text1" ||
  fixedActionKeys.has(field.key) || unusedGiftKeys.has(field.key)
).map(field=>field.key));
export const copyFields=allCopyFields.filter(field=>!fixedCopyKeys.has(field.key)&&field.key!=="hero.text5"&&!["dressCode.text2","dressCode.text3","gifts.text3","gifts.text4","story.text6","story.text7","story.text8"].includes(field.key));
export function siteCopy(copy:Record<string,string>|undefined,key:string,templateId:TemplateId=defaultTemplateId){const defaults=templateCopyDefaults(templateId);if(key==="gifts.heading"&&copy?.[key]===undefined)return (copy?.["gifts.text3"]??copyDefaults["gifts.text3"])+(copy?.["gifts.text4"]??copyDefaults["gifts.text4"]);if(key==="dressCode.heading"&&copy?.[key]===undefined)return (copy?.["dressCode.text2"]??copyDefaults["dressCode.text2"])+(copy?.["dressCode.text3"]??copyDefaults["dressCode.text3"]);return fixedCopyKeys.has(key)?copyDefaults[key]:(copy?.[key]??defaults[key]??"");}

export const templateSections:Record<TemplateId,CopySection[]>={
 "minimalist-modern":["hero","countdown","story","events","gallery","dressCode","gifts","rsvp","footer"],
 "serene-breeze":["hero","countdown","story","events","gallery","dressCode","gifts","rsvp","footer"],
 "botanical-classic":["hero","story","transition","events","gallery","dressCode","gifts","rsvp","footer"],
 "contemporary-romance":["hero","countdown","story","gallery","events","dressCode","gifts","schedule","rsvp","footer"],
};
export function templateCopyFields(id:TemplateId,dressCodeStyle?:DressCodeStyle){
 const style=resolveDressCodeStyle({dressCodeStyle},id);
 const common=copyFields.filter(field=>field.section!=="dressCode").filter(field=>id==="minimalist-modern"||id==="serene-breeze"?field.key.startsWith("pro.")||["gifts","rsvp","footer"].includes(field.section):id==="contemporary-romance"?field.key.startsWith("romance.")||["rsvp.text1","rsvp.text4"].includes(field.key):!field.key.startsWith("romance.")&&!field.key.startsWith("pro."));
 const dress=copyFields.filter(field=>field.section==="dressCode"&&(style==="botanical"?field.key.startsWith("dressCode."):field.key==="pro.dress.eyebrow"));
 return [...common,...dress];
}
export function templateCopyDefaults(id:TemplateId):Record<string,string>{return {...copyDefaults,...(id==="serene-breeze"?{"pro.hero.eyebrow":"Com a leveza de um encontro, para a vida inteira","pro.events.title":"Onde o amor encontra o horizonte","pro.gallery.title":"Marés de boas memórias"}:{}),...(id==="contemporary-romance"?{"rsvp.text1":"Você faz parte desse dia","rsvp.text4":"Estamos contando os dias para celebrar ao seu lado. Confirme sua presença com o código do seu convite."}:{})};}
/** Keep authored text, replace inherited defaults, and fill missing destination fields. */
export function switchTemplateCopy(copy:Record<string,string>|undefined,from:TemplateId,to:TemplateId){
 const source=templateCopyDefaults(from),destination=templateCopyDefaults(to),next={...copy};
 for(const field of templateCopyFields(to))if(!next[field.key]?.trim()||next[field.key]===source[field.key])next[field.key]=destination[field.key];
 return next;
}
