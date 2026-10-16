import type { CopySection } from "./registry";

export const contentFields: {
  key: string;
  section: CopySection;
  label: string;
  defaultValue: string;
}[] = [
  {
    key: "events.separateIntro",
    section: "events",
    label: "Introdução para locais diferentes",
    defaultValue: "Dois lugares especiais para celebrar o nosso grande dia.",
  },
  {
    key: "events.ceremonyDescription",
    section: "events",
    label: "Descrição da cerimônia",
    defaultValue: "O lugar onde vamos dizer o nosso sim.",
  },
  {
    key: "events.partyDescription",
    section: "events",
    label: "Descrição da festa",
    defaultValue: "Depois da cerimônia, esperamos você aqui para continuar a celebração.",
  },
  {
    key: "events.ceremonyLabel",
    section: "events",
    label: "Título do local da cerimônia",
    defaultValue: "Cerimônia",
  },
  {
    key: "events.partyLabel",
    section: "events",
    label: "Título do local da festa",
    defaultValue: "Festa e recepção",
  },
  {
    key: "events.combinedLabel",
    section: "events",
    label: "Título do local único",
    defaultValue: "Cerimônia & celebração",
  },
  {
    key: "events.afterCeremony",
    section: "events",
    label: "Horário quando não informado",
    defaultValue: "Após a cerimônia",
  },
  {
    key: "events.ceremonyStart",
    section: "events",
    label: "Legenda do horário da cerimônia",
    defaultValue: "Início da cerimônia",
  },
  {
    key: "events.partyStart",
    section: "events",
    label: "Legenda do horário da festa",
    defaultValue: "Início da festa",
  },
  {
    key: "pro.story.since",
    section: "story",
    label: "Texto antes do ano do primeiro encontro",
    defaultValue: "Juntos desde",
  },
  {
    key: "romance.story.since",
    section: "story",
    label: "Texto antes do ano do primeiro encontro",
    defaultValue: "Desde",
  },
  {
    key: "pro.dress.label",
    section: "dressCode",
    label: "Legenda dos trajes",
    defaultValue: "Dress code",
  },
  {
    key: "pro.dress.dosTitle",
    section: "dressCode",
    label: "Título das recomendações",
    defaultValue: "Para aproveitar o dia",
  },
  {
    key: "pro.dress.dontsTitle",
    section: "dressCode",
    label: "Título dos pedidos",
    defaultValue: "Com carinho, pedimos",
  },
  {
    key: "pro.dress.paletteTitle",
    section: "dressCode",
    label: "Título da paleta",
    defaultValue: "Cores para inspirar o seu look",
  },
  {
    key: "dressCode.color1Hex",
    section: "dressCode",
    label: "Cor do primeiro desenho",
    defaultValue: "#FFFFFF",
  },
  {
    key: "dressCode.color2Hex",
    section: "dressCode",
    label: "Cor do segundo desenho",
    defaultValue: "#80654E",
  },
  {
    key: "gifts.emptyMessage",
    section: "gifts",
    label: "Mensagem quando a lista está vazia",
    defaultValue:
      "A lista de presentes ainda está vazia. Em breve os noivos poderão compartilhar suas escolhas por aqui.",
  },
  {
    key: "romance.countdown.arrived",
    section: "countdown",
    label: "Mensagem ao chegar a data",
    defaultValue: "O nosso grande dia chegou",
  },
];
