import { invitationFonts } from "./invitation-fonts";
import { getInvitationArtwork } from "./invitation-artwork";
import { invitationUrl } from "@/config/site";
import type { WeddingConfig } from "@/types/wedding";
import type { TemplateId } from "@/config/templates/registry";

export async function createInvitationPdf(
  invitation: { label: string; token: string },
  weddingConfig: WeddingConfig,
  slug: string,
  templateId: TemplateId = "botanical-classic",
) {
  const [{ jsPDF }, { default: QRCode }, { svg2pdf }, fonts] = await Promise.all([
    import("jspdf"),
    import("qrcode"),
    import("svg2pdf.js"),
    invitationFonts(),
  ]);
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a5",
    compress: true,
    putOnlyUsedFonts: true,
  });
  for (const [index, style] of ["normal", "italic"].entries()) {
    const file = "CormorantGaramond-" + style + ".ttf";
    pdf.addFileToVFS(file, fonts[index]);
    pdf.addFont(file, "CormorantGaramond", style);
  }
  for (const [index, style] of ["normal", "italic"].entries()) {
    const file = "CormorantGaramondLight-" + style + ".ttf";
    pdf.addFileToVFS(file, fonts[index + 2]);
    pdf.addFont(file, "CormorantGaramondLight", style);
  }
  const width = 148,
    center = width / 2;
  const isRomance = templateId === "contemporary-romance";
  const primary = isRomance ? "#722F37" : "#5D613C";
  const ink = isRomance ? "#302329" : "#3D2501";
  const accent = isRomance ? "#82656C" : "#80654E";
  const sand = isRomance ? "#D2B9BD" : "#C7B79D";
  const paperBg = isRomance ? "#FAF7F5" : "#FAF8F1";

  const { couple, ceremony } = weddingConfig;
  const url = invitationUrl(invitation.token, slug);
  pdf.setProperties({
    title: "Convite de casamento - " + invitation.label,
    subject: couple.partner1 + " e " + couple.partner2,
    author: couple.partner1 + " e " + couple.partner2,
    creator: "Site do casamento",
  });

  pdf.setFillColor(paperBg);
  pdf.rect(0, 0, width, 210, "F");

  pdf.setDrawColor(sand);
  pdf.setLineWidth(0.25);
  pdf.roundedRect(8, 8, 132, 194, 5, 5);

  const artworkString = getInvitationArtwork(templateId);
  const artwork = new DOMParser().parseFromString(artworkString, "image/svg+xml").documentElement;
  await svg2pdf(artwork, pdf, { x: 0, y: 0, width: 148, height: 210 });

  function text(
    value: string,
    y: number,
    size: number,
    color = ink,
    font = "CormorantGaramond",
    style = "normal",
  ) {
    pdf.setFont(font, style);
    pdf.setFontSize(size);
    pdf.setTextColor(color);
    pdf.text(value, center, y, { align: "center" });
  }

  text(
    (couple.headline || (isRomance ? "O amor em cada detalhe." : "Vamos celebrar nossa história."))
      .split("\n")[0]
      .slice(0, 90),
    25,
    11,
    accent,
    "CormorantGaramond",
    "italic",
  );

  pdf.setFont("CormorantGaramondLight", "normal");
  pdf.setFontSize(32);
  const firstWidth = pdf.getTextWidth(couple.partner1);
  const lastWidth = pdf.getTextWidth(couple.partner2);
  pdf.setFont("CormorantGaramondLight", "italic");
  const ampWidth = pdf.getTextWidth("&");
  const gap = 3;
  const start = center - (firstWidth + lastWidth + ampWidth + gap * 2) / 2;

  pdf.setTextColor(ink);
  pdf.setFont("CormorantGaramondLight", "normal");
  pdf.text(couple.partner1, start, 49);

  pdf.setTextColor(primary);
  pdf.setFont("CormorantGaramondLight", "italic");
  pdf.text("&", start + firstWidth + gap, 49);

  pdf.setTextColor(ink);
  pdf.setFont("CormorantGaramondLight", "normal");
  pdf.text(couple.partner2, start + firstWidth + ampWidth + gap * 2, 49);

  pdf.setDrawColor(sand);
  pdf.setLineWidth(0.2);
  pdf.line(54, 67, 68, 67);
  pdf.line(80, 67, 94, 67);

  text(
    isRomance ? "Com muito amor e alegria" : "Com alegria no coração",
    79,
    12,
    accent,
    "CormorantGaramond",
    "italic",
  );
  text("Convidam você para celebrar esse momento tão especial", 85, 11, accent);

  let labelSize = 19;
  pdf.setFont("CormorantGaramond", "italic");
  pdf.setFontSize(labelSize);
  let family = pdf.splitTextToSize(invitation.label, 104) as string[];
  while (family.length > 2 && labelSize > 10) {
    labelSize--;
    pdf.setFontSize(labelSize);
    family = pdf.splitTextToSize(invitation.label, 104) as string[];
  }
  pdf.setTextColor(primary);
  pdf.text(family, center, family.length > 1 ? 96 : 99, {
    align: "center",
    lineHeightFactor: 1.15,
  });

  const date = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(couple.weddingDate));

  text(date + " | " + ceremony.time, 110, 13, primary);
  text(ceremony.placeName, 122, 19, ink);

  pdf.setFont("CormorantGaramond", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(accent);
  const address = pdf.splitTextToSize(ceremony.address, 114) as string[];
  pdf.text(address, center, 129, { align: "center", lineHeightFactor: 1.3 });
  text(ceremony.cityState, 129 + address.length * 4, 10, accent, "CormorantGaramond");

  const qr = await QRCode.toDataURL(url, {
    errorCorrectionLevel: "M",
    margin: 4,
    width: 640,
    color: { dark: ink, light: paperBg },
  });
  pdf.addImage(qr, "PNG", 56, 142, 36, 36);

  pdf.setDrawColor(sand);
  pdf.setLineWidth(0.25);
  pdf.roundedRect(54, 140, 40, 40, 3, 3);
  pdf.link(56, 142, 36, 36, { url });

  text("CONFIRME SUA PRESENÇA", 188, 10, primary, "CormorantGaramond");
  text("Leia o QR Code ou toque aqui para responder", 197, 10, accent, "CormorantGaramond");
  pdf.link(24, 193, 100, 7, { url });
  return pdf;
}

export async function downloadInvitationPdf(
  invitation: { label: string; token: string },
  weddingConfig: WeddingConfig,
  slug: string,
  templateId: TemplateId = "botanical-classic",
) {
  const pdf = await createInvitationPdf(invitation, weddingConfig, slug, templateId);
  const coupleNames = [weddingConfig.couple?.partner1, weddingConfig.couple?.partner2]
    .filter(Boolean)
    .join(" e ")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const guestLabel =
    invitation.label
      .replace(/[\\/:*?"<>|]/g, "")
      .replace(/\s+/g, " ")
      .trim() || "Convidado";

  const fileName = coupleNames
    ? `Convite de Casamento - ${coupleNames} - ${guestLabel}.pdf`
    : `Convite de Casamento - ${guestLabel}.pdf`;

  pdf.save(fileName);
}
