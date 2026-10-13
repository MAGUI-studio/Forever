import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { requireAccess, assertModule } from "@/lib/guest-server";
import { MAX_GALLERY_PHOTOS } from "@/config/gallery";

const f = createUploadthing();

async function authenticateAdmin({ req }: { req: Request }) {
  try {
    const access = await requireAccess(req);
    assertModule(access.wedding, "siteEditor");
    if (access.role !== "admin") {
      throw new UploadThingError("Acesso exclusivo da administração.");
    }
    return {
      weddingSlug: access.wedding.slug,
      userId: access.uid,
      userEmail: access.email,
    };
  } catch (error) {
    if (error instanceof UploadThingError) throw error;
    const message = error instanceof Error ? error.message : "Não autorizado.";
    throw new UploadThingError(message);
  }
}

export const ourFileRouter = {
  galleryUploader: f({
    "image/png": { maxFileSize: "1MB", maxFileCount: MAX_GALLERY_PHOTOS },
    "image/webp": { maxFileSize: "1MB", maxFileCount: MAX_GALLERY_PHOTOS },
  })
    .middleware(authenticateAdmin)
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        url: file.ufsUrl || file.url,
        key: file.key,
        name: file.name,
        size: file.size,
        uploadedBy: metadata.userId,
      };
    }),

  singleImageUploader: f({
    "image/png": { maxFileSize: "1MB", maxFileCount: 1 },
    "image/webp": { maxFileSize: "1MB", maxFileCount: 1 },
  })
    .middleware(authenticateAdmin)
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        url: file.ufsUrl || file.url,
        key: file.key,
        name: file.name,
        size: file.size,
        uploadedBy: metadata.userId,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
