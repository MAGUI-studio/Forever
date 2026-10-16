"use client";

import {useState} from "react";
import Image from "next/image";
import {ArrowUpRight, ArrowUp, Waves, Plus} from "lucide-react";
import {useWedding} from "../WeddingProvider";
import {useSiteCopy} from "../useSiteCopy";
import {VenuePhotoMap} from "../VenuePhotoMap";
import {GalleryLightbox} from "../GalleryLightbox";
import {GalleryGridDispatcher} from "../GalleryStyles";
import {GiftList} from "../GiftList";
import {RSVPSection} from "../RSVPSection";
import {Countdown} from "../Countdown";
import {DressCodeSection} from "../DressCodeSection";
import {galleryEnabled, MAX_GALLERY_PHOTOS, resolveGalleryStyle} from "@/config/gallery";
import {resolveTemplateImage} from "@/lib/template-images";
import {venueMapUrl,venueDisplayTips} from "@/lib/wedding-settings";
import type {TemplateOrnamentsProps} from "./ornament-types";
import "./pro-templates.css";

export function MinimalAccent(){return <Plus aria-hidden="true" size={26} strokeWidth={1}/>;}
export function BreezeAccent(){return <Waves aria-hidden="true" size={36} strokeWidth={1}/>;}
export function MinimalOrnaments(_props:TemplateOrnamentsProps){return <div aria-hidden="true" className="pro-minimal-ornament"/>;}
export function BreezeOrnaments(_props:TemplateOrnamentsProps){return <svg aria-hidden="true" className="pro-wave-ornament" viewBox="0 0 600 120" fill="none"><path d="M-20 65 Q130 -20 300 65 T620 65 M-20 85 Q130 0 300 85 T620 85 M-20 105 Q130 20 300 105 T620 105" stroke="currentColor" strokeWidth="1"/></svg>;}

export function ProDate(){const {config}=useWedding();const date=new Date(config.couple.weddingDate);return <>{Number.isNaN(date.getTime())?"":date.toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric",timeZone:"America/Sao_Paulo"})}</>;}
export function ProActions(){const {modules}=useWedding();return <div className="pro-actions">{modules.rsvp&&<a className="pro-button" href="#rsvp">Confirmar presença <ArrowUpRight size={16}/></a>}{modules.gifts&&<a className="pro-text-link" href="#presentes">Lista de presentes</a>}</div>;}
export function ProCountdown(){const {config}=useWedding();const copy=useSiteCopy();return Number.isNaN(new Date(config.couple.weddingDate).getTime())?null:<section className="pro-countdown"><p className="pro-kicker">{copy("pro.countdown.eyebrow")}</p><Countdown targetDateISO={config.couple.weddingDate}/></section>;}

export function ProStory(){const {config,templateId}=useWedding();const copy=useSiteCopy();const story=config.couple.story;if(!story?.enabled)return null;const storyImage=resolveTemplateImage(config,templateId,"story");return <section id="historia" className={"pro-story pro-section"+(!storyImage?" pro-story-no-photo":"")} >{storyImage&&<div className="pro-story-photo"><Image src={storyImage} alt="Uma memória da nossa história" fill sizes="(min-width: 768px) 45vw, 100vw" className="object-cover"/></div>}<div className="pro-story-copy"><p className="pro-kicker">{story.sinceYear?`${copy("pro.story.since")} ${story.sinceYear}`:copy("pro.story.eyebrow")}</p><h2>{story.title}</h2>{story.text.map((text,i)=><div className="pro-chapter" key={i}>{story.moments?.[i]&&<h3>{story.moments[i]}</h3>}<p>{text}</p></div>)}</div></section>;}

export function ProVenues(){const {config,templateId}=useWedding();const copy=useSiteCopy();const separate=config.sameVenue===false;return <section id="eventos" className="pro-section pro-venues"><div className="pro-section-heading"><p className="pro-kicker">{copy("pro.events.eyebrow")}</p><h2>{copy("pro.events.title")}</h2></div><div className={"pro-venue-grid"+(separate?" pro-venue-grid-pair":"")}>{(separate?[config.ceremony,config.party]:[config.ceremony]).map((venue,i)=>{const tips=venueDisplayTips(venue,config.sameVenue);const photo=i===1?(venue.image||""):resolveTemplateImage(config,templateId,"venue");return <article className="pro-venue" key={i}><VenuePhotoMap point={venue.coordinates} label={venue.placeName} className="pro-venue-photo">{photo&&<Image src={photo} alt={venue.placeName} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover"/>}</VenuePhotoMap><div className="pro-venue-info"><p className="pro-kicker">{separate?(i===0?`01 / ${copy("events.ceremonyLabel")}`:`02 / ${copy("events.partyLabel")}`):copy("events.combinedLabel")}</p><h3>{venue.placeName}</h3><p><ProDate/> · {venue.time||copy("events.afterCeremony")}</p><address>{venue.address}<br/>{venue.cityState}</address>{tips&&<p>{tips}</p>}<div className="pro-actions"><a className="pro-button" href={venueMapUrl(venue)} target="_blank" rel="noopener noreferrer">Como chegar <ArrowUpRight size={16}/></a>{venue.websiteUrl&&<a className="pro-text-link" href={venue.websiteUrl} target="_blank" rel="noopener noreferrer">Conheça o espaço</a>}</div></div></article>;})}</div></section>;}

export function ProGallery(){
 const {config,templateId}=useWedding();
 const copy=useSiteCopy();
 const [selected,setSelected]=useState<number|null>(null);
 const photos=config.gallery.slice(0,MAX_GALLERY_PHOTOS);
 if(!galleryEnabled(config)||!photos.length)return null;
 return <section id="galeria" className="pro-section pro-gallery">
  <div className="pro-section-heading"><p className="pro-kicker">{copy("pro.gallery.eyebrow")}</p><h2>{copy("pro.gallery.title")}</h2></div>
  <GalleryGridDispatcher style={resolveGalleryStyle(config,templateId)} photos={photos} onSelectPhoto={setSelected}/>
  {selected!==null&&<GalleryLightbox photos={photos} index={selected} onIndexChange={setSelected} onClose={()=>setSelected(null)}/>}
 </section>;
}
export function ProClosing(){const {config,modules,templateId}=useWedding();const copy=useSiteCopy();return <>{templateId==="minimalist-modern"&&modules.gifts&&<div className="pro-functional minimal-gifts"><GiftList/></div>}<DressCodeSection/>{templateId!=="minimalist-modern"&&modules.gifts&&<div className="pro-functional"><GiftList/></div>}{modules.rsvp&&<div className={"pro-functional"+(templateId==="minimalist-modern"?" minimal-rsvp":"")}><RSVPSection/></div>}<footer className="cinema-footer pro-footer"><p className="pro-kicker">{config.couple.hashtag}</p><h2>{config.couple.partner1} <em>&</em> {config.couple.partner2}</h2><p>{copy("footer.text2")}</p><button type="button" className="pro-text-link" onClick={()=>window.scrollTo({top:0,behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"})}>Voltar ao início <ArrowUp size={16} aria-hidden="true"/></button><p className="pro-kicker"><ProDate/> · {config.couple.locationSummary}</p></footer></>;}
