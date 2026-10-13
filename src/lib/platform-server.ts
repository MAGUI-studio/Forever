import "server-only";
import { services } from "./firebase/admin";
import { HttpError, sameOrigin } from "./guest-server";
export async function platformIdentity(request: Request) {
  sameOrigin(request);
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new HttpError(401, "Faça login para continuar.");
  let identity;
  try {
    identity = await services().auth.verifyIdToken(token, true);
  } catch {
    throw new HttpError(401, "Sua sessão expirou.");
  }
  const superadmin = (process.env.MAGUI_ADMIN_UIDS ?? "")
    .split(",")
    .map((v) => v.trim())
    .includes(identity.uid);
  return { identity, superadmin };
}
