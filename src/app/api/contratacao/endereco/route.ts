import { platformIdentity } from "@/lib/platform-server";
import { services } from "@/lib/firebase/admin";
import { failure, reply } from "@/lib/guest-server";
import { validWeddingSlug } from "@/config/forever";

export async function GET(request: Request) {
  try {
    await platformIdentity(request);
    const slug = new URL(request.url).searchParams.get("slug") ?? "";
    if (!validWeddingSlug(slug)) return reply({ available: false, reason: "invalid" });
    const exists = (await services().db.doc(`weddings/${slug}`).get()).exists;
    return reply({ available: !exists, reason: exists ? "taken" : null });
  } catch (error) {
    return failure(error);
  }
}
