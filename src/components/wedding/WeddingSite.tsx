"use client";
import {BotanicalClassicTemplate} from "./templates/BotanicalClassicTemplate";
import {ContemporaryRomanceTemplate} from "./templates/ContemporaryRomanceTemplate";
import {useWedding} from "./WeddingProvider";
import {defaultTemplateId,type TemplateId} from "@/config/templates/registry";
const templates:Record<TemplateId,typeof BotanicalClassicTemplate>={"botanical-classic":BotanicalClassicTemplate,"contemporary-romance":ContemporaryRomanceTemplate};
export function WeddingSite(){const {templateId}=useWedding();const Template=templates[templateId]??templates[defaultTemplateId];return <Template/>;}
