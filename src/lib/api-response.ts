/** Preserve a useful message when a hosting platform returns HTML or an empty error. */
export async function readApiResponse(response:Response) {
  const text = await response.text();
  let result;
  try {result = JSON.parse(text);} catch {throw new Error("Não foi possível carregar os dados (HTTP "+response.status+"). Tente novamente em instantes.");}
  if(!response.ok) {
    if(typeof window !== "undefined" && response.status === 403 && typeof result?.redirect === "string" && /^\/[a-z0-9-]+\/acesso-expirado$/.test(result.redirect)) window.location.replace(result.redirect);
    throw new Error(typeof result?.error === "string" ? result.error : "Não foi possível concluir a solicitação (HTTP "+response.status+").");
  }
  return result;
}
