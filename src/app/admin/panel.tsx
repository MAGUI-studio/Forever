"use client";
import { AdminContainer } from "./AdminContainer";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { AttendanceBadge } from "@/components/ui/AttendanceBadge";
import { ExpandingIconButton, ExpandingIconButtonGroup } from "@/components/ui/ExpandingIconButton";
import { useEffect, useRef, useState } from "react";
import { EnvelopeSimpleIcon, CopyIcon, CheckIcon, CaretDownIcon, PencilSimpleIcon, PaperPlaneTiltIcon, TrashIcon, UsersIcon, WarningCircleIcon, ChatTextIcon } from "@phosphor-icons/react";
import { WeddingSelect } from "@/components/ui/WeddingSelect";
import { CheckInList } from "./CheckInList";
import { MobileAdminMenu } from "./MobileAdminMenu";
import { GuestStats } from "./GuestStats";
import { DashboardSkeleton, GuestStatsSkeleton } from "./skeleton";
import { invitationUrl } from "@/config/site";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminModals, type InviteDraft } from "./modals";
import { useAdminModal, type AdminModalName } from "./modal-state";
import { weddingConfig } from "@/config/wedding.config";
import {
  ArrowUpRight,
  CalendarDays,
  Flower2,
  Heart,
  KeyRound,
  LockKeyhole,
  LogOut,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import {
  WeddingOrnaments,
  WeddingBranch,
} from "@/components/wedding/WeddingOrnaments";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";
import type { Invitation, RSVPSettings } from "@/types/guests";
export function AdminPanel({
  view,
  section = "overview",
}: {
  view: "entry" | "login" | "dashboard";
  section?: "overview" | "guests" | "check-in";
}) {
  const router = useRouter();
  const [modalState, setModalState] = useAdminModal();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);
  const [authorized, setAuthorized] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [settings, setSettings] = useState<RSVPSettings>({
    enabled: true,
    deadline: "",
  });
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("todos");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try {
      return onAuthStateChanged(clientAuth(), (u) => {
        setUser(u);
        setReady(true);
        setAuthorized(false);
        setLoading(true);
        setInvites([]);
        const destination = u ? "dashboard" : "login";
        if (view !== destination) router.replace("/admin/" + destination);
      });
    } catch (e) {
      queueMicrotask(() => {
        setError(e instanceof Error ? e.message : "Falha ao iniciar login.");
        setReady(true);
        if (view !== "login") router.replace("/admin/login");
      });
    }
  }, [router, view]);
  async function api(
    path: string,
    method = "GET",
    data?: unknown,
    account = user,
  ) {
    if (!account) throw new Error("Faça login para continuar.");
    const response = await fetch(path, {
      method,
      headers: {
        Authorization: `Bearer ${await account.getIdToken()}`,
        "Content-Type": "application/json",
      },
      ...(data ? { body: JSON.stringify(data) } : {}),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  }
  async function load(account = user) {
    const [list, config] = await Promise.all([
      api("/api/admin/invites", "GET", undefined, account),
      api("/api/admin/settings", "GET", undefined, account),
    ]);
    setInvites(list.invitations);
    setSettings(config.settings);
    setAuthorized(true);
    setLoading(false);
  }
  useEffect(() => {
    if (user && view === "dashboard") {
      let cancelled = false;
      (async () => {
        try {
          const headers = {
            Authorization: `Bearer ${await user.getIdToken()}`,
          };
          const results = await Promise.all([
            fetch("/api/admin/invites", { headers }),
            fetch("/api/admin/settings", { headers }),
          ]);
          const [list, config] = await Promise.all(
            results.map((r) => r.json()),
          );
          if (cancelled) return;
          if (!results[0].ok || !results[1].ok)
            throw new Error(list.error || config.error);
          setInvites(list.invitations);
          setSettings(config.settings);
          setAuthorized(true);
          setError("");
        } catch (e) {
          if (!cancelled) setLoading(false);
          if (!cancelled)
            setError(
              e instanceof Error ? e.message : "Erro ao carregar painel.",
            );
        }
      })();
      return () => {
        cancelled = true;
      };
    }
  }, [user, view]);
  async function copyInvitationLink(token: string, key: string) {
    try {
      await navigator.clipboard.writeText(invitationUrl(token));
      setCopiedId(key);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopiedId(null), 3000);
    } catch {setError("Não foi possível copiar o link. Tente novamente.");}
  }
  async function action(work: () => Promise<void>, local = false) {
    if (!local) setBusy(true);
    setError("");
    if (!local) 
    try {
      await work();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível concluir.");
    } finally {
      if (!local) setBusy(false);
    }
  }
  function openModal(modal: AdminModalName, convite: string | null = null) {
    setError("");
    
    void setModalState({ modal, convite });
  }
  function open(invite?: Invitation) {
    openModal(invite ? "edit-invitation" : "new-invitation", invite?.id ?? null);
  }
  function closeModal() {
    setError("");
    void setModalState(null, { history: "replace" });
  }
  async function downloadPdf(invitation: {label: string; token: string}, key: string) {
    setGeneratingPdf(key); setError("");
    try {const {downloadInvitationPdf} = await import("@/lib/invitation-pdf"); await downloadInvitationPdf(invitation);}
    catch {setError("Não foi possível gerar o convite. Tente novamente.");}
    finally {setGeneratingPdf(null);}
  }
  function saveInvitation(draft: InviteDraft, original?: Invitation) {
    void action(async () => {
      await api(
        "/api/admin/invites",
        original ? "PATCH" : "POST",
        original
          ? { id: original.id, revision: original.revision, invitation: draft }
          : draft,
      );
      closeModal();
      await load();
      
    });
  }
  const allGuests = invites.filter((i) => i.active).flatMap((i) => i.guests);
  const normalized = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const visible = invites.filter(
    (i) =>
      (normalized(i.label).includes(normalized(query)) ||
        i.guests.some((g) => normalized(g.name).includes(normalized(query)))) &&
      (filter === "todos" ||
        (filter === "enviados" ? !!i.sentAt : filter === "nao-enviados" ? !i.sentAt : filter === "inativos"
          ? !i.active
          : i.active &&
            i.guests.some((g) =>
              g.status === filter,
            ))),
  );
  const invitationSections = [
    {id:"groups", title:"Famílias e grupos", invitations:visible.filter(i => i.kind === "group" || (!i.kind && i.guests.length > 1))},
    {id:"individuals", title:"Convites individuais", invitations:visible.filter(i => i.kind === "individual" || (!i.kind && i.guests.length === 1))},
  ];
  return (
    <main className={"admin-wedding " + (!user ? "admin-wedding--login" : "")}>
      <div className="admin-background" aria-hidden="true">
        <div className="admin-floral-layer">
          <WeddingOrnaments variant="floral" tone="paper" />
        </div>
        <div className="admin-background-wash" />
      </div>
      <AdminContainer centered={!user}>
        {user && view === "dashboard" && (
          <nav className="admin-nav flex-nowrap! gap-3! lg:flex-wrap! lg:gap-6!" aria-label="Navegação da administração">
            <Link href="/admin/dashboard" className="admin-wordmark">
              {weddingConfig.couple.partner1} <em>&</em> {weddingConfig.couple.partner2}<span>O nosso grande dia</span>
            </Link>
            <div className="hidden! lg:flex! order-last flex w-full items-center justify-center gap-2 lg:order-none lg:w-auto lg:flex-1" aria-label="Seções do painel">
              <Link href="/admin/guests" aria-current={section === "guests" ? "page" : undefined} className={"inline-flex min-h-11 items-center gap-2 rounded-[var(--wedding-radius)] px-4 text-xs transition-colors hover:bg-[#5d613c10] " + (section === "guests" ? "bg-[#5d613c10] font-semibold text-[#5D613C]" : "text-[#80654E]")}><Users size={16} aria-hidden="true" />Lista de convidados</Link>
              <Link href="/admin/check-in" aria-current={section === "check-in" ? "page" : undefined} className={"inline-flex min-h-11 items-center gap-2 rounded-[var(--wedding-radius)] px-4 text-xs transition-colors hover:bg-[#5d613c10] " + (section === "check-in" ? "bg-[#5d613c10] font-semibold text-[#5D613C]" : "text-[#80654E]")}><CheckIcon size={16} aria-hidden="true" />Controle de chegada</Link>
            </div>
            <div className="hidden lg:block">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild><button type="button" className="admin-profile-trigger" aria-label="Abrir menu da conta"><span className="admin-account-avatar" aria-hidden="true">{user.email?.slice(0,1).toUpperCase() || "G"}</span><span className="admin-profile-name">{user.displayName || user.email}</span><CaretDownIcon size={13} aria-hidden="true" /></button></DropdownMenu.Trigger>
              <DropdownMenu.Portal><DropdownMenu.Content className="admin-profile-menu" align="end" sideOffset={10} collisionPadding={16}>
                <DropdownMenu.Label className="admin-profile-label">Espaço dos noivos<span>{user.email}</span></DropdownMenu.Label>
                <DropdownMenu.Separator className="admin-profile-separator" />
                <DropdownMenu.Item className="flex cursor-pointer items-center gap-2 rounded-[var(--wedding-radius)] px-2.5 py-3 text-xs text-[#5D613C] outline-none data-highlighted:bg-[#edf0e3] data-disabled:opacity-40" disabled={busy || !authorized} onSelect={() => openModal("settings")}><CalendarDays size={16} aria-hidden="true" />Configurações</DropdownMenu.Item>
                <DropdownMenu.Item className="admin-profile-item" disabled={busy} onSelect={() => void action(async () => {await signOut(clientAuth());})}><LogOut size={16} aria-hidden="true" /> Sair</DropdownMenu.Item>
              </DropdownMenu.Content></DropdownMenu.Portal>
            </DropdownMenu.Root>
            </div>
            <MobileAdminMenu section={section} email={user.email} busy={busy} authorized={authorized} onSettings={() => openModal("settings")} onSignOut={() => void action(async () => {await signOut(clientAuth());})} />
          </nav>
        )}
        {user && view === "dashboard" && section === "overview" && (
          <AdminContainer variant="content" className="admin-page-heading px-0! pb-9! grid! grid-cols-1! items-center! gap-8! lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]! lg:gap-12!">
            <div>
              <p className="admin-eyebrow">Com carinho, cada detalhe</p>
              <h1 className="text-[clamp(44px,5vw,80px)]!">
                Quem faz parte da
                <br />
                nossa <em>história.</em>
              </h1>
              <p className="admin-subtitle">
                Um espaço para cuidar dos convites e de quem estará ao nosso
                lado.
              </p>
            </div>
            {authorized ? <GuestStats guests={allGuests} /> : loading ? <GuestStatsSkeleton /> : null}
          </AdminContainer>
        )}
        {error && !(authorized && modalState.modal) && (
          <p role="alert" className="admin-alert admin-alert--error">
            {error}
          </p>
        )}
        {!ready || view !== (user ? "dashboard" : "login") ? (
          <div className="admin-loading" role="status">
            <Flower2 aria-hidden="true" strokeWidth={1} />
            <p>Preparando nosso espaço…</p>
          </div>
        ) : !user ? (
          <div className="admin-login-grid">
            <aside className="admin-login-scene">
              <div
                className="admin-scene-photo"
                aria-hidden="true"
                style={{
                  backgroundImage:
                    "linear-gradient(160deg, #424A30D9, #2F351FD9), url(" +
                    weddingConfig.couple.coverImage +
                    ")",
                }}
              />
              <WeddingOrnaments variant="floral" tone="photo" />
              <div className="admin-scene-copy">
                <p className="admin-eyebrow">O amor mora nos detalhes</p>
                <div className="admin-monogram" aria-hidden="true">
                  G<span>&</span>E
                </div>
                <h1>
                  Cada presença,
                  <br />
                  uma parte da
                  <br />
                  <em>nossa história.</em>
                </h1>
                <div className="admin-scene-rule">
                  <Heart size={15} strokeWidth={1} aria-hidden="true" />
                </div>
                <p>
                  Um dia especial, rodeado
                  <br />
                  de pessoas que amamos.
                </p>
              </div>
            </aside>
            <form
              className="admin-login-card"
              onSubmit={(e) => {
                e.preventDefault();
                void action(async () => {
                  await signInWithEmailAndPassword(
                    clientAuth(),
                    email,
                    password,
                  );
                  setPassword("");
                });
              }}
            >
              <div className="admin-login-intro">
                <span className="admin-lock">
                  <LockKeyhole size={21} strokeWidth={1.2} aria-hidden="true" />
                </span>
                <p className="admin-eyebrow">Espaço dos noivos</p>
                <h2>
                  Bem-vindos
                  <br />
                  <em>ao nosso espaço.</em>
                </h2>
                <p>
                  Entre para organizar os convites e acompanhar cada
                  confirmação.
                </p>
              </div>
              <label className="block">
                <span className="admin-field-label">
                  <Mail size={14} aria-hidden="true" /> E-mail
                </span>
                <input
                  className="guest-input mt-2"
                  placeholder="seu@email.com"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="admin-field-label">
                  <KeyRound size={14} aria-hidden="true" /> Senha
                </span>
                <input
                  className="guest-input mt-2"
                  placeholder="Sua senha de acesso"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <button
                className="guest-button admin-login-submit"
                disabled={busy}
              >
                {busy ? "Entrando…" : "Entrar no painel"}
                <ArrowUpRight size={17} aria-hidden="true" />
              </button>
              <p className="admin-login-note">
                <LockKeyhole size={12} aria-hidden="true" /> Acesso reservado às
                contas autorizadas.
              </p>
            </form>
          </div>
        ) : (
          <>
            
            {(authorized || loading) && section !== "overview" && (section === "check-in" ? <CheckInList loading={!authorized && loading} invitations={invites} busy={busy} onRefresh={() => void action(async () => {await load();})} onToggle={(invitation, guestId, checkedIn) => void action(async () => {
              await api("/api/admin/invites", "PATCH", {id:invitation.id, revision:invitation.revision, invitation:{kind:invitation.kind, label:invitation.label, active:invitation.active, guests:invitation.guests.map(guest => guest.id === guestId ? {...guest, checkedIn} : guest)}});
              await load();
            })} /> :
              <>
                <AdminContainer variant="content" className="admin-list-heading">
                  <div>
                    <p className="admin-eyebrow">Pessoas que amamos</p>
                    <h2>
                      Lista de <em>convidados</em>
                    </h2>
                    <p>
                      {loading && !authorized ? <span className="inline-block h-3 w-32 animate-pulse rounded bg-[#5d613c15]" aria-label="Carregando quantidade" /> : <>{visible.length}{" "}
                      {visible.length === 1
                        ? "convite encontrado"
                        : "convites encontrados"}</> }
                    </p>
                  </div>
                  <span className="admin-heading-branch" aria-hidden="true">
                    <WeddingBranch />
                  </span>
                </AdminContainer>
                <div className="flex flex-col gap-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(220px,340px)_220px] sm:items-center sm:gap-6">
                    <label className="flex min-h-12 min-w-0 items-center gap-3 rounded-[var(--wedding-radius)] border border-[#5d613c30] bg-[#fffdfa] px-3 text-[#5D613C] transition-[border-color,box-shadow] focus-within:border-[#5d613c70] focus-within:ring-2 focus-within:ring-[#5d613c20]">
                      <Search size={19} className="shrink-0" aria-hidden="true" />
                      <input aria-label="Buscar convidados" className="h-12 w-full min-w-0 rounded-lg bg-transparent text-sm text-[#3D2501] border-0! outline-none! ring-0! shadow-none! placeholder:text-[#8a887b] focus:outline-none! focus-visible:outline-none!" placeholder="Buscar nome, família ou grupo" value={query} onChange={event => setQuery(event.target.value)} />
                    </label>
                    <WeddingSelect label="Filtrar situação" className="h-12! min-h-12! border! border-[#5d613c30]! bg-[#fffdfa]! px-3! text-sm! shadow-none! focus-visible:border-[#5d613c70]!" value={filter} onValueChange={setFilter} options={[{value:"todos",label:"Todos os convites"},{value:"pendente",label:"Com pendentes"},{value:"confirmado",label:"Com confirmados"},{value:"recusado",label:"Com recusas"},{value:"enviados",label:"Convites enviados"},{value:"nao-enviados",label:"Ainda não enviados"},{value:"inativos",label:"Inativos"}]} />
                  </div>
                  <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                    <button type="button" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--wedding-radius)] px-3 text-xs text-[#5D613C] transition-colors hover:bg-[#5d613c0d] disabled:opacity-50" disabled={busy} onClick={() => void action(async () => {await load();})}>
                      <RefreshCw size={16} aria-hidden="true" className={busy ? "animate-spin" : ""} />Atualizar
                    </button>
                    <button type="button" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--wedding-radius)] bg-[#5D613C] px-5 text-xs font-medium text-white transition-colors hover:bg-[#4b4f30] disabled:opacity-50" disabled={busy} onClick={() => open()}><Plus size={17} aria-hidden="true" />Adicionar convite</button>
                  </div>
                </div>
                <aside className="admin-guest-legend" aria-label="Legenda dos alertas de convidados confirmados">
                  <strong>Legenda</strong>
                  <div className="admin-guest-legend-items">
                    <span><WarningCircleIcon size={19} weight="fill" className="admin-dietary-alert" aria-hidden="true" />Restrição alimentar</span>
                    <span><ChatTextIcon size={19} weight="fill" className="admin-message-alert" aria-hidden="true" />Recado aos noivos</span>
                  </div>
                </aside>
                <div className="mt-8 space-y-5">
                  {!authorized && loading ? <DashboardSkeleton /> : visible.length === 0 && (
                    <div className="admin-empty">
                      <span className="admin-empty-icon">
                        <Flower2
                          size={34}
                          strokeWidth={0.8}
                          aria-hidden="true"
                        />
                      </span>
                      <h3>
                        {query || filter !== "todos"
                          ? "Nenhum convite por aqui."
                          : "Toda história começa com um convite."}
                      </h3>
                      <p>
                        {query || filter !== "todos"
                          ? "Experimente outro nome ou ajuste o filtro para encontrar quem procura."
                          : "Adicione a primeira família e comece a preparar a lista do nosso grande dia."}
                      </p>
                      {!query && filter === "todos" && (
                        <button
                          className="guest-secondary"
                          disabled={busy}
                          onClick={() => open()}
                        >
                          <Plus size={14} aria-hidden="true" /> Criar primeiro
                          convite
                        </button>
                      )}
                    </div>
                  )}
                  {invitationSections.filter(section => section.invitations.length > 0).map(section => (
                    <section key={section.id} className="space-y-5">
                      <SectionDivider title={section.title} count={section.invitations.length} actions={
                        <button type="button" className="inline-flex min-h-9 items-center gap-1.5 rounded-[var(--wedding-radius)] px-2 text-xs transition-colors hover:bg-[#5d613c10] focus-visible:outline-2 focus-visible:outline-[#5D613C]" onClick={() => setCollapsed(current => {
                          const allExpanded = section.invitations.every(invite => !current[invite.id]);
                          return {...current, ...Object.fromEntries(section.invitations.map(invite => [invite.id, allExpanded]))};
                        })}>
                          <CaretDownIcon size={14} className={section.invitations.every(invite => !collapsed[invite.id]) ? "rotate-180 transition-transform" : "transition-transform"} aria-hidden="true" />
                          {section.invitations.every(invite => !collapsed[invite.id]) ? "Recolher todos" : "Expandir todos"}
                        </button>
                      } />
                      {section.invitations.map((i) => (
                    <article
                      key={i.id}
                      className={
                        "admin-invite " +
                        (!i.active ? "admin-invite--inactive" : "")
                      }
                    >
                      <div className="admin-invite-header">
                        <div><h2 className="font-serif text-3xl"><button type="button" className="admin-invite-toggle" aria-expanded={!collapsed[i.id]} aria-controls={"invite-body-" + i.id} aria-label={(collapsed[i.id] ? "Expandir convite " : "Recolher convite ") + i.label} onClick={() => setCollapsed(current => ({...current,[i.id]:!current[i.id]}))}>{i.label}<CaretDownIcon size={20} className={collapsed[i.id] ? "" : "is-expanded"} aria-hidden="true" /></button>{!i.active && <span className="ml-3 font-sans text-sm">Inativo</span>}</h2>
                        <p className="admin-invite-meta"><UsersIcon size={15} aria-hidden="true" /> {i.guests.length} {i.guests.length === 1 ? "pessoa" : "pessoas"}<span>·</span>{i.sentAt ? "Enviado em " + new Date(i.sentAt).toLocaleDateString("pt-BR") : "Envio ainda não registrado"}</p></div>
                        <ExpandingIconButtonGroup className="admin-invite-actions">

                          <ExpandingIconButton disabled={busy} onClick={() => open(i)} icon={<PencilSimpleIcon size={17} aria-hidden="true" />} label={"Editar"} />
                          <ExpandingIconButton disabled={busy || !i.active} onClick={() => void action(async () => {
                            await navigator.clipboard.writeText(invitationUrl(i.token));
                            setCopiedId(i.id); if (copyTimer.current) clearTimeout(copyTimer.current);
                            copyTimer.current = setTimeout(() => setCopiedId(null), 3000);
                          })} icon={copiedId === i.id ? <CheckIcon size={17} weight="bold" aria-hidden="true" /> : <CopyIcon size={17} aria-hidden="true" />} label={copiedId === i.id ? "Copiado" : (i.guests.length > 1 ? "Copiar link do grupo" : "Copiar link")} />
                          <ExpandingIconButton aria-pressed={!!i.sentAt} disabled={busy} onClick={() => void action(async () => {
                            const result = await api("/api/admin/invites/sent", "POST", {id:i.id,sent:!i.sentAt});
                            setInvites(current => current.map(item => item.id === i.id ? {...item,sentAt:result.sentAt} : item));
                            
                          })} icon={<PaperPlaneTiltIcon size={17} weight={i.sentAt ? "fill" : "regular"} aria-hidden="true" />} label={i.sentAt ? "Enviado" : "Marcar enviado"} />
                          <ExpandingIconButton disabled={busy || !!generatingPdf || !i.active} onClick={async () => {setGeneratingPdf(i.id);setError("");try {const {downloadInvitationPdf} = await import("@/lib/invitation-pdf");await downloadInvitationPdf(i);}catch {setError("Não foi possível gerar o convite. Tente novamente.");}finally {setGeneratingPdf(null);}}} icon={<EnvelopeSimpleIcon size={17} aria-hidden="true" />} label={generatingPdf === i.id ? "Gerando convite…" : (i.guests.length > 1 ? "Convite do grupo" : "Baixar convite")} />
                          <ExpandingIconButton disabled={busy} onClick={() => openModal("delete-invitation",i.id)} icon={<TrashIcon size={17} aria-hidden="true" />} label={"Excluir"} />
                        </ExpandingIconButtonGroup>
                      </div>
                      <div id={"invite-body-" + i.id} className="admin-invite-collapse" data-open={!collapsed[i.id]} aria-hidden={!!collapsed[i.id]} inert={!!collapsed[i.id]}><div className="admin-invite-collapse-inner">
                      <p className="admin-form-help">O link e o convite do grupo permitem responder por todos. Os botões de cada pessoa geram um convite pessoal, que permite responder somente por ela.</p><div className={i.respondedAt || i.dietaryRestrictions || i.message ? "mt-5 mb-5" : "mt-5"}>
                        {i.guests.map((g) => (
                          <details key={g.id} className="rsvp-guest-accordion admin-guest-accordion last:border-b-0! [&:last-child>summary]:pb-0! [&:last-child[open]>summary]:pb-[18px]!">
                            <summary>
                              <span className="admin-guest-name-alerts">{g.name}{g.child ? " · Criança" : ""}
                                {g.status === "confirmado" && i.personalResponses?.[g.id]?.dietaryRestrictions?.trim() && <WarningCircleIcon size={19} weight="fill" className="admin-dietary-alert" role="img" aria-label="Restrição alimentar informada" />}
                                {g.status === "confirmado" && i.personalResponses?.[g.id]?.message?.trim() && <ChatTextIcon size={19} weight="fill" className="admin-message-alert" role="img" aria-label="Recado aos noivos" />}
                              </span>
                              <span className="rsvp-guest-summary-status">
                                <ExpandingIconButtonGroup as="span" className="admin-guest-quick-actions">
                                  <ExpandingIconButton type="button" aria-label={"Baixar convite de " + g.name} disabled={busy || generatingPdf === g.id || !i.active} onClick={event => {event.preventDefault(); event.stopPropagation(); void downloadPdf({label:g.name, token:i.personalTokens?.[g.id] ?? i.token},g.id);}} icon={<EnvelopeSimpleIcon size={17} aria-hidden="true" />} label={"Convite pessoal"} />
                                  <ExpandingIconButton type="button" aria-label={copiedId === g.id ? "Link copiado" : "Copiar link de " + g.name} disabled={busy || !i.active} onClick={event => {event.preventDefault(); event.stopPropagation(); void copyInvitationLink(i.personalTokens?.[g.id] ?? i.token, g.id);}} icon={copiedId === g.id ? <CheckIcon size={17} weight="bold" aria-hidden="true" /> : <CopyIcon size={17} aria-hidden="true" />} label={copiedId === g.id ? "Copiado" : "Copiar link"} />
                                </ExpandingIconButtonGroup>
                                <AttendanceBadge status={g.status} className="max-[600px]:col-start-2 max-[600px]:row-start-1 max-[600px]:w-[140px] max-[600px]:text-[11px] max-[380px]:w-[125px] max-[380px]:text-[10px]" />
                                <CaretDownIcon className="rsvp-accordion-caret" size={18} aria-hidden="true" />
                              </span>
                            </summary>
                            <div className="rsvp-guest-accordion-fields">
                              <div className="admin-guest-notes">
                                <div><p><WarningCircleIcon size={19} weight="fill" className="admin-dietary-alert" aria-hidden="true" />Restrições alimentares</p><span>{i.personalResponses?.[g.id]?.dietaryRestrictions || "Nenhuma restrição informada."}</span></div>
                                <div><p><ChatTextIcon size={19} weight="fill" className="admin-message-alert" aria-hidden="true" />Recado aos noivos</p><span>{i.personalResponses?.[g.id]?.message || "Nenhum recado enviado."}</span></div>
                              </div>
                            </div>
                          </details>
                        ))}
                      </div>
                      {i.respondedAt && (
                        <p className="text-sm text-[#80654E]">
                          Última resposta do convite:{" "}
                          {new Date(i.respondedAt).toLocaleString("pt-BR")}
                        </p>
                      )}
                      {i.dietaryRestrictions && (
                        <p className="mt-2 whitespace-pre-wrap text-sm">
                          Restrições: {i.dietaryRestrictions}
                        </p>
                      )}
                      {i.message && (
                        <p className="mt-2 whitespace-pre-wrap text-sm">
                          Recado: {i.message}
                        </p>
                      )}
                      </div></div>
                    </article>
                      ))}
                    </section>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </AdminContainer>
      {authorized && view === "dashboard" && modalState.modal && (
        <AdminModals
          key={modalState.modal + ":" + (modalState.convite ?? "")}
          modal={modalState.modal}
          selected={
            modalState.modal === "new-invitation" ||
            modalState.modal === "settings"
              ? undefined
              : invites.find((i) => i.id === modalState.convite)
          }
          settings={settings}
          busy={busy}
          error={error}
          onClose={closeModal}
          onSave={saveInvitation}
          onSettings={(value) => {
            void action(async () => {
              await api("/api/admin/settings", "PUT", value);
              setSettings(value);
              closeModal();
              
            });
          }}
          onDelete={(invite) => {
            void action(async () => {
              await api("/api/admin/invites", "DELETE", {
                id: invite.id,
                revision: invite.revision,
              });
              closeModal();
              await load();
              
            });
          }}
        />
      )}
    </main>
  );
}
