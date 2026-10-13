import {assertModule} from "@/lib/guest-server";
import { getStorage } from "firebase-admin/storage";
import { randomUUID } from "node:crypto";
import {
  requireAccess,
  HttpError,
  reply,
  failure,
  limitedBody,
} from "@/lib/guest-server";
import { services } from "@/lib/firebase/admin";
export async function POST(request: Request) {
  try {
    const { role, wedding } = await requireAccess(request);assertModule(wedding,"siteEditor");
    if (role !== "admin")
      throw new HttpError(403, "Acesso exclusivo da administração.");
    const length = Number(request.headers.get("content-length") ?? 0);
    if (length > 8 * 1024 * 1024)
      throw new HttpError(413, "Use uma imagem de até 8 MB.");
    const payload = await limitedBody(request, 8 * 1024 * 1024 + 65536);
    const form = await new Response(payload, {
        headers: { "Content-Type": request.headers.get("content-type") ?? "" },
      }).formData(),
      file = form.get("file");
    if (!(file instanceof File) || file.size > 8 * 1024 * 1024)
      throw new HttpError(400, "Selecione uma imagem de até 8 MB.");
    const bytes = Buffer.from(await file.arrayBuffer());
    let extension = "";
    if (bytes[0] === 0xff && bytes[1] === 0xd8) extension = "jpg";
    else if (
      bytes
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    )
      extension = "png";
    else if (
      bytes.toString("ascii", 0, 4) === "RIFF" &&
      bytes.toString("ascii", 8, 12) === "WEBP"
    )
      extension = "webp";
    if (!extension)
      throw new HttpError(400, "Use uma imagem JPG, PNG ou WebP.");
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
    if (!bucketName)
      throw new HttpError(
        503,
        "O armazenamento de imagens ainda não foi configurado.",
      );
    services();
    const app = (await import("firebase-admin/app"))
      .getApps()
      .find((a) => a.name === "wedding-server")!;
    const token = randomUUID(),
      name = "weddings/" + wedding.slug + "/" + randomUUID() + "." + extension;
    await getStorage(app)
      .bucket(bucketName)
      .file(name)
      .save(bytes, {
        resumable: false,
        metadata: {
          contentType:
            extension === "jpg" ? "image/jpeg" : "image/" + extension,
          cacheControl: "public,max-age=31536000,immutable",
          metadata: { firebaseStorageDownloadTokens: token },
        },
      });
    return reply({
      url:
        "https://firebasestorage.googleapis.com/v0/b/" +
        bucketName +
        "/o/" +
        encodeURIComponent(name) +
        "?alt=media&token=" +
        token,
    });
  } catch (e) {
    return failure(e);
  }
}
