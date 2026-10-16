import { deterministicShortCode, personalToken } from "./guest-server";
import { redactModuleData, type WeddingModules } from "@/config/modules";
import type { WeddingDatabase } from "./wedding-server";
export async function adminInvitations(
  db: WeddingDatabase,
  modules: WeddingModules,
  mode: "links" | "overview" | "operations" = "links",
) {
  if (!modules.guestList) return [];
  const query = db.collection("invitations").orderBy("updatedAt", "desc");
  const snap = await (
    mode === "links"
      ? query
      : query.select(
          "label",
          "kind",
          "active",
          "revision",
          "guests",
          "personalResponses",
          "message",
          "dietaryRestrictions",
          ...(mode === "overview" ? ["sentAt", "openedAt"] : []),
        )
  ).get();
  if (mode !== "links")
    return redactModuleData(
      snap.docs.map((d) => ({ sentAt: null, ...d.data(), id: d.id })),
      modules,
    );
  return redactModuleData(
    snap.docs.map((d) => {
      const item = d.data();
      const code = item.code ?? deterministicShortCode(d.id);
      const guestCodes = item.guestCodes ?? {};
      const personalCodes = Object.fromEntries(
        (item.guests ?? []).map((g: { id: string }) => [
          g.id,
          guestCodes[g.id] ??
            (item.kind === "individual" || (item.guests ?? []).length === 1
              ? code
              : deterministicShortCode(d.id + ":" + g.id)),
        ]),
      );
      return {
        sentAt: null,
        ...item,
        id: d.id,
        code,
        personalCodes,
        personalTokens: Object.fromEntries(
          (item.guests ?? []).map((g: { id: string }) => [
            g.id,
            personalToken(d.id, item.token, g.id),
          ]),
        ),
      };
    }),
    modules,
  );
}
