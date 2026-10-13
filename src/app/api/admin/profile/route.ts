import {preserveTemplateImages} from "@/lib/template-images";
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
      const current=await t.get(ref);
      if(data.expectedUpdatedAt&&data.expectedUpdatedAt!==current.data()?.updatedAt)throw new HttpError(409,"O site foi alterado em outra sessão. Atualize antes de salvar.");
      const {expectedUpdatedAt,...update}=data;
      update.config=preserveTemplateImages(update.config,current.data()!.config);
      t.update(ref, { ...update,siteRevision:(current.data()?.siteRevision??0)+1, updatedAt: new Date().toISOString() });
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
