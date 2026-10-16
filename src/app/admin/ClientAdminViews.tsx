"use client";

import dynamic from "next/dynamic";
const loading = () => (
  <div role="status" aria-live="polite" className="flex min-h-svh items-center justify-center bg-[#F1F1F1] px-6 text-sm text-[#722F37]">
    Carregando seu espaço…
  </div>
);

// Private interactive views load their data after Firebase authentication.
// Rendering their loading state on the Worker needlessly loads all editor modules.
export const AdminPanel = dynamic(
  () => import("./panel").then(module => module.AdminPanel),
  { ssr: false, loading },
);
export const WeddingPreview = dynamic(
  () => import("./WeddingPreview").then(module => module.WeddingPreview),
  { ssr: false, loading },
);
export const SitePreviewFrame = dynamic(
  () => import("./SitePreviewFrame").then(module => module.SitePreviewFrame),
  { ssr: false, loading },
);
