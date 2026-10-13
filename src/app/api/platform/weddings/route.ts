import {bindWeddingUser} from "@/lib/wedding-membership";
import { services } from "@/lib/firebase/admin";
import { platformIdentity } from "@/lib/platform-server";
import { body, failure, HttpError, reply } from "@/lib/guest-server";
import { slugSchema } from "@/lib/wedding-schema";
import { emptyWeddingConfig } from "@/config/forever";
import { z } from "zod";
export async function GET(request: Request) {
  try {
    const { identity, superadmin } = await platformIdentity(request),
      db = services().db;
    const list = await db.collection("weddings").get();
    const weddings = [];
    for (const document of list.docs) {
      const member = superadmin
        ? true
        : (
            await document.ref.collection("members").doc(identity.uid).get()
          ).data()?.active === true;
      const reception = identity.email
        ? (
            await document.ref
              .collection("receptionTeam")
              .doc(
                (await import("@/lib/guest-server")).tokenId(
                  identity.email.toLowerCase(),
                ),
              )
              .get()
          ).data()
        : null;
      if (
        member ||
        (reception?.active &&
          (identity.email_verified || reception.uid === identity.uid))
      ) {
        const data = document.data();
        weddings.push({
          slug: document.id,
          status: data.status,
          config: data.config,
          theme: data.theme,
        });
      }
    }
    return reply({ superadmin, weddings });
  } catch (e) {
    return failure(e);
  }
}
const createSchema = z
  .object({
    slug: slugSchema,
    partner1: z.string().trim().min(1).max(80),
    partner2: z.string().trim().min(1).max(80),
    ownerEmail: z.string().trim().email().max(254),
    ownerPassword: z.string().min(8).max(128).optional(),
  })
  .strict();
export async function POST(request: Request) {
  let createdUid: string | undefined;
  try {
    const { auth, db } = services();
    const { superadmin } = await platformIdentity(request);
    if (!superadmin)
      throw new HttpError(403, "Esta ação é exclusiva da MAGUI.studio.");
    const data = createSchema.parse(await body(request));
    const ref = db.doc("weddings/" + data.slug);
    if ((await ref.get()).exists)
      throw new HttpError(409, "Este endereço já está em uso.");
    let owner;
    try {
      owner = await auth.getUserByEmail(data.ownerEmail);
    } catch (e) {
      if ((e as { code?: string }).code !== "auth/user-not-found") throw e;
      if (!data.ownerPassword)
        throw new HttpError(400, "Informe a senha para criar a nova conta.");
      owner = await auth.createUser({
        email: data.ownerEmail,
        password: data.ownerPassword,
      });
      createdUid = owner.uid;
    }
    const now = new Date().toISOString();
    await db.runTransaction(async (t) => {
      if ((await t.get(ref)).exists)
        throw new HttpError(409, "Este endereço já está em uso.");
      await bindWeddingUser(t,owner.uid,data.ownerEmail,data.slug);
      t.set(ref, {
        slug: data.slug,
        status: "draft",
        theme: "botanical",
        config: {
          ...emptyWeddingConfig,
          couple: {
            ...emptyWeddingConfig.couple,
            partner1: data.partner1,
            partner2: data.partner2,
          },
        },
        createdAt: now,
        updatedAt: now,
      });
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
    const { superadmin } = await platformIdentity(request);
    if (!superadmin)
      throw new HttpError(403, "Acesso exclusivo da MAGUI.studio.");
    const data = z
      .object({
        slug: slugSchema,
        status: z.enum(["draft", "suspended", "archived"]),
      })
      .strict()
      .parse(await body(request));
    const ref = services().db.doc("weddings/" + data.slug);
    if (!(await ref.get()).exists)
      throw new HttpError(404, "Casamento não encontrado.");
    await ref.update({
      status: data.status,
      updatedAt: new Date().toISOString(),
    });
    return reply({ success: true });
  } catch (e) {
    return failure(e);
  }
}
