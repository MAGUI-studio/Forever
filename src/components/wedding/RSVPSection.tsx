"use client";
import {RequiredMark,RequiredFieldsNotice} from "@/components/ui/RequiredFields";
import { notify, useFeedbackToasts } from "@/components/ui/ForeverToaster";
import {useSiteCopy} from "./useSiteCopy";
import {useWedding} from "./WeddingProvider";
import { AttendanceBadge } from "@/components/ui/AttendanceBadge";
import { useEffect, useState } from "react";
import { EnvelopeOpenIcon, CheckCircleIcon, PaperPlaneTiltIcon, UsersIcon, CaretDownIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { WeddingSelect } from "@/components/ui/WeddingSelect";
import confetti from "canvas-confetti";
import { WeddingOrnaments } from "./WeddingOrnaments";
import { RSVPCodeInput } from "./RSVPCodeInput";

function isValidTokenOrCode(val: string): boolean {
  const clean = val.trim();
  return (
    /^[2-9A-Za-z]{3}-?[2-9A-Za-z]{3}$/.test(clean) ||
    /^(?:[a-f0-9]{48}|[a-f0-9]{64}\.[a-f0-9-]{36}\.[a-f0-9]{64})$/.test(clean)
  );
}

function normalizeTokenOrCode(val: string): string {
  const clean = val.trim();
  const digitsOnly = clean.replace(/[^A-Za-z0-9]/g, "");
  if (digitsOnly.length === 6) {
    return digitsOnly.slice(0, 3).toUpperCase() + "-" + digitsOnly.slice(3).toUpperCase();
  }
  return clean.toLowerCase();
}
import type { Attendance, RSVPSettings } from "@/types/guests";
type PublicInvite = {
  personal?: boolean;
  label: string;
  guests: { id: string; name: string; status: Attendance; message: string; dietaryRestrictions: string }[];
  revision: number;
  respondedAt: string | null;
  message: string;
  dietaryRestrictions: string;
};
export function RSVPSection() {
  const copy=useSiteCopy();
 const {slug,modules,templateId,config}=useWedding();
 const romance=templateId==="contemporary-romance";
  const [code, setCode] = useState("");
  const [invite, setInvite] = useState<PublicInvite | null>(null);
  const [settings, setSettings] = useState<RSVPSettings>({
    enabled: true,
    deadline: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useFeedbackToasts(error);
  const [saved, setSaved] = useState(false);
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    let active = true;
    const syncHash = () => {
      const raw = window.location.hash.slice(1).trim();
      // Section anchors such as "inicio" also match the six-letter invite format.
      if (document.getElementById(raw)) return;
      if (isValidTokenOrCode(raw)) {
        const normalized = normalizeTokenOrCode(raw);
        setCode(normalized);
        setBusy(true);
        setError("");
        setSaved(false);
        setInvite(null);
        fetch("/api/rsvp/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-wedding-slug": slug },
          body: JSON.stringify({ token: normalized }),
        })
          .then(async (response) => {
            const result = await response.json();
            if (!response.ok) {
              throw new Error(
                response.status === 404
                  ? copy("rsvp.text27")
                  : response.status === 400
                  ? copy("rsvp.text28")
                  : result.error
              );
            }
            if (!active) return;
            setCode(normalized);
            setInvite(result.invitation);
            setSettings(result.settings);
            setClosed(
              !result.settings.enabled ||
                (!!result.settings.deadline &&
                  Date.now() > Date.parse(result.settings.deadline))
            );
          })
          .catch((e) => {
            if (active) setError(e.message || copy("rsvp.text25"));
          })
          .finally(() => {
            if (active) setBusy(false);
          });
      }
    };
    window.addEventListener("hashchange", syncHash);
    queueMicrotask(syncHash);
    return () => {
      active = false;
      window.removeEventListener("hashchange", syncHash);
    };
  }, [slug]);

  async function doLookup(targetCode?: string) {
    const raw = (targetCode ?? code).trim();
    if (!isValidTokenOrCode(raw)) {setError(copy("rsvp.text26")); return;}
    const token = normalizeTokenOrCode(raw);
    setBusy(true);
    setError("");
    setSaved(false);
    setInvite(null);
    try {
      const response = await fetch("/api/rsvp/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wedding-slug":slug },
        body: JSON.stringify({ token }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(response.status === 404 ? copy("rsvp.text27") : response.status === 400 ? copy("rsvp.text28") : result.error);
      setCode(token);
      window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search + "#" + token);
      setInvite(result.invitation);
      setSettings(result.settings);
      setClosed(
        !result.settings.enabled ||
          (!!result.settings.deadline &&
            Date.now() > Date.parse(result.settings.deadline)),
      );
    } catch (e) {
      setError((e as Error).message || copy("rsvp.text25"));
    } finally {
      setBusy(false);
    }
  }

  async function lookup(event: React.FormEvent) {
    event.preventDefault();
    await doLookup();
  }
  function updateGuest(id: string, patch: Partial<PublicInvite["guests"][number]>) {
    setSaved(false);
    setInvite(current => current ? {...current, guests: current.guests.map(g => g.id === id ? {...g, ...patch} : g)} : current);
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!invite) return;
    if (invite.guests.some(g => g.status === "pendente")) {setError(copy("rsvp.text29")); return;}
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wedding-slug":slug },
        body: JSON.stringify({
          token: normalizeTokenOrCode(code),
          revision: invite.revision,
          responses: invite.guests.map((g) => ({ id: g.id, status: g.status, ...(modules.messages?{message:g.message}:{}),...(modules.dietaryRestrictions?{dietaryRestrictions:g.dietaryRestrictions}:{}) })),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setInvite({
        ...invite,
        revision: result.revision,
        respondedAt: new Date().toISOString(),
      });
      setSaved(true);
      notify.success("Resposta salva!", "Sua resposta foi registrada com carinho.");
      if (invite.guests.some((g) => g.status === "confirmado"))
        confetti({
          particleCount: 80,
          spread: 65,
          colors: romance
            ? ["#722F37", "#D2B9BD", "#82656C", "#ffffff"]
            : ["#C7B79D", "#5D613C", "#80654E"],
        });
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : copy("rsvp.text30"),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      id="rsvp"
      className="rsvp-section relative overflow-hidden bg-none! px-6 py-20 text-[var(--forever-ink,#3D2501)]"
    >
      <WeddingOrnaments variant="vows" tone="paper" />
      <div className={romance?"rsvp-shell relative z-10 mx-auto max-w-4xl space-y-10 sm:space-y-12":"rsvp-shell relative z-10 mx-auto max-w-2xl space-y-8"}>
        <div className="text-center">
          {!romance&&<span className="rsvp-emblem"><EnvelopeOpenIcon size={30} weight="duotone" aria-hidden="true" /></span>}<p className="cinema-eyebrow">{copy("rsvp.text1")}</p>
          <h2 className="font-serif text-5xl sm:text-7xl">{copy("rsvp.text2")}<em className="text-[var(--forever-primary,#5D613C)]">{copy("rsvp.text3")}</em>
          </h2>
          <p className={(romance?"mx-auto max-w-xl leading-7 ":"")+"mt-5 text-[var(--forever-accent,#80654E)]"}>{copy("rsvp.text4")}</p>
        </div>
        <div className={(romance?"rsvp-card rounded-3xl border border-[var(--forever-primary,#722F37)]/15 bg-white/80 p-7 sm:p-10 shadow-[0_20px_50px_rgba(50,21,28,0.06)] backdrop-blur-md [&_.guest-input]:rounded-xl! [&_.guest-button]:rounded-full! [&_.guest-button]:text-white! [&_.rsvp-person]:rounded-2xl! [&_.rsvp-person]:border-[var(--forever-primary,#722F37)]/15! [&_.rsvp-person]:bg-white/60!":"rsvp-card rounded-[var(--wedding-radius)] border border-[#e3dccf] bg-[#fffdfa] p-7 sm:p-10 shadow-[0_15px_60px_#3d250107]") + (invite ? " mx-auto max-w-2xl" : " mx-auto max-w-lg")}>
          {!invite && (
            <form onSubmit={lookup} className="space-y-6"><RequiredFieldsNotice/>
              <div className="text-center space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-[0.2em] text-[var(--forever-primary,#722F37)] font-semibold">
                  {copy("rsvp.text6")}<RequiredMark/>
                </label>
                <p className="text-xs text-[var(--forever-accent,#82656C)]">
                  Digite os 6 dígitos do código que você recebeu
                </p>
              </div>
              <RSVPCodeInput
                value={code}
                onChange={(val) => {
                  setCode(val);
                  if (error) setError("");
                }}
                onSubmit={(ready) => {
                  void doLookup(ready);
                }}
                disabled={busy}
                hasError={!!error}
              />
              <div className="flex justify-center pt-2">
                <button
                  type="submit"
                  className={
                    romance
                      ? "inline-flex min-h-[48px] w-full max-w-[280px] items-center justify-center gap-2.5 rounded-full bg-[var(--forever-primary,#722F37)] px-7 py-3 text-xs uppercase tracking-[0.18em] font-medium text-white shadow-sm transition-all hover:bg-[var(--forever-primary-hover,#5B252C)] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
                      : "inline-flex min-h-[48px] w-full max-w-[280px] items-center justify-center gap-2.5 rounded-[var(--wedding-radius)] bg-[#5D613C] px-7 py-3 font-mono text-xs uppercase tracking-[0.14em] font-semibold text-[#fffdfa] shadow-xs transition-all hover:bg-[#4b4f30] hover:shadow-sm active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
                  }
                  disabled={busy || code.replace(/[^A-Za-z0-9]/g, "").length < 6}
                >
                  {busy ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      <span>Consultando…</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span>{copy("rsvp.text31")}</span>
                      <ArrowRightIcon className="minimal-action-arrow-right" size={14} weight="bold" />
                    </span>
                  )}
                </button>
              </div>
            </form>
          )}
          {busy && !invite && <div className="rsvp-loading" role="status"><span className="wedding-skeleton" /><span className="wedding-skeleton" /><p>{copy("rsvp.text8")}</p></div>}
          {error && (
            <p
              role="alert"
              id="rsvp-error"
              className="mt-5 rounded-xl bg-rose-50 p-4 text-rose-800"
            >
              {error}
            </p>
          )}
          {saved && (
            <p
              role="status"
              className="mt-5 mb-6 rounded-xl bg-green-50 p-4 text-green-800"
            >
              <CheckCircleIcon size={22} className="inline mr-2" aria-hidden="true" />{copy("rsvp.text9")}</p>
          )}
          {invite && (
            <form onSubmit={submit} className="rsvp-response space-y-6"><RequiredFieldsNotice/>
              <div>
                <button type="button" className={romance ? "rsvp-change text-[var(--forever-primary,#722F37)] font-medium hover:opacity-80" : "rsvp-change"} disabled={busy} onClick={() => {setInvite(null);setCode("");setSaved(false);setError("");if (window.location.hash) window.history.replaceState(null,"",window.location.pathname + window.location.search);}}>{copy("rsvp.text10")}</button><p className={romance ? "rsvp-card-eyebrow text-[var(--forever-accent,#82656C)]" : "rsvp-card-eyebrow"}><UsersIcon size={16} aria-hidden="true" />{copy("rsvp.text11")}</p><h3 className={romance ? "font-sans font-normal text-[var(--forever-primary,#722F37)]" : "font-sans font-normal"}>{invite.label}</h3>
                {settings.deadline && (
                  <p className={romance ? "mt-2 text-sm text-[var(--forever-accent,#82656C)]" : "mt-2 text-sm"}>{copy("rsvp.text12")}{" "}
                    {new Date(settings.deadline).toLocaleString("pt-BR", {
                      timeZone: "America/Sao_Paulo",
                    })}{" "}{copy("rsvp.text13")}</p>
                )}
              </div>
              {closed ? (
                <p role="status">{copy("rsvp.text14")}</p>
              ) : (
                <fieldset disabled={busy} className="space-y-5">
                  {invite.guests.map((g) => (
                    <details key={g.id} className={romance ? "rsvp-guest-accordion border-b border-[var(--forever-primary,#722F37)]/15 py-1" : "rsvp-guest-accordion"} open={invite.guests.length === 1 ? true : undefined}>
                      <summary className={romance ? "cursor-pointer list-none text-[var(--forever-primary,#722F37)] font-sans font-normal text-xl" : undefined}><span>{g.name}</span><span className="rsvp-guest-summary-status"><AttendanceBadge status={g.status} label={g.status === "confirmado" ? copy("rsvp.text32") : g.status === "recusado" ? copy("rsvp.text33") : copy("rsvp.text34")} /><CaretDownIcon className="rsvp-accordion-caret" size={18} aria-hidden="true" /></span></summary>
                      <div className={romance ? "rsvp-guest-accordion-fields pt-3 pb-6 [&_label>span]:text-[var(--forever-accent,#82656C)]" : "rsvp-guest-accordion-fields"}>
                        <label className="flex flex-col gap-3">
                          <span>{copy("rsvp.text15")}<RequiredMark/></span>
                          <WeddingSelect required label={copy("rsvp.text35") + g.name} disabled={busy} placeholder={copy("rsvp.text16")} value={g.status === "pendente" ? "" : g.status} onValueChange={value => updateGuest(g.id, {status: value as Attendance})} options={[{value:"confirmado",label:copy("rsvp.text36")},{value:"recusado",label:copy("rsvp.text37")}]} />
                        </label>
                        {modules.dietaryRestrictions&&<label className="flex flex-col gap-3">
                          <span>{copy("rsvp.text17")}</span>
                          <textarea className={romance ? "guest-input border-[var(--forever-primary,#722F37)]/25 bg-white/90 text-[var(--forever-ink,#302329)] placeholder:text-[var(--forever-accent,#82656C)]/60 focus-visible:outline-[var(--forever-primary,#722F37)]!" : "guest-input"} maxLength={500} rows={3} placeholder={copy("rsvp.text18")} value={g.dietaryRestrictions} onChange={e => updateGuest(g.id, {dietaryRestrictions: e.target.value})} />
                        </label>}
                        {modules.messages&&<label className="flex flex-col gap-3">
                          <span>{copy("rsvp.text19")}</span>
                          <textarea className={romance ? "guest-input border-[var(--forever-primary,#722F37)]/25 bg-white/90 text-[var(--forever-ink,#302329)] placeholder:text-[var(--forever-accent,#82656C)]/60 focus-visible:outline-[var(--forever-primary,#722F37)]!" : "guest-input"} maxLength={500} rows={3} placeholder={copy("rsvp.text20")} value={g.message} onChange={e => updateGuest(g.id, {message: e.target.value})} />
                        </label>}
                      </div>
                    </details>
                  ))}
                  {(!invite.personal && ((modules.messages&&invite.message) || (modules.dietaryRestrictions&&invite.dietaryRestrictions))) && <div className={romance ? "text-sm space-y-2 text-[var(--forever-accent,#82656C)]" : "text-sm space-y-2"}><p>{copy("rsvp.text21")}</p>{modules.dietaryRestrictions&&invite.dietaryRestrictions && <p>{copy("rsvp.text22")}{invite.dietaryRestrictions}</p>}{modules.messages&&invite.message && <p>{copy("rsvp.text23")}{invite.message}</p>}</div>}
                  <div className="pt-2 flex justify-center">
                    <button
                      type="submit"
                      className={
                        romance
                          ? "inline-flex min-h-[48px] w-full max-w-sm items-center justify-center gap-2.5 rounded-full bg-[var(--forever-primary,#722F37)] px-7 py-3 text-xs uppercase tracking-[0.18em] font-medium text-white shadow-sm transition-all hover:bg-[var(--forever-primary-hover,#5B252C)] hover:shadow-md cursor-pointer disabled:opacity-50"
                          : "guest-button w-full max-w-sm"
                      }
                      disabled={busy}
                    >
                      <PaperPlaneTiltIcon size={18} aria-hidden="true" />{busy ? "Salvando…" : copy("rsvp.text38")}
                    </button>
                  </div>
                </fieldset>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
