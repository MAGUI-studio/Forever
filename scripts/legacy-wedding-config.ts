import giftCatalog from "../src/config/gifts.json";
import { WeddingConfig } from "@/types/wedding";
const photosWithPeople = new Set([
  "https://gift-media.lejour.com.br/9a917f53-1486-422c-af2d-8dfa2e2341ef.jpeg",
  "https://gift-media.lejour.com.br/d2c33d6e-236a-4d2e-8b50-4dd859dfecd6.jpeg",
  "https://gift-media.lejour.com.br/7b8c8352-cd9f-460d-8765-d0d4832bf9bb.jpeg",
  "https://gift-media.lejour.com.br/sanduicheira-eletrica.png",
]);
function safeGiftImage(url: string) {
  return photosWithPeople.has(url) ? "/detalhes/aliancas-florais.jpg" : url;
}

export const weddingConfig: WeddingConfig = {
  couple: {
    partner1: "Giovanna",
    partner2: "Edson",
    headline: "Deus uniu nossos caminhos e sob sua benção\nuniremos nossas vidas para sempre!",
    weddingDate: "2027-05-29T11:30:00-03:00",
    locationSummary: "São José dos Campos - SP",
    hashtag: "#CasamentoGiovannaeEdson",
    coverImage: "/casal/festa-de-casamento.png",
    story: {
      enabled: true,
      sinceYear:2016,
      moments:["O encontro · 2016","Uma vida construída juntos","O nosso grande sim · 2027"],
      title: "Do primeiro encontro ao nosso grande ‘sim’.",
      text: [
        "Nossa história começou em 2016, quando a vida nos colocou no mesmo caminho. Desde então, entre encontros, desafios, conquistas e muitos momentos compartilhados, fomos construindo uma vida juntos.",
        "Hoje, depois de tantos capítulos vividos lado a lado, chegamos ao momento de celebrar o nosso amor e dizer, mais uma vez, sim um ao outro.",
        "E agora, diante das pessoas que amamos, damos início ao capítulo mais bonito da nossa história: o nosso para sempre.",
      ],
      image: "/casal/aliancas-que-selam-nossa-promessa.png",
    },
  },

  gallery: [
    { id: "1", url: "/detalhes/praia.jpg", caption: "Luz suave à beira-mar", aspect: "wide" },
    { id: "2", url: "/casal/cerimonia-religiosa.png", caption: "Flores e mesa posta", aspect: "tall" },
    { id: "3", url: "/casal/aliancas-que-selam-nossa-promessa.png", caption: "Alianças para o nosso para sempre", aspect: "tall" },
    { id: "4", url: "/detalhes/mesa.jpg", caption: "Detalhes de uma celebração", aspect: "wide" },
    { id: "5", url: "/detalhes/flores.jpg", caption: "Flores e delicadeza", aspect: "square" },
    { id: "6", url: "/detalhes/aliancas-florais.jpg", caption: "Símbolos do nosso amor", aspect: "square" },
    { id: "7", url: "/casal/festa-de-casamento.png", caption: "Um jardim para celebrar", aspect: "tall" },
    { id: "8", url: "/detalhes/paisagem.jpg", caption: "A beleza dos novos caminhos", aspect: "wide" },
    { id: "9", url: "/detalhes/cafe.jpg", caption: "Pequenos prazeres a dois", aspect: "square" },
    { id: "10", url: "/detalhes/drinks.jpg", caption: "Cores para a celebração", aspect: "square" },
    { id: "11", url: "/detalhes/brinde.jpg", caption: "Um brinde ao nosso sim", aspect: "wide" },
    { id: "12", url: "/casal/festa-de-casamento.png", caption: "Flores e luz para o grande dia", aspect: "tall" },
  ],
  ceremony: {
    title: "Cerimônia", subtitle: "Nosso grande ‘sim’", time: "11h30",
    placeName: "Quintal & Cia", address: "Rua dos Marceneiros, 210 - Jardim Valparaíba",
    cityState: "São José dos Campos - SP",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Quintal+e+Cia+Rua+dos+Marceneiros+210+Jardim+Valparaiba+Sao+Jose+dos+Campos",
    wazeUrl: "https://waze.com/ul?q=Rua%20dos%20Marceneiros%20210%20Sao%20Jose%20dos%20Campos&navigate=yes",
    websiteUrl:"https://www.instagram.com/quintal_sjc/",
    image: "/utils/quintal-e-cia/quintal-e-cia-wp.webp", tips: "A cerimônia e a recepção acontecerão no mesmo local.",
  },
  party: {
    image: "/casal/festa-de-casamento.png", title: "Recepção", subtitle: "Após a cerimônia", time: "Após a cerimônia",
    placeName: "Quintal & Cia", address: "Rua dos Marceneiros, 210 - Jardim Valparaíba",
    cityState: "São José dos Campos - SP",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Quintal+e+Cia+Rua+dos+Marceneiros+210",
  },

  dressCode: {
    title: "Guia de Trajes & Dress Code",
    description: "A paleta da nossa celebração, inspirada na natureza.",
    palette: [
      { name: "Areia Dourada & Linho", hex: "#C7B79D" },
      { name: "Terracota & Marrom Quente", hex: "#80654E" },
      { name: "Café Profundo & Madeira", hex: "#3D2501" },
      { name: "Verde Oliva Botânico", hex: "#5D613C" },
      { name: "Marfim Suave & Baunilha", hex: "#F5F5DA" },
      { name: "Alabastro / Off-White", hex: "#F1F1F1" },
    ],
    dos: [], donts: [],
    gallery: [],
  },

  gifts: giftCatalog.map((item, index) => ({
    id: String(index + 1), title: item.name, category: item.category,
    categoryLabel: item.category, image: safeGiftImage(item.url),
  })),
  pix: {
    key: "",
    keyType: "email",
    receiverName: "Giovanna e Edson",
    city: "SAO JOSE DOS CAMPOS",
    whatsappConfirmationPhone: "",
  },

  creditCard: {
    enabled: true,
    defaultPaymentLink: "",
    providerName: "Mercado Pago",
    installmentsInfo: "Parcelamento conforme as condições do checkout.",
  },

  rsvp: {
    googleAppsScriptUrl:
      "",

    contactWhatsApp: "",
  },
};
