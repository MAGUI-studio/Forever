"use client";
import {useSiteCopy} from "./useSiteCopy";

import { WeddingOrnaments } from "./WeddingOrnaments";
import {useWedding} from "./WeddingProvider";


export function Story() {
  const copy=useSiteCopy();
  const {config:weddingConfig,path}=useWedding();
  const story = weddingConfig.couple.story;
  const moments=story?.moments??[copy("story.text6"),copy("story.text7"),copy("story.text8")];
  if (!story?.enabled) return null;
  return (
    <section id="historia" aria-label={copy("story.text1")} className="cinematic-section relative overflow-hidden z-10 bg-[#F1F1F1] text-[#3D2501] px-6 sm:px-12 lg:px-20 py-24 sm:py-28">
      <WeddingOrnaments variant="floral" tone="paper" />
      <div data-story-content className="relative z-10 max-w-5xl mx-auto text-center">
        <p className="cinema-eyebrow text-[#80654E]">{copy("story.text2")}<span className="mx-3 text-[#C7B79D]">{copy("story.text3")}</span> {story.sinceYear ? copy("story.text9")+story.sinceYear : copy("story.text10")}</p>
        <h2 className="font-serif font-light text-[clamp(2.8rem,4.7vw,5rem)] leading-[1.06] tracking-[-0.04em] text-balance max-w-4xl mx-auto mt-7">{story.title}</h2>
        <div data-story-panels className="grid gap-16 mt-10 sm:mt-12">
          {story.text.map((paragraph, index) => (
            <div key={index} data-story-panel className="max-w-4xl mx-auto w-full space-y-5 self-center">
              <p className="text-[10px] uppercase tracking-[0.23em] text-[#5D613C]">{moments[index]}</p>
              <p className="font-serif text-2xl sm:text-3xl lg:text-[1.9rem] font-light leading-[1.55] tracking-[-0.01em]">{paragraph}</p>
            </div>
          ))}
        </div>
        <p className="font-serif italic text-2xl sm:text-3xl text-[#5D613C] mt-10">{copy("story.text4")}</p>
      </div>
    </section>
  );
}