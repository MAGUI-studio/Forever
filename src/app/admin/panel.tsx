"use client";
import { invitationSearchIndex, searchInvitations } from "@/lib/invitation-search";
import { RequiredMark, RequiredFieldsNotice } from "@/components/ui/RequiredFields";
import { PRO_SUPPORT_URL } from "@/config/plan-access";
import {
  useTableSearch,
  useQueryState,
  guestFilterParser,
  tableUrlOptions,
} from "./table-url-state";

import { UpgradePlanDialog } from "./UpgradePlanDialog";
import { InvitationEditorPage } from "./InvitationEditorPage";
import { AdminPageHeading } from "./AdminPageHeading";
import { notify, useFeedbackToasts } from "@/components/ui/ForeverToaster";
import { resolveModules, sectionModule } from "@/config/modules";
import { AdminLoading } from "./AdminLoading";
import dynamic from "next/dynamic";
import { AdminContainer } from "./AdminContainer";
import { useEffect, useMemo, useRef, useState } from "react";
import { PencilSimpleIcon } from "@phosphor-icons/react";
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
import { useWedding } from "@/components/wedding/WeddingProvider";
import { GuestsTableView } from "./GuestsTableView";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
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
  UserX,
  Users,
  Utensils,
  X,
} from "lucide-react";
import {
  WeddingOrnaments,
  WeddingBranch,
  WeddingLoadingIcon,
} from "@/components/wedding/WeddingOrnaments";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";
import { PLAN_NAMES, getWeddingGuestLimit, type WeddingPlan } from "@/config/forever";
import { ForeverLogo } from "@/components/forever/ForeverLogo";
import type { Invitation, RSVPSettings, AuditEntry, ReceptionMember } from "@/types/guests";
const VisualSiteEditor = dynamic(
  () => import("./VisualSiteEditor").then((editor) => editor.VisualSiteEditor),
  { loading: () => <AdminLoading /> },
);

