import {isPlatformAdmin} from "./platform-access";
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
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "unknown";
    console.error("AUTH_TOKEN_VERIFICATION_ERROR", JSON.stringify({
      code,
      message: error instanceof Error ? error.message : "Token verification failed",
    }));
    if (["auth/id-token-expired", "auth/id-token-revoked", "auth/invalid-id-token", "auth/argument-error", "auth/user-disabled", "auth/user-not-found"].includes(code)) {
      throw new HttpError(401, "Sua sessão expirou. Entre novamente.");
    }
    throw new HttpError(503, "Não foi possível validar a sessão no servidor. Tente novamente em instantes.", undefined, "AUTH_TOKEN_VERIFICATION_ERROR");
  }
  const superadmin=await isPlatformAdmin(identity.uid, identity);
  return { identity, superadmin };
}
