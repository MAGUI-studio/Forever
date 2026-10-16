import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const code = ts.transpileModule(readFileSync("src/app/api/rsvp/lookup/route.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
for (const personal of [false, true])
  for (const tracking of [false, true]) {
    let reads = 0,
      writes = 0;
    const guest = { id: "guest", name: "Guest", status: "pendente" };
    let data = {
      active: true,
      label: "Invitation",
      token: "secret",
      revision: 1,
      guests: [guest],
      message: "Message",
      dietaryRestrictions: "",
    };
    const ref = {};
    const exports = {};
    class HttpError extends Error {
      constructor(status, message) {
        super(message);
        this.status = status;
      }
    }
    const db = {
      doc: () => ({ get: async () => ({ data: () => ({ enabled: true, deadline: "" }) }) }),
      runTransaction: async (callback) =>
        callback({
          get: async () => {
            reads++;
            return { data: () => ({ ...data }) };
          },
          update: (_ref, value) => {
            writes++;
            data = { ...data, ...value };
          },
        }),
    };
    vm.runInNewContext(code, {
      exports,
      require: (name) =>
        name === "zod"
          ? require(name)
          : name.includes("config/modules")
            ? {
                resolveModules: () => ({ invitationTracking: tracking }),
                redactModuleData: (value) => value,
              }
            : {
                sameOrigin: () => {},
                body: async () => ({ token: "ABC-DEF" }),
                tokenSchema: require("zod").z.string(),
                publicWeddingAccess: async () => ({ db, wedding: {} }),
                assertModule: () => {},
                checkLookupRateLimit: () => {},
                resolveInvitation: async () => ({ ref, guestId: personal ? "guest" : undefined }),
                resolveAuthorizedGuests: () => [guest],
                reply: (value) => value,
                HttpError,
                failure: (error) => {
                  throw error;
                },
              },
    });
    for (let i = 0; i < 3; i++) {
      const result = await exports.POST({});
      assert.equal(result.invitation.label, personal ? "Guest" : "Invitation");
      assert.equal(result.invitation.revision, 1);
      assert.equal(result.invitation.guests[0].name, "Guest");
    }
    assert.equal(reads, 3);
    assert.equal(writes, tracking ? 1 : 0);
    const opened = data.openedAt;
    if (tracking && personal) {
      data.personalOpenedAt = {};
      await exports.POST({});
      assert.equal(writes, 2);
      assert.equal(data.openedAt, opened);
    }
    data.active = false;
    await assert.rejects(
      () => exports.POST({}),
      (error) => error.status === 404,
    );
  }
console.log(
  "OK RSVP reads each invitation once and writes opening only when missing, preserving personal access and inactive rejection",
);
