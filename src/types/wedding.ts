export interface CoupleInfo {
  partner1: string;
  partner2: string;
  headline?: string;
  weddingDate: string;
  locationSummary: string;
  hashtag: string;
  coverImage: string;
  story?: {
    sinceYear?:number;
    moments?:string[];
    enabled: boolean;
    title: string;
    text: string[];
    image?: string;
  };
}

export interface GalleryPhoto {
  id: string;
  url: string;
  caption?: string;
  aspect?: "tall" | "wide" | "square" | "hero";
}

export interface EventLocation {
  title: string;
  subtitle: string;
  time: string;
  placeName: string;
  address: string;
  cityState: string;
  googleMapsUrl: string;
  websiteUrl?:string;
  wazeUrl?: string;
  uberUrl?: string;
  image?: string;
  tips?: string;
}

export interface DressCodePaletteColor {
  name: string;
  hex: string;
}

export interface DressCodeInfo {
  title: string;
  description: string;
  dos: string[];
  donts: string[];
  palette: DressCodePaletteColor[];
  gallery: {
    title: string;
    description: string;
    image: string;
  }[];
}

export interface GiftItem {
  id: string;
  title: string;
  category: string;
  categoryLabel: string;
  price?: number;
  image: string;
  description?: string;
  featured?: boolean;
  creditCardUrl?: string;
}

export interface CreditCardConfig {
  enabled: boolean;
  defaultPaymentLink: string;
  installmentsInfo?: string;
  providerName?: string;
}

export interface PixConfig {
  key: string;
  keyType: "cpf" | "cnpj" | "email" | "phone" | "random";
  receiverName: string;
  city: string;
  whatsappConfirmationPhone: string;
}

export interface RsvpConfig {
  googleAppsScriptUrl: string;
  deadlineDate?: string;
  contactWhatsApp: string;
}

export type GalleryStyle = "polaroid" | "relicario" | "varal" | "filme" | "mural";

export interface WeddingConfig {
  giftPaymentLink?: string;
  copy?:Record<string,string>;
  sections?: {gallery?:boolean};
  galleryStyle?: GalleryStyle;
  couple: CoupleInfo;
  gallery: GalleryPhoto[];
  ceremony: EventLocation;
  party: EventLocation;
  dressCode: DressCodeInfo;
  gifts: GiftItem[];
  pix: PixConfig;
  creditCard?: CreditCardConfig;
  rsvp: RsvpConfig;
  ui?: {
    primaryColorName?: string;
    spotifyPlaylistUrl?: string;
  };
}

export interface RsvpFormData {
  fullName: string;
  whatsapp: string;
  attending: "sim" | "nao";
  hasCompanions: boolean;
  companions: { name: string }[];
  dietaryRestrictions?: string;
  message?: string;
}
