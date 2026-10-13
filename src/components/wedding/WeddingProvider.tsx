"use client";
import {resolveModules,type WeddingModules} from "@/config/modules";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
  type CSSProperties,
} from "react";
import { emptyWeddingConfig, weddingPath } from "@/config/forever";
import type { WeddingConfig } from "@/types/wedding";
import type { WeddingTheme } from "@/types/forever";
const themes = {
  botanical: {
    primary: "#5D613C",
    ink: "#3D2501",
    accent: "#80654E",
    sand: "#C7B79D",
    paper: "#F1F1F1",
  },
  rose: {
    primary: "#8B5263",
    ink: "#412B35",
    accent: "#986E79",
    sand: "#D4B1B9",
    paper: "#FAF3F5",
  },
  ocean: {
    primary: "#3D6870",
    ink: "#233B43",
    accent: "#637D86",
    sand: "#AFC5C7",
    paper: "#F1F6F7",
  },
};
const WeddingContext = createContext<{
  slug: string;
  modules:WeddingModules;
  setModules:(modules:Partial<WeddingModules>)=>void;
  config: WeddingConfig;
  setConfig: (config: WeddingConfig) => void;
  setTheme: (theme: WeddingTheme) => void;
  themeStyle: CSSProperties;
  path: (path?: string) => string;
} | null>(null);
export function WeddingProvider({
  slug,
  config = emptyWeddingConfig,
  theme = "botanical",
  modules,
  children,
}: {
  slug: string;
  config?: WeddingConfig;
  theme?: WeddingTheme;
  modules?:Partial<WeddingModules>;
  children: ReactNode;
}) {
  const [enabledModules,updateModules]=useState(()=>resolveModules(modules));
  const setModules=useCallback((value:Partial<WeddingModules>)=>updateModules(resolveModules(value)),[]);
  const [current, setConfig] = useState(config);
  const [currentTheme, setTheme] = useState(theme);
  const path=useCallback((path="")=>weddingPath(slug,path),[slug]);
  const colors = themes[currentTheme];
  const themeStyle = {
    "--forever-primary": colors.primary,
    "--forever-ink": colors.ink,
    "--forever-accent": colors.accent,
    "--forever-sand": colors.sand,
    "--forever-paper": colors.paper,
  } as CSSProperties;
  return (
    <WeddingContext.Provider
      value={{
        slug,
        modules:enabledModules,setModules,
        config: current,
        setConfig,
        setTheme,
        themeStyle,
        path,
      }}
    >
      <div style={themeStyle}>{children}</div>
    </WeddingContext.Provider>
  );
}
export function useWedding() {
  const context = useContext(WeddingContext);
  if (!context) throw new Error("WeddingProvider is required");
  return context;
}

export function useOptionalWedding() {
  return useContext(WeddingContext);
}
