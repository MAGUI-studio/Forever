import { randomUUID } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";

type Data = Record<string, unknown>;
type Value = { nullValue?: null; booleanValue?: boolean; integerValue?: string; doubleValue?: number; stringValue?: string; timestampValue?: string; arrayValue?: { values?: Value[] }; mapValue?: { fields?: Record<string, Value> } };
type Document = { name: string; fields?: Record<string, Value>; updateTime?: string };
type Write = { update?: Document; delete?: string; updateMask?: { fieldPaths: string[] }; currentDocument?: { exists: boolean } };

function encode(value: unknown): Value {
  if (value === null) return { nullValue: null };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "number" && Number.isFinite(value)) return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encode) } };
  if (value && typeof value === "object") return { mapValue: { fields: encodeFields(value as Data) } };
  throw new Error("Unsupported Firestore value");
}
function encodeFields(data: Data): Record<string, Value> {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, encode(value)]));
}
function decode(value: Value): unknown {
  if ("nullValue" in value) return null;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("timestampValue" in value) return new Date(value.timestampValue!);
  if ("arrayValue" in value) return (value.arrayValue?.values ?? []).map(decode);
  if ("mapValue" in value) return decodeFields(value.mapValue?.fields ?? {});
  return value.stringValue;
}
function decodeFields(fields: Record<string, Value>): Data {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decode(value)]));
}
const quote = (key: string) => "`" + key.replace(/\\/g, "\\\\").replace(/`/g, "\\`") + "`";
function mergePaths(data: Data, parent = ""): string[] {
  return Object.entries(data).flatMap(([key, value]) => {
    const path = parent ? parent + "." + quote(key) : quote(key);
    return value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date) && Object.keys(value).length ? mergePaths(value as Data, path) : [path];
  });
}

class RestError extends Error {
  constructor(public code: string, status: number) { super(`Firestore REST HTTP ${status}: ${code}`); }
}
class Snapshot {
  readonly exists: boolean;
  readonly id: string;
  constructor(readonly ref: Reference, private document?: Document) { this.exists = !!document; this.id = ref.id; }
  data() { return this.document ? decodeFields(this.document.fields ?? {}) : undefined; }
  get(path: string) { return path.split(".").reduce<unknown>((value, key) => (value as Data | undefined)?.[key], this.data()); }
}
class QuerySnapshot {
  readonly size: number;
  readonly empty: boolean;
  constructor(readonly docs: Snapshot[]) { this.size = docs.length; this.empty = !docs.length; }
  forEach(callback: (document: Snapshot) => void) { this.docs.forEach(callback); }
}
class Query {
  constructor(readonly db: RestDatabase, readonly path: string, private filters: Data[] = [], private orders: Data[] = [], private maximum?: number) {}
  where(field: string, operator: string, value: unknown) {
    const ops: Record<string, string> = { "==": "EQUAL", "!=": "NOT_EQUAL", "<": "LESS_THAN", "<=": "LESS_THAN_OR_EQUAL", ">": "GREATER_THAN", ">=": "GREATER_THAN_OR_EQUAL", in: "IN", "not-in": "NOT_IN", "array-contains": "ARRAY_CONTAINS", "array-contains-any": "ARRAY_CONTAINS_ANY" };
    if (!ops[operator]) throw new Error("Unsupported Firestore query operator");
    return new Query(this.db, this.path, [...this.filters, { fieldFilter: { field: { fieldPath: field }, op: ops[operator], value: encode(value) } }], this.orders, this.maximum);
  }
  orderBy(field: string, direction = "asc") { return new Query(this.db, this.path, this.filters, [...this.orders, { field: { fieldPath: field }, direction: direction === "desc" ? "DESCENDING" : "ASCENDING" }], this.maximum); }
  limit(maximum: number) { return new Query(this.db, this.path, this.filters, this.orders, maximum); }
  async get(transaction?: string) {
    const parts = this.path.split("/");
    const collectionId = parts.pop()!;
    const result = await this.db.call<( { document?: Document } )[]>(parts.join("/") + ":runQuery", {
      structuredQuery: { from: [{ collectionId }], ...(this.filters.length ? { where: this.filters.length === 1 ? this.filters[0] : { compositeFilter: { op: "AND", filters: this.filters } } } : {}), ...(this.orders.length ? { orderBy: this.orders } : {}), ...(this.maximum !== undefined ? { limit: this.maximum } : {}) },
      ...(transaction ? { transaction } : {}),
    });
    return new QuerySnapshot(result.filter(row => row.document).map(row => new Snapshot(this.db.doc(row.document!.name.split("/documents/")[1]), row.document)));
  }
}
class Collection extends Query {
  get id() { return this.path.split("/").at(-1)!; }
  doc(id = randomUUID().replaceAll("-", "").slice(0, 20)) { return this.db.doc(this.path + "/" + id); }
  async add(data: Data) { const ref = this.doc(); await ref.create(data); return ref; }
}
class Reference {
  readonly id: string;
  constructor(readonly db: RestDatabase, readonly path: string) { this.id = path.split("/").at(-1)!; }
  get parent() { return this.db.collection(this.path.split("/").slice(0, -1).join("/")); }
  collection(path: string) { return this.db.collection(this.path + "/" + path); }
  async get(transaction?: string) {
    try { return new Snapshot(this, await this.db.call<Document>(this.path + (transaction ? "?transaction=" + encodeURIComponent(transaction) : ""))); }
    catch (error) { if (error instanceof RestError && error.code === "NOT_FOUND") return new Snapshot(this); throw error; }
  }
  async set(data: Data, options?: { merge?: boolean }) { await this.db.commit([this.db.write(this, data, options?.merge ? "merge" : "set")]); }
  async update(data: Data) { await this.db.commit([this.db.write(this, data, "update")]); }
  async create(data: Data) { await this.db.commit([{ ...this.db.write(this, data, "set"), currentDocument: { exists: false } }]); }
  async delete() { await this.db.commit([{ delete: this.db.name(this.path) }]); }
}
class Transaction {
  readonly writes: Write[] = [];
  constructor(private db: RestDatabase, readonly token: string) {}
  async get(target: Reference): Promise<Snapshot>;
  async get(target: Query): Promise<QuerySnapshot>;
  async get(target: Reference | Query) {
    if (this.writes.length) throw new Error("Firestore transactions require all reads before writes");
    return target.get(this.token);
  }
  set(ref: Reference, data: Data, options?: { merge?: boolean }) { this.writes.push(this.db.write(ref, data, options?.merge ? "merge" : "set")); return this; }
  update(ref: Reference, data: Data) { this.writes.push(this.db.write(ref, data, "update")); return this; }
  delete(ref: Reference) { this.writes.push({ delete: this.db.name(ref.path) }); return this; }
  create(ref: Reference, data: Data) { this.writes.push({ ...this.db.write(ref, data, "set"), currentDocument: { exists: false } }); return this; }
}
export class RestDatabase {
  constructor(private projectId: string, private getToken: () => Promise<{ access_token: string }>) {}
  name(path: string) { return `projects/${this.projectId}/databases/(default)/documents/${path}`; }
  doc(path: string) { if (!path || path.split("/").length % 2) throw new Error("Invalid document path"); return new Reference(this, path); }
  collection(path: string) { if (!path || !(path.split("/").length % 2)) throw new Error("Invalid collection path"); return new Collection(this, path); }
  async call<T>(path: string, body?: unknown): Promise<T> {
    const token = await this.getToken();
    const encoded = path.split("?")[0].split("/").map(part => encodeURIComponent(part).replace(/%3A/g, ":")).join("/");
    const query = path.includes("?") ? "?" + path.split("?").slice(1).join("?") : "";
    const separator = encoded.startsWith(":") ? "" : "/";
    const response = await fetch(`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(this.projectId)}/databases/(default)/documents${separator}${encoded}${query}`, {
      method: body === undefined ? "GET" : "POST", headers: { Authorization: `Bearer ${token.access_token}`, "Content-Type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(20000),
    });
    const data = await response.json() as T & { error?: { status?: string } };
    if (!response.ok) throw new RestError(data.error?.status ?? "UNKNOWN", response.status);
    return data;
  }
  write(ref: Reference, data: Data, mode: "set" | "merge" | "update"): Write {
    if (mode === "update") {
      const nested: Data = {};
      for (const [path, value] of Object.entries(data)) {
        const parts = path.split("."); let parent = nested;
        for (const key of parts.slice(0, -1)) { parent[key] ??= {}; parent = parent[key] as Data; }
        parent[parts.at(-1)!] = value;
      }
      return { update: { name: this.name(ref.path), fields: encodeFields(nested) }, updateMask: { fieldPaths: Object.keys(data).map(path => path.split(".").map(quote).join(".")) }, currentDocument: { exists: true } };
    }
    return { update: { name: this.name(ref.path), fields: encodeFields(data) }, ...(mode === "merge" ? { updateMask: { fieldPaths: mergePaths(data) } } : {}) };
  }
  commit(writes: Write[], transaction?: string) { return this.call(":commit", { writes, ...(transaction ? { transaction } : {}) }); }
  async runTransaction<T>(callback: (transaction: Transaction) => Promise<T>, options?: { maxAttempts?: number }): Promise<T> {
    for (let attempt = 0; attempt < (options?.maxAttempts ?? 5); attempt++) {
      const { transaction: token } = await this.call<{ transaction: string }>(":beginTransaction", { options: { readWrite: {} } });
      const transaction = new Transaction(this, token);
      try { const value = await callback(transaction); await this.commit(transaction.writes, token); return value; }
      catch (error) {
        await this.call(":rollback", { transaction: token }).catch(() => undefined);
        if (!(error instanceof RestError && error.code === "ABORTED") || attempt === (options?.maxAttempts ?? 5) - 1) throw error;
      }
    }
    throw new Error("Firestore transaction retry limit exceeded");
  }
  asFirestore() { return this as unknown as Firestore; }
}
