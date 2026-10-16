import { initialWeddingConfig, weddingRegistrationFields } from "@/lib/wedding-registration";
import { resolveModules } from "@/config/modules";
import { audit } from "@/lib/event-audit";
import { scopedDatabase } from "@/lib/wedding-server";
import { bindWeddingUser } from "@/lib/wedding-membership";
import { services } from "@/lib/firebase/admin";
import { platformIdentity } from "@/lib/platform-server";
import { body, failure, HttpError, reply, tokenId } from "@/lib/guest-server";
import { mapConcurrent } from "@/lib/map-concurrent";
import { slugSchema } from "@/lib/wedding-schema";
import { foreverTemplateId } from "@/config/templates/registry";
import { z } from "zod";
import { passwordRequirements } from "@/lib/password-requirements";
export async function GET(request: Request) {
  try {
    const { identity, superadmin } = await platformIdentity(request),
      db = services().db;
    const summary = new URL(request.url).searchParams.get("summary") === "1";
    const collection = db.collection("weddings");
    const list = await (
      summary
        ? collection.select(
            "status",
            "plan",
            "modules",
            "theme",
            "config.couple.partner1",
            "config.couple.partner2",
          )
        : collection
    ).get();
    const weddings = (
      await mapConcurrent(list.docs, async (document) => {
        const data = document.data();
        const member = superadmin
          ? true
          : (await document.ref.collection("members").doc(identity.uid).get()).data()?.active ===
            true;
        const reception =
          !member && identity.email && resolveModules(data.modules, data.plan).team
            ? (
                await document.ref
                  .collection("receptionTeam")
                  .doc(tokenId(identity.email.toLowerCase()))
                  .get()
              ).data()
            : null;
        if (
          member ||
          (reception?.active && (identity.email_verified || reception.uid === identity.uid))
        ) {
          if (!superadmin && data.plan === null) return null;
          if (!superadmin && !member && !resolveModules(data.modules, data.plan).team) return null;
          return {
            slug: document.id,
            plan:
              data.plan === null ? null : data.plan === "essencial" ? "essencial" : "foreverPro",
            status: data.status,
            config: data.config,
            theme: data.theme,
            modules: resolveModules(data.modules, data.plan),
          };
        }
        return null;
      })
    ).filter((wedding) => wedding !== null);
    return reply({ superadmin, weddings });
  } catch (e) {
    return failure(e);
  }
}
const createSchema = z
  .object({
    slug: slugSchema,
    ...weddingRegistrationFields,
    ownerEmail: z.string().trim().email().max(254),
    ownerPassword: z
      .string()
      .max(128)
      .refine(
        (value) => passwordRequirements.every((rule) => rule.test(value)),
        "A senha precisa de pelo menos 8 caracteres, uma letra maiúscula, uma minúscula, um número e um símbolo.",
      )
      .optional(),
    plan: z.enum(["essencial", "foreverPro"]).optional(),
  })
  .strict();
export async function POST(request: Request) {
  let createdUid: string | undefined;
  try {
    const { auth, db } = services();
    const { superadmin } = await platformIdentity(request);
    if (!superadmin) throw new HttpError(403, "Esta ação é exclusiva da MAGUI.studio.");
    const data = createSchema.parse(await body(request));
    const ref = db.doc("weddings/" + data.slug);
    if ((await ref.get()).exists) throw new HttpError(409, "Este endereço já está em uso.");
    let owner;
    try {
      owner = await auth.getUserByEmail(data.ownerEmail);
    } catch (e) {
      if ((e as { code?: string }).code !== "auth/user-not-found") throw e;
      if (!data.ownerPassword) throw new HttpError(400, "Informe a senha para criar a nova conta.");
      owner = await auth.createUser({
        email: data.ownerEmail,
        password: data.ownerPassword,
      });
      createdUid = owner.uid;
    }
    const now = new Date().toISOString();
    await db.runTransaction(async (t) => {
      if ((await t.get(ref)).exists) throw new HttpError(409, "Este endereço já está em uso.");
      await bindWeddingUser(t, owner.uid, data.ownerEmail, data.slug);
      t.set(ref, {
        slug: data.slug,
        status: "draft",
        theme: "botanical",
        templateId: foreverTemplateId,
        plan: data.plan ?? "foreverPro",
        config: initialWeddingConfig({
          partner1: data.partner1,
          partner2: data.partner2,
          weddingDate: data.weddingDate,
        }),
        purchaseOwnerUid: owner.uid,
        createdAt: now,
        updatedAt: now,
      });
      t.set(ref.collection("settings").doc("rsvp"), { enabled: true, deadline: "" });
      t.set(ref.collection("members").doc(owner.uid), {
        uid: owner.uid,
        email: data.ownerEmail.toLowerCase(),
        role: "admin",
        active: true,
      });
    });
    return reply({ slug: data.slug }, 201);
  } catch (e) {
    if (createdUid) await services().auth.deleteUser(createdUid);
    return failure(e);
  }
}

export async function PATCH(request: Request) {
  try {
    const { superadmin, identity } = await platformIdentity(request);
    if (!superadmin) throw new HttpError(403, "Acesso exclusivo da MAGUI.studio.");
    const data = z
      .object({
        slug: slugSchema,
        status: z.enum(["draft", "suspended", "archived"]).optional(),
        plan: z.enum(["essencial", "foreverPro"]).nullable().optional(),
      })
      .strict()
      .refine((v) => v.status !== undefined || v.plan !== undefined, "Nenhum campo para atualizar.")
      .parse(await body(request));
    const ref = services().db.doc("weddings/" + data.slug);
    await services().db.runTransaction(async (transaction) => {
      const current = await transaction.get(ref);
      if (!current.exists) throw new HttpError(404, "Casamento não encontrado.");
      const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
      if (data.status) updates.status = data.status;
      if (data.plan !== undefined) updates.plan = data.plan;
      transaction.update(ref, updates);
      if (data.plan !== undefined) {
        audit(
          transaction,
          scopedDatabase(services().db, data.slug),
          identity.email ?? "MAGUI.studio",
          "Plano alterado manualmente",
          data.slug,
          `${current.data()?.plan ?? "Sem plano"} → ${data.plan ?? "Sem plano"}`,
        );
      }
    });
    return reply({ success: true });
  } catch (e) {
    return failure(e);
  }
}
