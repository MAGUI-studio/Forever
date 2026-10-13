"use client";

import type { ComponentType } from "react";
import type { TemplateId } from "@/config/templates/registry";
import type { TemplateOrnamentsProps } from "./ornament-types";
import { BotanicalClassicOrnaments, BotanicalClassicBranch } from "./BotanicalClassicOrnaments";

type TemplateVisuals = {
  Ornaments: ComponentType<TemplateOrnamentsProps>;
  Accent: ComponentType;
};

/** Each new template must provide its own background and decorative accent. */
export const templateVisuals: Record<TemplateId, TemplateVisuals> = {
  "botanical-classic": {
    Ornaments: BotanicalClassicOrnaments,
    Accent: BotanicalClassicBranch,
  },
};
