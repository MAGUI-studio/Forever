import { isPlanExpired } from "@/config/plan-access";
import { resolveModules } from "@/config/modules";
import { services } from "@/lib/firebase/admin";
import { platformIdentity } from "@/lib/platform-server";
import { failure, HttpError, reply, tokenId } from "@/lib/guest-server";
import { mapConcurrent } from "@/lib/map-concurrent";
export async function GET(request: Request) {
  try {
    const { identity, superadmin } = await platformIdentity(request),
      db = services().db;
    if (superadmin)
      return reply({ destination: "/studio", role: "superadmin", plan: "foreverPro" });
    const weddings = await db
      .collection("weddings")
      .select("status", "plan", "modules", "config.couple.weddingDate")
      .get();
    const matches = (
      await mapConcurrent(weddings.docs, async (wedding) => {
        const data = wedding.data();
        const member = (await wedding.ref.collection("members").doc(identity.uid).get()).data();
        const isAdmin = member?.active && member.role === "admin";
        const team =
          !isAdmin && identity.email && resolveModules(data.modules, data.plan).team
            ? (
                await wedding.ref
                  .collection("receptionTeam")
                  .doc(tokenId(identity.email.toLowerCase()))
                  .get()
              ).data()
            : null;
        const role = isAdmin
          ? "admin"
          : team?.active && (identity.email_verified || team.uid === identity.uid)
            ? "reception"
            : null;
        if (role === "reception" && !resolveModules(data.modules, data.plan).team) return null;
        return role
          ? {
              slug: wedding.id,
              status: data.status,
              role,
              plan: data.plan,
              config: data.config,
            }
          : null;
      })
    ).filter((match) => match !== null);
    if (!matches.length) return reply({ destination: "/contratar", role: "customer", plan: null });
    if (matches.length > 1)
      throw new HttpError(
        409,
        "Esta conta possui mais de um vínculo. Solicite a correção à MAGUI.studio.",
      );
    const wedding = matches[0];
    if (wedding.plan === null)
      throw new HttpError(
        403,
        "Seu casamento está sem plano. Assine novamente para recuperar o acesso.",
        undefined,
        "PLAN_REQUIRED",
      );
    if (isPlanExpired(wedding))
      return reply({
        destination: "/" + wedding.slug + "/acesso-expirado",
        slug: wedding.slug,
        role: wedding.role,
        plan: wedding.plan,
      });
    if (["suspended", "archived"].includes(wedding.status))
      throw new HttpError(403, "O acesso a este casamento está suspenso ou arquivado.");
    return reply({
      destination:
        "/" + wedding.slug + "/" + (wedding.role === "reception" ? "recepcao" : "painel"),
      slug: wedding.slug,
      role: wedding.role,
      plan: wedding.plan === "essencial" ? "essencial" : "foreverPro",
    });
  } catch (e) {
    return failure(e);
  }
}
