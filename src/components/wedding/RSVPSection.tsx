"use client";
import {useWedding} from "./WeddingProvider";
import { AttendanceBadge } from "@/components/ui/AttendanceBadge";
import { useEffect, useState } from "react";
import { EnvelopeOpenIcon, CheckCircleIcon, PaperPlaneTiltIcon, UsersIcon, CaretDownIcon } from "@phosphor-icons/react";
import { WeddingSelect } from "@/components/ui/WeddingSelect";
import confetti from "canvas-confetti";
import { WeddingOrnaments } from "./WeddingOrnaments";
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
 const {slug}=useWedding();
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
      const value = window.location.hash.slice(1);
      if (/^(?:[a-f0-9]{48}|[a-f0-9]{64}\.[a-f0-9-]{36}\.[a-f0-9]{64})$/.test(value)) {
        setCode(value); setBusy(true); setError("");
        fetch("/api/rsvp/lookup", {method:"POST",headers:{"Content-Type":"application/json","x-wedding-slug":slug},body:JSON.stringify({token:value})}).then(async response => { const result = await response.json(); if (!response.ok) throw new Error(result.error); if (!active) return; setInvite(result.invitation);setSettings(result.settings);setClosed(!result.settings.enabled || (!!result.settings.deadline && Date.now() > Date.parse(result.settings.deadline))); }).catch(e => {if(active) setError(e.message || "Não foi possível consultar o convite.");}).finally(() => {if(active) setBusy(false);});
      }
    };
    window.addEventListener("hashchange", syncHash);
    queueMicrotask(syncHash);
    return () => { active = false; window.removeEventListener("hashchange", syncHash); };
  }, []);

  async function lookup(event: React.FormEvent) {
    event.preventDefault();
    const token = code.trim().toLowerCase();
    if (!/^(?:[a-f0-9]{48}|[a-f0-9]{64}\.[a-f0-9-]{36}\.[a-f0-9]{64})$/.test(token)) {setError("Esse código parece incompleto ou inválido. Copie o código completo do convite enviado por os noivos, sem espaços, ou abra o link que você recebeu."); return;}
    setBusy(true);
    setError("");
    setSaved(false);
    setInvite(null);
    try {
      const response = await fetch("/api/rsvp/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wedding-slug":slug },
        body: JSON.stringify({ token: code.trim().toLowerCase() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(response.status === 404 ? "Não encontramos um convite ativo com esse código. Confira se você copiou o código completo ou use o link recebido. Se continuar sem conseguir, fale com os noivos." : response.status === 400 ? "Não foi possível reconhecer esse código. Copie o código completo do convite ou abra o link enviado pelos noivos." : result.error);
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
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível consultar o convite.",
      );
    } finally {
      setBusy(false);
    }
  }
  function updateGuest(id: string, patch: Partial<PublicInvite["guests"][number]>) {
    setSaved(false);
    setInvite(current => current ? {...current, guests: current.guests.map(g => g.id === id ? {...g, ...patch} : g)} : current);
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!invite) return;
    if (invite.guests.some(g => g.status === "pendente")) {setError("Escolha uma resposta para cada pessoa do convite."); return;}
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wedding-slug":slug },
        body: JSON.stringify({
          token: code.trim().toLowerCase(),
          revision: invite.revision,
          responses: invite.guests.map((g) => ({ id: g.id, status: g.status, message: g.message, dietaryRestrictions: g.dietaryRestrictions })),
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
          : "Não foi possível salvar. Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      id="rsvp"
      className="rsvp-section relative overflow-hidden px-6 py-20 text-[var(--forever-ink,#3D2501)]"
    >
      <WeddingOrnaments variant="vows" tone="paper" />
      <div className="rsvp-shell relative z-10 mx-auto max-w-2xl space-y-8">
        <div className="text-center">
          <span className="rsvp-emblem"><EnvelopeOpenIcon size={30} weight="duotone" aria-hidden="true" /></span><p className="cinema-eyebrow">Um lugar especial para você</p>
          <h2 className="font-serif text-5xl sm:text-7xl">
            Confirmação de <em className="text-[var(--forever-primary,#5D613C)]">presença</em>
          </h2>
          <p className="mt-5 text-[var(--forever-accent,#80654E)]">
            Que alegria ter você fazendo parte da nossa história! Estamos
            preparando esse dia com muito carinho e esperamos celebrar ao seu lado.
          </p>
          {!invite && !busy && <p className="mt-5 text-[var(--forever-accent,#80654E)]">
            Informe o código enviado com o convite.
          </p>}
        </div>
        <div className="rsvp-card">
          {!invite && <form onSubmit={lookup} className="space-y-4">
            <label className="block text-sm" htmlFor="invite-code">
              Código do convite
            </label>
            <input
              id="invite-code"
              aria-invalid={!!error}
              aria-describedby={error ? "rsvp-error" : undefined}
              autoComplete="off"
              required
              maxLength={166}
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setInvite(null);
                setSaved(false);
              }}
              className="guest-input"
              disabled={busy}
              placeholder="Cole aqui o código do seu convite"
            />
            <button className="guest-button w-full" disabled={busy}>
              {busy ? "Aguarde…" : "Consultar convite"}
            </button>
          </form>}
          {busy && !invite && <div className="rsvp-loading" role="status"><span className="wedding-skeleton" /><span className="wedding-skeleton" /><p>Preparando seu convite…</p></div>}
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
              <CheckCircleIcon size={22} className="inline mr-2" aria-hidden="true" />Resposta salva! Obrigado pelo carinho. Você pode revisar sua
              resposta até o encerramento das confirmações.
            </p>
          )}
          {invite && (
            <form onSubmit={submit} className="rsvp-response space-y-6">
              <div>
                <button type="button" className="rsvp-change" disabled={busy} onClick={() => {setInvite(null);setCode("");setSaved(false);setError("");if (/^(?:[a-f0-9]{48}|[a-f0-9]{64}\.[a-f0-9-]{36}\.[a-f0-9]{64})$/.test(window.location.hash.slice(1))) window.history.replaceState(null,"",window.location.pathname + window.location.search);}}>Consultar outro convite</button><p className="rsvp-card-eyebrow"><UsersIcon size={16} aria-hidden="true" /> Seu convite</p><h3 className="font-serif text-3xl">{invite.label}</h3>
                {settings.deadline && (
                  <p className="mt-2 text-sm">
                    Prazo:{" "}
                    {new Date(settings.deadline).toLocaleString("pt-BR", {
                      timeZone: "America/Sao_Paulo",
                    })}{" "}
                    (Brasília).
                  </p>
                )}
              </div>
              {closed ? (
                <p role="status">
                  As confirmações estão encerradas. Para alterações, fale com os
                  noivos.
                </p>
              ) : (
                <fieldset disabled={busy} className="space-y-5">
                  {invite.guests.map((g) => (
                    <details key={g.id} className="rsvp-guest-accordion" open={invite.guests.length === 1 ? true : undefined}>
                      <summary><span>{g.name}</span><span className="rsvp-guest-summary-status"><AttendanceBadge status={g.status} label={g.status === "confirmado" ? "Presença confirmada" : g.status === "recusado" ? "Não comparecerá" : "Aguardando resposta"} /><CaretDownIcon className="rsvp-accordion-caret" size={18} aria-hidden="true" /></span></summary>
                      <div className="rsvp-guest-accordion-fields">
                        <label className="flex flex-col gap-3">
                          <span>Confirmação de presença</span>
                          <WeddingSelect label={"Presença de " + g.name} disabled={busy} placeholder="Selecione uma resposta" value={g.status === "pendente" ? "" : g.status} onValueChange={value => updateGuest(g.id, {status: value as Attendance})} options={[{value:"confirmado",label:"Vou comparecer"},{value:"recusado",label:"Não poderei comparecer"}]} />
                        </label>
                        <label className="flex flex-col gap-3">
                          <span>Restrições alimentares (opcional)</span>
                          <textarea className="guest-input" maxLength={500} rows={3} placeholder="Ex.: alergia a amendoim, intolerância à lactose ou alimentação vegetariana." value={g.dietaryRestrictions} onChange={e => updateGuest(g.id, {dietaryRestrictions: e.target.value})} />
                        </label>
                        <label className="flex flex-col gap-3">
                          <span>Recado aos noivos (opcional)</span>
                          <textarea className="guest-input" maxLength={500} rows={3} placeholder="Deixe uma mensagem carinhosa para os noivos…" value={g.message} onChange={e => updateGuest(g.id, {message: e.target.value})} />
                        </label>
                      </div>
                    </details>
                  ))}
                  {(!invite.personal && (invite.message || invite.dietaryRestrictions)) && <div className="text-sm space-y-2"><p>Informações anteriores do grupo</p>{invite.dietaryRestrictions && <p>Restrições: {invite.dietaryRestrictions}</p>}{invite.message && <p>Recado: {invite.message}</p>}</div>}
                  <button className="guest-button w-full" disabled={busy}>
                    <PaperPlaneTiltIcon size={18} aria-hidden="true" />{busy ? "Salvando…" : "Salvar respostas"}
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
