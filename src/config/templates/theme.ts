import type {CSSProperties} from "react";
import type {TemplateId} from "./registry";

type Palette={primary:string;ink:string;accent:string;sand:string;hover:string};
export const templatePalettes:Record<TemplateId,Palette>={
 "botanical-classic":{primary:"#5D613C",ink:"#3D2501",accent:"#80654E",sand:"#C7B79D",hover:"#4b4f30"},
 "contemporary-romance":{primary:"#722F37",ink:"#302329",accent:"#82656C",sand:"#D2B9BD",hover:"#5B252C"},
};
export function weddingThemeStyle(colors:Palette):CSSProperties{
 return {
  "--forever-primary":colors.primary,
  "--forever-primary-hover":colors.hover,
  "--forever-ink":colors.ink,
  "--forever-accent":colors.accent,
  "--forever-sand":colors.sand,
  "--forever-paper":"var(--page-background, #F1F1F1)",
  "--forever-hover-tint":`color-mix(in srgb, ${colors.primary} 7%, transparent)`,
  "--forever-hover-border":`color-mix(in srgb, ${colors.primary} 40%, transparent)`,
  "--forever-focus":colors.primary,
 } as CSSProperties;
}
