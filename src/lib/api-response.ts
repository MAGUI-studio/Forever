/** Preserve a useful message when a hosting platform returns HTML or an empty error. */
export async function readApiResponse(response:Response) {
  const text = await response.text();
  let result;
  try {result = JSON.parse(text);} catch {throw new Error("Não foi possível carregar os dados (HTTP "+response.status+"). Tente novamente em instantes.");}
  if(!response.ok) throw new Error(typeof result?.error === "string" ? result.error : "Não foi possível concluir a solicitação (HTTP "+response.status+").");
  return result;
}
