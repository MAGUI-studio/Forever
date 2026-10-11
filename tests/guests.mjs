import { createRequire } from "node:module";
const runtimeRequire = createRequire(import.meta.url);
// Executa as rotas reais com Authentication e Firestore simulados, sem credenciais.
const assert = runtimeRequire("node:assert/strict");
const fs = runtimeRequire("node:fs");
const path = runtimeRequire("node:path");
const vm = runtimeRequire("node:vm");
const ts = runtimeRequire("typescript");
const { randomUUID } = runtimeRequire("node:crypto");
const store = new Map();
const clone = (value) =>
  value === undefined ? undefined : structuredClone(value);
const snapshot = (key) => ({
  exists: store.has(key),
  data: () => clone(store.get(key)),
});
const ref = (key) => ({
  key,
  get: async () => snapshot(key),
  create: async (value) => {
    assert(!store.has(key));
    store.set(key, clone(value));
  },
  set: async (value) => store.set(key, clone(value)),
});
const db = {
  doc: ref,
  collection: (name) => ({
    doc: (id) => ref(`${name}/${id}`),
    orderBy: () => ({
      get: async () => ({
        docs: [...store]
          .filter(([k]) => k.startsWith(`${name}/`))
          .map(([k, v]) => ({ id: k.split("/")[1], data: () => clone(v) })),
      }),
    }),
  }),
  runTransaction: async (callback) => {
    const writes = [];
    const result = await callback({
      get: async (r) => snapshot(r.key),
      update: (r, value) =>
        writes.push(() =>
          store.set(r.key, { ...store.get(r.key), ...clone(value) }),
        ),
      delete: (r) => writes.push(() => store.delete(r.key)),
    });
    writes.forEach((write) => write());
    return result;
  },
};
const services = () => ({
  db,
  auth: {
    verifyIdToken: async (token) => {
      if (token === "valid") return { uid: "bride" };
      if (token === "outsider") return { uid: "stranger" };
      throw new Error("invalid");
    },
  },
});
process.env.FIREBASE_ADMIN_UIDS = "bride,groom";
const modules = new Map();
function load(filename) {
  const full = path.resolve(filename);
  if (modules.has(full)) return modules.get(full).exports;
  const record = { exports: {} };
  modules.set(full, record);
  const javascript = ts.transpileModule(fs.readFileSync(full, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;
  const localRequire = (name) => {
    if (name === "server-only") return {};
    if (name === "@/lib/firebase/admin" || name === "./firebase/admin")
      return { services };
    if (name.startsWith("@/")) return load(`src/${name.slice(2)}.ts`);
    return runtimeRequire(name);
  };
  vm.runInThisContext(`(function(require,module,exports){${javascript}\n})`, {
    filename: full,
  })(localRequire, record, record.exports);
  return record.exports;
}
const sent = load("src/app/api/admin/invites/sent/route.ts");
const admin = load("src/app/api/admin/invites/route.ts");
const settings = load("src/app/api/admin/settings/route.ts");
const lookup = load("src/app/api/rsvp/lookup/route.ts");
const rsvp = load("src/app/api/rsvp/route.ts");
const request = (
  method,
  data,
  token = "valid",
  origin = "https://wedding.example",
) =>
  new Request("https://wedding.example/api", {
    method,
    headers: {
      origin,
      authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
let count = 0;
async function check(title, work) {
  await work();
  count++;
  console.log(`OK ${title}`);
}
(async () => {
  await check("admin exige autenticação", async () =>
    assert.equal(
      (await admin.GET(request("GET", null, "invalid"))).status,
      401,
    ),
  );
  await check("conta não autorizada é bloqueada", async () =>
    assert.equal(
      (await admin.GET(request("GET", null, "outsider"))).status,
      403,
    ),
  );
  await check("origem externa é bloqueada", async () =>
    assert.equal(
      (await admin.POST(request("POST", {}, "valid", "https://evil.example")))
        .status,
      403,
    ),
  );
  const guests = ["Ana", "Bruno"].map((name) => ({
    id: randomUUID(),
    name,
    child: false,
    status: "pendente",
    checkedIn: false,
  }));
  const invitation = { label: "Família teste", active: true, guests };
  await check("convite cadastrado com código aleatório", async () => {
    assert.equal((await admin.POST(request("POST", invitation))).status, 201);
    assert.equal(store.size, 1);
  });
  const list = await (await admin.GET(request("GET"))).json();
  const invite = list.invitations[0];
  const key = `invitations/${invite.id}`;
  assert.match(invite.token, /^[a-f0-9]{48}$/);
  await check("consulta não expõe campos administrativos", async () => {
    const res = await lookup.POST(request("POST", { token: invite.token }, ""));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.invitation.token, undefined);
    assert.equal(body.invitation.guests[0].checkedIn, undefined);
  });
  await check("código inexistente é rejeitado", async () =>
    assert.equal(
      (await lookup.POST(request("POST", { token: "a".repeat(48) }))).status,
      404,
    ),
  );
  const answer = {
    token: invite.token,
    revision: 1,
    responses: guests.map((g, i) => ({
      id: g.id,
      status: i ? "recusado" : "confirmado",
    })),
    message: "Felicidades!",
    dietaryRestrictions: "",
  };
  await check("pessoa fora da lista é rejeitada", async () => {
    const data = structuredClone(answer);
    data.responses[0].id = randomUUID();
    assert.equal((await rsvp.POST(request("POST", data))).status, 400);
  });
  await check("IDs duplicados são rejeitados", async () => {
    const data = structuredClone(answer);
    data.responses[1].id = data.responses[0].id;
    assert.equal((await rsvp.POST(request("POST", data))).status, 400);
  });
  await check("resposta incompleta é rejeitada", async () =>
    assert.equal(
      (
        await rsvp.POST(
          request("POST", {
            ...answer,
            responses: answer.responses.slice(0, 1),
          }),
        )
      ).status,
      400,
    ),
  );
  await check("resposta salva individualmente", async () => {
    assert.equal((await rsvp.POST(request("POST", answer))).status, 200);
    assert.equal(store.get(key).guests[0].status, "confirmado");
    assert.equal(store.get(key).guests[1].status, "recusado");
    assert.equal(store.get(key).revision, 2);
  });
  await check("envio repetido não sobrescreve nem duplica", async () => {
    assert.equal((await rsvp.POST(request("POST", answer))).status, 409);
    assert.equal(store.get(key).guests.length, 2);
  });
  await check("resposta atual pode ser corrigida", async () =>
    assert.equal(
      (await rsvp.POST(request("POST", { ...answer, revision: 2 }))).status,
      200,
    ),
  );
  await check("edição administrativa antiga é bloqueada", async () =>
    assert.equal(
      (
        await admin.PATCH(
          request("PATCH", { id: invite.id, revision: 1, invitation }),
        )
      ).status,
      409,
    ),
  );
  await check("prazo vencido bloqueia envio", async () => {
    store.set("settings/rsvp", {
      enabled: true,
      deadline: "2020-01-01T00:00:00.000Z",
    });
    assert.equal(
      (await rsvp.POST(request("POST", { ...answer, revision: 3 }))).status,
      403,
    );
  });
  await check("fechamento manual bloqueia envio", async () => {
    assert.equal(
      (await settings.PUT(request("PUT", { enabled: false, deadline: "" })))
        .status,
      200,
    );
    assert.equal(
      (await rsvp.POST(request("POST", { ...answer, revision: 3 }))).status,
      403,
    );
  });
  await check("prazo inválido não é aceito", async () =>
    assert.equal(
      (
        await settings.PUT(
          request("PUT", { enabled: true, deadline: "amanhã" }),
        )
      ).status,
      400,
    ),
  );
  await check("convite inativo não pode ser consultado", async () => {
    store.set(key, { ...store.get(key), active: false });
    assert.equal(
      (await lookup.POST(request("POST", { token: invite.token }))).status,
      404,
    );
  });
  await check("convite inativo não aceita resposta", async () => {
    store.set("settings/rsvp", { enabled: true, deadline: "" });
    assert.equal(
      (await rsvp.POST(request("POST", { ...answer, revision: 3 }))).status,
      404,
    );
  });
  await check("chegada exige presença confirmada", async () => {
    const data = structuredClone(invitation);
    data.guests[0].checkedIn = true;
    assert.equal((await admin.POST(request("POST", data))).status, 400);
  });
  await check("administrador corrige convite após fechamento", async () => {
    store.set("settings/rsvp", { enabled: false, deadline: "" });
    assert.equal(
      (
        await admin.PATCH(
          request("PATCH", { id: invite.id, revision: 3, invitation }),
        )
      ).status,
      200,
    );
  });
  await check("envio é persistido sem alterar respostas ou revisão", async () => {
    const before = structuredClone(store.get(key));
    const response = await sent.POST(request("POST", {id:invite.id,sent:true}));
    assert.equal(response.status,200);
    assert.ok(store.get(key).sentAt);
    assert.equal(store.get(key).revision,before.revision);
    assert.deepEqual(store.get(key).guests,before.guests);
    const timestamp = store.get(key).sentAt;
    await sent.POST(request("POST", {id:invite.id,sent:true}));
    assert.equal(store.get(key).sentAt,timestamp);
  });
  await check("envio pode ser desmarcado", async () => {
    assert.equal((await sent.POST(request("POST",{id:invite.id,sent:false}))).status,200);
    assert.equal(store.get(key).sentAt,null);
  });
  await check("marcação exige convite existente", async () => assert.equal((await sent.POST(request("POST",{id:"f".repeat(64),sent:true}))).status,404));
  await check("exclusão concorrente é bloqueada", async () =>
    assert.equal(
      (await admin.DELETE(request("DELETE", { id: invite.id, revision: 3 })))
        .status,
      409,
    ),
  );
  await check("exclusão remove convite", async () => {
    assert.equal(
      (await admin.DELETE(request("DELETE", { id: invite.id, revision: 4 })))
        .status,
      200,
    );
    assert.equal(
      (await lookup.POST(request("POST", { token: invite.token }))).status,
      404,
    );
  });
  await check("individual usa o nome e exige uma pessoa", async () => {
    assert.equal((await admin.POST(request("POST", {...invitation,kind:"individual"}))).status,400);
    assert.equal((await admin.POST(request("POST", {...invitation,kind:"individual",label:"",guests:[guests[0]]}))).status,201);
    const list = await (await admin.GET(request("GET"))).json(); assert.equal(list.invitations[0].label,guests[0].name);
  });
  await check("acesso pessoal limita leitura e escrita e rejeita adulteração e remoção", async () => {
    store.clear(); await admin.POST(request("POST",invitation));
    const list = await (await admin.GET(request("GET"))).json(); const group = list.invitations[0];
    const token = group.personalTokens[guests[0].id]; const groupKey = 'invitations/'+group.id;
    const view = await (await lookup.POST(request("POST",{token}))).json();
    assert.deepEqual(view.invitation.guests.map(g=>g.id),[guests[0].id]);
    const payload = {...answer,token,revision:1};
    assert.equal((await rsvp.POST(request("POST",payload))).status,400);
    const forged = token.replace(guests[0].id,guests[1].id);
    assert.equal((await lookup.POST(request("POST",{token:forged}))).status,404);
    assert.equal((await rsvp.POST(request("POST",{...payload,token:forged}))).status,404);
    assert.equal((await rsvp.POST(request("POST",{...payload,responses:[answer.responses[0]]}))).status,200);
    assert.equal(store.get(groupKey).guests[1].status,'pendente'); assert.equal(store.get(groupKey).message,'');
    assert.equal(store.get(groupKey).personalResponses[guests[0].id].message,answer.message);
    const familyView = await (await lookup.POST(request("POST",{token:group.token}))).json();
    assert.equal(familyView.invitation.guests[0].message,answer.message);
    const familyResponses = familyView.invitation.guests.map((g,index) => ({id:g.id,status:"confirmado",message:index ? "Recado de Bruno" : g.message,dietaryRestrictions:index ? "Vegetariano" : "Alergia a amendoim"}));
    assert.equal((await rsvp.POST(request("POST",{token:group.token,revision:2,responses:familyResponses}))).status,200);
    const personalView = await (await lookup.POST(request("POST",{token}))).json();
    assert.equal(personalView.invitation.guests[0].dietaryRestrictions,"Alergia a amendoim");
    assert.equal(personalView.invitation.guests[0].message,answer.message);
    assert.equal(personalView.invitation.guests.length,1);
    const otherView = await (await lookup.POST(request("POST",{token:group.personalTokens[guests[1].id]}))).json();
    assert.equal(otherView.invitation.guests[0].message,"Recado de Bruno");
    assert.equal(otherView.invitation.guests[0].dietaryRestrictions,"Vegetariano");
    store.set(groupKey,{...store.get(groupKey),guests:[guests[1]]});
    assert.equal((await lookup.POST(request("POST",{token}))).status,404);
  });
  console.log(
    `\n${count} verificações passaram. Banco e autenticação simulados.`,
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
