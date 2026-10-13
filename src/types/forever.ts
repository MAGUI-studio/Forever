import type {WeddingConfig} from "./wedding";
export type WeddingStatus = "draft" | "published" | "suspended" | "archived";
export type WeddingTheme = "botanical" | "rose" | "ocean";
export interface WeddingDocument {modules?:Partial<import("@/config/modules").WeddingModules>;slug:string; status:WeddingStatus; config:WeddingConfig; theme:WeddingTheme; createdAt:string; updatedAt:string;}
