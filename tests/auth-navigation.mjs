import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function compile(file) {
  return ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
}

const flush = () => new Promise((resolve) => setImmediate(resolve));
const fallback = new Proxy({}, { get: () => () => null });
const account = (uid) => ({ uid, getIdToken: async () => `token-${uid}` });
const destination = (slug, role = "admin") => ({
  destination: `/${slug}/${role === "reception" ? "recepcao" : "painel"}`,
  slug,
  role,
  plan: "foreverPro",
});

function fixture(file, exportedName) {
  const state = [];
  const effects = [];
  const pendingEffects = [];
  const resolutions = [];
  const redirects = [];
  let stateIndex = 0;
  let effectIndex = 0;
  let listener;
  let listenerError;
  const router = { replace: (path) => redirects.push(path) };
  const exports = {};
  const jsx = (type, props) => ({ type, props });
  vm.runInNewContext(compile(file), {
    exports,
    queueMicrotask,
    URLSearchParams,
    require: (name) => {
      if (name === "react")
        return {
          Fragment: "Fragment",
          useState: (initial) => {
            const index = stateIndex++;
            if (!(index in state))
              state[index] = typeof initial === "function" ? initial() : initial;
            return [
              state[index],
              (value) => {
                state[index] = typeof value === "function" ? value(state[index]) : value;
              },
            ];
          },
          useEffect: (work, deps) => {
            const index = effectIndex++;
            if (!effects[index] || deps.some((dep, i) => dep !== effects[index].deps[i])) {
              pendingEffects.push(() => {
                effects[index]?.cleanup?.();
                effects[index] = { deps, cleanup: work() };
              });
            }
          },
        };
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx, Fragment: "Fragment" };
      if (name === "firebase/auth")
        return {
          onAuthStateChanged: (_auth, callback, error) => {
            listener = callback;
            listenerError = error;
            return () => {};
          },
          signOut: async () => listener(null),
        };
      if (name === "@/lib/firebase/client") return { clientAuth: () => ({}) };
      if (name === "@/lib/auth-destination")
        return {
          resolveAuthDestination: (user) =>
            new Promise((resolve, reject) => resolutions.push({ uid: user.uid, resolve, reject })),
        };
      if (name === "next/navigation")
        return { useRouter: () => router, useSearchParams: () => new URLSearchParams() };
      if (name === "next/link") return "Link";
      if (name === "@/config/modules") return { moduleKeys: [], moduleCatalog: {} };
      return fallback;
    },
  });
  return {
    render() {
      stateIndex = 0;
      effectIndex = 0;
      const tree = exports[exportedName]();
      while (pendingEffects.length) pendingEffects.shift()();
      return tree;
    },
    auth: (user) => listener(user),
    authError: (error) => listenerError(error),
    resolutions,
    redirects,
  };
}

function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!tree || typeof tree !== "object") return [];
  return [tree, ...nodes(tree.props?.children)];
}
const hasForm = (tree) => nodes(tree).some((node) => node.type === "form");
const hrefs = (tree) =>
  nodes(tree)
    .map((node) => node.props?.href)
    .filter(Boolean);

const landing = fixture("src/components/forever/ForeverLandingPage.tsx", "ForeverLandingPage");
assert(!hrefs(landing.render()).includes("/login"));
landing.auth(account("first"));
assert(!hrefs(landing.render()).includes("/login"));
landing.resolutions[0].resolve(destination("giovanna-e-edson"));
await flush();
assert(hrefs(landing.render()).includes("/giovanna-e-edson/painel"));
assert(!hrefs(landing.render()).includes("/login"));
landing.auth(account("old"));
landing.auth(account("new"));
landing.resolutions[2].resolve(destination("new-couple"));
await flush();
landing.resolutions[1].resolve(destination("old-couple"));
await flush();
assert(hrefs(landing.render()).includes("/new-couple/painel"));
assert(!hrefs(landing.render()).includes("/old-couple/painel"));
landing.auth(account("failure"));
landing.resolutions[3].reject(new Error("Temporary connection failure"));
await flush();
assert(!hrefs(landing.render()).includes("/login"));
assert(nodes(landing.render()).some((node) => node.props?.role === "alert"));
landing.auth(null);
assert(hrefs(landing.render()).includes("/login"));

const login = fixture("src/app/login/Login.tsx", "Login");
assert(!hasForm(login.render()));
login.auth(account("signed-in"));
assert(!hasForm(login.render()));
login.resolutions[0].resolve(destination("giovanna-e-edson"));
await flush();
assert.deepEqual(login.redirects, ["/giovanna-e-edson/painel"]);
assert(!hasForm(login.render()));

const signedOut = fixture("src/app/login/Login.tsx", "Login");
signedOut.render();
signedOut.auth(account("old"));
signedOut.auth(null);
signedOut.resolutions[0].resolve(destination("old-couple"));
await flush();
assert.deepEqual(signedOut.redirects, []);
assert(hasForm(signedOut.render()));

const failedLogin = fixture("src/app/login/Login.tsx", "Login");
failedLogin.render();
failedLogin.auth(account("signed-in"));
failedLogin.resolutions[0].reject(new Error("Temporary connection failure"));
await flush();
const failureTree = failedLogin.render();
assert(!hasForm(failureTree));
assert(nodes(failureTree).some((node) => node.props?.role === "alert"));
const retry = nodes(failureTree).find(
  (node) => node.type === "button" && node.props.children === "Tentar novamente",
);
retry.props.onClick();
assert(!hasForm(failedLogin.render()));
failedLogin.auth(account("signed-in"));
failedLogin.resolutions[1].resolve(destination("restored"));
await flush();
assert.deepEqual(failedLogin.redirects, ["/restored/painel"]);

let response;
let tokenCalls = 0;
const apiExports = {};
vm.runInNewContext(compile("src/lib/api-response.ts"), {
  exports: apiExports,
  require: () => fallback,
});
const resolverExports = {};
vm.runInNewContext(compile("src/lib/auth-destination.ts"), {
  exports: resolverExports,
  fetch: async (_url, options) => {
    assert.equal(options.cache, "no-store");
    return response;
  },
  require: () => apiExports,
});
const user = {
  getIdToken: async () => {
    tokenCalls++;
    return "test-token";
  },
};
for (const result of [
  destination("couple"),
  destination("couple", "reception"),
  { destination: "/studio", role: "superadmin", plan: "foreverPro" },
  { destination: "/couple/acesso-expirado", role: "admin", plan: "essencial" },
]) {
  response = Response.json(result);
  assert.equal(
    (await resolverExports.resolveAuthDestination(user)).destination,
    result.destination,
  );
}
response = Response.json({ error: "No plan", code: "PLAN_REQUIRED" }, { status: 403 });
assert.equal(
  (await resolverExports.resolveAuthDestination(user)).destination,
  "/contratar?reason=sem-plano",
);
response = Response.json({ destination: "https://example.com" });
await assert.rejects(() => resolverExports.resolveAuthDestination(user));
assert.equal(tokenCalls, 6);
console.log(
  "OK auth navigation: pending sessions, direct panel links, login guard, stale requests, retries and account destinations",
);
