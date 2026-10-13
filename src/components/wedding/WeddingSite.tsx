"use client";
import {BotanicalClassicTemplate} from "./templates/BotanicalClassicTemplate";
import {useWedding} from "./WeddingProvider";
import {defaultTemplateId,type TemplateId} from "@/config/templates/registry";
const templates:Record<TemplateId,typeof BotanicalClassicTemplate>={"botanical-classic":BotanicalClassicTemplate};
export function WeddingSite(){const {templateId}=useWedding();const Template=templates[templateId]??templates[defaultTemplateId];return <Template/>;}
