import { invitationArtwork } from "./invitation-artwork";
import { invitationUrl } from "@/config/site";
import type {WeddingConfig} from "@/types/wedding";

/** Generated locally; invitation codes are never sent to a PDF or QR service. */
export async function createInvitationPdf(invitation: { label: string; token: string }, weddingConfig:WeddingConfig, slug:string) {
  const [{ jsPDF }, { default: QRCode }, { svg2pdf }, fonts] = await Promise.all([import("jspdf"), import("qrcode"), import("svg2pdf.js"), Promise.all(["regular", "italic", "light", "light-italic"].map(async style => {
    const response = await fetch("/fonts/cormorant-garamond-" + style + ".ttf");
    if (!response.ok) throw new Error("Não foi possível carregar a fonte do convite.");
    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = ""; for (let offset=0;offset<bytes.length;offset+=8192) binary += String.fromCharCode(...bytes.subarray(offset,offset+8192));
    return btoa(binary);
  }))]);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5", compress: true, putOnlyUsedFonts: true });
  for (const [index,style] of ["normal", "italic"].entries()) {const file="CormorantGaramond-"+style+".ttf";pdf.addFileToVFS(file,fonts[index]);pdf.addFont(file,"CormorantGaramond",style);}
  for (const [index,style] of ["normal", "italic"].entries()) {const file="CormorantGaramondLight-"+style+".ttf";pdf.addFileToVFS(file,fonts[index+2]);pdf.addFont(file,"CormorantGaramondLight",style);}
  const width = 148, center = width / 2;
  const olive = "#5D613C", ink = "#3D2501", taupe = "#80654E", sand = "#C7B79D";
  const { couple, ceremony } = weddingConfig;
  const url = invitationUrl(invitation.token,slug);
  pdf.setProperties({title: "Convite de casamento - " + invitation.label, subject: couple.partner1+" e "+couple.partner2, author: couple.partner1+" e "+couple.partner2, creator: "Site do casamento"});
  pdf.setFillColor("#FAF8F1"); pdf.rect(0, 0, width, 210, "F");
  pdf.setDrawColor(sand); pdf.setLineWidth(.25); pdf.roundedRect(8, 8, 132, 194, 5, 5);
  const artwork = new DOMParser().parseFromString(invitationArtwork,"image/svg+xml").documentElement;
  await svg2pdf(artwork,pdf,{x:0,y:0,width:148,height:210});
  function text(value: string, y: number, size: number, color = ink, font = "CormorantGaramond", style = "normal") {
    pdf.setFont(font,style); pdf.setFontSize(size); pdf.setTextColor(color);
    pdf.text(value,center,y,{align:"center"});
  }
  text((couple.headline || "Vamos celebrar nossa história.").split("\n")[0].slice(0,90),25,11,taupe,"CormorantGaramond","italic");
  // Match the hero: Cormorant Garamond 300, with an italic ampersand.
  pdf.setFont("CormorantGaramondLight","normal");pdf.setFontSize(32);
  const firstWidth=pdf.getTextWidth(couple.partner1), lastWidth=pdf.getTextWidth(couple.partner2);
  pdf.setFont("CormorantGaramondLight","italic");const ampWidth=pdf.getTextWidth("&");
  const gap=3, start=center-(firstWidth+lastWidth+ampWidth+gap*2)/2;
  pdf.setTextColor(ink);pdf.setFont("CormorantGaramondLight","normal");pdf.text(couple.partner1,start,49);
  pdf.setTextColor(taupe);pdf.setFont("CormorantGaramondLight","italic");pdf.text("&",start+firstWidth+gap,49);
  pdf.setTextColor(ink);pdf.setFont("CormorantGaramondLight","normal");pdf.text(couple.partner2,start+firstWidth+ampWidth+gap*2,49);
  pdf.setDrawColor(sand);pdf.line(54,67,68,67);pdf.line(80,67,94,67);
  text("Com alegria no coração",79,12,taupe,"CormorantGaramond","italic");
  text("Convidam você para celebrar esse momento tão especial",85,11,taupe);
  let labelSize=19; pdf.setFont("CormorantGaramond","italic");pdf.setFontSize(labelSize);
  let family = pdf.splitTextToSize(invitation.label,104) as string[];
  while(family.length > 2 && labelSize > 10) {labelSize--;pdf.setFontSize(labelSize);family=pdf.splitTextToSize(invitation.label,104) as string[];}
  pdf.setTextColor(olive);pdf.text(family,center,family.length > 1 ? 96 : 99,{align:"center",lineHeightFactor:1.15});
  const date = new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"long",year:"numeric",timeZone:"America/Sao_Paulo"}).format(new Date(couple.weddingDate));
  text(date + " | " + ceremony.time,110,13,olive);
  text(ceremony.placeName,122,19);
  pdf.setFont("CormorantGaramond","normal");pdf.setFontSize(10);pdf.setTextColor(taupe);
  const address = pdf.splitTextToSize(ceremony.address,114) as string[];
  pdf.text(address,center,129,{align:"center",lineHeightFactor:1.3});
  text(ceremony.cityState,129 + address.length * 4,10,taupe,"CormorantGaramond");
  const qr = await QRCode.toDataURL(url,{errorCorrectionLevel:"M",margin:4,width:640,color:{dark:ink,light:"#FAF8F1"}});
  pdf.addImage(qr,"PNG",56,142,36,36);
  pdf.setDrawColor(sand);pdf.setLineWidth(.25);pdf.roundedRect(54,140,40,40,3,3);
  pdf.setDrawColor("#E3DCCB");pdf.setLineWidth(.15);pdf.roundedRect(55,141,38,38,2.5,2.5);
  pdf.link(56,142,36,36,{url});
  text("CONFIRME SUA PRESENÇA",188,10,olive,"CormorantGaramond");
  text("Leia o QR Code ou toque aqui para responder",197,10,taupe,"CormorantGaramond");
  pdf.link(24,193,100,7,{url});
  return pdf;
}

export async function downloadInvitationPdf(invitation: {label:string;token:string}, weddingConfig:WeddingConfig, slug:string) {
  const pdf = await createInvitationPdf(invitation,weddingConfig,slug);
  const name = invitation.label.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,80) || "familia";
  pdf.save("convite-" + name.toLowerCase() + ".pdf");
}
