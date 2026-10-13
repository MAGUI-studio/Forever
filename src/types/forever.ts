import type {WeddingConfig} from "./wedding";
export type WeddingStatus = "draft" | "published" | "suspended" | "archived";
export type WeddingTheme = "botanical" | "rose" | "ocean";
export interface WeddingDocument {siteRevision?:number;siteDraft?:{config:WeddingConfig;templateId:import("@/config/templates/registry").TemplateId;baseRevision:number;updatedAt:string}|null;templateId?:import("@/config/templates/registry").TemplateId;modules?:Partial<import("@/config/modules").WeddingModules>;slug:string; status:WeddingStatus; config:WeddingConfig; theme:WeddingTheme; createdAt:string; updatedAt:string;}
