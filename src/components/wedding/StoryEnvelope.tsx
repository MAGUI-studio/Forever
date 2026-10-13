"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useWedding } from "./WeddingProvider";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Hero } from "./Hero";
import { Story } from "./Story";
import { CinematicTransition } from "./CinematicTransition";
import { Events } from "./Events";

export function StoryEnvelope() {
  const {config} = useWedding();
  const panelCount = config.couple.story?.text?.length ?? 0;
  const root = useRef<HTMLDivElement>(null);
  const topPath = useRef<SVGPathElement>(null);
  const bottomPath = useRef<SVGPathElement>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    let disposed = false;
    media.add({ desktop: "(min-width: 1024px) and (min-height: 800px)", reduced: "(prefers-reduced-motion: reduce)" }, context => {
      if (context.conditions?.reduced) return;
      const hero = root.current?.querySelector<HTMLElement>("#inicio");
      const story = root.current?.querySelector<HTMLElement>("#historia");
      const bottom = root.current?.querySelector<HTMLElement>(".cinema-transition");
      const bottomGroup = root.current?.querySelector<HTMLElement>("[data-envelope-bottom]");
      const content = root.current?.querySelector<HTMLElement>("[data-story-content]");
      const panels = gsap.utils.toArray<HTMLElement>("[data-story-panel]", root.current);
      if (!hero || !story || !bottom || !bottomGroup || !content || !root.current) return;

      if (!context.conditions?.desktop) {
        panels.forEach(panel => gsap.from(panel, { y: 30, opacity: 0, duration: 1.2, scrollTrigger: { trigger: panel, start: "top 88%", once: true } }));
        return;
      }

      gsap.set(story, { paddingTop: 32, paddingBottom: 32, display: "flex", flexDirection: "column", justifyContent: "center" });
      gsap.set("[data-story-panels]", { gap: 0 });
      gsap.set(panels, { gridArea: "1 / 1", opacity: 0, y: 25 });
      gsap.set(panels[0], { opacity: 1, y: 0 });
      gsap.set(hero, { zIndex: 20, clipPath: "url(#envelope-real-top)" });
      gsap.set("[data-envelope-edge], [data-envelope-top-edge]", { opacity: 0 });

      gsap.set(bottomGroup, { zIndex: 30, clipPath: "url(#envelope-real-bottom)" });

      const edge = () => hero.querySelector<HTMLElement>("[data-envelope-edge]")?.getBoundingClientRect().height ?? 112;
      const initialBottomY = () => window.innerHeight - 2 * edge() - story.getBoundingClientRect().height;
      const closingDistance = () => (window.innerHeight - edge()) / 2;
      const updatePaths = () => {
        // Center the story within the actual opening between the two animated edges.
        gsap.set(story, { height: Math.max(window.innerHeight - 2 * edge(), content.scrollHeight + 64) });
        const h = edge() / hero.getBoundingClientRect().height;
        const b = edge() / bottomGroup.getBoundingClientRect().height;
        const y = (value: number) => 1 - h + h * value;
        topPath.current?.setAttribute("d", `M 0,0 L 1,0 L 1,1 C .88,1 .86,${y(.08)} .71,${y(.08)} C .61,${y(.08)} .54,${y(.48)} .5,${y(.76)} C .46,${y(.48)} .39,${y(.08)} .29,${y(.08)} C .14,${y(.08)} .12,1 0,1 Z`);
        bottomPath.current?.setAttribute("d", `M 0,${b} C .12,${b} .14,${b * .08} .29,${b * .08} C .39,${b * .08} .46,${b * .48} .5,${b * .76} C .54,${b * .48} .61,${b * .08} .71,${b * .08} C .86,${b * .08} .88,${b} 1,${b} L 1,1.01 L 0,1.01 Z`);
      };
      updatePaths();

      const timeline = gsap.timeline({ scrollTrigger: {
        trigger: root.current,
        start: () => `top top-=${hero.getBoundingClientRect().height - edge()}`,
        end: "+=2400",
        pin: true,
        scrub: 0.8,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onRefresh: updatePaths,
        onUpdate: trigger => {
          // Keep the pin's reserved space aligned with the moving venue section.
          const container = root.current;
          const spacer = container?.parentElement;
          if (!container || !spacer?.classList.contains("pin-spacer")) return;
          const bottomOffset = parseFloat(gsap.getProperty(bottomGroup, "y") as string) || 0;
          const height = hero.offsetHeight + story.offsetHeight + bottomGroup.offsetHeight + bottomOffset;
          container.style.height = `${height}px`;
          spacer.style.height = `${height + trigger.end - trigger.start}px`;
        },
      } });
      timeline.fromTo(bottomGroup, { y: initialBottomY }, { y: initialBottomY, duration: 1, ease: "none" }, 0);
      panels.slice(1).forEach((panel, index) => {
        const at = 1 + index * 2;
        timeline.to(panels[index], { opacity: 0, y: -25, filter: "blur(3px)", duration: 0.5 }, at)
          .fromTo(panel, { opacity: 0, y: 25, filter: "blur(3px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7 }, at + .35)
          .to({}, { duration: 1 });
      });
      const closing = timeline.duration() + .6;
      timeline.to(content, { opacity: 0, y: -15, duration: .8 }, closing)
        .fromTo(hero, { y: 0 }, { y: closingDistance, duration: 1.8, ease: "power2.inOut" }, closing)
        .to(bottomGroup, { y: () => initialBottomY() - closingDistance() - 2, duration: 1.8, ease: "power2.inOut" }, closing)
        .fromTo(bottomGroup, { marginBottom: initialBottomY }, { marginBottom: () => initialBottomY() - closingDistance() - 2, duration: 1.8, ease: "power2.inOut" }, closing)
        .to({}, { duration: .5 });
    }, root);
    document.fonts.ready.then(() => { if (!disposed) ScrollTrigger.refresh(); });
    return () => { disposed = true; media.revert(); };
  }, [panelCount]);

  // Text edits can change the pinned section's dimensions without remounting it.
  useEffect(() => {
    const timer = setTimeout(() => ScrollTrigger.refresh(), 150);
    return () => clearTimeout(timer);
  }, [config]);

  return (
    <div ref={root} className="relative bg-[#F1F1F1]">
      <svg aria-hidden="true" width="0" height="0" className="absolute pointer-events-none">
        <defs>
          <clipPath id="envelope-real-top" clipPathUnits="objectBoundingBox"><path ref={topPath} /></clipPath>
          <clipPath id="envelope-real-bottom" clipPathUnits="objectBoundingBox"><path ref={bottomPath} /></clipPath>
        </defs>
      </svg>
      <Hero />
      <Story />
      <div data-envelope-bottom className="relative bg-[#5D613C]">
        <CinematicTransition />
        <Events />
      </div>
    </div>
  );
}
