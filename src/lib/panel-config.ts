import type { WeddingConfig } from "@/types/wedding";
import type { PanelSection } from "./panel-data";
export function panelConfig(config: WeddingConfig, section: PanelSection): WeddingConfig {
  if (section === "guests" || section === "site") return config;
  return {
    ...config,
    couple: { ...config.couple, story: undefined },
    gallery: [],
    gifts: [],
    customImages: {},
    copy: undefined,
  };
}
