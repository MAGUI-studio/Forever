"use client";
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";
import { readApiResponse } from "@/lib/api-response";
import { useWedding, WeddingProvider } from "@/components/wedding/WeddingProvider";
import { WeddingSite } from "@/components/wedding/WeddingSite";
import { AdminLoading } from "./AdminLoading";
import { weddingConfigSchema } from "@/lib/wedding-schema";
import {
  copySections,
  templateSections,
  templateIds,
  type CopySection,
  type TemplateId,
} from "@/config/templates/registry";
import type { WeddingConfig } from "@/types/wedding";
import { resolveModules } from "@/config/modules";
import type { WeddingModules } from "@/config/modules";
import type { WeddingTheme } from "@/types/forever";
export function SitePreviewFrame() {
  const { slug } = useWedding();
  const initialSection = useRef<CopySection | null>(null);
  const [session, setSession] = useState<{
      modules: Partial<WeddingModules>;
      theme: WeddingTheme;
    } | null>(null),
    [draft, setDraft] = useState<{ config: WeddingConfig; templateId: TemplateId } | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(clientAuth(), async (user) => {
      if (!user) {
        setError("Entre no painel para visualizar o site.");
        return;
      }
      try {
        const data = await readApiResponse(
          await fetch("/api/admin/session?preview=frame", {
            headers: {
              Authorization: "Bearer " + (await user.getIdToken()),
              "x-wedding-slug": slug,
            },
          }),
        );
        if (
          data.role !== "admin" ||
          !resolveModules(data.wedding.modules, data.wedding.plan).siteEditor
        )
          throw Error("Acesso exclusivo da administração.");
        if (active) {
          setSession({
            modules: resolveModules(data.wedding.modules, data.wedding.plan),
            theme: data.wedding.theme,
          });
        }
      } catch (e) {
        if (active) setError((e as Error).message);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [slug]);
  useEffect(() => {
    if (!session) return;
    function message(event: MessageEvent) {
      if (
        event.origin !== window.location.origin ||
        event.source !== window.parent ||
        event.data?.slug !== slug
      )
        return;
      if (event.data.type === "forever:preview-update") {
        const config = weddingConfigSchema.safeParse(event.data.config);
        if (config.success && templateIds.includes(event.data.templateId)) {
          const templateId = event.data.templateId as TemplateId;
          if (templateSections[templateId].includes(event.data.section))
            initialSection.current = event.data.section;
          setDraft({ config: config.data, templateId });
        }
      }
    }

    function submit(event: Event) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    window.addEventListener("message", message);
    document.addEventListener("submit", submit, true);
    window.parent.postMessage({ type: "forever:preview-ready", slug }, window.location.origin);
    return () => {
      window.removeEventListener("message", message);
      document.removeEventListener("submit", submit, true);
    };
  }, [session, slug]);
  useEffect(() => {
    if (!draft?.templateId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    void document.fonts.ready.then(() => {
      if (cancelled) return;
      timer = setTimeout(() => {
        if (cancelled) return;
        const section = initialSection.current;
        initialSection.current = null;
        const anchor = section ? copySections[section].anchor : null;
        const target = anchor
          ? anchor.startsWith(".")
            ? document.querySelector(anchor)
            : document.getElementById(anchor)
          : null;
        if (target) target.scrollIntoView({ block: "start", behavior: "instant" });
        else window.scrollTo({ top: 0, behavior: "instant" });
      }, 250);
    });
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [draft?.templateId]);
  if (error)
    return (
      <p role="alert" className="p-6 text-sm text-red-700">
        {error}
      </p>
    );
  if (!draft || !session)
    return <AdminLoading description="Preparando seu site para visualização…" />;
  return (
    <WeddingProvider
      slug={slug}
      config={draft.config}
      templateId={draft.templateId}
      theme={session.theme}
      modules={session.modules}
      preview
    >
      <WeddingSite />
    </WeddingProvider>
  );
}
