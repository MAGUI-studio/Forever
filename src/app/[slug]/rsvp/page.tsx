import type { Metadata } from "next";
import { RSVPSection } from "@/components/wedding/RSVPSection";
export const metadata: Metadata = {
  title: "Confirmar presença | casamento",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
import {PublicWedding} from "@/components/wedding/PublicWedding";
export const dynamic="force-dynamic";
export default async function RSVPPage({params}:{params:Promise<{slug:string}>}) {
 const {slug}=await params;
  return (
    <PublicWedding slug={slug} requiredModule="rsvp"><main>
      <RSVPSection />
    </main></PublicWedding>
  );
}
