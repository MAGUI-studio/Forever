import fields from "./copy-fields.json";
import type {WeddingModule} from "@/config/modules";
export const templateIds=["botanical-classic"] as const;
export type TemplateId=(typeof templateIds)[number];
export const defaultTemplateId:TemplateId="botanical-classic";
export const templateCatalog=[{id:defaultTemplateId,name:"Botânico clássico",description:"O design atual: tipografia elegante, ramos e flores, tons de oliva e transições suaves.",image:"/detalhes/aliancas-florais.jpg"}] as const;
export type CopySection="hero"|"countdown"|"story"|"transition"|"events"|"dressCode"|"gifts"|"rsvp"|"checkout"|"footer";
export const copySections:Record<CopySection,{label:string;anchor:string;module?:WeddingModule}>={hero:{label:"Capa",anchor:"inicio"},countdown:{label:"Contagem regressiva",anchor:"contagem-regressiva"},story:{label:"Nossa história",anchor:"historia"},transition:{label:"O nosso para sempre",anchor:".cinema-transition"},events:{label:"Cerimônia e festa",anchor:"eventos"},dressCode:{label:"Trajes",anchor:"dress-code"},gifts:{label:"Lista de presentes",anchor:"presentes",module:"gifts"},rsvp:{label:"Confirmação de presença",anchor:"rsvp",module:"rsvp"},checkout:{label:"Pagamento dos presentes",anchor:"pagamento-presente",module:"gifts"},footer:{label:"Rodapé",anchor:".cinema-footer"}};
const allCopyFields=fields as {key:string;section:CopySection;label:string;defaultValue:string;module?:WeddingModule}[];
export const copyDefaults:Record<string,string>=Object.fromEntries(allCopyFields.map(field=>[field.key,field.defaultValue]));
const editableRsvpKeys = new Set(["rsvp.text1", "rsvp.text4"]);
const unusedGiftKeys = new Set(["gifts.text1","gifts.text7","gifts.text8","gifts.text9","gifts.text10","gifts.text11","gifts.text12","gifts.text13","gifts.text15","gifts.text16","gifts.text18","gifts.text19"]);
const fixedActionKeys = new Set(["footer.text3", "checkout.text19", "checkout.text20", "checkout.text21"]);
export const fixedCopyKeys = new Set(allCopyFields.filter(field=>
  !/[\p{L}\p{N}]/u.test(field.defaultValue) ||
  field.section === "checkout" ||
  (field.section === "rsvp" && !editableRsvpKeys.has(field.key)) ||
  field.label === "Texto do botão" || field.label === "Descrição acessível" ||
  fixedActionKeys.has(field.key) || unusedGiftKeys.has(field.key)
).map(field=>field.key));
export const copyFields=allCopyFields.filter(field=>!fixedCopyKeys.has(field.key)&&field.key!=="hero.text5"&&!["dressCode.text2","dressCode.text3","gifts.text3","gifts.text4"].includes(field.key));
export function siteCopy(copy:Record<string,string>|undefined,key:string){if(key==="gifts.heading"&&copy?.[key]===undefined)return (copy?.["gifts.text3"]??copyDefaults["gifts.text3"])+(copy?.["gifts.text4"]??copyDefaults["gifts.text4"]);if(key==="dressCode.heading"&&copy?.[key]===undefined)return (copy?.["dressCode.text2"]??copyDefaults["dressCode.text2"])+(copy?.["dressCode.text3"]??copyDefaults["dressCode.text3"]);return fixedCopyKeys.has(key)?copyDefaults[key]:(copy?.[key]??copyDefaults[key]??"");}
