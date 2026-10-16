import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const compiled = ts.transpileModule(readFileSync("src/lib/panel-data.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const all = {
  guestList: true,
  rsvp: true,
  tables: true,
  team: true,
  history: true,
  buffet: true,
  checkIn: true,
  siteEditor: true,
};
const expected = {
  overview: ["invitations:overview", "settings/rsvp", "settings/tables"],
  guests: ["invitations:links", "settings/rsvp", "settings/tables"],
  tables: ["invitations:operations", "settings/rsvp", "settings/tables"],
  buffet: ["invitations:operations", "settings/rsvp", "settings/tables"],
  team: ["receptionTeam", "settings/rsvp"],
  history: ["auditLog", "settings/rsvp"],
  "check-in": ["reception", "settings/rsvp"],
  site: [],
};
for (const [section, wanted] of Object.entries(expected)) {
  const exports = {},
    started = [],
    release = [];
  const deferred = (name, value) => {
    started.push(name);
    return new Promise((resolve) => release.push(() => resolve(value)));
  };
  const db = {
    doc: (path) => ({
      get: () =>
        deferred(path, {
          data: () => (path.endsWith("tables") ? { tables: ["table"] } : { enabled: true }),
        }),
    }),
    collection: (path) => {
      const query = {
        orderBy: () => query,
        limit: () => query,
        get: () => deferred(path, { docs: [{ id: path, data: () => ({ name: path }) }] }),
      };
      return query;
    },
  };
  vm.runInNewContext(compiled, {
    exports,
    require: (name) => {
      if (name.includes("config/modules"))
        return {
          resolveModules: () => all,
          sectionModule: {
            site: "siteEditor",
            tables: "tables",
            buffet: "buffet",
            team: "team",
            history: "history",
            "check-in": "checkIn",
          },
        };
      if (name.includes("guest-server")) return { assertModule: () => {} };
      if (name.includes("admin-invitations"))
        return {
          adminInvitations: (_db, _modules, mode) => deferred("invitations:" + mode, ["invite"]),
        };
      if (name.includes("reception-data"))
        return {
          receptionData: () =>
            deferred("reception", { invitations: ["confirmed"], tables: ["table"] }),
        };
      throw Error(name);
    },
  });
  const pending = exports.panelData({ db, wedding: {}, role: "admin" }, section);
  assert.deepEqual(started.sort(), wanted.slice().sort());
  release.reverse().forEach((done) => done());
  const result = await pending;
  if (section === "site") assert.equal(result, null);
  else {
    assert.equal(result.team.length, section === "team" ? 1 : 0);
    assert.equal(result.history.length, section === "history" ? 1 : 0);
  }
}
console.log("OK all eight admin screens start only their required resource reads concurrently");
