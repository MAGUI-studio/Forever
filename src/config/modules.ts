export const moduleKeys = [
  "guestList",
  "rsvp",
  "checkIn",
  "organization",
  "tables",
  "buffet",
  "history",
  "team",
  "dietaryRestrictions",
  "messages",
  "invitationTracking",
  "gifts",
  "siteEditor",
] as const;
export type WeddingModule = (typeof moduleKeys)[number];
export type WeddingModules = Record<WeddingModule, boolean>;
export const moduleCatalog: Record<
  WeddingModule,
  { label: string; description: string; requires: WeddingModule[] }
> = {
  guestList: {
    label: "Lista de convidados",
    description: "Cadastro e gerenciamento dos convites e pessoas.",
    requires: [],
  },
  rsvp: {
    label: "Confirmação de presença",
    description: "Resposta dos convidados pelo link do convite.",
    requires: ["guestList"],
  },
  checkIn: {
    label: "Controle de chegada",
    description: "Registro e cancelamento da chegada dos convidados.",
    requires: ["guestList"],
  },
  organization: {
    label: "Organização",
    description: "Habilita os recursos de organização disponíveis abaixo.",
    requires: [],
  },
  tables: {
    label: "Mesas e lugares",
    description: "Cadastro de mesas e distribuição dos convidados.",
    requires: ["organization", "guestList"],
  },
  buffet: {
    label: "Resumo para o buffet",
    description: "Consulta das necessidades alimentares dos confirmados.",
    requires: ["organization", "dietaryRestrictions"],
  },
  history: {
    label: "Histórico de alterações",
    description: "Consulta dos registros de alterações do casamento.",
    requires: ["organization"],
  },
  team: {
    label: "Equipe da recepção",
    description: "Criação e gerenciamento de contas de recepcionistas.",
    requires: ["organization", "checkIn"],
  },
  dietaryRestrictions: {
    label: "Restrição alimentar",
    description: "Campo no RSVP, alertas, legenda e detalhes alimentares.",
    requires: ["rsvp"],
  },
  messages: {
    label: "Recados aos noivos",
    description: "Campo de mensagem no RSVP e alertas no painel.",
    requires: ["rsvp"],
  },
  invitationTracking: {
    label: "Acompanhamento dos convites",
    description: "Envio, primeiro acesso e progresso das respostas.",
    requires: ["guestList"],
  },
  gifts: {
    label: "Lista de presentes",
    description: "Seção de presentes, Pix e pagamento por cartão.",
    requires: [],
  },
  siteEditor: {
    label: "Personalização do site",
    description: "Edição do conteúdo, fotos, tema e publicação.",
    requires: [],
  },
};
export const foreverProExclusiveModules: ReadonlySet<WeddingModule> = new Set<WeddingModule>([
  "checkIn",
  "organization",
  "tables",
  "buffet",
  "history",
  "team",
]);
export function resolveModules(
  _stored?: Partial<WeddingModules>,
  plan?: import("@/config/forever").WeddingPlan | null,
): WeddingModules {
  const result = Object.fromEntries(moduleKeys.map((key) => [key, true])) as WeddingModules;
  if (plan === null)
    return Object.fromEntries(moduleKeys.map((key) => [key, false])) as WeddingModules;
  if (plan === "essencial") {
    for (const key of foreverProExclusiveModules) result[key] = false;
  }
  for (let i = 0; i < moduleKeys.length; i++) {
    let changed = false;
    for (const key of moduleKeys) {
      if (result[key] && moduleCatalog[key].requires.some((parent) => !result[parent])) {
        result[key] = false;
        changed = true;
      }
    }
    if (!changed) break;
  }
  return result;
}
export const sectionModule: Record<string, WeddingModule | undefined> = {
  guests: "guestList",
  "check-in": "checkIn",
  tables: "tables",
  buffet: "buffet",
  history: "history",
  team: "team",
  site: "siteEditor",
  "site-settings": "siteEditor",
  "editor-preview": "siteEditor",
  preview: "siteEditor",
};
export function redactModuleData<T>(value: T, modules: WeddingModules): T {
  const hidden = new Set<string>();
  if (!modules.dietaryRestrictions) hidden.add("dietaryRestrictions");
  if (!modules.messages) hidden.add("message");
  if (!modules.invitationTracking)
    for (const key of ["sentAt", "openedAt", "personalOpenedAt"]) hidden.add(key);
  function redact(item: unknown): unknown {
    if (Array.isArray(item)) return item.map(redact);
    if (item && typeof item === "object") {
      const entries: [string, unknown][] = [];
      for (const [key, child] of Object.entries(item)) {
        if (!hidden.has(key)) entries.push([key, redact(child)]);
      }
      return Object.fromEntries(entries);
    }
    return item;
  }
  return redact(value) as T;
}
