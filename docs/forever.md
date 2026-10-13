# Forever by MAGUI.studio

## Modules

Platform administrators manage wedding features at `/studio/modules?wedding={slug}`. The catalog and dependency rules live in `src/config/modules.ts`; flags are stored in `weddings/{slug}.modules`. Missing flags preserve existing features. Disabling a prerequisite disables its dependents. Enabling a dependent enables its prerequisites; re-enabling a prerequisite does not automatically restore every dependent.

Disabled modules hide navigation, fields, alerts and legends, reject protected API actions and redact disabled notes from responses and exports. Existing Firestore values are preserved. Refresh open tabs after changing modules; server checks apply on every request. Infrastructure audit recording continues when the history screen is disabled.

Authorize an existing Firebase account with `node scripts/grant-platform-admin.mjs --email=operator@example.com`. This stores the account UID in the server-only `platformAdmins` collection. Platform administrators are redirected from `/login` to `/studio`.

Dietary restrictions and the dependent buffet module are disabled for `giovanna-e-edson`. Other weddings are unaffected.

## Addresses and data model

Production uses only https://forever.magui.studio/{slug}. There is no custom-domain feature. Slugs are immutable, lowercase and unique. Reserved paths cannot be used.

- /login: shared sign-in and password recovery. Each account is redirected to its single linked wedding (dashboard for owners, check-in for reception). /admin redirects to /login.
- /studio: MAGUI-only operations console for creating, suspending and archiving weddings. Customers never see a wedding selector.
- /{slug}: published wedding site.
- /{slug}/presentes and /{slug}/rsvp: gifts and private invitation responses.
- /{slug}/admin/*: wedding dashboard and management.
- /{slug}/admin/site: content, theme, media and publication editor.

Firestore: weddings/{slug} stores the public configuration and lifecycle. invitations, settings, receptionTeam, members and auditLog are subcollections. All wedding APIs require x-wedding-slug and validate membership on the server. The slug is not a credential. Requests without a scope fail closed. Draft, suspended and archived sites are unavailable to public RSVP routes. Administrators use members/{uid}; reception users use a scoped receptionTeam record. MAGUI_ADMIN_UIDS grants platform administration. FIREBASE_ADMIN_UIDS no longer authorizes runtime access.

Firestore client access remains disabled by firestore.rules. Admin SDK credentials remain server-only. Passwords are sent only to Firebase Authentication and are excluded from Firestore and audit records. Removing reception access preserves the login account so it can be used in another wedding.

## Initial setup and migration

1. Add MAGUI_ADMIN_UIDS to Vercel with the UID of your MAGUI operator account. Keep owner UIDs in FIREBASE_ADMIN_UIDS only for the migration script.
2. Configure the Firebase Storage bucket via FIREBASE_STORAGE_BUCKET and ensure the service account can upload objects. Uploaded JPG/PNG/WebP files are restricted to 8 MB and scoped to a wedding. These photographs have public download URLs; do not upload confidential documents.
3. Configure forever.magui.studio in Vercel and authorize the domain in Firebase Authentication for sign-in/password recovery. HTTPS/certificates remain managed by hosting.
4. Run npm run migrate:legacy -- --slug=giovanna-e-edson for a read-only migration inventory. Then npm run migrate:legacy -- --slug=giovanna-e-edson --apply. This creates the wedding and its owner memberships atomically, preserves IDs/tokens and leaves the original global collections untouched. It refuses an existing destination and migrations exceeding 480 writes. For larger databases, prepare a checkpointed migration before deployment.
5. Verify scoped dashboard and RSVP links before publishing this branch. Update previously distributed links to include /giovanna-e-edson/rsvp; tokens remain valid in that wedding. The root now belongs to the Forever product, not to the legacy wedding.
6. New weddings are created in /studio as drafts. A new owner requires an initial password; an existing Firebase account keeps its password. Configure the date and venue before publication.

No production migration, DNS change, Storage configuration or deployment is performed automatically by this branch. The legacy content snapshot is kept only in scripts/legacy-wedding-config.ts for migration; it is not imported into application pages.

## Operations

Use the authenticated export in the site editor to download a wedding snapshot. Treat exports as confidential: they include invitations and access codes. Configure scheduled Firestore backups in the Firebase/Google Cloud project before commercial launch; the export is not a substitute for infrastructure backups. Restoring production data should be rehearsed in a separate environment.

Commercial follow-ups: automated billing/plan enforcement, contractual privacy and retention policy, monitoring/alerts, and offline reception synchronization require operational configuration and further implementation. The current check-in still requires connectivity. Third-party image URLs are accepted for content, but uploads to Firebase Storage are the supported image-hosting workflow.


### Template backgrounds

Background artwork belongs to the selected template. The botanical branches, flowers and hearts live in `BotanicalClassicOrnaments.tsx`. `visual-registry.ts` requires background and accent renderers for every template ID. Public pages, the live preview, admin pages, dialogs and loading screens resolve their artwork through `WeddingOrnaments` and `WeddingBranch`, using the wedding template ID. Generic platform screens use the default template. Add each new template’s own renderers to this registry rather than changing the shared botanical artwork.


### SEO and link previews

`src/lib/seo.ts` defines the production origin, canonical URLs, Open Graph and Twitter cards. All share cards use `public/SEO/og-image.png` (1200 × 630). Public wedding pages generate couple-specific titles and descriptions; confirmation links never expose guest names or invitation tokens in metadata. Private pages declare noindex for both general crawlers and Googlebot. `robots.txt` advertises `sitemap.xml`, which lists only the home page and published wedding slugs. Drafts, suspended weddings, archived weddings, admin routes and RSVP URLs are excluded. JSON-LD identifies the Forever website and MAGUI.studio publisher; wedding pages have WebPage data. New public routes should call `pageMetadata` with their own path, and private routes must set `index: false`. The image becomes available on the production URL after deployment.


### Independent site templates

`botanical-classic` remains the fallback for existing weddings. New weddings start with `contemporary-romance` (Romance contemporâneo). Each template has its own page composition, section list, editable copy and ornament/loading components. Romance adds a day schedule and its own animated countdown cards, and does not use the botanical envelope transition; attire, gifts, venue and footer use separate layouts. RSVP retains the shared authenticated invitation workflow with template-specific presentation.

The editor exposes only fields belonging to the selected template. Switching preserves authored content and gift data, fills missing or empty text from the destination defaults, and replaces inherited source defaults. The save API applies the same fallback. Switching does not publish until Save changes is used. Artwork is fixed, and the shared external payment link remains mandatory for nonempty catalogs.

Romance photography is bundled as optimized WebP artwork under `public/templates/contemporary-romance`, generated exclusively for this template with the built-in image generation tool. The immutable `romance-assets.ts` manifest supplies the public site and live preview. Photographs are decorative template artwork, independent of the couple's image fields. Hearts, bows and sparkles replace the original geometric emblem. Photo parallax and reveals honor reduced-motion preferences; no background gradients are added.

Romance now bundles eight exclusive photographs, with a different asset for each image placement. Eight section-specific background compositions use sixteen distinct hand-drawn motifs: silk, stars, letters, linked hearts, garlands, bells, glasses, confetti, bows, pearls, presents, arrows, envelopes, keys, moon and rings. Source prompts are documented in `public/templates/contemporary-romance/ARTWORK.md`.

The Romance hero has no navigation/header, fits the couple names onto one line and uses a narrower headline. Its countdown uses animated paper cards. The full-width heart garland is a separate divider before the venue; the small corner garland, moon and flowing silk motifs have been removed. RSVP cards align to their content height instead of stretching to the adjacent photo/text column.

### Couple gallery

Couples can choose from five distinct gallery styles via the "Estilo da galeria" select in the site editor:
- `polaroid` (Polaroid Clássica): tilted handmade paper frames without captions and soft levelling hover.
- `relicario` (Relicário Romântico): keepsake album with arch and oval frames, satin bows, heart emblems, and floating hearts.
- `varal` (Varal de Fotos): suspended string with miniature wooden clothespins and glowing fairy lights.
- `filme` (Película Vintage): 35mm photo booth strips with retro sprockets and nostalgic timestamps.
- `mural` (Mural Afetivo): scrapbook memory wall with pastel washi tape strips and gentle shadows.

Styles can be used across any template. Default styles fallback naturally (`polaroid` for Botanical Classic, `relicario` for Contemporary Romance). All styles share `GalleryLightbox` for full-screen viewing. `src/config/gallery.ts` defines `MAX_GALLERY_PHOTOS` (6), which also limits the schema, editor and stored data. Until couples can upload photos, six bundled placeholders under `public/gallery/placeholders` are shown when `config.gallery` is empty.

The gallery is the only section that can be hidden. It is shown by default: `galleryEnabled` hides it only when `config.sections.gallery` is explicitly `false`. The editor toggle "Exibir galeria no site" (section "Galeria do casal") controls it, and the schema drops any other section flags.

### Gallery photo uploads via UploadThing

Couples can upload up to 6 custom photos using the custom file input in the visual site editor (`GalleryUploader.tsx`). UploadThing is configured in `src/app/api/uploadthing/` with strict constraints:
- Maximum file size: 1MB per image (`MAX_GALLERY_FILE_SIZE_BYTES`).
- Allowed formats: ONLY `image/png` and `image/webp`.
- Maximum file count: 6 images per batch (`MAX_GALLERY_PHOTOS`).
- Automated storage cleanup: whenever 6 new photos are uploaded (or when sample photos are restored), previous UploadThing files are deleted via `utapi.deleteFiles` (`POST /api/admin/gallery/cleanup`) to prevent storage clutter.
- Custom UX: romantic styled dropzone with drag-and-drop, individual file preview cards, progress indicators, and badge constraints matching the Forever design system.
