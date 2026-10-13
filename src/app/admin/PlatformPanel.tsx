"use client";
import {useRouter} from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  type User,
} from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";
import { readApiResponse } from "@/lib/api-response";
import { AdminContainer } from "./AdminContainer";
import { AdminButton } from "./AdminButton";
import { SkeletonBlock } from "./skeleton";
import Link from "next/link";
import { AdminDialog } from "./AdminDialog";
import { Plus, LogOut, RefreshCw } from "lucide-react";
import { parseAsStringEnum, useQueryState } from "nuqs";
type Wedding = {
  slug: string;
  status: string;
  config: { couple: { partner1: string; partner2: string } };
};
const field =
  "mt-2 h-12 w-full rounded-2xl border border-[#5d613c30] bg-white px-4 text-sm outline-none focus:border-[var(--forever-primary,#5D613C)] focus:ring-2 focus:ring-[#5d613c20]";
export function PlatformPanel() {
 const router=useRouter();
  const [user, setUser] = useState<User | null>(null),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [weddings, setWeddings] = useState<Wedding[]>([]),
    [superadmin, setSuperadmin] = useState(false);
  const [action, setAction] = useQueryState(
    "action",
    parseAsStringEnum(["new-wedding"]).withOptions({
      history: "push",
      scroll: false,
    }),
  );
  const [slug, setSlug] = useState(""),
    [partner1, setPartner1] = useState(""),
    [partner2, setPartner2] = useState(""),
    [ownerEmail, setOwnerEmail] = useState(""),
    [ownerPassword, setOwnerPassword] = useState("");
  useEffect(() => {
    try {
      return onAuthStateChanged(clientAuth(), (account) => {
        if(!account){router.replace("/login");return;}
        setUser(account);
        setReady(true);
        setWeddings([]);setLoading(true);
      });
    } catch (e) {
      queueMicrotask(()=>{setError((e as Error).message);setReady(true);});
    }
  }, [router]);
  const api=useCallback(async (method = "GET", data?: unknown) => {
    if (!user) throw Error("Entre para continuar.");
    return readApiResponse(
      await fetch("/api/platform/weddings", {
        method,
        headers: {
          Authorization: "Bearer " + (await user.getIdToken()),
          "Content-Type": "application/json",
        },
        ...(data ? { body: JSON.stringify(data) } : {}),
      }),
    );
  },[user]);
  const load=useCallback(async () => {
    try {
      const data = await api();
      if(!data.superadmin){router.replace("/login");return;}
      setWeddings(data.weddings);
      setSuperadmin(data.superadmin);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  },[api,router]);
  useEffect(() => {
    if (user) void load();
  }, [user,load]);
  async function work(callback: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await callback();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function close() {
    setOwnerPassword("");
    void setAction(null, { history: "replace" });
  }
  return (
    <main className="admin-wedding">
      <AdminContainer>
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#5d613c20] py-6">
          <Link href="/" className="font-serif text-4xl">
            Forever{" "}
            <span className="font-sans text-xs text-[var(--forever-primary,#5D613C)]">
              by MAGUI.studio
            </span>
          </Link>
          {user && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-[var(--forever-accent,#80654E)]">
                {user.email}
              </span>
              <AdminButton
                variant="ghost"
                onClick={() => void signOut(clientAuth())}
              >
                <LogOut size={16} />
                Sair
              </AdminButton>
            </div>
          )}
        </header>
        <section className="py-8 sm:py-12">
          {!ready ? (
            <SkeletonBlock className="h-56 w-full" />
          ) : !user ? (
            <form
              className="mx-auto grid max-w-md gap-5"
              onSubmit={(e) => {
                e.preventDefault();
                void work(() =>
                  signInWithEmailAndPassword(clientAuth(), email, password),
                );
              }}
            >
              <h1 className="font-serif text-4xl">Acessar meu espaço</h1>
              <label className="text-sm">
                E-mail <span className="text-red-600">*</span>
                <input
                  className={field}
                  required
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label className="text-sm">
                Senha <span className="text-red-600">*</span>
                <input
                  className={field}
                  required
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <AdminButton type="submit" disabled={busy}>
                Entrar
              </AdminButton>
              <AdminButton
                variant="ghost"
                disabled={busy || !email}
                onClick={() =>
                  void work(async () => {
                    await sendPasswordResetEmail(clientAuth(), email);
                    setNotice(
                      "Se houver uma conta para este e-mail, você receberá as instruções de recuperação.",
                    );
                  })
                }
              >
                Esqueci minha senha
              </AdminButton>
            </form>
          ) : (
            <>
              <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--forever-primary,#5D613C)]">
                    {superadmin ? "Painel MAGUI.studio" : "Seu espaço"}
                  </p>
                  <h1 className="mt-3 font-serif text-5xl">
                    {superadmin ? "Casamentos" : "Meus casamentos"}
                  </h1>
                </div>
                <div className="flex gap-3">
                  <AdminButton
                    variant="ghost"
                    disabled={busy}
                    onClick={() => void load()}
                  >
                    <RefreshCw size={16} />
                    Atualizar
                  </AdminButton>
                  {superadmin && (
                    <AdminButton onClick={() => void setAction("new-wedding")}>
                      <Plus size={16} />
                      Novo casamento
                    </AdminButton>
                  )}
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                {loading
                  ? [0, 1].map((i) => (
                      <SkeletonBlock key={i} className="h-52 w-full" />
                    ))
                  : weddings.map((wedding) => (
                      <article
                        key={wedding.slug}
                        className="rounded-2xl bg-[#fffdfa] p-6"
                      >
                        <p className="text-xs text-[var(--forever-accent,#80654E)]">
                          {
                            {
                              draft: "Rascunho",
                              published: "Publicado",
                              suspended: "Suspenso",
                              archived: "Arquivado",
                            }[wedding.status]
                          }
                        </p>
                        <h2 className="mt-3 font-serif text-3xl">
                          {wedding.config.couple.partner1} &amp;{" "}
                          {wedding.config.couple.partner2}
                        </h2>
                        <p className="mt-2 break-all text-xs text-[var(--forever-accent,#80654E)]">
                          forever.magui.studio/{wedding.slug}
                        </p>
                        <div className="mt-5 flex flex-wrap items-center gap-3">
                          <Link
                            className="rounded-xl bg-[var(--forever-primary,#5D613C)] px-5 py-3 text-sm text-white hover:bg-[#4b4f30]"
                            href={"/" + wedding.slug + "/admin/dashboard"}
                          >
                            Gerenciar
                          </Link>
                          {superadmin&&<Link className="rounded-xl border border-[#5d613c30] px-5 py-3 text-sm text-[#5D613C] hover:bg-[#5d613c10]" href={"/studio/modules?wedding="+wedding.slug}>Módulos</Link>}
                          {wedding.status === "published" && (
                            <Link
                              className="text-sm text-[var(--forever-primary,#5D613C)]"
                              href={"/" + wedding.slug}
                            >
                              Ver site
                            </Link>
                          )}
                          {superadmin && (
                            <>
                              <AdminButton
                                variant="ghost"
                                onClick={() =>
                                  void work(async () => {
                                    await api("PATCH", {
                                      slug: wedding.slug,
                                      status:
                                        wedding.status === "suspended" ||
                                        wedding.status === "archived"
                                          ? "draft"
                                          : "suspended",
                                    });
                                    await load();
                                  })
                                }
                              >
                                {wedding.status === "suspended" ||
                                wedding.status === "archived"
                                  ? "Restaurar rascunho"
                                  : "Suspender"}
                              </AdminButton>
                              <AdminButton
                                variant="ghost"
                                disabled={wedding.status === "archived"}
                                onClick={() =>
                                  void work(async () => {
                                    await api("PATCH", {
                                      slug: wedding.slug,
                                      status: "archived",
                                    });
                                    await load();
                                  })
                                }
                              >
                                Arquivar
                              </AdminButton>
                            </>
                          )}
                        </div>
                      </article>
                    ))}
              </div>
              {!loading && !weddings.length && (
                <p className="py-10 text-center text-[var(--forever-accent,#80654E)]">
                  Nenhum casamento vinculado à sua conta. Solicite o acesso à
                  MAGUI.studio.
                </p>
              )}
            </>
          )}
          {error && (
            <p role="alert" className="mt-5 text-sm text-red-700">
              {error}
            </p>
          )}
          {notice && (
            <p
              role="status"
              className="mt-5 text-sm text-[var(--forever-primary,#5D613C)]"
            >
              {notice}
            </p>
          )}
        </section>
      </AdminContainer>
      <AdminDialog
        open={superadmin && action === "new-wedding"}
        onClose={close}
        busy={busy}
        title="Novo casamento"
        description="O endereço será forever.magui.studio/slug. Uma conta existente mantém sua senha."
      >
        <p className="mt-4 text-xs">
          Campos marcados com <span className="text-red-600">*</span> são
          obrigatórios.
        </p>
        <form
          className="mt-5 grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void work(async () => {
              await api("POST", {
                slug,
                partner1,
                partner2,
                ownerEmail,
                ...(ownerPassword ? { ownerPassword } : {}),
              });
              close();
              await load();
            });
          }}
        >
          {[
            { label: "Slug", value: slug, set: setSlug },
            { label: "Primeira pessoa", value: partner1, set: setPartner1 },
            { label: "Segunda pessoa", value: partner2, set: setPartner2 },
            {
              label: "E-mail do responsável",
              value: ownerEmail,
              set: setOwnerEmail,
            },
          ].map((item) => (
            <label key={item.label} className="text-sm">
              {item.label} <span className="text-red-600">*</span>
              <input
                disabled={busy}
                required
                className={field}
                type={item.label.includes("E-mail") ? "email" : "text"}
                value={item.value}
                onChange={(e) => item.set(e.target.value)}
              />
            </label>
          ))}
          <label className="text-sm">
            Senha inicial (necessária para uma nova conta)
            <input
              disabled={busy}
              className={field}
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={ownerPassword}
              onChange={(e) => setOwnerPassword(e.target.value)}
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <AdminButton type="submit" disabled={busy}>
            {busy ? "Criando…" : "Criar casamento"}
          </AdminButton>
        </form>
      </AdminDialog>
    </main>
  );
}
