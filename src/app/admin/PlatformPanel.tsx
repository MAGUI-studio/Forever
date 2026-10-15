"use client";
import {useRouter} from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";
import { readApiResponse } from "@/lib/api-response";
import {StudioShell} from "@/components/forever/StudioShell";
import {StudioButton} from "@/components/forever/StudioButton";
import {StudioLoading} from "@/components/forever/StudioLoading";
import Link from "next/link";
import { AdminDialog } from "./AdminDialog";
import { Plus, RefreshCw, Search, ArrowUpRight, Layers3, Heart, Globe, FileText } from "lucide-react";
import { parseAsStringEnum, useQueryState } from "nuqs";
type Wedding = {
  slug: string;
  status: string;
  config: { couple: { partner1: string; partner2: string } };
};
const field="mt-2 h-12 w-full rounded-xl border border-[#16161620] bg-white px-4 text-sm outline-none focus:border-[#722F37] focus:ring-2 focus:ring-[#722F3710]";
export function PlatformPanel() {
 const router=useRouter();
  const [user, setUser] = useState<User | null>(null),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [query,setQuery]=useState("");
  const [weddings, setWeddings] = useState<Wedding[]>([]),
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
  const filtered=weddings.filter(wedding=>(wedding.config.couple.partner1+" "+wedding.config.couple.partner2+" "+wedding.slug).toLowerCase().includes(query.toLowerCase()));
  return <StudioShell email={user?.email??undefined}>
   {!ready||loading?<StudioLoading/>:<>
    <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#77736c]">Administração interna</p><h1 className="mt-3 font-serif text-5xl leading-none sm:text-6xl">Histórias que começam aqui.</h1><p className="mt-4 text-sm text-[#77736c]">Gerencie os casamentos, os acessos e as funções de cada espaço.</p></div><div className="flex flex-wrap gap-2"><StudioButton variant="ghost" disabled={busy} onClick={()=>void load()}><RefreshCw size={16}/>Atualizar</StudioButton>{superadmin&&<StudioButton onClick={()=>void setAction("new-wedding")}><Plus size={16}/>Novo casamento</StudioButton>}</div></div>
    <div className="my-8 grid gap-4 sm:grid-cols-3">{[{label:"Casamentos",value:weddings.length,Icon:Heart},{label:"Sites publicados",value:weddings.filter(item=>item.status==="published").length,Icon:Globe},{label:"Em preparação",value:weddings.filter(item=>item.status==="draft").length,Icon:FileText}].map(({label,value,Icon},index)=><article key={label} className={"relative overflow-hidden rounded-2xl border p-5 "+(index===0?"border-[#722F37] bg-[#722F37] text-white":"border-[#1616160d] bg-white text-[#161616]")}><Icon size={92} strokeWidth={1} aria-hidden="true" className="absolute -bottom-5 -right-3 opacity-[0.06]"/><p className="relative text-xs opacity-60">{label}</p><p className="relative mt-4 font-serif text-5xl">{value}</p></article>)}</div>
    <section aria-label="Casamentos"><div className="mb-5 flex flex-wrap items-center justify-between gap-4"><h2 className="font-serif text-3xl">Seus casamentos</h2><label className="relative w-full sm:w-80"><Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#77736c]"/><input aria-label="Buscar casamentos" placeholder="Buscar casal ou endereço" value={query} onChange={event=>setQuery(event.target.value)} className="h-12 w-full rounded-xl border border-[#16161615] bg-white pr-4 pl-11 text-sm outline-none focus:border-[#722F37] focus:ring-2 focus:ring-[#722F3710]"/></label></div>
     <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map(wedding=><article key={wedding.slug} className="group rounded-2xl border border-[#1616160d] bg-white p-5 transition-shadow hover:shadow-[0_8px_28px_#16161606] sm:p-6"><div className="flex items-center justify-between gap-3"><span className={"rounded-full px-3 py-1 text-[11px] "+(wedding.status==="published"?"bg-[#edf3ee] text-[#496451]":wedding.status==="suspended"?"bg-[#f9eee8] text-[#986343]":"bg-[#16161606] text-[#77736c]")}>{{draft:"Rascunho",published:"Publicado",suspended:"Suspenso",archived:"Arquivado"}[wedding.status]}</span><Heart size={19} strokeWidth={1} className="text-[#16161630]"/></div><h3 className="mt-5 font-serif text-3xl leading-tight">{wedding.config.couple.partner1} <span className="italic text-[#a39e95]">&</span> {wedding.config.couple.partner2}</h3><p className="mt-2 break-all text-xs text-[#77736c]">forever.magui.studio/{wedding.slug}</p><div className="mt-6 grid grid-cols-2 gap-2"><Link href={"/"+wedding.slug+"/painel"} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#722F37] px-3 text-xs font-medium text-white transition-colors hover:bg-[#5B252C]">Abrir painel<ArrowUpRight size={14}/></Link><Link href={"/studio/modules?wedding="+wedding.slug} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#16161615] px-3 text-xs text-[#722F37] transition-colors hover:bg-[#722F3705]"><Layers3 size={14}/>Módulos</Link></div><div className="mt-4 flex flex-wrap items-center gap-1 border-t border-[#16161608] pt-3"><StudioButton variant="ghost" disabled={busy} className="min-h-9! px-2! text-xs!" onClick={()=>void work(async()=>{await api("PATCH",{slug:wedding.slug,status:["suspended","archived"].includes(wedding.status)?"draft":"suspended"});await load();})}>{["suspended","archived"].includes(wedding.status)?"Restaurar rascunho":"Suspender"}</StudioButton><StudioButton variant="ghost" disabled={busy||wedding.status==="archived"} className="min-h-9! px-2! text-xs!" onClick={()=>void work(async()=>{await api("PATCH",{slug:wedding.slug,status:"archived"});await load();})}>Arquivar</StudioButton><Link href={"/"+wedding.slug} target="_blank" rel="noopener noreferrer" className="ml-auto px-2 py-2 text-xs text-[#77736c] hover:text-[#722F37]">Ver site ↗</Link></div></article>)}</div>{!filtered.length&&<p className="rounded-2xl border border-dashed border-[#16161620] py-12 text-center text-sm text-[#77736c]">{query?"Nenhum casamento encontrado.":"Cadastre o primeiro casamento para começar."}</p>}
    </section>
   </>}
   {error&&<p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}{notice&&<p role="status" className="mt-5 text-sm text-[#62605b]">{notice}</p>}
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
          <StudioButton type="submit" disabled={busy}>
            {busy ? "Criando…" : "Criar casamento"}
          </StudioButton>
        </form>
      </AdminDialog>
  </StudioShell>;
}
