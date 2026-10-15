import { copySections, switchTemplateCopy, templateCopyFields, type CopySection, type TemplateId } from "@/config/templates/registry";
import type { WeddingConfig } from "@/types/wedding";

/** Compare with the last saved version so reverting a field removes its section. */
export function unsavedSections(config: WeddingConfig, templateId: TemplateId, savedSnapshot: string): string[] {
  if (!savedSnapshot) return [];
  const saved = JSON.parse(savedSnapshot) as { config: WeddingConfig; templateId: TemplateId };
  const labels = new Set<string>();
  const changed = (before: unknown, after: unknown) => JSON.stringify(before) !== JSON.stringify(after);
  const add = (section: CopySection) => labels.add(copySections[section].label);
  if (saved.templateId !== templateId) labels.add("Template do site");
  const baselineCopy = saved.templateId === templateId ? saved.config.copy : switchTemplateCopy(saved.config.copy, saved.templateId, templateId);
  for (const field of templateCopyFields(templateId)) {
    if (changed(baselineCopy?.[field.key], config.copy?.[field.key])) add(field.section);
  }
  const { story: oldStory, headline: oldHeadline, coverImage: oldCover, ...oldCouple } = saved.config.couple;
  const { story, headline, coverImage, ...couple } = config.couple;
  if (changed(oldCouple, couple)) labels.add("Configurações");
  if (changed(oldHeadline, headline) || changed(oldCover, coverImage)) add("hero");
  if (changed(oldStory, story)) add("story");
  const { image: oldVenueImage, ...oldVenue } = saved.config.ceremony;
  const { image: venueImage, ...venue } = config.ceremony;
  if (changed(saved.config.sameVenue !== false, config.sameVenue !== false) || changed(oldVenue, venue) || changed(saved.config.party, config.party)) labels.add("Configurações");
  if (changed(oldVenueImage, venueImage)) add("events");
  if (changed(saved.config.gallery, config.gallery) || changed(saved.config.galleryStyle, config.galleryStyle) || changed(saved.config.sections, config.sections)) add("gallery");
  if (changed(saved.config.dressCode, config.dressCode)) add("dressCode");
  if (changed(saved.config.gifts, config.gifts) || changed(saved.config.giftPaymentLink, config.giftPaymentLink) || changed(saved.config.pix, config.pix) || changed(saved.config.creditCard, config.creditCard)) add("gifts");
  if (changed(saved.config.rsvp, config.rsvp)) add("rsvp");
  const imageSections: Record<string, CopySection> = { hero: "hero", story: "story", detail: "story", venue: "events", schedule: "schedule", dress: "dressCode", rsvp: "rsvp", footer: "footer" };
  for (const key of new Set([...Object.keys(saved.config.customImages ?? {}), ...Object.keys(config.customImages ?? {})])) {
    if (changed(saved.config.customImages?.[key], config.customImages?.[key])) {
      const section = imageSections[key.split(".").at(-1)!];
      if (section) add(section);
    }
  }
  return [...labels];
}
