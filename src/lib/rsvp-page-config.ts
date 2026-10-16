import type { WeddingConfig } from "@/types/wedding";
export function rsvpPageConfig(config: WeddingConfig): WeddingConfig {
  return {
    ...config,
    couple: { ...config.couple, story: undefined },
    gallery: [],
    gifts: [],
    customImages: {},
    copy:
      config.copy &&
      Object.fromEntries(Object.entries(config.copy).filter(([key]) => key.startsWith("rsvp."))),
  };
}
