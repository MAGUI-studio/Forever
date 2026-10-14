"use client";
import {resolveModules,sectionModule} from "@/config/modules";
import {AdminLoading} from "./AdminLoading";
import { VisualSiteEditor } from "./VisualSiteEditor";
import { AdminContainer } from "./AdminContainer";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { AttendanceBadge } from "@/components/ui/AttendanceBadge";
import { ExpandingIconButton, ExpandingIconButtonGroup } from "@/components/ui/ExpandingIconButton";
import { useEffect, useRef, useState } from "react";
import { EnvelopeSimpleIcon, CopyIcon, CheckIcon, CaretDownIcon, PencilSimpleIcon, PaperPlaneTiltIcon, TrashIcon, UsersIcon, WarningCircleIcon, ChatTextIcon } from "@phosphor-icons/react";
import { WeddingSelect } from "@/components/ui/WeddingSelect";
import { readApiResponse } from "@/lib/api-response";
import { AdminButton } from "./AdminButton";
import { EventOperations } from "./EventOperations";
import { CheckInList } from "./CheckInList";
import { MobileAdminMenu } from "./MobileAdminMenu";
import { GuestStats } from "./GuestStats";
import { DashboardOverview } from "./DashboardOverview";
import { DashboardSkeleton, GuestStatsSkeleton } from "./skeleton";
import { invitationUrl } from "@/config/site";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminModals, type InviteDraft } from "./modals";
import { useAdminModal, type AdminModalName } from "./modal-state";
import {useWedding} from "@/components/wedding/WeddingProvider";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Flower2,
  Heart,
  History,
  KeyRound,
  LayoutGrid,
  Loader2,
  LockKeyhole,
  LogOut,
  Mail,
  Plus,
  RefreshCw,
  Search,
  UserCheck,
  Users,
  Utensils,
} from "lucide-react";
import {
  WeddingOrnaments,
  WeddingBranch,
  WeddingLoadingIcon,
} from "@/components/wedding/WeddingOrnaments";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";
import { PLAN_NAMES, type WeddingPlan } from "@/config/forever";
import { ForeverLogo } from "@/components/forever/ForeverLogo";
import type { Invitation, RSVPSettings } from "@/types/guests";
export function AdminPanel({
  view,
  section = "overview",
}: {
  view: "entry" | "login" | "dashboard";
  section?: "site" | "overview" | "guests" | "check-in" | "tables" | "buffet" | "history" | "team";
}) {
  const {slug,config:weddingConfig,setConfig,setTheme,modules,setModules,setTemplateId,templateId,themeStyle,path:weddingPath}=useWedding();
  const router = useRouter();
  const [modalState, setModalState] = useAdminModal();
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<WeddingPlan>("foreverPro");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Verificando seu acesso…");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);
  const [role, setRole] = useState<"admin" | "reception">("admin");
  const [tables, setTables] = useState<import("@/types/guests").EventTable[]>([]);
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
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [orgOpen, setOrgOpen] = useState(false);
  const orgTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleOrgMouseEnter() {
    if (orgTimeoutRef.current) clearTimeout(orgTimeoutRef.current);
    setOrgOpen(true);
  }

  function handleOrgMouseLeave() {
    orgTimeoutRef.current = setTimeout(() => {
      setOrgOpen(false);
    }, 160);
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("upgrade") === "success") {
        setUpgradeSuccess(true);
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, "", cleanUrl);
      }
    }
  }, []);

  async function handleUpgrade() {
    try {
      setUpgradeLoading(true);
      setError("");
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: "foreverPro",
          action: "upgrade",
          weddingSlug: slug,
          customerEmail: user?.email || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Não foi possível iniciar o checkout de upgrade.");
      }
      window.location.href = data.url;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao iniciar upgrade.";
      setError(message);
      setUpgradeLoading(false);
    }
  }
  useEffect(() => {
    try {
      return onAuthStateChanged(clientAuth(), (u) => {
        setUser(u);
        setReady(true);
        setAuthorized(false);
        setLoading(true);
        setInvites([]);
        const destination = u ? "dashboard" : "login";
        if (view !== destination) router.replace(u?weddingPath("admin/dashboard"):"/login");
      });
    } catch (e) {
      queueMicrotask(() => {
        setError(e instanceof Error ? e.message : "Falha ao iniciar login.");
        setReady(true);
        if (view !== "login") router.replace("/login");
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
        "x-wedding-slug":slug,
      },
      ...(data ? { body: JSON.stringify(data) } : {}),
    });
    const result = await readApiResponse(response);
    return result;
  }
  async function load(account = user) {
    setLoadingMessage("Buscando os detalhes do seu casamento…");
    const session = await api("/api/admin/session", "GET", undefined, account);
    setConfig(session.wedding.config);setTheme(session.wedding.theme);setModules(session.wedding.modules??{});setTemplateId(session.wedding.templateId??"botanical-classic");setPlan(session.wedding.plan === "essencial" ? "essencial" : "foreverPro");
    const enabled=resolveModules(session.wedding.modules, session.wedding.plan);
    if(sectionModule[section]&&!enabled[sectionModule[section]!]){setLoading(false);router.replace(weddingPath("admin/dashboard"));return;}
    const reception = session.role === "reception";
    if (enabled.guestList) setLoadingMessage("Carregando sua lista de convidados…");
    const list = enabled.guestList?await api(reception || section === "check-in" ? "/api/admin/reception" : "/api/admin/invites", "GET", undefined, account):{invitations:[]};
    if (!reception && enabled.rsvp) setLoadingMessage("Buscando as configurações de confirmação de presença…");
    const config = reception||!enabled.rsvp ? null : await api("/api/admin/settings", "GET", undefined, account);
    if (!reception) setLoadingMessage("Carregando a organização do grande dia…");
    const operations = reception ? list : await api("/api/admin/operations", "GET", undefined, account);
    setRole(session.role); setTables(operations.tables); setInvites(list.invitations);
    if(config) setSettings(config.settings);
    setAuthorized(true); setLoading(false);
    if(reception && section !== "check-in") router.replace(weddingPath("admin/check-in"));
  }
  useEffect(() => {
    if(user && view === "dashboard") void load(user).catch(e => {setLoading(false);setError(e instanceof Error ? e.message : "Erro ao carregar painel.");});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, view]);
  useEffect(() => {
    if(!authorized || section !== "check-in" || busy) return;
    let cancelled = false;
    const timer = setInterval(async () => {
      if(document.visibilityState !== "visible") return;
      try {const list = await api("/api/admin/reception");if(!cancelled){setInvites(list.invitations);setTables(list.tables);}}
      catch { /* Manual refresh reports connectivity errors without interrupting reception. */ }
    },15000);
    return () => {cancelled=true;clearInterval(timer);};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[authorized,section,busy,user]);
  async function copyInvitationLink(token: string, key: string) {
    try {
      await navigator.clipboard.writeText(invitationUrl(token,slug));
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
    try {const {downloadInvitationPdf} = await import("@/lib/invitation-pdf"); await downloadInvitationPdf(invitation,weddingConfig,slug,templateId);}
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
        (filter === "abertos" ? !!i.openedAt : filter === "nao-respondidos" ? i.active && i.guests.some(g=>g.status === "pendente") : filter === "respondidos" ? i.guests.every(g=>g.status !== "pendente") : filter === "enviados" ? !!i.sentAt : filter === "nao-enviados" ? !i.sentAt : filter === "inativos"
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
  if (view === "dashboard" && (!ready || (!!user && loading && !authorized))) return <AdminLoading description={!ready ? "Verificando seu acesso…" : loadingMessage}/>;
  if(authorized&&section==="site"&&modules.siteEditor)return <VisualSiteEditor/>;
  return (
    <main className={"admin-wedding " + (!user ? "admin-wedding--login" : "")}>
      <div className="admin-background" aria-hidden="true">
        <div className="admin-floral-layer">
          <WeddingOrnaments variant="floral" tone="paper" />
        </div>
      </div>
      <AdminContainer centered={view!=="dashboard"&&!user}>

        {user && view === "dashboard" && authorized && (
          <nav className="admin-nav flex-nowrap! gap-3! lg:flex-wrap! lg:gap-6!" aria-label="Navegação da administração">
            <div className="flex items-center gap-3.5">
              <Link href={weddingPath("admin/dashboard")} aria-label="Forever — Início" className="transition-opacity hover:opacity-85">
                <ForeverLogo className="w-28 sm:w-32" />
              </Link>
              <span className="hidden sm:block h-7 w-px bg-[#80654e30]" aria-hidden="true" />
              <div
                className="hidden sm:flex items-center"
                title={`Assinatura: ${PLAN_NAMES[plan] ?? "Forever PRO"}`}
              >
                <img
                  src={plan === "essencial" ? "/forever/subscription/essential_plan.svg" : "/forever/subscription/pro_plan.svg"}
                  alt={PLAN_NAMES[plan] ?? "Forever PRO"}
                  className="h-8 w-auto object-contain"
                />
              </div>
            </div>
            <div className="hidden! lg:flex! order-last flex w-full items-center justify-center gap-2.5 lg:order-none lg:w-auto lg:flex-1" aria-label="Seções do painel">
              {role === "admin" && modules.guestList && (
                <Link
                  href={weddingPath("admin/guests")}
                  aria-current={section === "guests" ? "page" : undefined}
                  className={`group relative inline-flex min-h-11 items-center gap-2 overflow-hidden rounded-xl px-4 text-xs transition-all duration-200 border ${
                    section === "guests"
                      ? "border-[#722F3735] bg-[#722F3714] font-semibold text-[#722F37] shadow-xs"
                      : "border-transparent bg-white/40 text-[#6B6760] hover:border-[#722F3725] hover:bg-[#722F370a] hover:text-[#722F37]"
                  }`}
                >
                  <span
                    className="pointer-events-none absolute -right-1.5 -bottom-1.5 size-9 text-[#722F37] opacity-[0.08] transition-all duration-300 group-hover:scale-125 group-hover:opacity-[0.18]"
                    aria-hidden="true"
                  >
                    <Users className="size-full" />
                  </span>
                  <span className="relative z-10 flex items-center gap-2">
                    <Users size={15} className="text-[#722F37] shrink-0" aria-hidden="true" />
                    <span>Lista de convidados</span>
                  </span>
                </Link>
              )}

              {modules.checkIn && (
                <Link
                  href={weddingPath("admin/check-in")}
                  aria-current={section === "check-in" ? "page" : undefined}
                  className={`group relative inline-flex min-h-11 items-center gap-2 overflow-hidden rounded-xl px-4 text-xs transition-all duration-200 border ${
                    section === "check-in"
                      ? "border-[#722F3735] bg-[#722F3714] font-semibold text-[#722F37] shadow-xs"
                      : "border-transparent bg-white/40 text-[#6B6760] hover:border-[#722F3725] hover:bg-[#722F370a] hover:text-[#722F37]"
                  }`}
                >
                  <span
                    className="pointer-events-none absolute -right-1.5 -bottom-1.5 size-9 text-[#722F37] opacity-[0.08] transition-all duration-300 group-hover:scale-125 group-hover:opacity-[0.18]"
                    aria-hidden="true"
                  >
                    <Check className="size-full" />
                  </span>
                  <span className="relative z-10 flex items-center gap-2">
                    <Check size={15} className="text-[#722F37] shrink-0" aria-hidden="true" />
                    <span>Controle de chegada</span>
                  </span>
                </Link>
              )}

              {role === "admin" && modules.organization && (
                <div
                  className="relative"
                  onMouseEnter={handleOrgMouseEnter}
                  onMouseLeave={handleOrgMouseLeave}
                >
                  <button
                    type="button"
                    aria-expanded={orgOpen}
                    onClick={() => setOrgOpen(prev => !prev)}
                    className={`group relative inline-flex min-h-11 items-center gap-2 overflow-hidden rounded-xl px-4 text-xs transition-all duration-200 border ${
                      orgOpen || ["tables", "buffet", "history", "team"].includes(section)
                        ? "border-[#722F3735] bg-[#722F3714] font-semibold text-[#722F37] shadow-xs"
                        : "border-transparent bg-white/40 text-[#6B6760] hover:border-[#722F3725] hover:bg-[#722F370a] hover:text-[#722F37]"
                    }`}
                  >
                    <span
                      className="pointer-events-none absolute -right-1.5 -bottom-1.5 size-9 text-[#722F37] opacity-[0.08] transition-all duration-300 group-hover:scale-125 group-hover:opacity-[0.18]"
                      aria-hidden="true"
                    >
                      <LayoutGrid className="size-full" />
                    </span>
                    <span className="relative z-10 flex items-center gap-1.5">
                      <LayoutGrid size={15} className="shrink-0 text-[#722F37]" />
                      <span>Organização</span>
                      <ChevronDown
                        size={13}
                        className={`transition-transform duration-200 text-[#722F37] ${orgOpen ? "rotate-180" : ""}`}
                      />
                    </span>
                  </button>

                  {orgOpen && (
                    <div
                      role="menu"
                      className="absolute top-full left-1/2 -translate-x-1/2 z-50 mt-2 w-[460px] rounded-2xl border border-[#722F3725] bg-[#FFFDFB] p-3 shadow-xl shadow-[#722F3712] animate-in fade-in-0 zoom-in-95 duration-150"
                    >
                      <div className="px-3 py-1.5 border-b border-[#722F3715] mb-2 flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#722F37]">
                          Central do Grande Dia
                        </span>
                        <span className="text-[10px] text-[#8C877F]">Recursos de Gestão</span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { href: "tables", label: "Mesas e lugares", description: "Distribuição e assentos", icon: LayoutGrid, key: "tables" as const },
                          { href: "buffet", label: "Alimentação & buffet", description: "Restrições alimentares", icon: Utensils, key: "buffet" as const },
                          { href: "history", label: "Histórico", description: "Auditoria de alterações", icon: History, key: "history" as const },
                          { href: "team", label: "Equipe da recepção", description: "Contas e portaria", icon: UserCheck, key: "team" as const },
                        ]
                          .filter(item => modules[item.key])
                          .map(item => {
                            const Icon = item.icon;
                            const isActive = section === item.href;
                            return (
                              <Link
                                key={item.href}
                                href={weddingPath("admin/" + item.href)}
                                onClick={() => setOrgOpen(false)}
                                className={`group/item relative flex flex-col gap-1 rounded-xl p-3 text-left transition-all duration-200 border ${
                                  isActive
                                    ? "border-[#722F3735] bg-[#722F3714] text-[#722F37] font-semibold shadow-xs"
                                    : "border-transparent hover:border-[#722F3720] hover:bg-[#722F3708] text-[#161616]"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#722F3712] text-[#722F37] transition-transform group-hover/item:scale-110">
                                    <Icon size={14} />
                                  </span>
                                  <span className="text-xs font-medium text-[#722F37]">
                                    {item.label}
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#82656C] leading-snug pl-9">
                                  {item.description}
                                </p>
                              </Link>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Icon Buttons with Colored Tooltips */}
            <div className="hidden lg:flex items-center gap-2">
              {/* Ver site */}
              <div className="group relative inline-flex items-center">
                <Link
                  href={weddingPath()}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Ver site"
                  className="inline-flex size-10 items-center justify-center rounded-xl border border-[#722F3730] bg-[#722F370a] text-[#722F37] transition-all duration-200 hover:border-[#722F37] hover:bg-[#722F3718] hover:shadow-xs focus-visible:outline-2 focus-visible:outline-[#722F37]"
                >
                  <ArrowUpRight size={17} aria-hidden="true" />
                </Link>
                <div
                  role="tooltip"
                  className="pointer-events-none absolute top-full left-1/2 z-50 mt-2.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#722F37] px-2.5 py-1 text-[11px] font-medium text-white shadow-md shadow-[#722F3730] opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 translate-y-1"
                >
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 size-2 rotate-45 bg-[#722F37]" />
                  <span className="relative z-10 flex items-center gap-1">
                    <span>Ver site</span>
                    <ArrowUpRight size={11} className="opacity-80" />
                  </span>
                </div>
              </div>

              {/* Personalizar site */}
              {role === "admin" && modules.siteEditor && (
                <div className="group relative inline-flex items-center">
                  <Link
                    href={weddingPath("admin/site")}
                    aria-label="Personalizar site"
                    className={`inline-flex size-10 items-center justify-center rounded-xl border transition-all duration-200 hover:shadow-xs focus-visible:outline-2 focus-visible:outline-[#722F37] ${
                      section === "site"
                        ? "border-[#722F37] bg-[#722F3722] text-[#722F37] font-semibold"
                        : "border-[#722F3730] bg-[#722F370a] text-[#722F37] hover:border-[#722F37] hover:bg-[#722F3718]"
                    }`}
                  >
                    <PencilSimpleIcon size={17} aria-hidden="true" />
                  </Link>
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute top-full left-1/2 z-50 mt-2.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#722F37] px-2.5 py-1 text-[11px] font-medium text-white shadow-md shadow-[#722F3730] opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 translate-y-1"
                  >
                    <span className="absolute -top-1 left-1/2 -translate-x-1/2 size-2 rotate-45 bg-[#722F37]" />
                    <span className="relative z-10">Personalizar site</span>
                  </div>
                </div>
              )}
            </div>
            <div className="hidden lg:block">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  aria-label="Abrir menu da conta"
                  title={user.displayName || user.email || "Minha conta"}
                  className="group relative flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-[#722F37]/35 bg-[#FAF7F5] p-0.5 shadow-xs transition-all duration-200 hover:border-[#722F37] hover:ring-2 hover:ring-[#722F37]/20 hover:scale-105 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-[#722F37] focus-visible:outline-offset-2 data-[state=open]:border-[#722F37] data-[state=open]:ring-2 data-[state=open]:ring-[#722F37]/25"
                >
                  <span
                    className="flex size-full items-center justify-center rounded-full bg-gradient-to-br from-[#85343E] to-[#60232A] text-white font-serif text-base font-semibold shadow-inner transition-transform duration-200 group-hover:scale-95"
                    aria-hidden="true"
                  >
                    {user.email?.slice(0, 1).toUpperCase() || "G"}
                  </span>
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal><DropdownMenu.Content className="admin-profile-menu border border-[#722F3720] shadow-xl" align="end" sideOffset={10} collisionPadding={16}>
                <DropdownMenu.Label className="admin-profile-label">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#722F37]">Espaço dos noivos</span>
                  <span className="text-xs text-[#80654e] font-normal">{user.email}</span>
                </DropdownMenu.Label>
                {plan === "essencial" && (
                  <DropdownMenu.Item asChild>
                    <button
                      type="button"
                      disabled={upgradeLoading}
                      onClick={() => void handleUpgrade()}
                      className="flex w-full cursor-pointer items-center justify-between rounded-lg bg-[#722F3710] px-2.5 py-2 text-xs font-medium text-[#722F37] transition-colors hover:bg-[#722F3718] outline-none disabled:opacity-60"
                    >
                      <span className="flex items-center gap-1.5">
                        {upgradeLoading ? (
                          <Loader2 size={12} className="animate-spin text-[#722F37]" />
                        ) : (
                          <Heart size={12} className="fill-[#722F37]" />
                        )}
                        <span>{upgradeLoading ? "Iniciando…" : "Upgrade para Forever PRO"}</span>
                      </span>
                      <ArrowUpRight size={13} />
                    </button>
                  </DropdownMenu.Item>
                )}
                <DropdownMenu.Separator className="admin-profile-separator bg-[#722F3715]" />

                {modules.rsvp&&<DropdownMenu.Item className="flex cursor-pointer items-center gap-2 rounded-[var(--wedding-radius)] px-2.5 py-3 text-xs text-[#722F37] outline-none hover:bg-[#722F370d] data-highlighted:bg-[#722F370d] data-disabled:opacity-40" disabled={busy || !authorized || role !== "admin"} onSelect={() => openModal("settings")}><CalendarDays size={16} aria-hidden="true" />Configurações</DropdownMenu.Item>}
                <DropdownMenu.Item className="admin-profile-item text-[#722F37] hover:bg-[#722F370d] data-highlighted:bg-[#722F370d]" disabled={busy} onSelect={() => void action(async () => {await signOut(clientAuth());})}><LogOut size={16} aria-hidden="true" /> Sair</DropdownMenu.Item>
              </DropdownMenu.Content></DropdownMenu.Portal>
            </DropdownMenu.Root>
            </div>
            <MobileAdminMenu role={role} plan={plan} section={section} email={user.email} busy={busy} authorized={authorized} onSettings={() => openModal("settings")} onSignOut={() => void action(async () => {await signOut(clientAuth());})} onUpgrade={() => void handleUpgrade()} />
          </nav>
        )}
        {authorized && upgradeSuccess && (
          <section className="relative mb-6 overflow-hidden rounded-2xl border border-emerald-600/30 bg-emerald-50 p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={24} className="shrink-0 text-emerald-700" />
                <div>
                  <p className="text-sm font-semibold text-emerald-950">
                    Upgrade ativado! Seu casamento agora é Forever PRO.
                  </p>
                  <p className="mt-0.5 text-xs text-emerald-800">
                    Convidados ilimitados, organização de mesas, check-in na portaria e todos os templates já estão liberados.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUpgradeSuccess(false)}
                className="rounded-full border border-emerald-700/20 bg-white px-3 py-1 text-xs font-medium text-emerald-900 hover:bg-emerald-100 cursor-pointer"
              >
                Dispensar
              </button>
            </div>
          </section>
        )}
        {user && view === "dashboard" && section === "overview" && role === "admin" && (
          <DashboardOverview
            guests={allGuests}
            invitations={invites}
            tables={tables}
            weddingConfig={weddingConfig}
            slug={slug}
            templateId={templateId}
            plan={plan}
            modules={modules}
            weddingPath={weddingPath}
            onOpenNewInvite={() => open()}
            onOpenSettings={() => openModal("settings")}
            onUpgrade={() => void handleUpgrade()}
            upgradeLoading={upgradeLoading}
            loading={loading && !authorized}
          />
        )}
        {error && !(authorized && modalState.modal) && (
          <p role="alert" className="admin-alert admin-alert--error">
            {error}
          </p>
        )}
        {!ready || view !== (user ? "dashboard" : "login") ? (
          <div className="admin-loading" role="status">
            <WeddingLoadingIcon />
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
                    "url(" +
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

            {(authorized || loading) && (!sectionModule[section]||modules[sectionModule[section]!]) && section !== "overview" && (section === "site" ? <VisualSiteEditor/> : section === "tables" || section === "buffet" || section === "history" || section === "team" ? <EventOperations pageLoading={!authorized && loading} section={section} invitations={invites} tables={tables} api={api} onRefresh={load} /> : section === "check-in" ? <CheckInList tables={tables} loading={!authorized && loading} invitations={invites} busy={busy} onRefresh={() => void action(async () => {await load();})} onToggle={(invitation, guestIds, checkedIn) => void action(async () => {
              await api("/api/admin/reception", "PATCH", {id:invitation.id, guestIds, checkedIn, expectedCheckedIn:!checkedIn});
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
                        : "convites encontrados"}{plan === "essencial" && <> · {allGuests.length} de 50 convidados</>}</> }
                    </p>
                  </div>
                  <span className="admin-heading-branch" aria-hidden="true">
                    <WeddingBranch />
                  </span>
                </AdminContainer>
                {plan === "essencial" && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#722F3725] bg-[#722F370a] p-4 text-xs text-[#161616]">
                    <div className="flex items-center gap-2.5">
                      <Heart size={16} className="shrink-0 fill-[#722F37] text-[#722F37]" />
                      <span>
                        Seu plano atual é o <strong>Forever Essencial</strong> ({allGuests.length} de 50 convidados).
                        Para convidados ilimitados e gestão de mesas, faça o upgrade para o <strong>Forever PRO</strong>.
                      </span>
                    </div>
                    <a
                      href="/#preco"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#722F37] px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#5b242b]"
                    >
                      <span>Conhecer Forever PRO</span>
                      <ArrowUpRight size={13} />
                    </a>
                  </div>
                )}
                <div className="flex flex-col gap-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="grid min-w-0 gap-3 sm:grid-cols-[340px_220px] sm:items-center sm:gap-6">
                    <label className="flex min-h-12 min-w-0 items-center gap-3 rounded-[var(--wedding-radius)] border border-[#5d613c30] bg-[#fffdfa] px-3 text-[var(--forever-primary,#5D613C)] transition-[border-color,box-shadow] focus-within:border-[#5d613c70] focus-within:ring-2 focus-within:ring-[#5d613c20]">
                      <Search size={19} className="shrink-0" aria-hidden="true" />
                      <input aria-label="Buscar convidados" className="h-12 w-full min-w-0 rounded-lg bg-transparent text-sm text-[var(--forever-ink,#3D2501)] border-0! outline-none! ring-0! shadow-none! placeholder:text-[#8a887b] focus:outline-none! focus-visible:outline-none!" placeholder="Buscar nome, família ou grupo" value={query} onChange={event => setQuery(event.target.value)} />
                    </label>
                    <WeddingSelect label="Filtrar situação" className="h-12! min-h-12! border! border-[#5d613c30]! bg-[#fffdfa]! px-3! text-sm! shadow-none! focus-visible:border-[var(--forever-hover-border,#5d613c70)]!" value={filter} onValueChange={setFilter} options={[{value:"todos",label:"Todos os convites"},{value:"pendente",label:"Com pendentes"},{value:"confirmado",label:"Com confirmados"},{value:"recusado",label:"Com recusas"},{value:"abertos",label:"Convites abertos"},{value:"nao-respondidos",label:"Com respostas pendentes"},{value:"respondidos",label:"Totalmente respondidos"},{value:"enviados",label:"Convites enviados"},{value:"nao-enviados",label:"Ainda não enviados"},{value:"inativos",label:"Inativos"}].filter(option=>modules.invitationTracking||!["abertos","enviados","nao-enviados","nao-respondidos","respondidos"].includes(option.value))} />
                  </div>
                  <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                    <button type="button" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--wedding-radius)] px-3 text-xs text-[var(--forever-primary,#5D613C)] transition-colors hover:bg-[var(--forever-hover-tint,#5d613c0d)] disabled:opacity-50" disabled={busy} onClick={() => void action(async () => {await load();})}>
                      <RefreshCw size={16} aria-hidden="true" className={busy ? "animate-spin" : ""} />Atualizar
                    </button>
                    {plan === "essencial" && (
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${allGuests.length >= 50 ? "border-[#b4434640] bg-[#b4434612] font-medium text-[#b44346]" : "border-[#5d613c30] bg-[#fffdfa] text-[var(--forever-primary,#5D613C)]"}`}>
                        <Users size={13} aria-hidden="true" />
                        <span>{allGuests.length} / 50 convidados {allGuests.length >= 50 ? "· Limite atingido" : ""}</span>
                      </span>
                    )}
                    <AdminButton disabled={busy || (plan === "essencial" && allGuests.length >= 50)} onClick={() => open()} title={plan === "essencial" && allGuests.length >= 50 ? "Limite de 50 convidados atingido no plano Forever Essencial" : undefined}><Plus size={17} aria-hidden="true" />Adicionar convite</AdminButton>
                  </div>
                </div>
                {(modules.dietaryRestrictions||modules.messages)&&<aside className="admin-guest-legend" aria-label="Legenda dos alertas de convidados confirmados">
                  <strong>Legenda</strong>
                  <div className="admin-guest-legend-items">
                    {modules.dietaryRestrictions&&<span><WarningCircleIcon size={19} weight="fill" className="admin-dietary-alert" aria-hidden="true" />Restrição alimentar</span>}
                    {modules.messages&&<span><ChatTextIcon size={19} weight="fill" className="admin-message-alert" aria-hidden="true" />Recado aos noivos</span>}
                  </div>
                </aside>}
                <div className="mt-8 space-y-5">
                  {!authorized && loading ? <DashboardSkeleton /> : visible.length === 0 && (
                    <div className="admin-empty">
                      <span className="admin-empty-icon">
                        <WeddingLoadingIcon />
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
                          disabled={busy || (plan === "essencial" && allGuests.length >= 50)}
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
                        <button type="button" className="inline-flex min-h-9 items-center gap-1.5 rounded-[var(--wedding-radius)] px-2 text-xs transition-colors hover:bg-[var(--forever-hover-tint,#5d613c10)] focus-visible:outline-2 focus-visible:outline-[var(--forever-primary,#5D613C)]" onClick={() => setCollapsed(current => {
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
                        <p className="admin-invite-meta"><UsersIcon size={15} aria-hidden="true" /> {i.guests.length} {i.guests.length === 1 ? "pessoa" : "pessoas"}{modules.invitationTracking&&<><span>·</span>{i.sentAt ? "Enviado em " + new Date(i.sentAt).toLocaleDateString("pt-BR") : "Envio ainda não registrado"}</>}</p></div>
                        <ExpandingIconButtonGroup className="admin-invite-actions">

                          <ExpandingIconButton disabled={busy} onClick={() => open(i)} icon={<PencilSimpleIcon size={17} aria-hidden="true" />} label={"Editar"} />
                          <ExpandingIconButton disabled={busy || !i.active} onClick={() => void action(async () => {
                            await navigator.clipboard.writeText(invitationUrl(i.code ?? i.token,slug));
                            setCopiedId(i.id); if (copyTimer.current) clearTimeout(copyTimer.current);
                            copyTimer.current = setTimeout(() => setCopiedId(null), 3000);
                          })} icon={copiedId === i.id ? <CheckIcon size={17} weight="bold" aria-hidden="true" /> : <CopyIcon size={17} aria-hidden="true" />} label={copiedId === i.id ? "Copiado" : (i.guests.length > 1 ? "Copiar link do grupo" : "Copiar link")} />
                          {modules.invitationTracking&&<ExpandingIconButton aria-pressed={!!i.sentAt} disabled={busy} onClick={() => void action(async () => {
                            const result = await api("/api/admin/invites/sent", "POST", {id:i.id,sent:!i.sentAt});
                            setInvites(current => current.map(item => item.id === i.id ? {...item,sentAt:result.sentAt} : item));

                          })} icon={<PaperPlaneTiltIcon size={17} weight={i.sentAt ? "fill" : "regular"} aria-hidden="true" />} label={i.sentAt ? "Enviado" : "Marcar enviado"} />}
                          <ExpandingIconButton disabled={busy || !!generatingPdf || !i.active} onClick={async () => {setGeneratingPdf(i.id);setError("");try {const {downloadInvitationPdf} = await import("@/lib/invitation-pdf");await downloadInvitationPdf({...i, token: i.code ?? i.token},weddingConfig,slug,templateId);}catch {setError("Não foi possível gerar o convite. Tente novamente.");}finally {setGeneratingPdf(null);}}} icon={<EnvelopeSimpleIcon size={17} aria-hidden="true" />} label={generatingPdf === i.id ? "Gerando convite…" : (i.guests.length > 1 ? "Convite do grupo" : "Baixar convite")} />
                          <ExpandingIconButton disabled={busy} onClick={() => openModal("delete-invitation",i.id)} icon={<TrashIcon size={17} aria-hidden="true" />} label={"Excluir"} />
                        </ExpandingIconButtonGroup>
                      </div>
                      <div id={"invite-body-" + i.id} className="admin-invite-collapse" data-open={!collapsed[i.id]} aria-hidden={!!collapsed[i.id]} inert={!!collapsed[i.id]}><div className="admin-invite-collapse-inner">
                      {modules.invitationTracking&&<div className="my-3 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-[var(--forever-accent,#80654E)]"><span>{i.sentAt ? "Enviado em "+new Date(i.sentAt).toLocaleDateString("pt-BR") : "Envio não registrado"}</span><span>{i.openedAt ? "Primeiro acesso em "+new Date(i.openedAt).toLocaleString("pt-BR") : "Sem acesso registrado"}</span><span>{i.guests.filter(g=>g.status!=="pendente").length}/{i.guests.length} respostas</span></div>}<div className={i.respondedAt || i.dietaryRestrictions || i.message ? "mt-5 mb-5" : "mt-5"}>
                        {i.guests.map((g) => (
                          <details key={g.id} className="rsvp-guest-accordion admin-guest-accordion last:border-b-0! [&:last-child>summary]:pb-0! [&:last-child[open]>summary]:pb-[18px]!">
                            <summary>
                              <span className="admin-guest-name-alerts">{g.name}{g.child ? " · Criança" : ""}
                                {modules.dietaryRestrictions&&g.status === "confirmado" && i.personalResponses?.[g.id]?.dietaryRestrictions?.trim() && <WarningCircleIcon size={19} weight="fill" className="admin-dietary-alert" role="img" aria-label="Restrição alimentar informada" />}
                                {modules.messages&&g.status === "confirmado" && i.personalResponses?.[g.id]?.message?.trim() && <ChatTextIcon size={19} weight="fill" className="admin-message-alert" role="img" aria-label="Recado aos noivos" />}
                              </span>
                              <span className="rsvp-guest-summary-status">
                                <ExpandingIconButtonGroup as="span" className="admin-guest-quick-actions">
                                  <ExpandingIconButton type="button" aria-label={"Baixar convite de " + g.name} disabled={busy || generatingPdf === g.id || !i.active} onClick={event => {event.preventDefault(); event.stopPropagation(); void downloadPdf({label:g.name, token:i.personalCodes?.[g.id] ?? i.code ?? i.personalTokens?.[g.id] ?? i.token},g.id);}} icon={<EnvelopeSimpleIcon size={17} aria-hidden="true" />} label={"Convite pessoal"} />
                                  <ExpandingIconButton type="button" aria-label={copiedId === g.id ? "Link copiado" : "Copiar link de " + g.name} disabled={busy || !i.active} onClick={event => {event.preventDefault(); event.stopPropagation(); void copyInvitationLink(i.personalCodes?.[g.id] ?? i.code ?? i.personalTokens?.[g.id] ?? i.token, g.id);}} icon={copiedId === g.id ? <CheckIcon size={17} weight="bold" aria-hidden="true" /> : <CopyIcon size={17} aria-hidden="true" />} label={copiedId === g.id ? "Copiado" : "Copiar link"} />
                                </ExpandingIconButtonGroup>
                                <AttendanceBadge status={g.status} className="max-[600px]:col-start-2 max-[600px]:row-start-1 max-[600px]:w-[140px] max-[600px]:text-[11px] max-[380px]:w-[125px] max-[380px]:text-[10px]" />
                                <CaretDownIcon className="rsvp-accordion-caret" size={18} aria-hidden="true" />
                              </span>
                            </summary>
                            <div className="rsvp-guest-accordion-fields">
                              <div className="admin-guest-notes">
                                {modules.invitationTracking&&i.personalOpenedAt?.[g.id] && <p className="text-xs text-[var(--forever-accent,#80654E)]">Link pessoal aberto em {new Date(i.personalOpenedAt[g.id]).toLocaleString("pt-BR")}</p>}
                                {modules.dietaryRestrictions&&<div><p><WarningCircleIcon size={19} weight="fill" className="admin-dietary-alert" aria-hidden="true" />Restrições alimentares</p><span>{i.personalResponses?.[g.id]?.dietaryRestrictions || "Nenhuma restrição informada."}</span></div>}
                                {modules.messages&&<div><p><ChatTextIcon size={19} weight="fill" className="admin-message-alert" aria-hidden="true" />Recado aos noivos</p><span>{i.personalResponses?.[g.id]?.message || "Nenhum recado enviado."}</span></div>}
                              </div>
                            </div>
                          </details>
                        ))}
                      </div>
                      {i.respondedAt && (
                        <p className="text-sm text-[var(--forever-accent,#80654E)]">
                          Última resposta do convite:{" "}
                          {new Date(i.respondedAt).toLocaleString("pt-BR")}
                        </p>
                      )}
                      {modules.dietaryRestrictions&&i.dietaryRestrictions && (
                        <p className="mt-2 whitespace-pre-wrap text-sm">
                          Restrições: {i.dietaryRestrictions}
                        </p>
                      )}
                      {modules.messages&&i.message && (
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
