"use client";

import type { ComponentType } from "react";
import type { TemplateId } from "@/config/templates/registry";
import type { TemplateOrnamentsProps } from "./ornament-types";
import {MinimalOrnaments,MinimalAccent,BreezeOrnaments,BreezeAccent} from "./ProTemplateSections";
import { BotanicalClassicOrnaments, BotanicalClassicBranch, BotanicalClassicLoadingIcon } from "./BotanicalClassicOrnaments";
import { ContemporaryRomanceOrnaments, ContemporaryRomanceAccent, ContemporaryRomanceLoadingIcon } from "./ContemporaryRomanceOrnaments";

type TemplateVisuals = {
  Ornaments: ComponentType<TemplateOrnamentsProps>;
  Accent: ComponentType;
  LoadingIcon: ComponentType;
};

/** Each new template must provide its own background and decorative accent. */
export const templateVisuals: Record<TemplateId, TemplateVisuals> = {
  "minimalist-modern": {Ornaments:MinimalOrnaments,Accent:MinimalAccent,LoadingIcon:MinimalAccent},
  "serene-breeze": {Ornaments:BreezeOrnaments,Accent:BreezeAccent,LoadingIcon:BreezeAccent},
  "contemporary-romance": {
    Ornaments: ContemporaryRomanceOrnaments,
    Accent: ContemporaryRomanceAccent,
    LoadingIcon: ContemporaryRomanceLoadingIcon,
  },
  "botanical-classic": {
    Ornaments: BotanicalClassicOrnaments,
    Accent: BotanicalClassicBranch,
    LoadingIcon: BotanicalClassicLoadingIcon,
  },
};
