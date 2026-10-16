import { requireAccess, assertModule, body, reply, failure, HttpError } from "@/lib/guest-server";
import { UTApi } from "uploadthing/server";
import { runtimeEnv } from "@/lib/runtime-env";
import { getUploadThingKey } from "@/config/gallery";
import { z } from "zod";

const cleanupSchema = z
  .object({
    keys: z.array(z.string().max(500)).max(20).optional(),
    urls: z.array(z.string().max(2048)).max(20).optional(),
  })
  .strict();

export async function POST(request: Request) {
  try {
    const access = await requireAccess(request);
    assertModule(access.wedding, "siteEditor");
    if (access.role !== "admin") {
      throw new HttpError(403, "Acesso exclusivo da administração.");
    }

    const payload = cleanupSchema.parse(await body(request));
    const keysToDelete = new Set<string>();

    for (const key of payload.keys ?? []) {
      const parsed = getUploadThingKey(key);
      if (parsed) keysToDelete.add(parsed);
    }
    for (const url of payload.urls ?? []) {
      const parsed = getUploadThingKey(url);
      if (parsed) keysToDelete.add(parsed);
    }

    if (keysToDelete.size === 0) {
      return reply({ success: true, deletedCount: 0 });
    }

    try {
      const utapi = new UTApi({ token: runtimeEnv("UPLOADTHING_TOKEN") });
      const result = await utapi.deleteFiles(Array.from(keysToDelete));
      return reply({ success: true, deletedCount: result.deletedCount });
    } catch (err) {
      console.error("Erro ao deletar arquivos do UploadThing:", err);
      // Even if cloud deletion has transient issues, reply with error or success
      return reply({
        success: false,
        warning: "Falha ao remover alguns arquivos do storage remoto.",
        keys: Array.from(keysToDelete),
      });
    }
  } catch (error) {
    return failure(error);
  }
}
