"use client";
import {resolveModules} from "@/config/modules";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";
import {
  WeddingProvider,
  useWedding,
} from "@/components/wedding/WeddingProvider";
import { WeddingSite } from "@/components/wedding/WeddingSite";
import { readApiResponse } from "@/lib/api-response";
import type { WeddingDocument } from "@/types/forever";
import Link from "next/link";
export function WeddingPreview() {
  const { slug, path } = useWedding();
  const [wedding, setWedding] = useState<WeddingDocument | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    return onAuthStateChanged(clientAuth(), async (user) => {
      if (!user) {
        setError("Entre no painel para visualizar o rascunho.");
        return;
      }
      try {
        const data = await readApiResponse(
          await fetch("/api/admin/session", {
            headers: {
              Authorization: "Bearer " + (await user.getIdToken()),
              "x-wedding-slug": slug,
            },
          }),
        );
        if (data.role !== "admin"||!resolveModules(data.wedding.modules).siteEditor)
          throw Error("Acesso exclusivo da administração.");
        setWedding(data.wedding);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }, [slug]);
  return (
    <>
      <div className="sticky top-0 z-40 flex items-center justify-between gap-4 bg-white p-4 text-sm text-[#5D613C]">
        <span>Prévia privada do conteúdo salvo</span>
        <Link href={path("admin/site")}>Voltar à edição</Link>
      </div>
      {error ? (
        <p role="alert" className="p-6 text-red-700">
          {error}
        </p>
      ) : wedding ? (
        <WeddingProvider
          slug={slug}
          config={wedding.config}
          templateId={wedding.templateId}
          theme={wedding.theme} modules={wedding.modules}
        >
          <WeddingSite />
        </WeddingProvider>
      ) : (
        <p role="status" className="p-6">
          Preparando prévia…
        </p>
      )}
    </>
  );
}
