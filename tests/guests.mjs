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
store.set("weddings/test-couple",{slug:"test-couple",status:"published",config:{couple:{partner1:"Test",partner2:"Couple"}},theme:"botanical"});
store.set("weddings/test-couple/members/bride",{role:"admin",active:true});
store.set("weddings/test-couple/members/groom",{role:"admin",active:true});

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
  update: async value => store.set(key,{...store.get(key),...clone(value)}),
  collection: name => db.collection(key+"/"+name),
});
const db = {
  doc: ref,
  collection: (name) => {
    const filters=[];
    const query = {name, where:(key,operator,value)=>{assert.equal(operator,"==");filters.push([key,value]);return query;},select:()=>query, doc:(id)=>ref(name+"/"+id), orderBy:()=>query, limit:()=>query,
      get:async()=>({docs:[...store].filter(([k])=>k.startsWith(name+"/") && k.slice(name.length+1).indexOf("/")===-1).filter(([,value])=>filters.every(([key,expected])=>value[key]===expected)).map(([k,v])=>({id:k.split("/").at(-1),ref:ref(k),data:()=>clone(v)}))})};
    return query;
  },
  runTransaction: async (callback) => {
    const writes = [];
    const result = await callback({
      get: async (r) => r.name ? r.get() : snapshot(r.key),
      set: (r,value,options)=>writes.push(()=>store.set(r.key,options?.merge?{...store.get(r.key),...clone(value)}:clone(value))),
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
const authAccounts = new Map([["staff@example.com",{uid:"reception-user",email:"staff@example.com"}]]);
const services = () => ({
  db,
  auth: {
    getUserByEmail: async email => {const user=authAccounts.get(email.toLowerCase());if(!user)throw Object.assign(new Error("Missing"),{code:"auth/user-not-found"});return user;},
    createUser: async ({email,password}) => {if(authAccounts.has(email))throw Object.assign(new Error("Exists"),{code:"auth/email-already-exists"});const user={uid:randomUUID(),email,password};authAccounts.set(email,user);return user;},
    deleteUser: async uid => {for(const [email,user] of authAccounts)if(user.uid===uid)authAccounts.delete(email);},
    verifyIdToken: async (token) => {
      if (token === "managed") return {...authAccounts.get("newstaff@example.com"),email_verified:false};
      if (token === "owner-verified") return {uid:"owner",email:"contato@guibus.dev",email_verified:true};
      if (token === "owner-unverified") return {uid:"owner",email:"contato@guibus.dev",email_verified:false};
      if (token === "valid") return { uid: "bride" };
      if (token === "buyer") return {uid:"buyer",email:"buyer@example.com"};
      if (token === "buyer2") return {uid:"buyer2",email:"buyer2@example.com"};
      if (token === "reception") return {uid:"reception-user",email:"staff@example.com",email_verified:true};
      if (token === "unverified") return {uid:"unverified",email:"staff@example.com",email_verified:false};
      if (token === "outsider") return { uid: "stranger" };
      throw new Error("invalid");
    },
  },
});
process.env.FIREBASE_ADMIN_UIDS = "bride,groom";
const modules = new Map();
const checkoutSessions = [];
const stripeSessions = new Map();
const stripeIdempotency = new Map();
let upgradeStripePrice = {active:true,currency:"brl",type:"one_time",unit_amount:50000};
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
    if (name.endsWith(".json")) return JSON.parse(fs.readFileSync(path.resolve(path.dirname(full),name),"utf8"));
    if (name === "server-only") return {};
    if (name === "@/lib/stripe") return {getStripe:()=>({prices:{retrieve:async()=>upgradeStripePrice},checkout:{sessions:{retrieve:async id=>{assert(stripeSessions.has(id));return stripeSessions.get(id);},expire:async id=>{stripeSessions.get(id).status="expired";return stripeSessions.get(id);},create:async(data,options)=>{if(options?.idempotencyKey && stripeIdempotency.has(options.idempotencyKey))return stripeIdempotency.get(options.idempotencyKey);checkoutSessions.push(data);const session={id:"cs_test_"+checkoutSessions.length,url:"https://checkout.stripe.com/test",status:"open",payment_status:"unpaid",metadata:data.metadata,amount_total:50000,currency:"brl"};stripeSessions.set(session.id,session);if(options?.idempotencyKey)stripeIdempotency.set(options.idempotencyKey,session);return session;}}}})};
    if (name === "@/lib/firebase/admin" || name === "./firebase/admin")
      return { services };
    if (name.startsWith("@/")) return load(`src/${name.slice(2)}.ts`);
    if(name.startsWith("."))return load(path.resolve(path.dirname(full),name+".ts"));
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
      "x-wedding-slug":"test-couple",
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
  await check("templates não inventam dados em sites novos ou no carregamento do editor",async()=>{
    const {initializeTemplateConfig}=load("src/config/template-examples.ts");
    const {emptyWeddingConfig}=load("src/config/forever.ts");
    const {weddingConfigSchema}=load("src/lib/wedding-schema.ts");
    const base={...clone(emptyWeddingConfig),couple:{...clone(emptyWeddingConfig.couple),partner1:"Marina",partner2:"Lucas",weddingDate:"2099-07-20T12:00:00-03:00"}};
    for(const template of ["botanical-classic","contemporary-romance","minimalist-modern"]){
      const initial=initializeTemplateConfig(base,template);
      assert(weddingConfigSchema.safeParse(initial).success);
      for(const key of ["couple","ceremony","party","gallery","gifts","dressCode","pix","creditCard"])assert.deepEqual(initial[key],base[key]);
    }
    const original=clone(store.get("weddings/test-couple")),site=load("src/app/api/admin/site/route.ts");
    try{store.set("weddings/test-couple",{...original,status:"draft",siteRevision:0,config:base});
      const response=await site.GET(request("GET"));assert.equal(response.status,200);
      const data=await response.json();assert.deepEqual(data.config,base);assert.equal(data.examplesApplied,undefined);
    }finally{store.set("weddings/test-couple",original);}
  });
  await check("endereço automático usa primeiros nomes e permite alternativa após colisão",async()=>{
    const onboarding=load("src/app/api/contratacao/route.ts"),availability=load("src/app/api/contratacao/endereco/route.ts");
    const {weddingAddress}=load("src/lib/wedding-address.ts");
    assert.equal(weddingAddress(" Marína Santos ","Lúcas Silva"),"marina-e-lucas");
    const checkAddress=(slug,token="buyer")=>availability.GET(new Request(`https://wedding.example/api/contratacao/endereco?slug=${slug}`,{headers:{authorization:`Bearer ${token}`}}));
    assert.equal((await checkAddress("marina-e-lucas","invalid")).status,401);
    assert.equal((await (await checkAddress("marina-e-lucas")).json()).available,true);
    const data={partner1:"Marina Santos",partner2:"Lucas Silva",weddingDate:"2099-07-20"};
    const result=await onboarding.POST(request("POST",data,"buyer"));assert.equal(result.status,201);assert.equal((await result.json()).slug,"marina-e-lucas");
    assert.equal((await (await checkAddress("marina-e-lucas")).json()).available,false);
    const conflict=await onboarding.POST(request("POST",data,"buyer2"));assert.equal(conflict.status,409);assert.equal((await conflict.json()).code,"ADDRESS_TAKEN");
    assert.equal((await (await checkAddress("studio")).json()).reason,"invalid");
    assert.equal((await (await checkAddress("mari-e-lucas")).json()).available,true);
    const alternative=await onboarding.POST(request("POST",{...data,slug:"mari-e-lucas"},"buyer2"));assert.equal(alternative.status,201);assert.equal((await alternative.json()).slug,"mari-e-lucas");
    for(const key of [...store.keys()])if(key.startsWith("weddings/marina-e-lucas") || key.startsWith("weddings/mari-e-lucas") || key === "userWeddingLinks/buyer" || key === "userWeddingLinks/buyer2")store.delete(key);
  });
  await check("contratação cria rascunho, vincula conta e só ativa após webhook pago",async()=>{
    const onboarding=load("src/app/api/contratacao/route.ts"),checkout=load("src/app/api/checkout/route.ts"),payment=load("src/app/api/contratacao/pagamento/route.ts");
    const {handlePaymentSuccess}=load("src/lib/stripe-fulfillment.ts");
    const data={partner1:"Ana",partner2:"Pedro",weddingDate:"2099-05-29",slug:"purchase-couple"};
    assert.equal((await onboarding.POST(request("POST",data,"invalid"))).status,401);
    assert.equal((await checkout.POST(request("POST",{plan:"foreverPro"}))).status,403);
    assert.equal((await onboarding.GET(request("GET",null,"buyer"))).status,200);
    assert.equal((await onboarding.POST(request("POST",data,"buyer"))).status,201);
    assert.equal(store.get("weddings/purchase-couple").plan,null);
    assert.equal(store.get("weddings/purchase-couple/members/buyer").role,"admin");
    const retry=await onboarding.POST(request("POST",{...data,slug:"another-purchase"},"buyer"));assert.equal((await retry.json()).slug,"purchase-couple");assert(!store.has("weddings/another-purchase"));
    assert.equal((await onboarding.POST(request("POST",data,"buyer2"))).status,409);
    const payload={plan:"foreverPro",weddingSlug:data.slug};
    assert.equal((await checkout.POST(request("POST",payload,"buyer2"))).status,403);
    const response=await checkout.POST(request("POST",payload,"buyer"));assert.equal(response.status,200);const first=await response.json();
    const repeated=await checkout.POST(request("POST",payload,"buyer"));assert.equal((await repeated.json()).sessionId,first.sessionId);
    const session=stripeSessions.get(first.sessionId);assert.equal(session.metadata.ownerUid,"buyer");
    assert.equal(session.metadata.weddingSlug,data.slug);
    const statusRequest=token=>new Request(`https://wedding.example/api/contratacao/pagamento?session_id=${first.sessionId}`,{headers:{authorization:`Bearer ${token}`}});
    assert.equal((await payment.GET(statusRequest("buyer2"))).status,403);
    assert.equal((await (await payment.GET(statusRequest("buyer"))).json()).confirmed,false);
    assert.equal(await handlePaymentSuccess(session),false);
    session.status="complete";session.payment_status="paid";
    await handlePaymentSuccess(session);
    assert.equal(store.get("weddings/purchase-couple").plan,"foreverPro");
    assert.equal(store.get("weddings/purchase-couple").status,"draft");
    assert.equal((await (await payment.GET(statusRequest("buyer"))).json()).confirmed,true);
    assert.equal((await checkout.POST(request("POST",payload,"buyer"))).status,409);
    // Repeated webhook delivery never overwrites a later admin removal.
    store.get("weddings/purchase-couple").plan=null;
    store.set("weddings/purchase-couple/invitations/preserved",{label:"Família",guests:[]});
    await handlePaymentSuccess(session);assert.equal(store.get("weddings/purchase-couple").plan,null);
    // A new purchase reuses the wedding and preserves all existing data.
    const renew=await checkout.POST(request("POST",{plan:"essencial",weddingSlug:data.slug},"buyer"));assert.equal(renew.status,200);
    const newSession=stripeSessions.get((await renew.json()).sessionId);newSession.status="complete";newSession.payment_status="paid";
    await handlePaymentSuccess(newSession);
    assert.equal(store.get("weddings/purchase-couple").plan,"essencial");assert(store.has("weddings/purchase-couple/invitations/preserved"));
    for(const key of [...store.keys()])if(key.startsWith("weddings/purchase-couple") || key === "userWeddingLinks/buyer" || key === `orders/${first.sessionId}` || key === `orders/${newSession.id}`)store.delete(key);
  });
  await check("troca de plano encerra sessão aberta e não cobra de novo enquanto aguarda webhook",async()=>{
    const onboarding=load("src/app/api/contratacao/route.ts"),checkout=load("src/app/api/checkout/route.ts");
    const data={partner1:"Maria",partner2:"João",weddingDate:"2099-06-10",slug:"switch-purchase"};
    assert.equal((await onboarding.POST(request("POST",data,"buyer2"))).status,201);
    const buy=plan=>checkout.POST(request("POST",{plan,weddingSlug:data.slug},"buyer2"));
    const first=await (await buy("essencial")).json();
    const second=await (await buy("foreverPro")).json();
    assert.notEqual(first.sessionId,second.sessionId);assert.equal(stripeSessions.get(first.sessionId).status,"expired");
    const resume=await (await onboarding.GET(request("GET",null,"buyer2"))).json();assert.equal(resume.pendingPlan,"foreverPro");
    stripeSessions.get(second.sessionId).status="complete";stripeSessions.get(second.sessionId).payment_status="paid";
    const count=checkoutSessions.length;
    const pending=await (await buy("essencial")).json();assert(pending.url.includes("checkout/sucesso"));assert.equal(pending.sessionId,second.sessionId);assert.equal(checkoutSessions.length,count);
    assert.equal(store.get("weddings/switch-purchase").plan,null);
    for(const key of [...store.keys()])if(key.startsWith("weddings/switch-purchase") || key === "userWeddingLinks/buyer2")store.delete(key);
  });
  await check("validade inclui o dia final em São Paulo, bloqueia gestão e mantém login", async () => {
    const {planAccessEndsAt,isPlanExpired}=load("src/config/plan-access.ts");
    const wedding={plan:"essencial",config:{couple:{weddingDate:"2026-01-31"}}};
    assert.equal(planAccessEndsAt(wedding).toISOString(),"2026-02-01T03:00:00.000Z");
    assert.equal(isPlanExpired(wedding,new Date("2026-02-01T02:59:59Z")),false);
    assert.equal(isPlanExpired(wedding,new Date("2026-02-01T03:00:00Z")),true);
    assert.equal(planAccessEndsAt({...wedding,plan:"foreverPro"}).toISOString(),"2026-05-01T03:00:00.000Z");
    assert.equal(isPlanExpired({plan:"essencial"}),false);
    const original=clone(store.get("weddings/test-couple"));
    try {
      store.set("weddings/test-couple",{...original,...wedding});
      const result=await admin.GET(request("GET"));
      assert.equal(result.status,403);
      assert.equal((await result.json()).redirect,"/test-couple/acesso-expirado");
      const destination=load("src/app/api/auth/destination/route.ts");
      const response=await destination.GET(request("GET"));
      assert.equal(response.status,200);
      assert.equal((await response.json()).destination,"/test-couple/acesso-expirado");
      assert.equal((await lookup.POST(request("POST",{token:"ABC-DEF"}))).status,404);
    } finally {store.set("weddings/test-couple",original);}
  });
  await check("webhook só ativa após pagamento concluído e não reaplica eventos duplicados", async () => {
    const {handlePaymentSuccess}=load("src/lib/stripe-fulfillment.ts");
    const original=clone(store.get("weddings/test-couple"));
    const session={id:"cs_test_webhook",status:"complete",payment_status:"unpaid",metadata:{action:"upgrade",plan:"foreverPro",weddingSlug:"test-couple"},amount_total:50000,currency:"brl"};
    try {
      store.set("weddings/test-couple",{...original,plan:"essencial"});
      assert.equal(await handlePaymentSuccess(session),false);
      assert.equal(store.get("weddings/test-couple").plan,"essencial");
      assert.equal(await handlePaymentSuccess({...session,payment_status:"paid"}),true);
      assert.equal(store.get("weddings/test-couple").plan,"foreverPro");
      assert.ok(store.get("orders/cs_test_webhook").fulfilledAt);
      // A replay cannot undo a later manual plan change by the super admin.
      store.set("weddings/test-couple",{...original,plan:"essencial"});
      await handlePaymentSuccess({...session,payment_status:"paid"});
      assert.equal(store.get("weddings/test-couple").plan,"essencial");
      assert.equal([...store.keys()].filter(key=>key==="weddings/test-couple/audit/cs_test_webhook").length,1);
      const webhook=load("src/app/api/webhooks/stripe/route.ts");
      assert.equal((await webhook.POST(new Request("https://wedding.example/api/webhooks/stripe",{method:"POST",body:JSON.stringify({type:"checkout.session.completed",data:{object:session}})}))).status,400);
    } finally {
      store.set("weddings/test-couple",original);
      store.delete("orders/cs_test_webhook");store.delete("weddings/test-couple/audit/cs_test_webhook");
    }
  });
  const checkout = load("src/app/api/checkout/route.ts");
  await check("upgrade cobra apenas a diferença e valida o preço do Stripe", async () => {
    const originalWedding=clone(store.get("weddings/test-couple"));
    const originalPrice=process.env.STRIPE_PRICE_UPGRADE;
    const payload={plan:"foreverPro",action:"upgrade",weddingSlug:"test-couple"};
    try {
      store.set("weddings/test-couple",{...originalWedding,plan:"essencial"});
      delete process.env.STRIPE_PRICE_UPGRADE;
      assert.equal((await checkout.POST(request("POST",payload))).status,200);
      assert.equal(checkoutSessions.at(-1).line_items[0].price_data.unit_amount,50000);
      process.env.STRIPE_PRICE_UPGRADE="price_upgrade_test";
      assert.equal((await checkout.POST(request("POST",payload))).status,200);
      assert.equal(checkoutSessions.at(-1).line_items[0].price,"price_upgrade_test");
      upgradeStripePrice={...upgradeStripePrice,unit_amount:99700};
      const sessionCount=checkoutSessions.length;
      assert.equal((await checkout.POST(request("POST",payload))).status,503);
      assert.equal(checkoutSessions.length,sessionCount);
      assert.equal((await checkout.POST(request("POST",payload,"invalid"))).status,401);
      assert.equal((await checkout.POST(request("POST",{...payload,weddingSlug:"other-couple"}))).status,403);
      store.set("weddings/test-couple",{...originalWedding,plan:"foreverPro"});
      assert.equal((await checkout.POST(request("POST",payload))).status,409);
    } finally {
      store.set("weddings/test-couple",originalWedding);
      upgradeStripePrice={...upgradeStripePrice,unit_amount:50000};
      if(originalPrice===undefined)delete process.env.STRIPE_PRICE_UPGRADE;else process.env.STRIPE_PRICE_UPGRADE=originalPrice;
    }
  });
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
    assert.equal([...store.keys()].filter(k=>k.startsWith("weddings/test-couple/invitations/")).length, 1);
  });
  const list = await (await admin.GET(request("GET"))).json();
  const invite = list.invitations[0];
  const key = `weddings/test-couple/invitations/${invite.id}`;
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
    store.set("weddings/test-couple/settings/rsvp", {
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
    store.set("weddings/test-couple/settings/rsvp", { enabled: true, deadline: "" });
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
    store.set("weddings/test-couple/settings/rsvp", { enabled: false, deadline: "" });
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
    for(const key of [...store.keys()])if(key.split("/").length>2&&!key.includes("/members/"))store.delete(key); await admin.POST(request("POST",invitation));
    const list = await (await admin.GET(request("GET"))).json(); const group = list.invitations[0];
    const token = group.personalTokens[guests[0].id]; const groupKey = 'weddings/test-couple/invitations/'+group.id;
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

  const ops = load("src/app/api/admin/operations/route.ts");
  const reception = load("src/app/api/admin/reception/route.ts");
  await check("equipe precisa de autorização e e-mail verificado", async () => {
    assert.equal((await reception.GET(request("GET",null,"reception"))).status,403);
    assert.equal((await ops.POST(request("POST",{action:"team",email:"staff@example.com",active:true}))).status,200);
    assert.equal((await reception.GET(request("GET",null,"unverified"))).status,403);
    assert.equal((await reception.GET(request("GET",null,"reception"))).status,200);
  });
  await check("recepção não pode administrar convites, configurações ou equipe", async () => {
    assert.equal((await admin.GET(request("GET",null,"reception"))).status,403);
    assert.equal((await admin.POST(request("POST",invitation,"reception"))).status,403);
    assert.equal((await settings.GET(request("GET",null,"reception"))).status,403);
    assert.equal((await ops.POST(request("POST",{action:"team",email:"intruder@example.com",active:true},"reception"))).status,403);
  });
  let eventInvite,table;
  await check("mesas respeitam capacidade e lugares não podem ser duplicados", async () => {
    const group={...invitation,guests:guests.map(g=>({...g,status:"confirmado"}))};
    await admin.POST(request("POST",group));
    eventInvite=(await (await admin.GET(request("GET"))).json()).invitations.find(i=>i.guests.length===2);
    assert.equal((await ops.POST(request("POST",{action:"table",name:"Mesa 01",capacity:1}))).status,200);
    table=(await (await ops.GET(request("GET"))).json()).tables[0];
    const assign=(guestId,seat)=>ops.POST(request("POST",{action:"assign",invitationId:eventInvite.id,guestId,tableId:table.id,seat}));
    assert.equal((await assign(guests[0].id,"01")).status,200);
    assert.equal((await assign(guests[1].id,"02")).status,409);
    assert.equal((await ops.POST(request("POST",{action:"table",id:table.id,name:table.name,capacity:2}))).status,200);
    assert.equal((await assign(guests[1].id,"01")).status,409);
    assert.equal((await assign(guests[1].id,"02")).status,200);
    assert.equal((await ops.POST(request("POST",{action:"table",id:table.id,name:table.name,capacity:1}))).status,400);
    assert.equal((await ops.POST(request("POST",{action:"delete-table",id:table.id}))).status,400);
  });
  await check("recepção recebe mesas e nomes sem tokens nem recados", async () => {
    const key="weddings/test-couple/invitations/"+eventInvite.id;
    store.set(key,{...store.get(key),message:"private",dietaryRestrictions:"private",personalResponses:{[guests[0].id]:{message:"private",dietaryRestrictions:"private"}}});
    const result=await (await reception.GET(request("GET",null,"reception"))).json();
    const item=result.invitations.find(i=>i.id===eventInvite.id);
    assert.equal(item.token,undefined);assert.equal(item.message,undefined);assert.equal(item.personalResponses,undefined);
    assert.equal(item.guests[0].tableId,table.id);
  });
  await check("chegada em grupo, desfazer e proteção contra alteração concorrente", async () => {
    const payload={id:eventInvite.id,guestIds:guests.map(g=>g.id),checkedIn:true,expectedCheckedIn:false};
    assert.equal((await reception.PATCH(request("PATCH",payload,"reception"))).status,200);
    assert(store.get("weddings/test-couple/invitations/"+eventInvite.id).guests.every(g=>g.checkedInAt));
    assert.equal((await reception.PATCH(request("PATCH",payload,"reception"))).status,409);
    assert.equal((await reception.PATCH(request("PATCH",{...payload,checkedIn:false,expectedCheckedIn:true},"reception"))).status,200);
    assert(store.get("weddings/test-couple/invitations/"+eventInvite.id).guests.every(g=>!g.checkedIn && g.checkedInAt===null));
    assert.equal((await reception.PATCH(request("PATCH",{...payload,guestIds:[randomUUID()]},"reception"))).status,400);
  });
  await check("histórico é atômico e não guarda tokens privados", async () => {
    const entries=[...store].filter(([key])=>key.startsWith("weddings/test-couple/auditLog/")).map(([,value])=>value);
    assert(entries.some(e=>e.action==="Chegada registrada"));assert(entries.some(e=>e.action==="Lugar atualizado"));
    assert(!JSON.stringify(entries).includes(eventInvite.token));
    const size=entries.length;
    await reception.PATCH(request("PATCH",{id:eventInvite.id,guestIds:[randomUUID()],checkedIn:true,expectedCheckedIn:false},"reception"));
    assert.equal([...store.keys()].filter(key=>key.startsWith("weddings/test-couple/auditLog/")).length,size);
  });
  await check("abertura válida é registrada sem alterar revisão e links inválidos não contam", async () => {
    const before=clone(store.get("weddings/test-couple/invitations/"+eventInvite.id));
    const token=eventInvite.personalTokens[guests[0].id];
    assert.equal((await lookup.POST(request("POST",{token}))).status,200);
    const after=store.get("weddings/test-couple/invitations/"+eventInvite.id);assert(after.openedAt);assert(after.personalOpenedAt[guests[0].id]);assert.equal(after.revision,before.revision);
    assert.equal((await lookup.POST(request("POST",{token:token.replace(guests[0].id,randomUUID())}))).status,404);
  });
  await check("revogação bloqueia imediatamente a conta da recepção", async () => {
    await ops.POST(request("POST",{action:"team",email:"staff@example.com",active:false}));
    assert.equal((await reception.GET(request("GET",null,"reception"))).status,403);
  });
  await check("criação da equipe cria conta, limita acesso e não persiste senha", async()=>{
    const payload={action:"create-team",email:"newstaff@example.com",password:"test-password-123"};
    assert.equal((await ops.POST(request("POST",payload,"reception"))).status,403);
    assert.equal((await ops.POST(request("POST",{...payload,password:"short"}))).status,400);
    assert.equal((await ops.POST(request("POST",payload))).status,200);
    assert(authAccounts.has(payload.email));
    assert.equal((await reception.GET(request("GET",null,"managed"))).status,200);
    assert.equal((await ops.GET(request("GET",null,"managed"))).status,403);
    assert(!JSON.stringify([...store.values()]).includes(payload.password));
    assert.equal((await ops.POST(request("POST",payload))).status,409);
    assert.equal((await ops.POST(request("POST",{action:"remove-team",email:payload.email}))).status,200);
    assert.equal((await reception.GET(request("GET",null,"managed"))).status,403);
    assert(authAccounts.has(payload.email));
  });
  await check("isolamento entre casamentos e rejeição de escopo ausente",async()=>{
    store.set("weddings/other-couple",{slug:"other-couple",status:"published",config:{}});
    const foreign=request("GET");foreign.headers.set("x-wedding-slug","other-couple");
    assert.equal((await admin.GET(foreign)).status,403);
    const noScope=request("GET");noScope.headers.delete("x-wedding-slug");assert.equal((await admin.GET(noScope)).status,404);
    const publicRequest=request("POST",{token:"a".repeat(48)});publicRequest.headers.set("x-wedding-slug","other-couple");assert.equal((await lookup.POST(publicRequest)).status,404);
    const saved=store.get("weddings/test-couple");store.set("weddings/test-couple",{...saved,status:"draft"});assert.equal((await lookup.POST(request("POST",{token:"a".repeat(48)}))).status,404);store.set("weddings/test-couple",saved);
  });
  await check("validação de slugs, publicação e URLs de conteúdo",async()=>{
    const {validWeddingSlug,emptyWeddingConfig}=load("src/config/forever.ts");
    const {weddingConfigSchema,weddingUpdateSchema}=load("src/lib/wedding-schema.ts");
    assert(validWeddingSlug("ana-e-pedro"));assert(!validWeddingSlug("admin"));assert(!validWeddingSlug("../foreign"));assert(!validWeddingSlug("Ana Pedro"));
    assert(weddingConfigSchema.safeParse(emptyWeddingConfig).success);
    assert(!weddingConfigSchema.safeParse({...emptyWeddingConfig,couple:{...emptyWeddingConfig.couple,coverImage:"javascript:alert(1)"}}).success);
    assert(!weddingUpdateSchema.safeParse({config:emptyWeddingConfig,theme:"botanical",status:"published"}).success);
  });
  await check("somente MAGUI cria casamentos, e cada responsável acessa só o próprio",async()=>{
    const platform=load("src/app/api/platform/weddings/route.ts");
    const payload={slug:"new-couple",partner1:"Ana",partner2:"Pedro",weddingDate:"2099-05-29",ownerEmail:"newstaff@example.com"};
    assert.equal((await platform.POST(request("POST",payload))).status,403);
    process.env.MAGUI_ADMIN_UIDS="bride";
    assert.equal((await platform.POST(request("POST",{...payload,weddingDate:undefined}))).status,400);
    assert.equal((await platform.POST(request("POST",{...payload,weddingDate:"2099-02-30"}))).status,400);
    assert.equal((await platform.POST(request("POST",{...payload,weddingDate:"2000-01-01"}))).status,400);
    assert.equal((await platform.POST(request("POST",payload))).status,201);
    assert.equal(store.get("weddings/new-couple").config.couple.weddingDate,"2099-05-29T12:00:00-03:00");
    assert.deepEqual(store.get("weddings/new-couple/settings/rsvp"),{enabled:true,deadline:""});
    assert.equal(store.get("weddings/new-couple").templateId,"contemporary-romance");
    assert.equal((await platform.POST(request("POST",payload))).status,409);
    process.env.MAGUI_ADMIN_UIDS="";
    const own=request("GET",null,"managed");own.headers.set("x-wedding-slug","new-couple");assert.equal((await admin.GET(own)).status,200);
    own.headers.set("x-wedding-slug","test-couple");assert.equal((await admin.GET(own)).status,403);
    const members=load("src/app/api/admin/members/route.ts");
    const remove=request("POST",{action:"remove",uid:authAccounts.get(payload.ownerEmail).uid},"managed");remove.headers.set("x-wedding-slug","new-couple");assert.equal((await members.POST(remove)).status,400);
  });
  await check("login resolve casamento único e bloqueia novos vínculos duplicados",async()=>{
    const destination=load("src/app/api/auth/destination/route.ts");
    const result=await destination.GET(request("GET",null,"managed"));assert.equal(result.status,200);assert.equal((await result.json()).destination,"/new-couple/painel");
    const members=load("src/app/api/admin/members/route.ts");
    assert.equal((await members.POST(request("POST",{action:"add",email:"newstaff@example.com"}))).status,409);
    const newcomer=await destination.GET(request("GET",null,"outsider"));assert.equal(newcomer.status,200);assert.equal((await newcomer.json()).destination,"/contratar");
    const ref="weddings/other-couple/members/"+authAccounts.get("newstaff@example.com").uid;store.set(ref,{active:true,role:"admin"});
    assert.equal((await destination.GET(request("GET",null,"managed"))).status,409);store.delete(ref);
  });
  await check("planos são a única origem dos recursos e flags antigas não interferem",async()=>{
    const {resolveModules,moduleKeys}=load("src/config/modules.ts");
    const oldFlags=Object.fromEntries(moduleKeys.map(key=>[key,false]));
    assert(moduleKeys.every(key=>resolveModules(oldFlags,"foreverPro")[key]));
    const essential=resolveModules(oldFlags,"essencial");
    assert(essential.guestList&&essential.rsvp&&essential.siteEditor&&essential.gifts);
    assert(!essential.tables&&!essential.team&&!essential.history&&!essential.checkIn&&!essential.buffet);
    assert(moduleKeys.every(key=>!resolveModules(oldFlags,null)[key]));
    assert(!fs.existsSync(path.resolve("src/app/api/platform/modules/route.ts")));
  });
  await check("editor salva rascunho isolado, publica e bloqueia revisões antigas",async()=>{
    const site=load("src/app/api/admin/site/route.ts"),{emptyWeddingConfig}=load("src/config/forever.ts"),{copyDefaults}=load("src/config/templates/registry.ts");
    const existing=store.get("weddings/test-couple");store.set("weddings/test-couple",{...existing,config:clone(emptyWeddingConfig)});
    const original=clone(store.get("weddings/test-couple"));
    const config={...clone(emptyWeddingConfig),couple:{...emptyWeddingConfig.couple,partner1:"Ana",partner2:"Pedro",weddingDate:"2027-10-10T12:00:00-03:00"},ceremony:{...emptyWeddingConfig.ceremony,placeName:"Jardim"},copy:{...copyDefaults,"hero.text2":"Texto personalizado"}};
    const payload={action:"draft",config,templateId:"botanical-classic",expectedRevision:0};
    assert.equal((await site.PUT(request("PUT",payload))).status,200);
    assert.deepEqual(store.get("weddings/test-couple").config,original.config);
    const draft=await (await site.GET(request("GET"))).json();assert.equal(draft.config.copy["hero.text2"],"Texto personalizado");assert.equal(draft.revision,1);
    assert.equal((await site.PUT(request("PUT",payload))).status,409);
    assert.equal((await site.PUT(request("PUT",{...payload,action:"publish",expectedRevision:1}))).status,200);
    assert.equal(store.get("weddings/test-couple").config.copy["hero.text2"],"Texto personalizado");assert.equal(store.get("weddings/test-couple").siteDraft,null);
    assert.equal((await site.PUT(request("PUT",{...payload,expectedRevision:2,templateId:"unknown"}))).status,400);
    store.set("weddings/test-couple",{...original,modules:{siteEditor:false}});assert.equal((await site.GET(request("GET"))).status,200);
    store.set("weddings/test-couple",{...original,plan:null});assert.equal((await site.GET(request("GET"))).status,403);
    store.set("weddings/test-couple",original);
  });
  await check("templates têm seções próprias e a troca preserva conteúdo personalizado",async()=>{
    const {templateIds,templateSections,templateCopyFields,switchTemplateCopy,siteCopy,defaultTemplateId}=load("src/config/templates/registry.ts");
    assert.equal(defaultTemplateId,"botanical-classic");assert(templateIds.includes("contemporary-romance"));
    assert(templateSections["contemporary-romance"].includes("schedule"));assert(!templateSections["botanical-classic"].includes("schedule"));assert(templateSections["contemporary-romance"].includes("countdown"));
    assert(templateCopyFields("contemporary-romance").some(field=>field.key.startsWith("dressCode.")));assert(!templateCopyFields("botanical-classic").some(field=>field.key.startsWith("romance.")));
    const copy={"hero.text2":"Nosso texto","rsvp.text4":siteCopy(undefined,"rsvp.text4"),"romance.dress.note":""};
    const next=switchTemplateCopy(copy,"botanical-classic","contemporary-romance");assert.equal(next["hero.text2"],"Nosso texto");assert.equal(next["romance.dress.note"],"");assert.equal(next["rsvp.text4"],siteCopy(undefined,"rsvp.text4","contemporary-romance"));assert.notEqual(next["rsvp.text4"],copy["rsvp.text4"]);
    const site=load("src/app/api/admin/site/route.ts"),{emptyWeddingConfig}=load("src/config/forever.ts");const original=clone(store.get("weddings/test-couple"));
    try{store.set("weddings/test-couple",{...original,siteRevision:0,config:clone(emptyWeddingConfig)});const config={...clone(emptyWeddingConfig),copy:{"rsvp.text4":"Minha mensagem"},couple:{...emptyWeddingConfig.couple,partner1:"Ana",partner2:"Pedro",weddingDate:"2027-10-10T12:00:00-03:00"},ceremony:{...emptyWeddingConfig.ceremony,placeName:"Salão"}};
    assert.equal((await site.PUT(request("PUT",{action:"publish",config,templateId:"contemporary-romance",expectedRevision:0}))).status,200);const saved=store.get("weddings/test-couple");assert.equal(saved.templateId,"contemporary-romance");assert.equal(saved.config.copy["rsvp.text4"],"Minha mensagem");assert(saved.config.copy["romance.schedule.title"]);assert.deepEqual(saved.config.gifts,config.gifts);
    }finally{store.set("weddings/test-couple",original);}
  });
  await check("textos de ações e regras do RSVP permanecem fixos",async()=>{
    const {copyFields,copyDefaults,siteCopy}=load("src/config/templates/registry.ts");
    const {weddingConfigSchema}=load("src/lib/wedding-schema.ts"),{emptyWeddingConfig}=load("src/config/forever.ts");
    assert.deepEqual(copyFields.filter(field=>field.section==="rsvp").map(field=>field.key),["rsvp.text1","rsvp.text2","rsvp.text3","rsvp.text4"]);
    for(const key of ["footer.text3","hero.text6","gifts.text14","rsvp.text38","checkout.text21","countdown.text4","countdown.text5","countdown.text6","countdown.text7"]){assert(!copyFields.some(field=>field.key===key));assert.equal(siteCopy({[key]:"Texto adulterado"},key),copyDefaults[key]);}
    const config=weddingConfigSchema.parse({...emptyWeddingConfig,copy:{"rsvp.text38":"Texto adulterado","rsvp.text1":"Boas-vindas"}});
    assert.equal(config.copy["rsvp.text38"],undefined);assert.equal(config.copy["rsvp.text1"],"Boas-vindas");
  });
  await check("presentes exigem um único link externo ao salvar qualquer template",async()=>{
    const {emptyWeddingConfig}=load("src/config/forever.ts"),{weddingUpdateSchema}=load("src/lib/wedding-schema.ts"),site=load("src/app/api/admin/site/route.ts");
    const config={...clone(emptyWeddingConfig),couple:{...emptyWeddingConfig.couple,weddingDate:"2027-10-10T12:00:00-03:00"},ceremony:{...emptyWeddingConfig.ceremony,placeName:"Jardim"},gifts:[{id:"computer",title:"Computador gamer",price:5000,category:"Casa",categoryLabel:"Casa",image:""}]};
    const update={config,theme:"botanical",status:"published",templateId:"botanical-classic"};
    assert(!weddingUpdateSchema.safeParse(update).success);
    assert(!weddingUpdateSchema.safeParse({...update,config:{...config,giftPaymentLink:"javascript:alert(1)"}}).success);
    assert(weddingUpdateSchema.safeParse({...update,config:{...config,giftPaymentLink:"https://example.com/pay"}}).success);
    assert(weddingUpdateSchema.safeParse({...update,config:{...config,gifts:[]}}).success);
    assert.equal((await site.PUT(request("PUT",{action:"publish",config,templateId:"botanical-classic",expectedRevision:0}))).status,400);
    assert.equal((await site.PUT(request("PUT",{action:"draft",config,templateId:"botanical-classic",expectedRevision:0}))).status,400);
  });
  await check("imagens do template são editáveis e preservam valores anteriores se omitidos",async()=>{
    const {preserveTemplateImages}=load("src/lib/template-images.ts"),{emptyWeddingConfig}=load("src/config/forever.ts");
    const current=clone(emptyWeddingConfig);current.couple.coverImage="/fixed-cover.jpg";current.ceremony.image="/fixed-venue.jpg";
    const next=clone(current);next.couple.coverImage="/changed.jpg";next.ceremony.image="/changed-venue.jpg";next.gifts=[{id:"one",title:"Presente",price:10,category:"Casa",categoryLabel:"Casa",image:"/gift.jpg"}];
    const saved=preserveTemplateImages(next,current);assert.equal(saved.couple.coverImage,"/changed.jpg");assert.equal(saved.ceremony.image,"/changed-venue.jpg");assert.equal(saved.gifts[0].image,"/gift.jpg");
    const omitted=preserveTemplateImages({couple:{}},current);assert.equal(omitted.couple.coverImage,current.couple.coverImage);assert.equal(omitted.ceremony.image,current.ceremony.image);
  });
  await check("galeria permite até 6 fotos e é a única seção ocultável",async()=>{
    const {galleryPhotos,placeholderGallery,MAX_GALLERY_PHOTOS}=load("src/config/gallery.ts"),{emptyWeddingConfig}=load("src/config/forever.ts"),{weddingConfigSchema}=load("src/lib/wedding-schema.ts"),{templateSections,templateCopyFields}=load("src/config/templates/registry.ts");
    assert.equal(MAX_GALLERY_PHOTOS,6);assert.equal(placeholderGallery.length,6);assert.equal(galleryPhotos(emptyWeddingConfig).length,6);assert.equal(emptyWeddingConfig.sections.gallery,true);{const {galleryEnabled}=load("src/config/gallery.ts");assert(galleryEnabled({}));assert(galleryEnabled({sections:{}}));assert(!galleryEnabled({sections:{gallery:false}}));}for(const photo of placeholderGallery)assert(fs.existsSync("public"+photo.url));
    const ten={...clone(emptyWeddingConfig),gallery:clone(placeholderGallery)};assert(weddingConfigSchema.safeParse(ten).success);assert(!weddingConfigSchema.safeParse({...ten,gallery:[...ten.gallery,{...ten.gallery[0],id:"seventh"}]}).success);assert.equal(galleryPhotos({...ten,gallery:[...ten.gallery,...ten.gallery]}).length,6);
    assert.deepEqual(weddingConfigSchema.parse({...ten,sections:{gallery:true,dressCode:false,gifts:false,rsvp:false}}).sections,{gallery:true});
    for(const id of ["botanical-classic","contemporary-romance"]){assert(templateSections[id].includes("gallery"));assert(templateCopyFields(id).some(field=>field.section==="gallery"));}
    const {galleryStyles,resolveGalleryStyle}=load("src/config/gallery.ts");
    assert.deepEqual(galleryStyles.map(s=>s.value),["polaroid","relicario","varal","filme","mural"]);
    assert.equal(resolveGalleryStyle({},"botanical-classic"),"polaroid");
    assert.equal(resolveGalleryStyle({},"contemporary-romance"),"relicario");
    assert.equal(resolveGalleryStyle({galleryStyle:"filme"}),"filme");
    assert(weddingConfigSchema.safeParse({...ten,galleryStyle:"varal"}).success);
    assert(!weddingConfigSchema.safeParse({...ten,galleryStyle:"invalido"}).success);
    const site=load("src/app/api/admin/site/route.ts"),original=clone(store.get("weddings/test-couple"));
    try{store.set("weddings/test-couple",{...original,siteRevision:0,config:ten});const config={...ten,sections:{gallery:true},galleryStyle:"mural",couple:{...ten.couple,partner1:"Ana",partner2:"Pedro",weddingDate:"2027-10-10T12:00:00-03:00"},ceremony:{...ten.ceremony,placeName:"Salão"}};
      assert.equal((await site.PUT(request("PUT",{action:"publish",config,templateId:"botanical-classic",expectedRevision:0}))).status,200);assert.equal(store.get("weddings/test-couple").config.sections.gallery,true);assert.equal(store.get("weddings/test-couple").config.galleryStyle,"mural");
      assert.equal((await site.PUT(request("PUT",{action:"publish",config:{...config,sections:{gallery:false},galleryStyle:"filme"},templateId:"contemporary-romance",expectedRevision:1}))).status,200);const saved=store.get("weddings/test-couple");assert.equal(saved.config.sections.gallery,false);assert.equal(saved.config.galleryStyle,"filme");assert.deepEqual(saved.config.gallery,ten.gallery);
    }finally{store.set("weddings/test-couple",original);}
  });
  await check("SEO usa URLs públicas, imagem OG real e protege páginas privadas",async()=>{
    const {pageMetadata,weddingMetadata,jsonLd,SEO_ORIGIN,SEO_IMAGE}=load("src/lib/seo.ts");
    const image=fs.readFileSync("public/SEO/og-image.png");assert.equal(image.readUInt32BE(16),SEO_IMAGE.width);assert.equal(image.readUInt32BE(20),SEO_IMAGE.height);
    const home=pageMetadata({title:"Forever"});assert.equal(home.alternates.canonical,SEO_ORIGIN+"/");assert.equal(home.openGraph.images[0].url,SEO_ORIGIN+"/SEO/og-image.png?v=2");assert.equal(home.twitter.card,"summary_large_image");assert.ok(image.length<500_000,"Social sharing image should stay lightweight");
    const privatePage=pageMetadata({title:"Editor",path:"/test-couple/admin/site?action=edit",index:false});assert.equal(privatePage.alternates.canonical,SEO_ORIGIN+"/test-couple/admin/site");assert.equal(privatePage.robots.index,false);assert.equal(privatePage.robots.googleBot.index,false);
    assert.throws(()=>pageMetadata({title:"Invalid",path:"https://example.org"}));
    const {emptyWeddingConfig}=load("src/config/forever.ts");const wedding={slug:"seo-couple",status:"published",config:{...emptyWeddingConfig,couple:{...emptyWeddingConfig.couple,partner1:"Ana",partner2:"Pedro",weddingDate:"2027-05-01T23:00:00-03:00"}}};
    const meta=weddingMetadata(wedding);assert.equal(meta.title.absolute,"Ana & Pedro | Forever");assert.equal(meta.alternates.canonical,SEO_ORIGIN+"/seo-couple");assert(meta.description.includes("1 de maio de 2027"));assert.equal(weddingMetadata(wedding,"rsvp").robots.index,false);
    const original={name:"</script><script>alert(1)</script>"};const encoded=jsonLd(original);assert(!encoded.includes("<"));assert.deepEqual(JSON.parse(encoded),original);
  });
  await check("sitemap inclui somente casamentos publicados e robots anuncia o sitemap",async()=>{
    const {default:sitemap}=load("src/app/sitemap.ts"),{default:robots}=load("src/app/robots.ts"),{SEO_ORIGIN}=load("src/lib/seo.ts");
    for(const status of ["published","draft","suspended","archived"])store.set("weddings/seo-"+status,{status,updatedAt:"2026-10-13T12:00:00Z"});
    const entries=await sitemap();assert(entries.some(entry=>entry.url===SEO_ORIGIN+"/"));assert(entries.some(entry=>entry.url===SEO_ORIGIN+"/seo-published"));
    for(const status of ["draft","suspended","archived"])assert(!entries.some(entry=>entry.url.endsWith("/seo-"+status)));
    assert(entries.every(entry=>!entry.url.includes("/admin")&&!entry.url.includes("/rsvp")&&!entry.url.includes("?")));assert.equal(robots().sitemap,SEO_ORIGIN+"/sitemap.xml");
    for(const status of ["published","draft","suspended","archived"])store.delete("weddings/seo-"+status);
  });
  await check("galeria valida regras do uploadthing e limpeza de storage",async()=>{
    const {MAX_GALLERY_PHOTOS,MAX_GALLERY_FILE_SIZE_BYTES,ALLOWED_GALLERY_MIME_TYPES,isUploadThingUrl,getUploadThingKey}=load("src/config/gallery.ts");
    assert.equal(MAX_GALLERY_PHOTOS,6);
    assert.equal(MAX_GALLERY_FILE_SIZE_BYTES,1024*1024);
    assert.deepEqual(ALLOWED_GALLERY_MIME_TYPES,["image/png","image/webp"]);
    assert(isUploadThingUrl("https://utfs.io/f/sample-key-123.png"));
    assert(isUploadThingUrl("https://k1g7xqtusx.ufs.sh/f/sample-key-456.webp"));
    assert(!isUploadThingUrl("/gallery/placeholders/01.webp"));
    assert.equal(getUploadThingKey("https://utfs.io/f/sample-key-123.png"),"sample-key-123.png");
    assert.equal(getUploadThingKey("https://ufs.sh/f/sample-key-456.webp?download=1"),"sample-key-456.webp");
    assert.equal(getUploadThingKey("/gallery/placeholders/01.webp"),null);
    assert.equal(getUploadThingKey("raw-key-789"),"raw-key-789");
    const cleanup=load("src/app/api/admin/gallery/cleanup/route.ts");
    assert.equal((await cleanup.POST(new Request("https://example.org/api/admin/gallery/cleanup",{method:"POST"}))).status,401);
  });
  await check("códigos curtos de 6 caracteres (3-3) funcionam para convites gerais e individuais", async () => {
    for(const key of [...store.keys()]) if(key.split("/").length>2&&!key.includes("/members/")) store.delete(key);
    await admin.POST(request("POST", invitation));
    const list = await (await admin.GET(request("GET"))).json();
    const item = list.invitations[0];
    assert.match(item.code, /^[2-9A-Z]{3}-[2-9A-Z]{3}$/);
    assert.equal(typeof item.personalCodes, "object");
    const gCode = item.personalCodes[guests[0].id];
    assert.match(gCode, /^[2-9A-Z]{3}-[2-9A-Z]{3}$/);

    // Consulta pelo código geral (com hífen e sem hífen em minúsculo)
    const viewGeneral = await (await lookup.POST(request("POST", { token: item.code }))).json();
    assert.equal(viewGeneral.invitation.guests.length, 2);
    const viewNoHyphen = await (await lookup.POST(request("POST", { token: item.code.replace("-","").toLowerCase() }))).json();
    assert.equal(viewNoHyphen.invitation.guests.length, 2);

    // Consulta pelo código pessoal (deve isolar a pessoa)
    const viewPersonal = await (await lookup.POST(request("POST", { token: gCode }))).json();
    assert.equal(viewPersonal.invitation.personal, true);
    assert.equal(viewPersonal.invitation.guests.length, 1);
    assert.equal(viewPersonal.invitation.guests[0].id, guests[0].id);

    // Resposta via código pessoal
    const rsvpRes = await rsvp.POST(request("POST", {
      token: gCode,
      revision: 1,
      responses: [{ id: guests[0].id, status: "confirmado", message: "Presença confirmada via 2FA" }]
    }));
    assert.equal(rsvpRes.status, 200);

    // Validação de formato incorreto e código inexistente
    assert.equal((await lookup.POST(request("POST", { token: "123" }))).status, 400);
    assert.equal((await lookup.POST(request("POST", { token: "ZZZ-999" }))).status, 404);
  });
  await check("códigos determinísticos resolvem convites legados e auto-indexam no banco", async () => {
    const { deterministicShortCode } = load("src/lib/guest-server.ts");
    const legacyId = "legacy-invite-xyz";
    const legacyGuestId = "11111111-2222-3333-4444-555555555555";
    store.set("weddings/test-couple/invitations/" + legacyId, {
      active: true,
      label: "Familia Legado",
      kind: "group",
      token: "secret-token-legacy",
      revision: 1,
      guests: [
        { id: legacyGuestId, name: "Convidado Legado", child: false, status: "pendente", checkedIn: false },
        { id: "22222222-3333-4444-5555-666666666666", name: "Outro Convidado", child: false, status: "pendente", checkedIn: false },
      ]
    });
    const guestCode = deterministicShortCode(legacyId + ":" + legacyGuestId);
    const res = await lookup.POST(request("POST", { token: guestCode }));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.invitation.label, "Convidado Legado");
    assert.equal(body.invitation.personal, true);
    assert(store.has("weddings/test-couple/codes/" + guestCode));
  });
  await check("plano essencial limita convidados em 50 e bloqueia módulos exclusivos", async () => {
    store.set("weddings/essencial-wedding", {
      slug: "essencial-wedding",
      status: "published",
      plan: "essencial",
      config: { couple: { partner1: "Noiva", partner2: "Noivo" } },
      theme: "botanical"
    });
    store.set("weddings/essencial-wedding/members/bride", { role: "admin", active: true });

    const essencialReq = (method, data) => new Request("https://wedding.example/api", {
      method,
      headers: {
        origin: "https://wedding.example",
        authorization: "Bearer valid",
        "Content-Type": "application/json",
        "x-wedding-slug": "essencial-wedding",
      },
      ...(data ? { body: JSON.stringify(data) } : {}),
    });

    store.set("weddings/essencial-wedding/settings/tables", {tables:[{id:"legacy-table",name:"Mesa antiga",capacity:8}]});
    store.set("weddings/essencial-wedding/receptionTeam/legacy", {email:"legacy@example.com",active:true});
    store.set("weddings/essencial-wedding/auditLog/legacy", {action:"Alteração antiga",at:new Date().toISOString()});
    const operationsRoute = load("src/app/api/admin/operations/route.ts");
    const protectedData = await (await operationsRoute.GET(essencialReq("GET"))).json();
    assert.deepEqual(protectedData.tables, []);
    assert.deepEqual(protectedData.team, []);
    assert.deepEqual(protectedData.history, []);
    for (const data of [
      {action:"table",name:"Mesa bloqueada",capacity:8},
      {action:"create-team",email:"blocked@example.com",password:"password123"},
    ]) assert.equal((await operationsRoute.POST(essencialReq("POST",data))).status,403);
    const receptionRoute = load("src/app/api/admin/reception/route.ts");
    assert.equal((await receptionRoute.GET(essencialReq("GET"))).status,403);

    const { resolveModules } = load("src/config/modules.ts");
    const modules = resolveModules({ checkIn: true, organization: true, guestList: true }, "essencial");
    assert.equal(modules.checkIn, false);
    assert.equal(modules.tables, false);
    assert.equal(modules.buffet, false);
    assert.equal(modules.team, false);
    assert.equal(modules.guestList, true);

    const guests50 = Array.from({ length: 50 }, (_, i) => ({
      id: randomUUID(),
      name: `Convidado ${i + 1}`,
      child: false,
      status: "pendente",
      checkedIn: false,
    }));
    const create40 = await admin.POST(essencialReq("POST", {
      label: "Grupo dos 45",
      active: true,
      kind: "group",
      guests: guests50.slice(0, 45),
    }));
    assert.equal(create40.status, 201);

    const create10 = await admin.POST(essencialReq("POST", {
      label: "Grupo dos 5",
      active: true,
      kind: "group",
      guests: guests50.slice(45, 50),
    }));
    assert.equal(create10.status, 201);

    const create51 = await admin.POST(essencialReq("POST", {
      label: "Convidado Excedente",
      active: true,
      kind: "individual",
      guests: [{ id: randomUUID(), name: "Convidado 51", child: false, status: "pendente", checkedIn: false }],
    }));
    assert.equal(create51.status, 403);
    const errBody = await create51.json();
    assert(errBody.error.includes("50"));
  });
  await check("Forever PRO aceita grupos com mais de 50 convidados sem limite de 40 por convite", async () => {
    store.set("weddings/test-couple", {slug:"test-couple",status:"published",plan:"foreverPro",config:{couple:{partner1:"Test",partner2:"Couple"}}});
    store.set("weddings/test-couple/members/bride", {role:"admin",active:true});
    const response = await admin.POST(request("POST", {label:"Grupo PRO de 75 pessoas",active:true,kind:"group",guests:Array.from({length:75},(_,index)=>({id:randomUUID(),name:"Pessoa PRO "+index,child:false,status:"pendente",checkedIn:false}))}));
    assert.equal(response.status,201);
  });
  await check("Studio altera e remove planos sem cobrança, preserva dados e bloqueia recursos por plano",async()=>{
    const platform=load("src/app/api/platform/weddings/route.ts");
    const {resolveModules}=load("src/config/modules.ts");
    const {requestWedding}=load("src/lib/guest-server.ts");
    store.set("weddings/plan-test",{slug:"plan-test",plan:"foreverPro",status:"published",config:{couple:{partner1:"Plan",partner2:"Test"}}});
    store.set("weddings/plan-test/members/bride",{active:true,role:"admin"});
    store.set("weddings/plan-test/invitations/existing",{active:true,token:"test-secret",guests:[{id:randomUUID(),name:"Preservado",status:"pendente",child:false,checkedIn:false}]});
    const scoped=(method,data,token="valid")=>new Request("https://wedding.example/api",{method,headers:{origin:"https://wedding.example",authorization:"Bearer "+token,"Content-Type":"application/json","x-wedding-slug":"plan-test"},...(data?{body:JSON.stringify(data)}:{})});
    assert.equal((await platform.PATCH(scoped("PATCH",{slug:"plan-test",plan:"essencial"}))).status,403);
    assert.equal((await platform.PATCH(scoped("PATCH",{slug:"plan-test",plan:"essencial"},"owner-unverified"))).status,403);
    assert.equal((await platform.PATCH(scoped("PATCH",{slug:"plan-test",plan:"essencial"},"owner-verified"))).status,200);
    assert.equal(store.get("weddings/plan-test").plan,"essencial");
    assert.equal((await platform.PATCH(scoped("PATCH",{slug:"plan-test",plan:null},"owner-verified"))).status,200);
    assert.equal(store.get("weddings/plan-test").plan,null);
    assert.equal(store.get("weddings/plan-test").status,"published");
    assert.equal(store.get("weddings/plan-test/invitations/existing").guests[0].name,"Preservado");
    assert.equal((await admin.GET(scoped("GET"))).status,403);
    await assert.rejects(()=>requestWedding(scoped("GET"),true));
    assert.equal((await platform.PATCH(scoped("PATCH",{slug:"plan-test",plan:"foreverPro"},"owner-verified"))).status,200);
    assert.equal((await admin.GET(scoped("GET"))).status,200);
    assert.equal((await requestWedding(scoped("GET"),true)).plan,"foreverPro");
    assert.equal(store.get("weddings/plan-test/invitations/existing").guests[0].name,"Preservado");
  });
  await check("configurações derivam horário e cidade e usam o endereço no OpenStreetMap",async()=>{
    const {emptyWeddingConfig}=load("src/config/forever.ts");
    const {synchronizeWeddingSettings,weddingDateTimeInput,venueMapUrl}=load("src/lib/wedding-settings.ts");
    const config=clone(emptyWeddingConfig);
    config.couple.weddingDate="2027-05-29T14:30:00Z";
    config.ceremony.time="18h00";
    config.ceremony.addressDetails={street:"Praça da Sé",number:"1",complement:"",neighborhood:"Sé",city:"São Paulo",state:"SP"};
    const synced=synchronizeWeddingSettings(config);
    assert.equal(synced.ceremony.time,"11h30");
    assert.equal(synced.couple.locationSummary,"São Paulo — SP");
    assert.equal(config.ceremony.time,"18h00");
    assert.equal(weddingDateTimeInput(config.couple.weddingDate),"2027-05-29T11:30");
    assert.equal(weddingDateTimeInput(""),"");
    config.ceremony.coordinates={latitude:-23.5505,longitude:-46.6333};
    const point=new URL(venueMapUrl(config.ceremony));
    assert.equal(point.hostname,"www.openstreetmap.org");
    assert.equal(point.searchParams.get("mlat"),"-23.5505");
    assert.equal(point.searchParams.get("mlon"),"-46.6333");
    config.ceremony.coordinates=null;config.ceremony.address="Praça da Sé, 1";config.ceremony.cityState="São Paulo — SP";
    assert.equal(new URL(venueMapUrl(config.ceremony)).searchParams.get("query"),"Praça da Sé, 1, São Paulo — SP");
  });
  await check("locais separados preservam endereço, mapa e horário próprios sem alterar casamentos existentes",async()=>{
    const {emptyWeddingConfig}=load("src/config/forever.ts");
    const {weddingConfigSchema,weddingUpdateSchema}=load("src/lib/wedding-schema.ts");
    const {synchronizeWeddingSettings,venueMapUrl}=load("src/lib/wedding-settings.ts");
    const config=clone(emptyWeddingConfig);
    assert.notEqual(weddingConfigSchema.parse(config).sameVenue,false);
    config.sameVenue=false;
    config.couple.weddingDate="2027-05-29T14:30:00Z";
    config.ceremony.placeName="Igreja";
    config.ceremony.coordinates={latitude:-23.55,longitude:-46.63};
    config.party={...config.party,placeName:"Salão",address:"Rua da Festa, 200",cityState:"Campinas — SP",time:"14:00",coordinates:{latitude:-22.9,longitude:-47.06}};
    const parsed=weddingConfigSchema.parse(config);
    const synced=synchronizeWeddingSettings(parsed);
    assert.equal(synced.sameVenue,false);
    assert.equal(synced.ceremony.time,"11h30");
    assert.deepEqual(synced.party,config.party);
    assert.notEqual(venueMapUrl(synced.party),venueMapUrl(synced.ceremony));
    const joined=weddingConfigSchema.parse({...synced,sameVenue:true});
    assert.deepEqual(joined.party,config.party);
    assert.deepEqual(weddingConfigSchema.parse({...joined,sameVenue:false}).party,config.party);
    const incomplete={...parsed,party:{...parsed.party,placeName:""}};
    assert(weddingUpdateSchema.safeParse({config:incomplete,theme:"botanical",status:"draft"}).success);
    assert(!weddingUpdateSchema.safeParse({config:incomplete,theme:"botanical",status:"published"}).success);
  });
  await check("mapas validam coordenadas e preservam configurações sem localização",async()=>{
    const {emptyWeddingConfig}=load("src/config/forever.ts"),{weddingConfigSchema}=load("src/lib/wedding-schema.ts");
    const config=clone(emptyWeddingConfig);
    assert(weddingConfigSchema.safeParse(config).success);
    config.ceremony.postalCode="01001000";
    config.ceremony.coordinates={latitude:-23.5505,longitude:-46.6333};
    config.ceremony.addressDetails={street:"Praça da Sé",number:"1",complement:"Entrada lateral",neighborhood:"Sé",city:"São Paulo",state:"SP"};
    assert(weddingConfigSchema.safeParse(config).success);
    assert.deepEqual(weddingConfigSchema.parse(config).ceremony.addressDetails,config.ceremony.addressDetails);
    assert(!weddingConfigSchema.safeParse({...config,ceremony:{...config.ceremony,addressDetails:{...config.ceremony.addressDetails,state:"São Paulo"}}}).success);
    assert(!weddingConfigSchema.safeParse({...config,ceremony:{...config.ceremony,coordinates:{latitude:91,longitude:0}}}).success);
    assert(!weddingConfigSchema.safeParse({...config,ceremony:{...config.ceremony,postalCode:"123"}}).success);
    config.ceremony.coordinates=null;assert(weddingConfigSchema.safeParse(config).success);
  });
  await check("geocodificação exige autorização e filtra resultados inválidos ou de fora do Brasil",async()=>{
    const route=load("src/app/api/admin/geocode/route.ts"),originalFetch=globalThis.fetch;
    store.set("weddings/test-couple",{slug:"test-couple",status:"published",plan:"essencial",config:{couple:{partner1:"Test",partner2:"Couple"}}});
    const payload={address:"Praça da Sé, 1, Entrada lateral, Sé",cityState:"São Paulo — SP",postalCode:"01001000",addressDetails:{street:"Praça da Sé",number:"1",complement:"Entrada lateral",neighborhood:"Sé",city:"São Paulo",state:"SP"}};
    assert.equal((await route.POST(request("POST",payload,"outsider"))).status,403);
    assert.equal((await route.POST(request("POST",{...payload,postalCode:"123"}))).status,400);
    try{
      globalThis.fetch=async url=>{assert.equal(new URL(url).searchParams.get("q"),"Praça da Sé, 1, São Paulo, SP, 01001000, Brasil");return Response.json({features:[{properties:{countrycode:"BR",name:"Sé",street:"Praça da Sé",city:"São Paulo"},geometry:{coordinates:[-46.6333,-23.5505]}},{properties:{countrycode:"US"},geometry:{coordinates:[1,2]}},{properties:{countrycode:"BR"},geometry:{coordinates:[0,100]}},{properties:{countrycode:"BR",street:"Outra rua",housenumber:"1",city:"São Paulo"},geometry:{coordinates:[-46.6,-23.5]}},{properties:{countrycode:"BR",street:"Praça da Sé",city:"Outra cidade"},geometry:{coordinates:[-46.6,-23.5]}}]});};
      const result=await route.POST(request("POST",payload));assert.equal(result.status,200);
      assert.deepEqual((await result.json()).candidates,[{latitude:-23.5505,longitude:-46.6333,label:"Sé, Praça da Sé, São Paulo"}]);
      assert.equal((await route.POST(request("POST",payload))).status,429);
      store.set("weddings/test-couple",{...store.get("weddings/test-couple"),plan:null});
      assert.equal((await route.POST(request("POST",payload))).status,403);
    }finally{globalThis.fetch=originalFetch;}
  });
  console.log(
    `\n${count} verificações passaram. Banco e autenticação simulados.`,
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
