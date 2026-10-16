"use client";
import { useSiteCopy } from "./useSiteCopy";
import { WeddingOrnaments } from "./WeddingOrnaments";
import { useWedding } from "./WeddingProvider";

export function Story() {
  const copy = useSiteCopy();
  const { config } = useWedding();
  const story = config.couple.story;
  const moments = story?.moments ?? [copy("story.text6"), copy("story.text7"), copy("story.text8")];
  if (!story) return null;

  return (
    <section
      data-cinema-static
      id="historia"
      aria-label={copy("story.text1")}
      className="cinematic-section relative z-10 overflow-hidden bg-[var(--page-background,#F1F1F1)] px-6 py-20 text-[#3D2501] sm:px-12 sm:py-28 lg:px-20"
    >
      <WeddingOrnaments variant="floral" tone="paper" disableMotion />
      <div data-story-content className="relative z-10 mx-auto max-w-5xl">
        <header className="mx-auto max-w-3xl text-center">
          <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[10px] uppercase tracking-[0.2em] text-[#80654E]">
            <span>{copy("story.text2")}</span>
            <span aria-hidden="true" className="text-[#C7B79D]">
              {copy("story.text3")}
            </span>
            <span>
              {story.sinceYear ? copy("story.text9") + story.sinceYear : copy("story.text10")}
            </span>
          </p>
          <h2 className="mt-6 text-balance font-serif text-[clamp(2.6rem,4.7vw,4.5rem)] font-light leading-[1.1] tracking-[-0.035em]">
            {story.title}
          </h2>
        </header>
        <ol data-story-panels className="mt-12 space-y-10 sm:mt-16 sm:space-y-12">
          {story.text.map((paragraph, index) => (
            <li
              key={index}
              data-story-panel
              className="grid gap-5 md:grid-cols-[minmax(0,0.65fr)_minmax(0,1.65fr)] md:gap-12"
            >
              <div className="flex items-baseline gap-4 md:gap-5">
                <span
                  aria-hidden="true"
                  className="shrink-0 font-serif text-3xl font-light italic text-[#A8997F]"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                {moments[index] && (
                  <h3 className="font-serif text-2xl font-normal leading-snug text-[#5D613C] sm:text-[1.7rem]">
                    {moments[index]}
                  </h3>
                )}
              </div>
              <p className="max-w-[62ch] whitespace-pre-line font-serif text-xl font-normal leading-[1.8] text-[#544833] sm:text-[1.4rem]">
                {paragraph}
              </p>
            </li>
          ))}
        </ol>
        <p className="mx-auto mt-14 max-w-2xl text-balance text-center font-serif text-2xl italic leading-relaxed text-[#5D613C] sm:mt-16 sm:text-3xl">
          {copy("story.text4")}
        </p>
      </div>
    </section>
  );
}
