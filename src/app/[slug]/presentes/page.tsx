import type { Metadata } from "next";
import { ScrollToTopOnMount } from "@/components/wedding/ScrollToTopOnMount";


import { GiftList } from "@/components/wedding/GiftList";
import { Footer } from "@/components/wedding/Footer";
import { CinematicExperience } from "@/components/wedding/CinematicExperience";

export const metadata: Metadata = {
  title: "Lista de presentes | casamento",
  description: "Confira a lista completa de presentes de casamento.",
};

import {PublicWedding} from "@/components/wedding/PublicWedding";
export const dynamic="force-dynamic";
export default async function GiftsPage({params}:{params:Promise<{slug:string}>}) {
 const {slug}=await params;
  return (
    <PublicWedding slug={slug} requiredModule="gifts"><main className="w-full bg-[var(--forever-paper,#F1F1F1)] overflow-x-hidden relative">
      <ScrollToTopOnMount />
      <CinematicExperience>
        <h1 className="sr-only">Lista de presentes</h1>
        <GiftList />
        <Footer />
      </CinematicExperience>
    </main></PublicWedding>
  );
}