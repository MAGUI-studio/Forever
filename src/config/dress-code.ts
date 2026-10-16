import type { DressCodeStyle, WeddingConfig } from "@/types/wedding";
import type { TemplateId } from "./templates/registry";

export const dressCodeStyleIds = ["botanical", "minimalist"] as const;
export const dressCodeStyles: { value: DressCodeStyle; label: string; description: string }[] = [
  {
    value: "botanical",
    label: "Traços elegantes",
    description: "Ilustrações em SVG dos trajes e orientações do modelo clássico.",
  },
  {
    value: "minimalist",
    label: "Noite de gala",
    description: "Foto de fundo, tipografia em destaque e paleta em formas geométricas.",
  },
];
export function resolveDressCodeStyle(
  config: Pick<WeddingConfig, "dressCodeStyle">,
  templateId: TemplateId,
): DressCodeStyle {
  if (config.dressCodeStyle && dressCodeStyleIds.includes(config.dressCodeStyle))
    return config.dressCodeStyle;
  return templateId === "botanical-classic" || templateId === "contemporary-romance"
    ? "botanical"
    : "minimalist";
}
