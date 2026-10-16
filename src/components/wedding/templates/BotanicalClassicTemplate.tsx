"use client";
import { StoryEnvelope } from "../StoryEnvelope";
import { DressCodeSection as DressCode } from "../DressCodeSection";
import { GiftList } from "../GiftList";
import { RSVPSection } from "../RSVPSection";
import { Footer } from "../Footer";
import { CinematicExperience } from "../CinematicExperience";
import { useWedding } from "../WeddingProvider";
import { BotanicalClassicGallery } from "./BotanicalClassicGallery";
import { galleryEnabled } from "@/config/gallery";
export function BotanicalClassicTemplate() {
  const { config, modules } = useWedding();
  return (
    <main className="relative w-full overflow-x-hidden bg-[var(--forever-paper,#F1F1F1)]">
      <CinematicExperience>
        <StoryEnvelope />
        {galleryEnabled(config) && <BotanicalClassicGallery />}
        <DressCode />
        {modules.gifts && <GiftList />}
        {modules.rsvp && <RSVPSection />}
        <Footer />
      </CinematicExperience>
    </main>
  );
}
