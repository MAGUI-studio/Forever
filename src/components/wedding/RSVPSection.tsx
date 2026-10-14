"use client";
import {useSiteCopy} from "./useSiteCopy";
import {useWedding} from "./WeddingProvider";
import { AttendanceBadge } from "@/components/ui/AttendanceBadge";
import { useEffect, useState } from "react";
import { EnvelopeOpenIcon, CheckCircleIcon, PaperPlaneTiltIcon, UsersIcon, CaretDownIcon } from "@phosphor-icons/react";
import { WeddingSelect } from "@/components/ui/WeddingSelect";
import confetti from "canvas-confetti";
import { WeddingOrnaments } from "./WeddingOrnaments";
import {romanceAssets} from "@/config/templates/romance-assets";
import {resolveTemplateImage} from "@/lib/template-images";
import {RomancePhoto} from "./templates/RomanceMotion";
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
 const rsvpImage=resolveTemplateImage(config,"contemporary-romance","rsvp");
 const romance=templateId==="contemporary-romance";
  const [code, setCode] = useState("");
  const [invite, setInvite] = useState<PublicInvite | null>(null);
  const [settings, setSettings] = useState<RSVPSettings>({
    enabled: true,
    deadline: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    let active = true;
    const syncHash = () => {
      const raw = window.location.hash.slice(1).trim();
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
      if (invite.guests.some((g) => g.status === "confirmado"))
        confetti({
          particleCount: 80,
          spread: 65,
          colors: ["#C7B79D", "#5D613C", "#80654E"],
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
      <div className={romance?"rsvp-shell relative z-10 w-full max-w-none! space-y-10 sm:space-y-12":"rsvp-shell relative z-10 mx-auto max-w-2xl space-y-8"}>
        <div className="text-center">
          {romance&&<div className="relative mb-14"><RomancePhoto src={rsvpImage} className="aspect-[2/1] rounded-t-[3rem] sm:aspect-[3/1] sm:rounded-t-[5rem]" sizes="100vw"/><span aria-hidden="true" className="absolute -bottom-7 left-1/2 flex size-16 -translate-x-1/2 items-center justify-center rounded-full border-[6px] border-[var(--forever-paper)] bg-[var(--forever-primary)] text-white"><EnvelopeOpenIcon size={25} weight="thin"/></span></div>}
          {!romance&&<span className="rsvp-emblem"><EnvelopeOpenIcon size={30} weight="duotone" aria-hidden="true" /></span>}<p className="cinema-eyebrow">{copy("rsvp.text1")}</p>
          <h2 className="font-serif text-5xl sm:text-7xl">{copy("rsvp.text2")}<em className="text-[var(--forever-primary,#5D613C)]">{copy("rsvp.text3")}</em>
          </h2>
          <p className={(romance?"mx-auto max-w-xl leading-7 ":"")+"mt-5 text-[var(--forever-accent,#80654E)]"}>{copy("rsvp.text4")}</p>
          {!invite && !busy && <p className="mt-5 text-[var(--forever-accent,#80654E)]">{copy("rsvp.text5")}</p>}
        </div>
        <div className={romance?"rsvp-card w-full rounded-2xl! border-0! bg-transparent! p-6! shadow-none! sm:p-8! [&_.guest-input]:rounded-xl! [&_.guest-button]:rounded-xl! [&_.guest-button]:text-white! [&_.rsvp-person]:rounded-xl! [&_.rsvp-person]:border-[var(--forever-primary)]/20! [&_.rsvp-person]:bg-transparent!":"rsvp-card"}>
          {!invite && (
            <form onSubmit={lookup} className="space-y-6">
              <div className="text-center">
                <label className="block text-sm font-medium text-[var(--forever-ink,#3D2501)]">
                  {copy("rsvp.text6")}
                </label>
                <p className="mt-1 text-xs text-[var(--forever-accent,#80654E)]">
                  Digite os 6 dígitos do código que você recebeu (ex: A6V-CDF)
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
                autoFocus
              />
              <button
                type="submit"
                className="guest-button w-full cursor-pointer transition-all hover:opacity-95 disabled:opacity-50"
                disabled={busy || code.replace(/[^A-Za-z0-9]/g, "").length < 6}
              >
                {busy ? "Consultando convite…" : copy("rsvp.text31")}
              </button>
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
            <form onSubmit={submit} className="rsvp-response space-y-6">
              <div>
                <button type="button" className="rsvp-change" disabled={busy} onClick={() => {setInvite(null);setCode("");setSaved(false);setError("");if (window.location.hash) window.history.replaceState(null,"",window.location.pathname + window.location.search);}}>{copy("rsvp.text10")}</button><p className="rsvp-card-eyebrow"><UsersIcon size={16} aria-hidden="true" />{copy("rsvp.text11")}</p><h3 className="font-serif text-3xl">{invite.label}</h3>
                {settings.deadline && (
                  <p className="mt-2 text-sm">{copy("rsvp.text12")}{" "}
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
                    <details key={g.id} className="rsvp-guest-accordion" open={invite.guests.length === 1 ? true : undefined}>
                      <summary><span>{g.name}</span><span className="rsvp-guest-summary-status"><AttendanceBadge status={g.status} label={g.status === "confirmado" ? copy("rsvp.text32") : g.status === "recusado" ? copy("rsvp.text33") : copy("rsvp.text34")} /><CaretDownIcon className="rsvp-accordion-caret" size={18} aria-hidden="true" /></span></summary>
                      <div className="rsvp-guest-accordion-fields">
                        <label className="flex flex-col gap-3">
                          <span>{copy("rsvp.text15")}</span>
                          <WeddingSelect label={copy("rsvp.text35") + g.name} disabled={busy} placeholder={copy("rsvp.text16")} value={g.status === "pendente" ? "" : g.status} onValueChange={value => updateGuest(g.id, {status: value as Attendance})} options={[{value:"confirmado",label:copy("rsvp.text36")},{value:"recusado",label:copy("rsvp.text37")}]} />
                        </label>
                        {modules.dietaryRestrictions&&<label className="flex flex-col gap-3">
                          <span>{copy("rsvp.text17")}</span>
                          <textarea className="guest-input" maxLength={500} rows={3} placeholder={copy("rsvp.text18")} value={g.dietaryRestrictions} onChange={e => updateGuest(g.id, {dietaryRestrictions: e.target.value})} />
                        </label>}
                        {modules.messages&&<label className="flex flex-col gap-3">
                          <span>{copy("rsvp.text19")}</span>
                          <textarea className="guest-input" maxLength={500} rows={3} placeholder={copy("rsvp.text20")} value={g.message} onChange={e => updateGuest(g.id, {message: e.target.value})} />
                        </label>}
                      </div>
                    </details>
                  ))}
                  {(!invite.personal && ((modules.messages&&invite.message) || (modules.dietaryRestrictions&&invite.dietaryRestrictions))) && <div className="text-sm space-y-2"><p>{copy("rsvp.text21")}</p>{modules.dietaryRestrictions&&invite.dietaryRestrictions && <p>{copy("rsvp.text22")}{invite.dietaryRestrictions}</p>}{modules.messages&&invite.message && <p>{copy("rsvp.text23")}{invite.message}</p>}</div>}
                  <button className="guest-button w-full" disabled={busy}>
                    <PaperPlaneTiltIcon size={18} aria-hidden="true" />{busy ? "Salvando…" : copy("rsvp.text38")}
                  </button>
                </fieldset>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
