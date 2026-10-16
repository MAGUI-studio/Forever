"use client";
import { synchronizeWeddingSettings } from "@/lib/wedding-settings";
import { templatePalettes, weddingThemeStyle } from "@/config/templates/theme";
import { defaultTemplateId, type TemplateId } from "@/config/templates/registry";
import { resolveModules, type WeddingModules } from "@/config/modules";
import {
  createContext,
  useContext,
  useState,
  useMemo,
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
    paper: "#F1F1F1",
  },
  ocean: {
    primary: "#3D6870",
    ink: "#233B43",
    accent: "#637D86",
    sand: "#AFC5C7",
    paper: "#F1F1F1",
  },
};
const WeddingContext = createContext<{
  slug: string;
  templateId: TemplateId;
  setTemplateId: (id: TemplateId) => void;
  preview: boolean;
  modules: WeddingModules;
  setModules: (modules: Partial<WeddingModules>) => void;
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
  templateId = defaultTemplateId,
  preview = false,
  children,
}: {
  slug: string;
  config?: WeddingConfig;
  theme?: WeddingTheme;
  modules?: Partial<WeddingModules>;
  templateId?: TemplateId;
  preview?: boolean;
  children: ReactNode;
}) {
  const [enabledModules, updateModules] = useState(() => ({ ...resolveModules(), ...modules }));
  const setModules = useCallback(
    (value: Partial<WeddingModules>) => updateModules({ ...resolveModules(), ...value }),
    [],
  );
  const [selectedTemplate, setTemplateId] = useState(templateId);
  const [current, setConfig] = useState(config);
  const [currentTheme, setTheme] = useState(theme);
  const path = useCallback((path = "") => weddingPath(slug, path), [slug]);
  const effectiveConfig = useMemo(
    () => synchronizeWeddingSettings(preview ? config : current),
    [preview, config, current],
  );
  const activeTemplate = preview ? templateId : selectedTemplate;
  const themeStyle = useMemo(() => {
    const colors =
      activeTemplate !== "botanical-classic"
        ? templatePalettes[activeTemplate]
        : {
            ...themes[currentTheme],
            hover:
              currentTheme === "botanical"
                ? "#4b4f30"
                : `color-mix(in srgb, ${themes[currentTheme].primary} 80%, black)`,
          };
    return weddingThemeStyle(colors);
  }, [activeTemplate, currentTheme]);
  const value = useMemo(
    () => ({
      slug,
      modules: enabledModules,
      setModules,
      config: effectiveConfig,
      templateId: activeTemplate,
      setTemplateId,
      preview,
      setConfig,
      setTheme,
      themeStyle,
      path,
    }),
    [slug, enabledModules, setModules, effectiveConfig, activeTemplate, preview, themeStyle, path],
  );
  return (
    <WeddingContext.Provider value={value}>
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
