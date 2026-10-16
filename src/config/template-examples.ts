import type { WeddingConfig } from "@/types/wedding";
import { templateCopyDefaults, templateCopyFields, type TemplateId } from "./templates/registry";
import { templateImageDefaults } from "@/lib/template-images";

export const EXAMPLE_PAYMENT_LINK="https://example.com/sua-lista-de-presentes";

/** Seed a template once. Never use this as a fallback for intentionally deleted content. */
export function templateExampleConfig(base:WeddingConfig,templateId:TemplateId):WeddingConfig {
  const next=structuredClone(base);
  if(templateId==="minimalist-modern"||templateId==="serene-breeze")return next;
  const names=`${next.couple.partner1} e ${next.couple.partner2}`;
  const defaults=templateCopyDefaults(templateId);
  next.copy={...Object.fromEntries(templateCopyFields(templateId).map(field=>[field.key,defaults[field.key]])),...next.copy};
  next.couple={...next.couple,
    weddingDate:next.couple.weddingDate || `${new Date().getFullYear()+1}-05-29T16:00:00-03:00`,
    locationSummary:next.couple.locationSummary || "Sua cidade — UF",
    hashtag:next.couple.hashtag || `#${names.replace(/[^\p{L}\p{N}]/gu,"")}`,
    headline:next.couple.headline || "Um encontro, uma escolha e uma vida inteira para celebrar.",
    story:{enabled:true,title:"Como tudo começou",text:["Nossa história começou com uma conversa sem pressa, daquelas que fazem o tempo passar diferente. Aos poucos, os encontros viraram rotina, os planos passaram a ser compartilhados e descobrimos que a vida ficava mais bonita quando estávamos juntos.","Entre viagens, descobertas e pequenos momentos do dia a dia, construímos uma parceria feita de carinho, respeito e muitas risadas. Agora, queremos celebrar esse novo capítulo com as pessoas que sempre fizeram parte da nossa história."],moments:["O começo de tudo","Uma vida lado a lado"],sinceYear:new Date().getFullYear()-5,image:templateImageDefaults[templateId].story || "/detalhes/aliancas-florais.jpg",...next.couple.story},
  };
  // Empty starter arrays need examples; existing authored paragraphs always win.
  if(!next.couple.story!.text.length)next.couple.story!.text=["Tudo começou com um encontro inesperado e uma conversa que não queríamos que terminasse. Desde então, colecionamos momentos, aprendemos a caminhar juntos e descobrimos no outro o nosso lugar favorito.","Agora, chegou a hora de dizer sim para uma vida inteira. Ter vocês ao nosso lado torna esse dia ainda mais especial. Obrigado por fazerem parte da nossa história!"];
  next.couple.story!.enabled=true;
  next.gallery=next.gallery.length ? next.gallery : [
    {id:"example-gallery-1",url:"/casal/festa-de-casamento.png",caption:"Um dos nossos dias favoritos",aspect:"wide"},
    {id:"example-gallery-2",url:"/casal/aliancas-que-selam-nossa-promessa.png",caption:"O início de um novo capítulo",aspect:"square"},
    {id:"example-gallery-3",url:"/casal/cerimonia-religiosa.png",caption:"Memórias para guardar para sempre",aspect:"tall"},
  ];
  const location=(current:WeddingConfig["ceremony"],party=false)=>({...current,time:current.time || (party ? "18h00" : "16h00"),placeName:current.placeName || (party ? "Salão da Celebração (exemplo)" : "Espaço do Nosso Sim (exemplo)"),address:current.address || "Rua das Flores, 123 — Jardim Primavera (exemplo)",cityState:current.cityState || "Sua cidade — UF",googleMapsUrl:current.googleMapsUrl || "https://example.com/mapa-do-local",websiteUrl:current.websiteUrl || "https://example.com/site-do-local",wazeUrl:current.wazeUrl || "https://example.com/rota-para-o-local",uberUrl:current.uberUrl || "https://example.com/transporte",tips:current.tips || "Chegue com 30 minutos de antecedência para encontrar seu lugar com tranquilidade. O espaço conta com estacionamento. Atualize estas orientações com as informações do seu local."});
  next.ceremony=location(next.ceremony);
  next.party=location(next.party,true);
  next.gifts=next.gifts.length ? next.gifts : [
    {id:"example-gift-1",title:"Um jantar especial a dois",category:"Experiências",categoryLabel:"Experiências",price:180,image:"/detalhes/mesa.jpg",description:"Para brindar o começo da nossa vida de casados com uma noite cheia de boas memórias.",featured:true},
    {id:"example-gift-2",title:"Café da manhã de recém-casados",category:"Casa nova",categoryLabel:"Casa nova",price:100,image:"/detalhes/cafe.jpg",description:"Uma contribuição para os pequenos rituais que tornam a nossa casa um lar."},
    {id:"example-gift-3",title:"Um passeio na lua de mel",category:"Lua de mel",categoryLabel:"Lua de mel",price:250,image:"/detalhes/praia.jpg",description:"Uma nova descoberta para a nossa coleção de viagens e histórias juntos."},
  ];
  next.giftPaymentLink=next.giftPaymentLink || EXAMPLE_PAYMENT_LINK;
  next.pix={...next.pix,key:next.pix.key || "seu-pix@example.com",receiverName:next.pix.receiverName || names,city:next.pix.city || "Sua cidade"};
  next.creditCard={...next.creditCard,enabled:next.creditCard?.enabled ?? false,defaultPaymentLink:next.creditCard?.defaultPaymentLink || EXAMPLE_PAYMENT_LINK,providerName:next.creditCard?.providerName || "Seu provedor de pagamento",installmentsInfo:next.creditCard?.installmentsInfo || "Consulte as condições disponíveis no link de pagamento."};
  next.ui={...next.ui,primaryColorName:next.ui?.primaryColorName || "Vermelho Forever"};
  return next;
}

export function isUnconfiguredTemplate(config:WeddingConfig):boolean {
  return !config.ceremony.placeName && !config.party.placeName && !config.gallery.length && !config.gifts.length && !config.couple.story?.text.length;
}
