import type {WeddingConfig} from "./wedding";
import type {WeddingPlan} from "@/config/forever";
export type WeddingStatus = "draft" | "published" | "suspended" | "archived";
export type WeddingTheme = "botanical" | "rose" | "ocean";
export type {WeddingPlan};
export interface WeddingDocument {
  plan?: WeddingPlan;
  siteRevision?: number;
  siteDraft?: {
    config: WeddingConfig;
    templateId: import("@/config/templates/registry").TemplateId;
    baseRevision: number;
    updatedAt: string;
  } | null;
  templateId?: import("@/config/templates/registry").TemplateId;
  modules?: Partial<import("@/config/modules").WeddingModules>;
  slug: string;
  status: WeddingStatus;
  config: WeddingConfig;
  theme: WeddingTheme;
  createdAt: string;
  updatedAt: string;
}
