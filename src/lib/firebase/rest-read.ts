import "server-only";
import { services } from "./admin";

function decode(value: Record<string, any>): any {
  if ("nullValue" in value) return null;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("timestampValue" in value) return new Date(value.timestampValue);
  if ("arrayValue" in value) return (value.arrayValue.values ?? []).map(decode);
  if ("mapValue" in value) return fields(value.mapValue.fields ?? {});
  return value.stringValue ?? value.referenceValue ?? value.bytesValue ?? value.geoPointValue;
}
function fields(values: Record<string, Record<string, any>>) {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, decode(value)]));
}
async function request(path: string, query = "", allowMissing = false) {
  const app = services().auth.app;
  const credential = app.options.credential;
  if (!credential) throw new Error("Firebase server credential is missing");
  const token = await credential.getAccessToken();
  const url = `https://firestore.googleapis.com/v1/projects/${app.options.projectId}/databases/(default)/documents/${path.split("/").map(encodeURIComponent).join("/")}${query}`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token.access_token}` }, signal: AbortSignal.timeout(15000) });
  if (response.status === 404 && allowMissing) return null;
  const data = await response.json();
  if (!response.ok) throw new Error(`Firestore REST HTTP ${response.status}: ${data.error?.status ?? "UNKNOWN"}`);
  return data;
}
export async function readDocument(path: string) {
  const document = await request(path, "", true);
  return document ? fields(document.fields ?? {}) : undefined;
}
export async function listDocuments(path: string) {
  const documents: { id: string; data: Record<string, any> }[] = [];
  let pageToken = "";
  do {
    const page = await request(path, "?" + new URLSearchParams({ pageSize: "100", ...(pageToken ? { pageToken } : {}) }));
    for (const document of page?.documents ?? []) documents.push({ id: document.name.split("/").at(-1), data: fields(document.fields ?? {}) });
    pageToken = page?.nextPageToken ?? "";
  } while (pageToken);
  return documents;
}
