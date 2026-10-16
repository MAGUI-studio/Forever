"use client";
import Image from "next/image";
import {useSiteCopy} from "../useSiteCopy";
import {useWedding} from "../WeddingProvider";
import {resolveTemplateImage} from "@/lib/template-images";
import {BreezeAccent,BreezeOrnaments,ProActions,ProDate,ProCountdown,ProStory,ProVenues,ProGallery,ProClosing} from "./ProTemplateSections";

export function SereneBreezeTemplate(){const {config}=useWedding();const {couple}=config;const copy=useSiteCopy();const heroImage=resolveTemplateImage(config,"serene-breeze","hero");return <main data-wedding-template="serene-breeze" className="pro-template pro-breeze"><section id="inicio" className="breeze-cover"><div className="breeze-horizon">{heroImage&&<Image src={heroImage} alt="O cenário do nosso novo capítulo" fill preload sizes="100vw" className="object-cover"/>}<div/></div><div className="breeze-invitation"><BreezeAccent/><p className="pro-kicker">{copy("pro.hero.eyebrow")}</p><h1><span>{couple.partner1}</span><em>&</em><span>{couple.partner2}</span></h1><p className="breeze-headline">{couple.headline}</p><div className="breeze-date"><ProDate/><span>{couple.locationSummary}</span></div><ProActions/><BreezeOrnaments/></div></section><ProStory/><ProCountdown/><ProGallery/><ProVenues/><ProClosing/></main>;}
