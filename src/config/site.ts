import { FOREVER_ORIGIN, weddingPath } from "./forever";
export const SITE_URL = FOREVER_ORIGIN;
export function invitationUrl(token: string, slug: string) {
  return (
    (process.env.NODE_ENV === "development" && typeof window !== "undefined"
      ? window.location.origin
      : SITE_URL) +
    weddingPath(slug, "rsvp") +
    "#" +
    token
  );
}
