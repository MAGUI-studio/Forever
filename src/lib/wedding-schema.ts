import {templateIds,copyDefaults,fixedCopyKeys} from "@/config/templates/registry";
import {MAX_GALLERY_PHOTOS} from "@/config/gallery";
import { z } from "zod";
import { validWeddingSlug } from "@/config/forever";
const text = z.string().trim().max(500);
const url = z
  .string()
  .max(2048)
  .refine(
    (v) => !v || /^\/(?!\/)[^\\]*$/.test(v) || /^https:\/\/[^\s]+$/.test(v),
    "Use um endereço HTTPS ou um arquivo do site.",
  );
const location = z
  .object({
    title: text,
    subtitle: text,
    time: text,
    placeName: text,
    address: text,
    cityState: text,
    googleMapsUrl: url,
    websiteUrl:url.optional(),
  wazeUrl: url.optional(),
    uberUrl: url.optional(),
    image: url.optional(),
    tips: text.optional(),
  })
  .strict();
export const weddingConfigSchema = z
  .object({
    giftPaymentLink: z.string().max(2048).refine(value=>!value||/^https:\/\/[^\s]+$/i.test(value),"Use um link de pagamento HTTPS.").optional(),
    copy:z.record(z.string().max(5000)).refine(value=>Object.keys(value).every(key=>key in copyDefaults),"Texto desconhecido no template.").transform(value=>Object.fromEntries(Object.entries(value).filter(([key])=>!fixedCopyKeys.has(key)&&key!=="hero.text5"))).optional(),
    customImages: z.record(url).optional(),
    sections: z
      .object({
        gallery: z.boolean().optional(),
        dressCode: z.boolean().optional(),
        gifts: z.boolean().optional(),
        rsvp: z.boolean().optional(),
      })
      .strict()
      .transform(value=>({gallery:value.gallery??true}))
      .optional(),
    galleryStyle: z.enum(["polaroid", "relicario", "varal", "filme", "mural", "editorial"]).transform(v => v === "editorial" ? "varal" : v).optional(),
    couple: z
      .object({
        partner1: z.string().trim().min(1).max(80),
        partner2: z.string().trim().min(1).max(80),
        headline: text.optional(),
        weddingDate: z
          .string()
          .refine((v) => !v || Number.isFinite(Date.parse(v)), "Data inválida"),
        locationSummary: text,
        hashtag: text,
        coverImage: url,
        story: z
          .object({
            sinceYear:z.number().int().min(1900).max(2200).optional(),
          moments:z.array(text).max(20).optional(),
          enabled: z.boolean(),
            title: text,
            text: z.array(z.string().max(5000)).max(20),
            image: url.optional(),
          })
          .strict()
          .optional(),
      })
      .strict(),
    gallery: z
      .array(
        z
          .object({
            id: text,
            url,
            caption: text.optional(),
            aspect: z.enum(["tall", "wide", "square", "hero"]).optional(),
          })
          .strict(),
      )
      .max(MAX_GALLERY_PHOTOS,`A galeria permite no máximo ${MAX_GALLERY_PHOTOS} fotos.`),
    ceremony: location,
    party: location,
    dressCode: z
      .object({
        title: text,
        description: text,
        dos: z.array(text).max(30),
        donts: z.array(text).max(30),
        palette: z
          .array(
            z.object({ name: text, hex: z.string().regex(/^#[a-f0-9]{6}$/i) }),
          )
          .max(12),
        gallery: z
          .array(z.object({ title: text, description: text, image: url }))
          .max(20),
      })
      .strict(),
    gifts: z
      .array(
        z
          .object({
            id: text,
            title: text,
            category: text,
            categoryLabel: text,
            price: z.number().nonnegative().max(1000000).optional(),
            image: url,
            description: text.optional(),
            featured: z.boolean().optional(),
            creditCardUrl: url.optional(),
          })
          .strict(),
      )
      .max(300),
    pix: z
      .object({
        key: text,
        keyType: z.enum(["cpf", "cnpj", "email", "phone", "random"]),
        receiverName: text,
        city: text,
        whatsappConfirmationPhone: text,
      })
      .strict(),
    creditCard: z
      .object({
        enabled: z.boolean(),
        defaultPaymentLink: url,
        installmentsInfo: text.optional(),
        providerName: text.optional(),
      })
      .strict()
      .optional(),
    rsvp: z
      .object({
        googleAppsScriptUrl: z.literal(""),
        deadlineDate: text.optional(),
        contactWhatsApp: text,
      })
      .strict(),
    ui: z
      .object({
        primaryColorName: text.optional(),
        spotifyPlaylistUrl: url.optional(),
      })
      .strict()
      .optional(),
  })
  .strict();
export const slugSchema = z
  .string()
  .refine(
    validWeddingSlug,
    "Use de 3 a 80 letras minúsculas, números e hífens, sem nomes reservados.",
  );
export const weddingUpdateSchema = z
  .object({
    templateId:z.enum(templateIds).optional(),
    expectedUpdatedAt:z.string().optional(),
    config: weddingConfigSchema,
    theme: z.enum(["botanical", "rose", "ocean"]),
    status: z.enum(["draft", "published", "suspended", "archived"]),
  })
  .strict()
  .superRefine((value, ctx) => {
    if(value.config.gifts.some(gift=>!gift.title.trim()||!gift.price||gift.price<=0))ctx.addIssue({code:"custom",path:["config","gifts"],message:"Preencha o nome e um valor sugerido maior que zero para cada presente."});
    if(value.config.gifts.length>0&&!/^https:\/\/[^\s]+$/i.test(value.config.giftPaymentLink??""))ctx.addIssue({code:"custom",path:["config","giftPaymentLink"],message:"Adicione o link único de pagamento para salvar a lista de presentes."});
    if (
      value.status === "published" &&
      (!value.config.couple.weddingDate || !value.config.ceremony.placeName)
    )
      ctx.addIssue({
        code: "custom",
        message: "Defina a data e o local antes de publicar.",
      });
  });
