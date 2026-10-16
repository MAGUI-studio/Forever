import { z } from "zod";
import { isPlanExpired } from "@/config/plan-access";
import { emptyWeddingConfig } from "@/config/forever";
import { initializeTemplateConfig } from "@/config/template-examples";
import { foreverTemplateId, type TemplateId } from "@/config/templates/registry";

export const weddingRegistrationFields = {
  partner1: z.string().trim().min(1, "Informe o nome da primeira pessoa.").max(80),
  partner2: z.string().trim().min(1, "Informe o nome da segunda pessoa.").max(80),
  weddingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data do casamento.").refine(value => {
    const date = new Date(value + "T12:00:00-03:00");
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value && !isPlanExpired({plan:"essencial",config:{couple:{weddingDate:value}}});
  }, "Informe uma data válida para o evento, a partir de hoje."),
};

export function initialWeddingConfig(data: {partner1:string;partner2:string;weddingDate:string}, templateId: TemplateId = foreverTemplateId) {
  return initializeTemplateConfig({...emptyWeddingConfig,couple:{...emptyWeddingConfig.couple,...data,weddingDate:data.weddingDate+"T12:00:00-03:00"}}, templateId);
}
