import type {GalleryPhoto,WeddingConfig,GalleryStyle} from "@/types/wedding";
export const MAX_GALLERY_PHOTOS=6;
export const MAX_GALLERY_FILE_SIZE_BYTES=1024*1024; // 1MB
export const ALLOWED_GALLERY_MIME_TYPES=["image/png","image/webp"] as const;
export const ALLOWED_GALLERY_EXTENSIONS=[".png",".webp"] as const;

/** Checks if a given image URL belongs to UploadThing storage. */
export function isUploadThingUrl(urlOrKey: string): boolean {
  if (!urlOrKey) return false;
  return urlOrKey.includes("utfs.io") || urlOrKey.includes("ufs.sh") || urlOrKey.includes("uploadthing");
}

/** Extracts the UploadThing file key from a URL or returns the key if already bare. */
export function getUploadThingKey(urlOrKey: string): string | null {
  if (!urlOrKey) return null;
  if (!urlOrKey.includes("/") && !urlOrKey.startsWith("http")) {
    return urlOrKey;
  }
  if (isUploadThingUrl(urlOrKey)) {
    const afterF = urlOrKey.split(/\/f\//)[1];
    if (afterF) {
      return afterF.split("?")[0] || null;
    }
    try {
      const parsed = new URL(urlOrKey);
      const parts = parsed.pathname.split("/").filter(Boolean);
      return parts[parts.length - 1] ?? null;
    } catch {
      return null;
    }
  }
  return null;
}

export interface GalleryStyleOption {
  value: GalleryStyle;
  label: string;
  description: string;
}

export const galleryStyles: GalleryStyleOption[] = [
  {
    value: "polaroid",
    label: "Polaroid Clássica",
    description: "Fotos em molduras brancas de papel artesanal com inclinações orgânicas e estilo polaroid.",
  },
  {
    value: "relicario",
    label: "Relicário Romântico",
    description: "Molduras em arco e medalhões ovais com lacinhos de cetim e corações flutuantes.",
  },
  {
    value: "varal",
    label: "Varal de Fotos",
    description: "Fotos penduradas em fios com mini pregadores rústicos e luzinhas delicadas de casamento.",
  },
  {
    value: "filme",
    label: "Película Vintage",
    description: "Tiras nostálgicas de fotocabine e película 35mm com marcadores retrô.",
  },
  {
    value: "mural",
    label: "Mural Afetivo",
    description: "Mural scrapbook com fotos presas por fitas washi delicadas e sombras suaves.",
  },
];

/** Resolves effective gallery style, falling back to template-preferred default if unset. */
export function resolveGalleryStyle(config?: Pick<WeddingConfig, "galleryStyle">, templateId?: string): GalleryStyle {
  if (config?.galleryStyle && galleryStyles.some(s => s.value === config.galleryStyle)) {
    return config.galleryStyle;
  }
  return templateId === "contemporary-romance" ? "relicario" : "polaroid";
}

/** Temporary wedding photographs, replaced by couple uploads in a future feature. */
export const placeholderGallery:GalleryPhoto[]=Array.from({length:MAX_GALLERY_PHOTOS},(_,index)=>({
 id:`sample-${index+1}`,url:`/gallery/placeholders/${String(index+1).padStart(2,"0")}.webp`,caption:"",
}));

export function galleryPhotos(config:Pick<WeddingConfig,"gallery">):GalleryPhoto[]{
 return (config.gallery.length?config.gallery:placeholderGallery).slice(0,MAX_GALLERY_PHOTOS);
}

/** The gallery is shown by default; only an explicit `false` hides it. */
export function galleryEnabled(config:Pick<WeddingConfig,"sections">):boolean{
 return config.sections?.gallery!==false;
}
