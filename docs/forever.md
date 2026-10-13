# Forever by MAGUI.studio

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
