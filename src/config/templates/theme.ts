import type {CSSProperties} from "react";
import type {TemplateId} from "./registry";

type Palette={primary:string;ink:string;accent:string;sand:string;hover:string};
export const templatePalettes:Record<string,Palette>={
 "botanical-classic":{primary:"#5D613C",ink:"#3D2501",accent:"#80654E",sand:"#C7B79D",hover:"#4b4f30"},
 "contemporary-romance":{primary:"#722F37",ink:"#302329",accent:"#82656C",sand:"#D2B9BD",hover:"#5B252C"},
 "minimalist-modern":{primary:"#161616",ink:"#161616",accent:"#8B6B35",sand:"#D8C29A",hover:"#333333"},
 "serene-breeze":{primary:"#1E2D4A",ink:"#101A2B",accent:"#457B9D",sand:"#A8DADC",hover:"#162238"},
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
