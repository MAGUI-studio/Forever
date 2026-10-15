"use client";
import { foreverTheme } from "@/config/brand";
import { WeddingOrnaments } from "@/components/wedding/WeddingOrnaments";
import { WeddingSelect } from "@/components/ui/WeddingSelect";
import { useRef, useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Baby,
  CalendarDays,
  Check,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
  Users,
  X,
} from "lucide-react";
import type { Guest, Invitation, RSVPSettings } from "@/types/guests";
import type { AdminModalName } from "./modal-state";
export type InviteDraft = Pick<Invitation, "kind" | "label" | "active" | "guests">;
const labels = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  recusado: "Não comparecerá",
};
const emptyGuest = (): Guest => ({
  id: crypto.randomUUID(),
  name: "",
  child: false,
  status: "pendente",
  checkedIn: false,
});
function Modal({
  title,
  description,
  children,
  busy,
  onClose,
  danger = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  busy: boolean;
  onClose: () => void;
  danger?: boolean;
}) {
  const content = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="admin-modal-overlay" />
        <Dialog.Content
          ref={content}
          style={foreverTheme}
          className={
            "admin-wedding admin-modal isolate overflow-hidden! [&>form]:relative [&>form]:z-10" +
            (danger ? " admin-modal--compact" : "")
          }
          onEscapeKeyDown={(event) => {
            if (busy) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (busy) event.preventDefault();
          }}
          onOpenAutoFocus={(event) => {
            opener.current = document.activeElement as HTMLElement;
            const first = content.current?.querySelector<HTMLElement>(
              "[data-modal-autofocus]",
            );
            if (first) {
              event.preventDefault();
              first.focus();
            }
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const target = opener.current?.isConnected
              ? opener.current
              : document.querySelector<HTMLElement>(
                  ".admin-toolbar .guest-button",
                );
            target?.focus();
          }}
        >
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-40" aria-hidden="true"><WeddingOrnaments variant="floral" tone="paper" /></div>
          <header className="admin-modal-heading z-10">

            <div>
              <p className="admin-eyebrow">
                {danger
                  ? "Cuidado com a nossa lista"
                  : "Cada detalhe, com carinho"}
              </p>
              <Dialog.Title asChild>
                <h2>{title}</h2>
              </Dialog.Title>
              <Dialog.Description className="admin-modal-description">
                {description}
              </Dialog.Description>
            </div>
            <Dialog.Close
              disabled={busy}
              className="admin-modal-close"
              aria-label="Fechar modal"
            >
              <X size={20} strokeWidth={1.4} />
            </Dialog.Close>
          </header>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
function RequiredMark() {
  return <span className="inline! text-red-600!" aria-hidden="true">*</span>;
}

function ErrorMessage({ error }: { error: string }) {
  return error ? (
    <p role="alert" className="admin-alert admin-alert--error">
      {error}
    </p>
  ) : null;
}
export function InvitationForm({
  initial,
  guestLimit = Infinity,
  otherGuestCount = 0,
  busy,
  error,
  onClose,
  onSave,
}: {
  initial?: Invitation;
  guestLimit?: number;
  otherGuestCount?: number;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSave: (draft: InviteDraft, original?: Invitation) => void;
}) {
  // Capture the revision with the draft so a concurrent update cannot silently overwrite it.
  const [original] = useState(initial);
  const [kind, setKind] = useState<"individual" | "group">(initial?.kind ?? (initial?.guests.length === 1 ? "individual" : "group"));
  const [label, setLabel] = useState(initial?.label ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [guests, setGuests] = useState<Guest[]>(() =>
    initial ? initial.guests.map((g) => ({ ...g })) : [emptyGuest()],
  );
  function change(id: string, patch: Partial<Guest>) {
    setGuests((current) =>
      current.map((g) =>
        g.id === id
          ? {
              ...g,
              ...patch,
              checkedIn:
                patch.status && patch.status !== "confirmado"
                  ? false
                  : (patch.checkedIn ?? g.checkedIn),
            }
          : g,
      ),
    );
  }
  const totalGuests = otherGuestCount + guests.length;
  const limitApplies = !original || active;
  const limitReached = limitApplies && totalGuests >= guestLimit;
  const overLimit = limitApplies && totalGuests > guestLimit;
  return (
    <form
      className="admin-modal-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (overLimit) return;
        onSave({ kind, label: kind === "individual" ? guests[0].name : label, active, guests }, original);
      }}
    >
      <div className="admin-modal-body">
        <fieldset disabled={busy} className="admin-modal-fields">
          <ErrorMessage error={error} />
          {overLimit && <p role="alert" className="text-sm text-rose-700">O Forever Essencial permite até {guestLimit} convidados no evento, somando todos os convites ativos.</p>}
          <p className="text-xs text-[var(--forever-accent,#77736c)]">Todos os campos marcados com <RequiredMark /> são obrigatórios.</p>
          <section className="admin-form-section">
            <p className="admin-form-kicker">01 · O convite</p>
<div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2">
<label className="admin-modal-field"><span>Tipo de convite <RequiredMark /></span><WeddingSelect label="Tipo de convite" value={kind} onValueChange={value => setKind(value as "individual" | "group")} options={[{value:"individual",label:"Individual — uma pessoa"},{value:"group",label:"Família ou grupo"}]} /></label>

            {kind === "group" && <label className="admin-modal-field">
              <span>
                Nome da família ou grupo <RequiredMark />
              </span>
              <input
                data-modal-autofocus
                autoComplete="off"
                required
                minLength={2}
                maxLength={100}
                className="guest-input"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                placeholder="Ex.: Família Oliveira ou Amigos do trabalho"
              />
            </label>}
</div>
{kind === "individual" && guests.length > 1 && <p className="admin-form-help">Selecione Família ou grupo e remova as outras pessoas antes de mudar para individual.</p>}
            <label className="admin-invitation-toggle">
              <span>
                <strong>Convite ativo</strong>
                <small>
                  Permite que os convidados consultem e respondam ao convite.
                </small>
              </span>
              <input
                type="checkbox"
                role="switch"
                className="sr-only!"
                checked={active}
                onChange={(event) => setActive(event.target.checked)}
              />
              <span className="admin-switch-track" aria-hidden="true" />
            </label>
          </section>
          <section className="admin-form-section">
            <div className="admin-people-heading">
              <div>
                <p className="admin-form-kicker">02 · Quem vai receber</p>
                <h3>Pessoas do convite</h3>
              </div>
              <span className="admin-people-count">
                <Users size={13} aria-hidden="true" />
                {guests.length} {guests.length === 1 ? "pessoa" : "pessoas"}
              </span>
            </div>
            <p className="admin-form-help">
              Inclua cada pessoa pelo nome, inclusive crianças e acompanhantes
              autorizados.
            </p>
            <div className="admin-guest-cards">
              {guests.map((guest, index) => (
                <div key={guest.id} className="admin-guest-card">
                  <div className="admin-guest-card-heading">
                    <span>
                      <i>{String(index + 1).padStart(2, "0")}</i>{" "}
                      {guest.name.trim() || "Nova pessoa"}
                    </span>
                    {kind === "group" && guests.length > 1 && <button
                      type="button"
                      className="admin-remove-person"
                      aria-label={
                        "Remover " +
                        (guest.name.trim() || "pessoa " + (index + 1))
                      }
                      onClick={() =>
                        setGuests((current) =>
                          current.filter((g) => g.id !== guest.id),
                        )
                      }
                    >
                      <Trash2 size={15} strokeWidth={1.4} />
                      <span>Remover</span>
                    </button>}
                  </div>
                  <div className="admin-guest-fields">
                    <label className="admin-modal-field">
                      <span>Nome completo <RequiredMark /></span>
                      <input
                        className="guest-input"
                        required
                        minLength={2}
                        maxLength={100}
                        value={guest.name}
                        onChange={(event) =>
                          change(guest.id, { name: event.target.value })
                        }
                        placeholder="Nome e sobrenome"
                        autoComplete="off"
                      />
                    </label>
                    <label className="admin-modal-field">
                      <span>Confirmação de presença</span>
                      <WeddingSelect label="Confirmação de presença" disabled={busy} value={guest.status} onValueChange={(value) => change(guest.id, {status: value as Guest["status"]})} options={Object.entries(labels).filter(([value]) => initial || value !== "recusado").map(([value,label]) => ({value,label}))} />
                    </label>
                  </div>
                  <div className="admin-guest-options">
                    <label className="relative flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-[var(--wedding-radius)] border border-neutral-200 bg-white px-4 py-3 text-[#161616] transition-colors hover:bg-neutral-50 has-[:checked]:border-[#722F37] has-[:checked]:bg-[#722F370d] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--forever-primary,#722F37)]">
                      <Baby size={22} strokeWidth={1.5} className="shrink-0 text-neutral-500" aria-hidden="true" />
                      <span className="flex-1 text-xs font-medium">Este convidado é uma criança</span>
                      <input type="checkbox" role="switch" className="peer sr-only!" checked={guest.child} onChange={event => change(guest.id, {child:event.target.checked})} />
                      <span aria-hidden="true" className="relative h-6 w-10 shrink-0 rounded-full bg-neutral-300 transition-colors duration-200 after:absolute after:top-1 after:left-1 after:size-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:duration-200 peer-checked:bg-[var(--forever-primary,#722F37)] peer-checked:after:translate-x-4" />
                    </label>

                  </div>
                </div>
              ))}
            {kind === "group" && <button
              type="button"
              className="admin-add-person"
              disabled={limitReached}
              onClick={() => setGuests((current) => [...current, emptyGuest()])}
            >
              <Plus size={17} aria-hidden="true" />
              Adicionar pessoa ao convite<span>{Number.isFinite(guestLimit) ? `${totalGuests}/${guestLimit} no evento` : `${guests.length} ${guests.length === 1 ? "pessoa" : "pessoas"}`}</span>
            </button>}
            </div>
          </section>
        </fieldset>
      </div>
      <footer className="admin-modal-footer">
        <span className="admin-save-hint">
          <Save size={14} aria-hidden="true" />
          Alterações aplicadas ao salvar.
        </span>
        <button
          type="button"
          className="guest-secondary"
          disabled={busy}
          onClick={onClose}
        >
          Cancelar
        </button>
        <button className="guest-button" disabled={busy || overLimit}>
          {busy ? (
            <LoaderCircle
              size={15}
              className="admin-refresh-busy"
              aria-hidden="true"
            />
          ) : (
            <Check size={15} aria-hidden="true" />
          )}
          {busy ? "Salvando…" : "Salvar convite"}
        </button>
      </footer>
    </form>
  );
}
function SettingsForm({
  initial,
  busy,
  error,
  onClose,
  onSave,
}: {
  initial: RSVPSettings;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSave: (settings: RSVPSettings) => void;
}) {
  const [settings, setSettings] = useState({ ...initial });
  return (
    <form
      className="admin-modal-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(settings);
      }}
    >
      <div className="admin-modal-body">
        <fieldset disabled={busy} className="admin-modal-fields">
          <ErrorMessage error={error} />
          <label className="admin-invitation-toggle">
            <span>
              <strong>Aceitar confirmações</strong>
              <small>Desative para encerrar o recebimento de respostas.</small>
            </span>
            <input
              data-modal-autofocus
              type="checkbox"
              checked={settings.enabled}
              onChange={(event) =>
                setSettings({ ...settings, enabled: event.target.checked })
              }
            />
            <span className="admin-switch-track" aria-hidden="true" />
          </label>
          <label className="admin-modal-field">
            <span>
              <CalendarDays size={14} aria-hidden="true" />
              Prazo para responder
            </span>
            <input
              type="datetime-local"
              className="guest-input"
              value={
                settings.deadline
                  ? new Date(
                      Date.parse(settings.deadline) -
                        new Date(settings.deadline).getTimezoneOffset() * 60000,
                    )
                      .toISOString()
                      .slice(0, 16)
                  : ""
              }
              onChange={(event) =>
                setSettings({
                  ...settings,
                  deadline: event.target.value
                    ? new Date(event.target.value).toISOString()
                    : "",
                })
              }
            />
          </label>
          <p className="admin-form-help">
            Horário do seu dispositivo. Deixe vazio para não definir prazo.
            Vocês podem corrigir respostas pelo painel mesmo depois do
            encerramento.
          </p>
        </fieldset>
      </div>
      <footer className="admin-modal-footer">
        <button
          type="button"
          className="guest-secondary"
          disabled={busy}
          onClick={onClose}
        >
          Cancelar
        </button>
        <button className="guest-button" disabled={busy}>
          {busy ? "Salvando…" : "Salvar configurações"}
        </button>
      </footer>
    </form>
  );
}
export function AdminModals({
  modal,
  selected,
  settings,
  busy,
  error,
  onClose,
  onSave,
  onSettings,
  onDelete,
}: {
  modal: AdminModalName;
  selected?: Invitation;
  settings: RSVPSettings;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSave: (draft: InviteDraft, original?: Invitation) => void;
  onSettings: (settings: RSVPSettings) => void;
  onDelete: (invite: Invitation) => void;
}) {
  const missing =
    (modal === "edit-invitation" || modal === "delete-invitation") && !selected;
  const title = missing
    ? "Convite indisponível"
    : modal === "new-invitation"
      ? "Novo convite"
      : modal === "edit-invitation"
        ? "Editar convite"
        : modal === "settings"
          ? "Confirmações de presença"
          : "Excluir convite?";
  const description = missing
    ? "O convite deste link não existe mais ou o endereço está incompleto."
    : modal === "settings"
      ? "Defina quando as pessoas podem responder ao nosso convite."
      : modal === "delete-invitation"
        ? "Esta ação remove o convite e todas as respostas da família."
        : "Crie um convite individual ou organize uma família ou grupo.";
  return (
    <Modal
      title={title}
      description={description}
      busy={busy}
      onClose={onClose}
      danger={modal === "delete-invitation"}
    >
      {missing ? (
        <div className="admin-modal-body">
          <p className="admin-form-help">
            Feche esta janela e escolha um convite na lista atualizada.
          </p>
          <button className="guest-secondary" onClick={onClose}>
            Voltar à lista
          </button>
        </div>
      ) : modal === "settings" ? (
        <SettingsForm
          initial={settings}
          busy={busy}
          error={error}
          onClose={onClose}
          onSave={onSettings}
        />
      ) : modal === "delete-invitation" && selected ? (
        <>
          <div className="admin-modal-body">
            <ErrorMessage error={error} />
            <div className="admin-delete-summary">
              <strong>{selected.label}</strong>
              <span>
                {selected.guests.length}{" "}
                {selected.guests.length === 1
                  ? "pessoa incluída"
                  : "pessoas incluídas"}
              </span>
            </div>
            <p className="admin-form-help">
              Para preservar as informações, você pode desativar o convite em
              Editar. A exclusão é definitiva.
            </p>
          </div>
          <footer className="admin-modal-footer">
            <button
              data-modal-autofocus
              className="guest-secondary"
              disabled={busy}
              onClick={onClose}
            >
              Manter convite
            </button>
            <button
              className="guest-button admin-danger-button"
              disabled={busy}
              onClick={() => onDelete(selected)}
            >
              <Trash2 size={14} aria-hidden="true" />
              {busy ? "Excluindo…" : "Excluir definitivamente"}
            </button>
          </footer>
        </>
      ) : (
        <InvitationForm
          initial={selected}
          busy={busy}
          error={error}
          onClose={onClose}
          onSave={onSave}
        />
      )}
    </Modal>
  );
}
