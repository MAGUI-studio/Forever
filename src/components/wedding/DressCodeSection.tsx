"use client";

import { useWedding } from "./WeddingProvider";
import { resolveDressCodeStyle } from "@/config/dress-code";
import { DressCode } from "./DressCode";
import { MinimalistDressCode } from "./templates/MinimalistDressCode";
import "./templates/pro-templates.css";

export function DressCodeSection() {
  const { config, templateId } = useWedding();
  const style = resolveDressCodeStyle(config, templateId);
  return (
    <div className="dress-style-host" data-dress-style={style}>
      {style === "botanical" ? <DressCode /> : <MinimalistDressCode />}
    </div>
  );
}
