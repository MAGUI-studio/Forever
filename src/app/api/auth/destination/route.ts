// Load server dependencies within the request so import failures can be logged.
export async function GET(request: Request) {
  try {
    const handler = await import("./handler");
    return await handler.GET(request);
  } catch (error) {
    console.error("AUTH_DESTINATION_MODULE_ERROR", JSON.stringify({
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Module initialization failed",
    }));
    return Response.json(
      { error: "Não foi possível iniciar o serviço de login.", code: "AUTH_DESTINATION_MODULE_ERROR" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
