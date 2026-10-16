"use client";

import { Fragment, ReactNode, useEffect, useRef } from "react";
import { MotionConfig } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function CinematicExperience({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    let disposed = false;
    const canAnimate=(element:HTMLElement)=>!element.closest("[data-cinema-static]");
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const context = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>("[data-cinema-words]").filter(canAnimate).forEach(heading => {
          gsap.from(heading.querySelectorAll("[data-cinema-word]"), {
            opacity: 0.24, y: 18, stagger: 0.09, ease: "none",
            scrollTrigger: { trigger: heading, start: "top 88%", end: "bottom 48%", scrub: 0.8 },
          });
        });
        gsap.utils.toArray<HTMLElement>("section:not(#inicio) h2:not([data-cinema-words]), section:not(#inicio) h3").filter(canAnimate).forEach(heading => {
          gsap.fromTo(heading, { y: 55, opacity: 0, filter: "blur(5px)" }, {
            y: 0, opacity: 1, filter: "blur(0px)", duration: 1.3, ease: "power3.out",
            scrollTrigger: { trigger: heading, start: "top 93%", once: true },
          });
        });
        gsap.utils.toArray<HTMLElement>("[data-cinema-depth]").filter(canAnimate).forEach(frame => {
          const image = frame.querySelector("img");
          if (!image) return;
          gsap.fromTo(image, { yPercent: -5, scale: 1.1 }, {
            yPercent: 5, scale: 1.02, ease: "none",
            scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: 1.2 },
          });
        });
        gsap.utils.toArray<HTMLElement>("[data-cinema-sequence]").filter(canAnimate).forEach(sequence => {
          gsap.from(sequence.children, {
            y: 36, opacity: 0, duration: 1.1, stagger: 0.13, ease: "power3.out",
            scrollTrigger: { trigger: sequence, start: "top 90%", once: true },
          });
        });
        gsap.utils.toArray<HTMLElement>("[data-cinema-copy]").filter(canAnimate).forEach(copy => {
          gsap.from(copy, {
            y: 24, opacity: 0, duration: 1.1, ease: "power2.out",
            scrollTrigger: { trigger: copy, start: "top 92%", once: true },
          });
        });
        gsap.utils.toArray<HTMLElement>("[data-cinema-drift]").filter(canAnimate).forEach((element, index) => {
          gsap.fromTo(element.querySelector("p") ?? element, { y: index % 2 === 0 ? 18 : -18 }, {
            y: index % 2 === 0 ? -18 : 18, ease: "none",
            scrollTrigger: { trigger: element, start: "top bottom", end: "bottom top", scrub: 1.3 },
          });
        });
        gsap.utils.toArray<HTMLElement>("[data-cinema-image]").filter(canAnimate).forEach(frame => {
          gsap.fromTo(frame, { clipPath: "inset(12% 0 12% 0 round 24px)" }, {
            clipPath: "inset(0% 0 0% 0 round 24px)", duration: 1.5, ease: "power3.inOut",
            scrollTrigger: { trigger: frame, start: "top 92%", once: true },
          });
        });
      }, root);
      return () => context.revert();
    });
    document.fonts.ready.then(() => { if (!disposed) ScrollTrigger.refresh(); });
    return () => { disposed = true; media.revert(); };
  }, []);

  return <MotionConfig reducedMotion="user"><div ref={root} className="cinematic-experience">{children}</div></MotionConfig>;
}

export function CinematicWords({ text, className = "" }: { text: string; className?: string }) {
  return <h2 data-cinema-words aria-label={text} className={className}>
    {text.split(" ").map((word, index) => <Fragment key={index}><span data-cinema-word aria-hidden="true" className="inline-block">{word}</span>{" "}</Fragment>)}
  </h2>;
}