const normalized = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export function AdminPanel({
  view,
  section = "overview",
  invitationEditor,
}: {
  view: "entry" | "login" | "dashboard";
  invitationEditor?: "new" | { id: string };
  section?: "site" | "overview" | "guests" | "check-in" | "tables" | "buffet" | "history" | "team";
}) {
  const {
    slug,
    config: weddingConfig,
    setConfig,
    setTheme,
    modules,
    setModules,
    setTemplateId,
    templateId,
    themeStyle,
    path: weddingPath,
  } = useWedding();
  const router = useRouter();
  const [modalState, setModalState] = useAdminModal();
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<WeddingPlan>("foreverPro");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadedSection, setLoadedSection] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("Verificando seu acesso…");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    [],
  );
  const [role, setRole] = useState<"admin" | "reception">("admin");
  const [tables, setTables] = useState<import("@/types/guests").EventTable[]>([]);
  const [operationsData, setOperationsData] = useState<{
    history: AuditEntry[];
    team: ReceptionMember[];
  }>({ history: [], team: [] });
  const [authorized, setAuthorized] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  useFeedbackToasts(error);
  const [busy, setBusy] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [invitationsLoaded, setInvitationsLoaded] = useState(false);
  const [settings, setSettings] = useState<RSVPSettings>({
    enabled: true,
    deadline: "",
  });
  const [query, setQuery] = useTableSearch();
  const [filter, setFilter] = useQueryState(
    "filter",
    guestFilterParser.withOptions(tableUrlOptions),
  );
  const [upgradePending, setUpgradePending] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");
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

  function handleUpgrade() {
    setUpgradeError("");
    setUpgradeDialogOpen(true);
  }
  async function startUpgradeCheckout() {
    try {
      if (!user) throw new Error("Entre na sua conta para continuar.");
      setUpgradeLoading(true);
      setUpgradeError("");
      setError("");
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + (await user.getIdToken()),
          "x-wedding-slug": slug,
        },
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
      setUpgradeError(message);
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
        if (view !== destination) router.replace(u ? weddingPath("painel") : "/login");
      });
    } catch (e) {
      queueMicrotask(() => {
        setError(e instanceof Error ? e.message : "Falha ao iniciar login.");
        setReady(true);
        if (view !== "login") router.replace("/login");
      });
    }
  }, [router, view]);
  async function api(path: string, method = "GET", data?: unknown, account = user) {
    if (!account) throw new Error("Faça login para continuar.");
    const response = await fetch(path, {
      method,
      headers: {
        Authorization: `Bearer ${await account.getIdToken()}`,
        "Content-Type": "application/json",
        "x-wedding-slug": slug,
      },
      ...(data ? { body: JSON.stringify(data) } : {}),
    });
    const result = await readApiResponse(response);
    if (method !== "GET") {
      const details = data as { sent?: boolean; checkedIn?: boolean; action?: string } | undefined;
      const messages: Record<string, string> = {
        table: "Mesa salva",
        "delete-table": "Mesa excluída",
        assign: "Lugares atualizados",
        "create-team": "Conta da equipe criada",
        team: "Acesso da equipe atualizado",
        "remove-team": "Acesso da equipe removido",
      };
      const title = path.endsWith("/invites/sent")
        ? details?.sent
          ? "Convite marcado como enviado"
          : "Marcação de envio removida"
        : path.endsWith("/invites")
          ? method === "POST"
            ? "Convite criado!"
            : method === "DELETE"
              ? "Convite excluído"
              : "Convite atualizado!"
          : path.endsWith("/settings")
            ? "Configurações salvas"
            : path.endsWith("/reception")
              ? details?.checkedIn
                ? "Chegada registrada"
                : "Chegada desfeita"
              : (messages[details?.action ?? ""] ?? "Alterações salvas");
      notify.success(title);
    }
    return result;
  }
  async function load(account = user, isCurrent = () => true) {
    setLoadingMessage("Buscando os detalhes do seu casamento…");
    const includeInvitations = !!modalState.modal && modalState.modal !== "settings";
    const session = await api(
      `/api/admin/session?section=${section}${includeInvitations ? "&invitations=1" : ""}`,
      "GET",
      undefined,
      account,
    );
    if (!isCurrent()) return;
    setLoadedSection(section);
    setConfig(session.wedding.config);
    setTheme(session.wedding.theme);
    setModules(resolveModules(session.wedding.modules, session.wedding.plan));
    setTemplateId(session.wedding.templateId ?? "botanical-classic");
    setPlan(session.wedding.plan === "essencial" ? "essencial" : "foreverPro");
    const enabled = resolveModules(session.wedding.modules, session.wedding.plan);
    if (sectionModule[section] && !enabled[sectionModule[section]!]) {
      setLoading(false);
      router.replace(weddingPath("painel"));
      return;
    }
    if (section === "site" && enabled.siteEditor && session.role === "admin") {
      setRole(session.role);
      setAuthorized(true);
      setLoading(false);
      return;
    }
    const data = session.panel;
    if (!data) throw new Error("Não foi possível carregar painel.");
    setRole(session.role);
    setTables(data.tables);
    setOperationsData({ history: data.history, team: data.team });
    setInvites(data.invitations);
    setInvitationsLoaded(data.invitationsLoaded);
    if (data.settings) setSettings(data.settings);
    setAuthorized(true);
    setLoading(false);
    if (session.role === "reception" && section !== "check-in")
      router.replace(weddingPath("recepcao"));
  }

  useEffect(() => {
    let active = true;
    if (user && view === "dashboard")
      void load(user, () => active).catch((e) => {
        if (!active) return;
        setLoadedSection(section);
        setAuthorized(false);
        setLoading(false);
        setError(e instanceof Error ? e.message : "Erro ao carregar painel.");
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, view, section]);
  useEffect(() => {
    if (!authorized || invitationsLoaded || !modalState.modal || modalState.modal === "settings")
      return;
    let cancelled = false;
    void api("/api/admin/invites")
      .then((data) => {
        if (!cancelled) {
          setInvites(data.invitations);
          setInvitationsLoaded(true);
        }
      })
      .catch((error) => {
        if (!cancelled) setError(error.message);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized, invitationsLoaded, modalState.modal]);
  useEffect(() => {
    if (!user || !authorized || view !== "dashboard") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgrade") !== "success") return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    setUpgradePending(true);
    const checkPlan = async () => {
      try {
        const session = await api("/api/admin/session");
        if (cancelled) return;
        if (session.wedding.plan === "foreverPro") {
          await load(user);
          if (cancelled) return;
          setUpgradePending(false);
          params.delete("upgrade");
          params.delete("session_id");
          window.history.replaceState(
            {},
            "",
            window.location.pathname + (params.size ? `?${params}` : ""),
          );
          notify.success(
            "Bem-vindo ao Forever PRO!",
            "Plano ativado. Convidados ilimitados e recursos de organização liberados.",
            "forever-upgrade-success",
          );
          return;
        }
      } catch {}
      if (!cancelled) timer = setTimeout(checkPlan, 3000);
    };
    void checkPlan();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authorized, view]);
  useEffect(() => {
    if (!authorized || section !== "check-in" || busy) return;
    let cancelled = false;
    let inFlight = false;
    const timer = setInterval(async () => {
      if (document.visibilityState !== "visible" || inFlight) return;
      inFlight = true;
      try {
        const list = await api("/api/admin/reception");
        if (!cancelled) {
          setInvites(list.invitations);
          setTables(list.tables);
        }
      } catch {
      } finally {
        inFlight = false;
      }
    }, 15000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized, section, busy, user]);
  async function refreshReception() {
    const list = await api("/api/admin/reception");
    setInvites(list.invitations);
    setTables(list.tables);
  }
  async function copyInvitationLink(token: string, key: string) {
    try {
      await navigator.clipboard.writeText(invitationUrl(token, slug));
      setCopiedId(key);
      notify.success("Link copiado!", "O link do convite está pronto para compartilhar.");
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopiedId(null), 3000);
    } catch {
      setError("Não foi possível copiar o link. Tente novamente.");
    }
  }
  async function action(work: () => Promise<void>, local = false) {
    if (!local) setBusy(true);
    const feedbackId = notify.loading("Concluindo sua solicitação…");
    setError("");
    try {
      await work();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível concluir.");
    } finally {
      notify.dismiss(feedbackId);
      if (!local) setBusy(false);
    }
  }
  function openModal(modal: AdminModalName, convite: string | null = null) {
    setError("");

    void setModalState({ modal, convite });
  }
  function open(invite?: Invitation) {
    if (
      !invite &&
      invites
        .filter((item) => item.active)
        .reduce((count, item) => count + item.guests.length, 0) >= getWeddingGuestLimit(plan)
    ) {
      notify.info(
        "Limite de convidados atingido",
        "O Forever Essencial permite 50 convidados no evento. O Forever PRO oferece convidados ilimitados.",
      );
      return;
    }
    router.push(weddingPath(invite ? `convidados/${invite.id}/editar` : "convidados/novo"));
  }
  function closeModal() {
    setError("");
    if (invitationEditor) {
      router.push(weddingPath("convidados"));
      return;
    }
    void setModalState(null, { history: "replace" });
  }
  async function downloadPdf(invitation: { label: string; token: string }, key: string) {
    setGeneratingPdf(key);
    setError("");
    try {
      const { downloadInvitationPdf } = await import("@/lib/invitation-pdf");
      await downloadInvitationPdf(invitation, weddingConfig, slug, templateId);
      notify.success("Convite gerado!", "O download do PDF foi iniciado.");
    } catch {
      setError("Não foi possível gerar o convite. Tente novamente.");
    } finally {
      setGeneratingPdf(null);
    }
  }
  function saveInvitation(draft: InviteDraft, original?: Invitation) {
    void action(async () => {
      await api(
        "/api/admin/invites",
        original ? "PATCH" : "POST",
        original ? { id: original.id, revision: original.revision, invitation: draft } : draft,
      );
      closeModal();
      if (!invitationEditor) await load();
    });
  }
  const allGuests = useMemo(
    () => invites.filter((i) => i.active).flatMap((i) => i.guests),
    [invites],
  );
  const normalizedQuery = normalized(query);
  const searchIndex = useMemo(() => invitationSearchIndex(invites), [invites]);
  const visible = useMemo(
    () => searchInvitations(searchIndex, normalizedQuery, filter),
    [searchIndex, normalizedQuery, filter],
  );

  if (
    view === "dashboard" &&
    (!ready || (!!user && ((loading && !authorized) || (authorized && loadedSection !== section))))
  )
    return <AdminLoading description={!ready ? "Verificando seu acesso…" : loadingMessage} />;
  if (authorized && section === "site" && modules.siteEditor) return <VisualSiteEditor />;
  return (
    <main className={"admin-wedding " + (!user ? "admin-wedding--login" : "")}>
      <div className="admin-background" aria-hidden="true">
        <div className="admin-floral-layer">
          <WeddingOrnaments variant="floral" tone="paper" />
        </div>
      </div>
      <AdminContainer centered={view !== "dashboard" && !user}>
        {user && view === "dashboard" && authorized && (
          <nav
            className="admin-nav flex-nowrap! gap-3! lg:flex-wrap! lg:gap-6!"
            aria-label="Navegação da administração"
          >
            <div className="flex items-center gap-3.5">
              <Link
                href={weddingPath("painel")}
                aria-label="Forever — Início"
                className="transition-opacity hover:opacity-85"
              >
                <ForeverLogo className="w-28 sm:w-32" />
              </Link>
              <span className="hidden sm:block h-7 w-px bg-[#722f3725]" aria-hidden="true" />
              <div
                className="hidden sm:flex items-center"
                title={`Assinatura: ${PLAN_NAMES[plan] ?? "Forever PRO"}`}
              >
                <img
                  src={
                    plan === "essencial"
                      ? "/forever/subscription/essential_plan.svg"
                      : "/forever/subscription/pro_plan.svg"
                  }
                  alt={PLAN_NAMES[plan] ?? "Forever PRO"}
                  className="h-8 w-auto object-contain"
                />
              </div>
            </div>
            <div
              className="hidden! lg:flex! order-last flex w-full items-center justify-center gap-2.5 lg:order-none lg:w-auto lg:flex-1"
              aria-label="Seções do painel"
            >
              {role === "admin" && modules.guestList && (
                <Link
                  href={weddingPath("convidados")}
                  aria-current={section === "guests" ? "page" : undefined}
                  className={`group relative inline-flex min-h-11 items-center gap-2 overflow-hidden rounded-xl px-4 text-xs transition-all duration-200 border ${
                    section === "guests"
                      ? "border-[#722F3735] bg-white font-semibold text-[#722F37] shadow-xs"
                      : "border-transparent bg-white text-[#6B6760] hover:border-[#722F3725] hover:bg-white hover:text-[#722F37]"
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
                  href={weddingPath("recepcao")}
                  aria-current={section === "check-in" ? "page" : undefined}
                  className={`group relative inline-flex min-h-11 items-center gap-2 overflow-hidden rounded-xl px-4 text-xs transition-all duration-200 border ${
                    section === "check-in"
                      ? "border-[#722F3735] bg-white font-semibold text-[#722F37] shadow-xs"
                      : "border-transparent bg-white text-[#6B6760] hover:border-[#722F3725] hover:bg-white hover:text-[#722F37]"
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
                    onClick={() => setOrgOpen((prev) => !prev)}
                    className={`group relative inline-flex min-h-11 items-center gap-2 overflow-hidden rounded-xl px-4 text-xs transition-all duration-200 border ${
                      orgOpen || ["tables", "buffet", "history", "team"].includes(section)
                        ? "border-[#722F3735] bg-white font-semibold text-[#722F37] shadow-xs"
                        : "border-transparent bg-white text-[#6B6760] hover:border-[#722F3725] hover:bg-white hover:text-[#722F37]"
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
                      className="absolute top-full left-1/2 -translate-x-1/2 z-50 mt-2 w-[460px] rounded-2xl border border-[#722F3725] bg-white p-3 shadow-xl shadow-[#722F3712] animate-in fade-in-0 zoom-in-95 duration-150"
                    >
                      <div className="px-3 py-1.5 border-b border-[#722F3715] mb-2 flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#722F37]">
                          Central do Grande Dia
                        </span>
                        <span className="text-[10px] text-[#8C877F]">Recursos de Gestão</span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          {
                            href: "mesas",
                            label: "Mesas e lugares",
                            description: "Organização de mesas e assentos",
                            icon: LayoutGrid,
                            key: "tables" as const,
                          },
                          {
                            href: "buffet",
                            label: "Alimentação & buffet",
                            description: "Restrições e preferências alimentares",
                            icon: Utensils,
                            key: "buffet" as const,
                          },
                          {
                            href: "historico",
                            label: "Histórico",
                            description: "Auditoria e registro de alterações",
                            icon: History,
                            key: "history" as const,
                          },
                          {
                            href: "equipe",
                            label: "Equipe da recepção",
                            description: "Acessos da equipe para a portaria",
                            icon: UserCheck,
                            key: "team" as const,
                          },
                        ]
                          .filter((item) => modules[item.key])
                          .map((item) => {
                            const Icon = item.icon;
                            const isActive = section === item.key;
                            return (
                              <Link
                                key={item.href}
                                href={weddingPath(item.href)}
                                onClick={() => setOrgOpen(false)}
                                className={`group/item relative flex flex-col gap-1 rounded-xl p-3 text-left transition-all duration-200 border ${
                                  isActive
                                    ? "border-[#722F3735] bg-white text-[#722F37] font-semibold shadow-xs"
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
                                <p className="mt-1 text-[11px] text-[#82656C] leading-snug">
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

            <div className="hidden lg:flex items-center gap-2">
              <div className="group relative inline-flex items-center">
                <Link
                  href={weddingPath()}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Ver site"
                  className="inline-flex size-10 items-center justify-center rounded-xl border border-[#722F3730] bg-white text-[#722F37] transition-all duration-200 hover:border-[#722F37] hover:bg-white hover:shadow-xs focus-visible:outline-2 focus-visible:outline-[#722F37]"
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

              {role === "admin" && modules.siteEditor && (
                <div className="group relative inline-flex items-center">
                  <Link
                    href={weddingPath("editar-site")}
                    aria-label="Personalizar site"
                    className={`inline-flex size-10 items-center justify-center rounded-xl border transition-all duration-200 hover:shadow-xs focus-visible:outline-2 focus-visible:outline-[#722F37] ${
                      section === "site"
                        ? "border-[#722F37] bg-white text-[#722F37] font-semibold"
                        : "border-[#722F3730] bg-white text-[#722F37] hover:border-[#722F37] hover:bg-white"
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
                    className="group relative flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-[#722F37]/35 bg-white p-0.5 shadow-xs transition-all duration-200 hover:border-[#722F37] hover:ring-2 hover:ring-[#722F37]/20 hover:scale-105 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-[#722F37] focus-visible:outline-offset-2 data-[state=open]:border-[#722F37] data-[state=open]:ring-2 data-[state=open]:ring-[#722F37]/25"
                  >
                    <span
                      className="flex size-full items-center justify-center rounded-full bg-white text-[#722F37] font-serif text-base font-semibold transition-transform duration-200 group-hover:scale-95"
                      aria-hidden="true"
                    >
                      {user.email?.slice(0, 1).toUpperCase() || "G"}
                    </span>
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="admin-profile-menu border border-[#722F3720] shadow-xl"
                    align="end"
                    sideOffset={10}
                    collisionPadding={16}
                  >
                    <DropdownMenu.Label className="admin-profile-label">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#722F37]">
                        Espaço dos noivos
                      </span>
                      <span className="text-xs text-[#77736c] font-normal">{user.email}</span>
                    </DropdownMenu.Label>
                    {plan === "essencial" && (
                      <DropdownMenu.Item asChild>
                        <button
                          type="button"
                          disabled={upgradeLoading}
                          onClick={() => void handleUpgrade()}
                          className="flex w-full cursor-pointer items-center justify-between rounded-lg bg-[#722F3710] px-2.5 py-2 text-xs font-medium text-[#722F37] transition-colors hover:bg-white outline-none disabled:opacity-60"
                        >
                          <span className="flex items-center gap-1.5">
                            {upgradeLoading ? (
                              <Loader2 size={12} className="animate-spin text-[#722F37]" />
                            ) : (
                              <Heart size={12} className="fill-[#722F37]" />
                            )}
                            <span>
                              {upgradeLoading ? "Iniciando…" : "Upgrade para Forever PRO"}
                            </span>
                          </span>
                          <ArrowUpRight size={13} />
                        </button>
                      </DropdownMenu.Item>
                    )}
                    {plan === "foreverPro" && (
                      <DropdownMenu.Item asChild>
                        <a
                          href={PRO_SUPPORT_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="admin-profile-item"
                        >
                          <ArrowUpRight size={16} aria-hidden="true" />
                          Suporte PRO pelo WhatsApp
                        </a>
                      </DropdownMenu.Item>
                    )}
                    <DropdownMenu.Separator className="admin-profile-separator bg-[#722F3715]" />

                    {modules.rsvp && (
                      <DropdownMenu.Item
                        className="flex cursor-pointer items-center gap-2 rounded-[var(--wedding-radius)] px-2.5 py-3 text-xs text-[#722F37] outline-none hover:bg-[#722F370d] data-highlighted:bg-[#722F370d] data-disabled:opacity-40"
                        disabled={busy || !authorized || role !== "admin"}
                        onSelect={() => openModal("settings")}
                      >
                        <CalendarDays size={16} aria-hidden="true" />
                        Configurações
                      </DropdownMenu.Item>
                    )}
                    <DropdownMenu.Item
                      className="admin-profile-item text-[#722F37] hover:bg-[#722F370d] data-highlighted:bg-[#722F370d]"
                      disabled={busy}
                      onSelect={() =>
                        void action(async () => {
                          await signOut(clientAuth());
                        })
                      }
                    >
                      <LogOut size={16} aria-hidden="true" /> Sair
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
            <MobileAdminMenu
              role={role}
              plan={plan}
              section={section}
              email={user.email}
              busy={busy}
              authorized={authorized}
              onSettings={() => openModal("settings")}
              onSignOut={() =>
                void action(async () => {
                  await signOut(clientAuth());
                })
              }
              onUpgrade={() => void handleUpgrade()}
            />
          </nav>
        )}
        {authorized && upgradePending && (
          <section
            role="status"
            className="relative mt-6 mb-6 flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-5 text-sm text-neutral-600"
          >
            <Loader2
              size={18}
              className="shrink-0 animate-spin text-[#722F37]"
              aria-hidden="true"
            />
            <div>
              <p className="font-medium text-neutral-900">Aguardando confirmação do pagamento</p>
              <p className="mt-1">
                Seu plano será atualizado assim que recebermos a confirmação oficial do Stripe.
              </p>
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
        {error && !invitationEditor && !(authorized && modalState.modal) && (
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
                  backgroundImage: "url(" + weddingConfig.couple.coverImage + ")",
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
                  await signInWithEmailAndPassword(clientAuth(), email, password);
                  setPassword("");
                });
              }}
            >
              <RequiredFieldsNotice />
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
                <p>Entre para organizar os convites e acompanhar cada confirmação.</p>
              </div>
              <label className="block">
                <span className="admin-field-label">
                  <Mail size={14} aria-hidden="true" /> E-mail
                  <RequiredMark />
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
                  <RequiredMark />
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
              <button className="guest-button admin-login-submit" disabled={busy}>
                {busy ? "Entrando…" : "Entrar no painel"}
                <ArrowUpRight size={17} aria-hidden="true" />
              </button>
              <p className="admin-login-note">
                <LockKeyhole size={12} aria-hidden="true" /> Acesso reservado às contas autorizadas.
              </p>
            </form>
          </div>
        ) : (
          <>
            {(authorized || loading) &&
              (!sectionModule[section] || modules[sectionModule[section]!]) &&
              section !== "overview" &&
              (section === "site" ? (
                <VisualSiteEditor />
              ) : section === "tables" ||
                section === "buffet" ||
                section === "history" ||
                section === "team" ? (
                <EventOperations
                  pageLoading={!authorized && loading}
                  section={section}
                  invitations={invites}
                  tables={tables}
                  history={operationsData.history}
                  team={operationsData.team}
                  api={api}
                  onRefresh={load}
                />
              ) : section === "check-in" ? (
                <CheckInList
                  tables={tables}
                  loading={!authorized && loading}
                  invitations={invites}
                  busy={busy}
                  onRefresh={() =>
                    void action(async () => {
                      await load();
                    })
                  }
                  onToggle={(invitation, guestIds, checkedIn) =>
                    void action(async () => {
                      await api("/api/admin/reception", "PATCH", {
                        id: invitation.id,
                        guestIds,
                        checkedIn,
                        expectedCheckedIn: !checkedIn,
                      });
                      await refreshReception();
                    })
                  }
                />
              ) : invitationEditor ? (
                <InvitationEditorPage
                  editing={invitationEditor !== "new"}
                  creationBlocked={
                    invitationEditor === "new" && allGuests.length >= getWeddingGuestLimit(plan)
                  }
                  onUpgrade={() => void handleUpgrade()}
                  upgradeLoading={upgradeLoading}
                  guestLimit={getWeddingGuestLimit(plan)}
                  otherGuestCount={invites
                    .filter(
                      (invite) =>
                        invite.active &&
                        (invitationEditor === "new" || invite.id !== invitationEditor.id),
                    )
                    .reduce((count, invite) => count + invite.guests.length, 0)}
                  invitation={
                    invitationEditor === "new"
                      ? undefined
                      : invites.find((invite) => invite.id === invitationEditor.id)
                  }
                  busy={busy}
                  error={error}
                  onBack={closeModal}
                  onSave={saveInvitation}
                />
              ) : (
                <div className="pt-6 sm:pt-8 space-y-6 pb-16">
                  <div className="grid grid-cols-1 items-center gap-6 border-b border-neutral-200/80 pb-6 xl:grid-cols-[minmax(280px,0.85fr)_minmax(0,3fr)]">
                    <AdminPageHeading
                      context="Pessoas que amamos"
                      title="Lista de"
                      accent="convidados"
                      loading={loading && !authorized}
                      description={
                        <>
                          {allGuests.length} convidados em {invites.length} convites cadastrados
                          {plan === "essencial" && <> · Plano Essencial (limite de 50 vagas)</>}
                        </>
                      }
                    />

                    <div
                      className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4"
                      aria-label="Resumo dos convidados"
                    >
                      <article className="relative flex min-h-32 flex-col justify-between overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs transition-all hover:border-[#722F3730]">
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute -right-3 -bottom-3 text-neutral-900 opacity-[0.04] rotate-[-12deg]"
                        >
                          <Users size={80} />
                        </span>
                        <p className="relative text-xs font-medium text-neutral-500">
                          Convidados ativos
                        </p>
                        <strong className="relative my-1 font-serif text-3xl sm:text-4xl font-normal text-neutral-900">
                          {loading && !authorized ? "…" : allGuests.length}
                        </strong>
                        <span className="relative text-[11px] text-neutral-400">
                          {plan === "essencial"
                            ? `${allGuests.length} de ${getWeddingGuestLimit(plan)} convidados · ${Math.max(0, getWeddingGuestLimit(plan) - allGuests.length)} vagas`
                            : "Forever PRO · convidados ilimitados"}
                        </span>
                      </article>

                      <article className="relative flex min-h-32 flex-col justify-between overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs transition-all hover:border-[#722F3730]">
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute -right-3 -bottom-3 text-neutral-900 opacity-[0.04] rotate-[-12deg]"
                        >
                          <CheckCircle2 size={80} />
                        </span>
                        <p className="relative text-xs font-medium text-neutral-500">Confirmados</p>
                        <strong className="relative my-1 font-serif text-3xl sm:text-4xl font-normal text-neutral-900">
                          {loading && !authorized
                            ? "…"
                            : allGuests.filter((g) => g.status === "confirmado").length}
                        </strong>
                        <span className="relative text-[11px] text-neutral-500 font-medium">
                          {allGuests.length > 0
                            ? `${Math.round((allGuests.filter((g) => g.status === "confirmado").length / allGuests.length) * 100)}% de presença confirmada`
                            : "Aguardando respostas"}
                        </span>
                      </article>

                      <article className="relative flex min-h-32 flex-col justify-between overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs transition-all hover:border-[#722F3730]">
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute -right-3 -bottom-3 text-neutral-900 opacity-[0.04] rotate-[-12deg]"
                        >
                          <Clock size={80} />
                        </span>
                        <p className="relative text-xs font-medium text-neutral-500">Pendentes</p>
                        <strong className="relative my-1 font-serif text-3xl sm:text-4xl font-normal text-neutral-900">
                          {loading && !authorized
                            ? "…"
                            : allGuests.filter((g) => g.status === "pendente").length}
                        </strong>
                        <span className="relative text-[11px] text-neutral-500 font-medium">
                          {allGuests.length > 0
                            ? `${Math.round((allGuests.filter((g) => g.status === "pendente").length / allGuests.length) * 100)}% aguardando resposta`
                            : "Nenhuma pendência"}
                        </span>
                      </article>

                      <article className="relative flex min-h-32 flex-col justify-between overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs transition-all hover:border-[#722F3730]">
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute -right-3 -bottom-3 text-neutral-900 opacity-[0.04] rotate-[-12deg]"
                        >
                          <UserX size={80} />
                        </span>
                        <p className="relative text-xs font-medium text-neutral-500">
                          Não comparecerão
                        </p>
                        <strong className="relative my-1 font-serif text-3xl sm:text-4xl font-normal text-neutral-900">
                          {loading && !authorized
                            ? "…"
                            : allGuests.filter((g) => g.status === "recusado").length}
                        </strong>
                        <span className="relative text-[11px] text-neutral-500 font-medium">
                          {allGuests.length > 0
                            ? `${Math.round((allGuests.filter((g) => g.status === "recusado").length / allGuests.length) * 100)}% justificaram ausência`
                            : "Nenhum recusado"}
                        </span>
                      </article>
                    </div>
                  </div>

                  {plan === "essencial" && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200/80 bg-white p-4 text-xs text-[#161616] shadow-xs">
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#722F3712] text-[#722F37]">
                          <Heart size={16} className="fill-[#722F37]" />
                        </span>
                        <div>
                          <p className="font-medium text-[#161616]">
                            <strong>
                              Forever Essencial · {allGuests.length} de {getWeddingGuestLimit(plan)}{" "}
                              convidados
                            </strong>
                          </p>
                          <p className="text-[11px] text-neutral-500">
                            {allGuests.length >= getWeddingGuestLimit(plan)
                              ? "Limite atingido. A criação de novos convites está bloqueada. O Forever PRO oferece convidados ilimitados."
                              : `${getWeddingGuestLimit(plan) - allGuests.length} vagas restantes no evento, somando todos os convites. O Forever PRO oferece convidados ilimitados.`}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleUpgrade()}
                        disabled={upgradeLoading}
                        className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#722F37] px-4 text-xs font-medium text-white transition-colors hover:bg-[#5B252C] disabled:opacity-50"
                      >
                        <span>
                          {upgradeLoading
                            ? "Abrindo upgrade…"
                            : allGuests.length >= getWeddingGuestLimit(plan)
                              ? "Assinar PRO e liberar convidados ilimitados"
                              : "Conhecer Forever PRO"}
                        </span>
                        <ArrowUpRight size={13} aria-hidden="true" />
                      </button>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-1 flex-wrap items-center gap-2.5">
                      <div className="relative flex-1 min-w-[240px] sm:max-w-[360px]">
                        <Search
                          size={16}
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                        />
                        <input
                          aria-label="Buscar convidados"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Buscar por nome, família ou grupo..."
                          className="h-11 w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-8 text-xs text-[#161616] placeholder:text-neutral-400 shadow-2xs outline-none transition-all focus:border-[#722F37] focus:ring-2 focus:ring-[#722F3715]"
                        />
                        {query && (
                          <button
                            type="button"
                            onClick={() => setQuery("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
                            title="Limpar busca"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      <div className="w-full sm:w-[220px]">
                        <WeddingSelect
                          label="Filtrar situação"
                          className="h-11! min-h-11! rounded-xl! border! border-neutral-200! bg-white! px-3! text-xs! shadow-2xs! text-[#161616]! focus-visible:border-[#722F37]!"
                          value={filter}
                          onValueChange={(value) => setFilter(guestFilterParser.parse(value))}
                          options={[
                            { value: "todos", label: "Todos os convites" },
                            { value: "confirmado", label: "Com confirmados" },
                            { value: "pendente", label: "Com pendentes" },
                            { value: "recusado", label: "Com recusas" },
                            { value: "abertos", label: "Convites abertos" },
                            { value: "nao-respondidos", label: "Respostas pendentes" },
                            { value: "respondidos", label: "Totalmente respondidos" },
                            { value: "enviados", label: "Convites enviados" },
                            { value: "nao-enviados", label: "Ainda não enviados" },
                            { value: "inativos", label: "Inativos" },
                          ].filter(
                            (option) =>
                              modules.invitationTracking ||
                              ![
                                "abertos",
                                "enviados",
                                "nao-enviados",
                                "nao-respondidos",
                                "respondidos",
                              ].includes(option.value),
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex w-full shrink-0 items-center gap-2.5 sm:w-auto">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void action(async () => {
                            await load();
                          })
                        }
                        className="inline-flex h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap sm:flex-none rounded-xl border border-neutral-200 bg-white px-3.5 text-xs font-medium text-neutral-700 shadow-2xs hover:bg-neutral-50 hover:border-neutral-300 hover:text-[#722F37] transition-all cursor-pointer disabled:opacity-50"
                        title="Atualizar lista"
                      >
                        <RefreshCw
                          size={14}
                          className={busy ? "animate-spin text-[#722F37]" : "text-neutral-400"}
                        />
                        <span>Atualizar</span>
                      </button>

                      <button
                        type="button"
                        disabled={busy || (plan === "essencial" && allGuests.length >= 50)}
                        onClick={() => open()}
                        className="inline-flex h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap sm:flex-none rounded-xl bg-[#722F37] px-4 text-xs font-medium text-white shadow-xs hover:bg-[#5b242b] transition-all cursor-pointer disabled:opacity-50"
                        title={
                          plan === "essencial" && allGuests.length >= 50
                            ? "Limite de 50 convidados atingido no plano Forever Essencial"
                            : undefined
                        }
                      >
                        <Plus size={15} />
                        <span>
                          {allGuests.length >= getWeddingGuestLimit(plan)
                            ? "Limite atingido"
                            : "Adicionar convite"}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {!authorized && loading ? (
                      <DashboardSkeleton />
                    ) : visible.length === 0 ? (
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
                        {(query || filter !== "todos") && (
                          <button
                            type="button"
                            className="guest-secondary"
                            onClick={() => {
                              setQuery("");
                              setFilter("todos");
                            }}
                          >
                            <X size={14} aria-hidden="true" /> Limpar busca e filtros
                          </button>
                        )}
                        {!query && filter === "todos" && (
                          <button
                            className="guest-secondary"
                            disabled={busy || (plan === "essencial" && allGuests.length >= 50)}
                            onClick={() => open()}
                          >
                            <Plus size={14} aria-hidden="true" /> Criar primeiro convite
                          </button>
                        )}
                      </div>
                    ) : (
                      <GuestsTableView
                        invitations={visible}
                        allGuests={allGuests}
                        tables={tables}
                        modules={modules}
                        busy={busy}
                        generatingPdf={generatingPdf}
                        copiedId={copiedId}
                        plan={plan}
                        onEdit={(invite) => open(invite)}
                        onDelete={(inviteId) => openModal("delete-invitation", inviteId)}
                        onCopyLink={async (token, key) => {
                          await copyInvitationLink(token, key);
                        }}
                        onDownloadPdf={async (invitation, key) => {
                          await downloadPdf(invitation, key);
                        }}
                        onToggleSent={async (invite) => {
                          await action(async () => {
                            const result = await api("/api/admin/invites/sent", "POST", {
                              id: invite.id,
                              sent: !invite.sentAt,
                            });
                            setInvites((current) =>
                              current.map((item) =>
                                item.id === invite.id ? { ...item, sentAt: result.sentAt } : item,
                              ),
                            );
                          });
                        }}
                        onAddInvite={() => open()}
                      />
                    )}
                  </div>
                </div>
              ))}
          </>
        )}
      </AdminContainer>
      {authorized && view === "dashboard" && modalState.modal && (
        <AdminModals
          key={modalState.modal + ":" + (modalState.convite ?? "")}
          modal={modalState.modal}
          selected={
            modalState.modal === "new-invitation" || modalState.modal === "settings"
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
      <UpgradePlanDialog
        open={upgradeDialogOpen}
        busy={upgradeLoading}
        error={upgradeError}
        onClose={() => setUpgradeDialogOpen(false)}
        onContinue={() => void startUpgradeCheckout()}
      />
    </main>
  );
}
