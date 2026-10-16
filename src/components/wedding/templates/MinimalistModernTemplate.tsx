"use client";

import Image from "next/image";
import { ArrowDownRight } from "lucide-react";
import { useSiteCopy } from "../useSiteCopy";
import { useWedding } from "../WeddingProvider";
import { resolveTemplateImage } from "@/lib/template-images";
import {
  ProActions,
  ProDate,
  ProCountdown,
  ProStory,
  ProVenues,
  ProGallery,
  ProClosing,
} from "./ProTemplateSections";

export function MinimalistModernTemplate() {
  const { config } = useWedding();
  const { couple } = config;
  const copy = useSiteCopy();
  const heroImage = resolveTemplateImage(config, "minimalist-modern", "hero");

  return (
    <main data-wedding-template="minimalist-modern" className="pro-template pro-minimal">
      <div className="minimal-hero-scene">
        {heroImage && (
          <Image
            src={heroImage}
            alt={`O casamento de ${couple.partner1} e ${couple.partner2}`}
            fill
            preload
            sizes="100vw"
            className="minimal-hero-photo"
          />
        )}
        <div className="minimal-hero-shade" aria-hidden="true" />
        <section id="inicio" className="minimal-hero" aria-labelledby="minimal-hero-names">
          <div className="minimal-hero-content">
            <p className="pro-kicker minimal-hero-intro">{copy("pro.hero.eyebrow")}</p>
            <h1 id="minimal-hero-names" className="minimal-hero-names">
              <span>{couple.partner1}</span>
              <span className="minimal-hero-second">
                <em>&</em>
                <span>{couple.partner2}</span>
              </span>
            </h1>
            <div className="minimal-hero-bottom">
              <div className="minimal-hero-invitation">
                {couple.headline && <p className="minimal-hero-headline">{couple.headline}</p>}
                <ProActions />
              </div>
              <div className="minimal-hero-details">
                <p className="minimal-hero-date">
                  <ProDate />
                </p>
                {couple.locationSummary && (
                  <p className="minimal-hero-location">{couple.locationSummary}</p>
                )}
                <a className="minimal-hero-explore" href="#eventos">
                  O grande dia <ArrowDownRight size={21} strokeWidth={1} />
                </a>
              </div>
            </div>
          </div>
        </section>
        <ProCountdown />
      </div>
      <ProStory />
      <ProGallery />
      <ProVenues />
      <ProClosing />
    </main>
  );
}
