import {assertModule} from "@/lib/guest-server";
import {
  body,
  failure,
  reply,
  requireAccess,
  HttpError,
} from "@/lib/guest-server";
import { weddingUpdateSchema } from "@/lib/wedding-schema";
import { services } from "@/lib/firebase/admin";
import { audit } from "@/lib/event-audit";
export async function PUT(request: Request) {
  try {
    const access = await requireAccess(request);assertModule(access.wedding,"siteEditor");
    if (access.role !== "admin")
      throw new HttpError(403, "Acesso exclusivo da administração.");
    const data = weddingUpdateSchema.parse(await body(request));
    if (!["draft", "published"].includes(data.status))
      throw new HttpError(
        400,
        "Use o painel MAGUI para suspender ou arquivar.",
      );
    const ref = services().db.doc("weddings/" + access.wedding.slug);
    await access.db.runTransaction(async (t) => {
      t.update(ref, { ...data, updatedAt: new Date().toISOString() });
      audit(
        t,
        access.db,
        access.email,
        "Site atualizado",
        access.wedding.slug,
        data.status,
      );
    });
    return reply({ success: true });
  } catch (e) {
    return failure(e);
  }
}
