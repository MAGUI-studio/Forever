/** Preserve a useful message when a hosting platform returns HTML or an empty error. */
export async function readApiResponse(response:Response, options: {redirectOnPlanRequired?: boolean} = {}) {
  const text = await response.text();
  let result;
  try {result = JSON.parse(text);} catch {throw new Error("Não foi possível carregar os dados (HTTP "+response.status+"). Tente novamente em instantes.");}
  if(!response.ok) {
    if(options.redirectOnPlanRequired !== false && typeof window !== "undefined" && response.status === 403 && result?.code === "PLAN_REQUIRED") {
      const [{signOut},{clientAuth}]=await Promise.all([import("firebase/auth"),import("@/lib/firebase/client")]);
      await signOut(clientAuth());
      window.location.replace("/login?reason=sem-plano");
      throw new Error("Seu casamento está sem plano. Assine novamente para recuperar o acesso.");
    }
    if(typeof window !== "undefined" && response.status === 403 && typeof result?.redirect === "string" && /^\/[a-z0-9-]+\/acesso-expirado$/.test(result.redirect)) window.location.replace(result.redirect);
    throw Object.assign(new Error(typeof result?.error === "string" ? result.error : "Não foi possível concluir a solicitação (HTTP "+response.status+")."), {code:result?.code});
  }
  return result;
}
