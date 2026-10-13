"use client";
import { useOptionalWedding } from "./WeddingProvider";
import { defaultTemplateId } from "@/config/templates/registry";
import { templateVisuals } from "./templates/visual-registry";
import type { TemplateOrnamentsProps } from "./templates/ornament-types";

/** Public pages, admin pages, dialogs and loaders share the selected template artwork. */
export function WeddingOrnaments(props: TemplateOrnamentsProps) {
  const wedding = useOptionalWedding();
  const Ornaments = templateVisuals[wedding?.templateId ?? defaultTemplateId].Ornaments;
  return <Ornaments {...props} />;
}

export function WeddingBranch() {
  const wedding = useOptionalWedding();
  const Accent = templateVisuals[wedding?.templateId ?? defaultTemplateId].Accent;
  return <Accent />;
}

export function WeddingLoadingIcon() {
  const wedding=useOptionalWedding();
  const Icon=templateVisuals[wedding?.templateId??defaultTemplateId].LoadingIcon;
  return <Icon/>;
}
