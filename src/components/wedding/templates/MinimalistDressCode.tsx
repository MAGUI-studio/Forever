"use client";

import Image from "next/image";
import {resolveTemplateImage} from "@/lib/template-images";
import {useWedding} from "../WeddingProvider";
import {useSiteCopy} from "../useSiteCopy";

export function MinimalistDressCode() {
  const {config,templateId}=useWedding();
  const copy=useSiteCopy();
  const dress=config.dressCode;
  const background=resolveTemplateImage(config,templateId,"dress");

  return <section id="dress-code" className="pro-section minimal-dress-invitation" aria-labelledby="minimal-dress-title">
    {background&&<Image src={background} alt="" fill sizes="(min-width: 1760px) 1664px, 100vw" className="minimal-dress-background"/>}
    <div className="minimal-dress-background-shade" aria-hidden="true"/>
    <div className="minimal-dress-invitation-inner">
      <header className="minimal-dress-invitation-heading">
        <p className="pro-kicker">{copy("pro.dress.eyebrow")}</p>
        <span className="minimal-dress-invitation-label">Dress code</span>
        <h2 id="minimal-dress-title">{dress.title}</h2>
        <p className="minimal-dress-invitation-description">{dress.description}</p>
      </header>
      <dl className="minimal-dress-invitation-guidance">
        {dress.dos.length>0&&<div><dt><span aria-hidden="true">01</span> Para aproveitar o dia</dt><dd><ul>{dress.dos.map((text,index)=><li key={index}>{text}</li>)}</ul></dd></div>}
        {dress.donts.length>0&&<div><dt><span aria-hidden="true">02</span> Com carinho, pedimos</dt><dd><ul>{dress.donts.map((text,index)=><li key={index}>{text}</li>)}</ul></dd></div>}
      </dl>
      {dress.palette.length>0&&<div className="minimal-dress-invitation-colors"><p className="pro-kicker">Cores para inspirar o seu look</p><ul>{dress.palette.map((color,index)=><li key={`${color.name}-${index}`}><span className="minimal-dress-color-shape" aria-hidden="true"><i style={{backgroundColor:color.hex}}/></span><span className="minimal-dress-color-name">{color.name}</span></li>)}</ul></div>}
    </div>
  </section>;
}
