"use client";
import {BotanicalClassicTemplate} from "./templates/BotanicalClassicTemplate";
import {ContemporaryRomanceTemplate} from "./templates/ContemporaryRomanceTemplate";
import {MinimalistModernTemplate} from "./templates/MinimalistModernTemplate";
import {SereneBreezeTemplate} from "./templates/SereneBreezeTemplate";
import {useWedding} from "./WeddingProvider";
import {defaultTemplateId,type TemplateId} from "@/config/templates/registry";
const templates:Record<TemplateId,typeof BotanicalClassicTemplate>={"botanical-classic":BotanicalClassicTemplate,"contemporary-romance":ContemporaryRomanceTemplate,"minimalist-modern":MinimalistModernTemplate,"serene-breeze":SereneBreezeTemplate};
export function WeddingSite(){const {templateId}=useWedding();const Template=templates[templateId]??templates[defaultTemplateId];return <Template/>;}
