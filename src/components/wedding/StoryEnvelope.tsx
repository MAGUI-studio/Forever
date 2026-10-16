"use client";

import { Hero } from "./Hero";
import { Story } from "./Story";
import { CinematicTransition } from "./CinematicTransition";
import { Events } from "./Events";

export function StoryEnvelope() {
  return (
    <div className="relative bg-[var(--page-background,#F1F1F1)]">
      <Hero />
      <Story />
      <div className="relative overflow-hidden rounded-b-[2.5rem] bg-[#5D613C] sm:rounded-b-[4rem]">
        <CinematicTransition />
        <Events />
      </div>
    </div>
  );
}
