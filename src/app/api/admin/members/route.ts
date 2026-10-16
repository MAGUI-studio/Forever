import { bindWeddingUser, releaseWeddingUser } from "@/lib/wedding-membership";
import { z } from "zod";
import { services } from "@/lib/firebase/admin";
import { body, failure, HttpError, reply, requireAccess } from "@/lib/guest-server";
import { audit } from "@/lib/event-audit";
export async function GET(request: Request) {
  try {
    const access = await requireAccess(request);
    if (access.role !== "admin") throw new HttpError(403, "Acesso exclusivo da administração.");
    return reply({
      members: (await access.db.collection("members").get()).docs.map((d) => ({
        id: d.id,
        email: d.data().email ?? "",
        active: d.data().active,
      })),
    });
  } catch (e) {
    return failure(e);
  }
}
const schema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("add"),
      email: z.string().trim().email().max(254),
      password: z.string().min(8).max(128).optional(),
    })
    .strict(),
  z.object({ action: z.literal("remove"), uid: z.string().min(1).max(128) }).strict(),
]);
export async function POST(request: Request) {
  let created: string | undefined;
  try {
    const access = await requireAccess(request);
    if (access.role !== "admin") throw new HttpError(403, "Acesso exclusivo da administração.");
    const data = schema.parse(await body(request));
    if (data.action === "remove") {
      if (data.uid === access.uid)
        throw new HttpError(400, "Você não pode remover seu próprio acesso.");
      await access.db.runTransaction(async (t) => {
        const members = await t.get(access.db.collection("members"));
        const target = members.docs.find((d) => d.id === data.uid);
        if (!target) throw new HttpError(404, "Responsável não encontrado.");
        if (members.docs.filter((d) => d.data().active && d.data().role === "admin").length <= 1)
          throw new HttpError(400, "Mantenha ao menos um responsável.");
        await releaseWeddingUser(t, data.uid, access.wedding.slug);
        t.delete(target.ref);
        audit(t, access.db, access.email, "Responsável removido", target.data().email ?? data.uid);
      });
      return reply({ success: true });
    }
    const auth = services().auth;
    let account;
    try {
      account = await auth.getUserByEmail(data.email);
    } catch (e) {
      if ((e as { code?: string }).code !== "auth/user-not-found") throw e;
      if (!data.password) throw new HttpError(400, "Informe a senha para criar a nova conta.");
      account = await auth.createUser({
        email: data.email,
        password: data.password,
      });
      created = account.uid;
    }
    await access.db.runTransaction(async (t) => {
      await bindWeddingUser(t, account.uid, data.email, access.wedding.slug);
      t.set(access.db.collection("members").doc(account.uid), {
        uid: account.uid,
        email: data.email.toLowerCase(),
        active: true,
        role: "admin",
      });
      audit(t, access.db, access.email, "Responsável adicionado", data.email);
    });
    return reply({ success: true });
  } catch (e) {
    if (created) await services().auth.deleteUser(created);
    return failure(e);
  }
}
