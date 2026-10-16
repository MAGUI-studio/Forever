import type { WeddingConfig } from "@/types/wedding";
import { templateCopyDefaults, templateCopyFields, type TemplateId } from "./templates/registry";

export const EXAMPLE_PAYMENT_LINK = "https://example.com/sua-lista-de-presentes";

export function initializeTemplateConfig(
  base: WeddingConfig,
  templateId: TemplateId,
): WeddingConfig {
  const next = structuredClone(base),
    defaults = templateCopyDefaults(templateId);
  next.copy = {
    ...Object.fromEntries(
      templateCopyFields(templateId, next.dressCodeStyle).map((field) => [
        field.key,
        defaults[field.key],
      ]),
    ),
    ...next.copy,
  };
  return next;
}
