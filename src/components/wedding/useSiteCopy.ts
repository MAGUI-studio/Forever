"use client";
import { useCallback } from "react";
import { useWedding } from "./WeddingProvider";
import { siteCopy } from "@/config/templates/registry";
export function useSiteCopy() {
  const { config, templateId } = useWedding();
  return useCallback(
    (key: string) => siteCopy(config.copy, key, templateId),
    [config.copy, templateId],
  );
}
