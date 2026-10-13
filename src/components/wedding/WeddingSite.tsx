"use client";
import { StoryEnvelope } from "./StoryEnvelope";
import { DressCode } from "./DressCode";
import { GiftList } from "./GiftList";
import { RSVPSection } from "./RSVPSection";
import { Footer } from "./Footer";
import { CinematicExperience } from "./CinematicExperience";
import { useWedding } from "./WeddingProvider";
export function WeddingSite() {
  const { config } = useWedding();
  return (
    <main className="relative w-full overflow-x-hidden bg-[var(--forever-paper,#F1F1F1)]">
      <CinematicExperience>
        <StoryEnvelope />
        {config.sections?.dressCode !== false && <DressCode />}
        {config.sections?.gifts !== false && <GiftList preview />}
        {config.sections?.rsvp !== false && <RSVPSection />}
        <Footer />
      </CinematicExperience>
    </main>
  );
}
