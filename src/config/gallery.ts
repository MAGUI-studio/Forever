import type {GalleryPhoto,WeddingConfig,GalleryStyle} from "@/types/wedding";
export const MAX_GALLERY_PHOTOS=6;

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
