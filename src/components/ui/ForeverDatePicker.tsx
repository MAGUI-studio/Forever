"use client";

import { useId, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { WeddingSelect } from "./WeddingSelect";

const dateKey = (date: Date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
const parse = (value: string) => new Date(value + "T12:00:00Z");
const monthName = (month: Date) =>
  month.toLocaleDateString("pt-BR", { month: "long", timeZone: "UTC" });

export function ForeverDatePicker({
  value,
  onChange,
  label = "Data",
  min,
  disabled = false,
  required = false,
  time,
  onTimeChange,
}: {
  time?: string;
  onTimeChange?: (value: string) => void;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  min?: string;
  disabled?: boolean;
  required?: boolean;
}) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const initial = value || min || today;
  const [open, setOpen] = useState(false),
    [month, setMonth] = useState(() => parse(initial)),
    [focused, setFocused] = useState(initial);
  const calendar = useRef<HTMLDivElement>(null),
    titleId = useId();
  const year = month.getUTCFullYear(),
    index = month.getUTCMonth();
  const count = new Date(Date.UTC(year, index + 1, 0)).getUTCDate(),
    offset = new Date(Date.UTC(year, index, 1)).getUTCDay();
  const monthPrefix = `${year}-${String(index + 1).padStart(2, "0")}-`;
  const focusKey = focused.startsWith(monthPrefix)
    ? focused
    : min?.startsWith(monthPrefix)
      ? min
      : monthPrefix + "01";
  const minimumYear = parse(min || today).getUTCFullYear();
  const years = Array.from({ length: Math.max(31, year - minimumYear + 1) }, (_, n) => ({
    value: String(minimumYear + n),
    label: String(minimumYear + n),
  }));
  function choose(key: string) {
    onChange(key);
    setFocused(key);
    if (!onTimeChange) setOpen(false);
  }
  function moveFocus(key: string, days: number) {
    const next = parse(key);
    next.setUTCDate(next.getUTCDate() + days);
    const target = dateKey(next);
    if (min && target < min) return;
    setMonth(next);
    setFocused(target);
    requestAnimationFrame(() =>
      calendar.current?.querySelector<HTMLButtonElement>(`[data-date="${target}"]`)?.focus(),
    );
  }
  return (
    <div className="relative mt-2">
      <Dialog.Root
        modal={false}
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) {
            setMonth(parse(value || min || today));
            setFocused(value || min || today);
          }
        }}
      >
        <Dialog.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            aria-label={`${label}${required ? " (obrigatório)" : ""}${value ? ": " + parse(value).toLocaleDateString("pt-BR", { timeZone: "UTC" }) + (time ? " às " + time : "") : ""}`}
            className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 text-left text-sm font-normal text-neutral-900 outline-none transition-shadow hover:border-neutral-300 focus-visible:border-[#722F37] focus-visible:ring-3 focus-visible:ring-[#722F3710] disabled:opacity-50"
          >
            <CalendarDays size={18} className="shrink-0 text-neutral-500" aria-hidden="true" />
            <span className={`flex-1 ${value ? "text-neutral-900" : "text-neutral-400"}`}>
              {value
                ? parse(value).toLocaleDateString("pt-BR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    timeZone: "UTC",
                  })
                : "Escolha a data do grande dia"}
              {value && time && <span className="ml-2 text-neutral-900">às {time}</span>}
            </span>
            <ChevronRight
              size={15}
              className={`text-neutral-400 transition-transform ${open ? "rotate-90" : ""}`}
              aria-hidden="true"
            />
          </button>
        </Dialog.Trigger>
        <Dialog.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            calendar.current?.querySelector<HTMLButtonElement>(`[data-date="${focused}"]`)?.focus();
          }}
          className="absolute left-0 top-full z-50 mt-2 w-[min(320px,100%)] rounded-2xl border border-neutral-200 bg-white p-4 text-neutral-900 shadow-xl outline-none"
        >
          <Dialog.Title className="sr-only">
            Escolher {label.toLocaleLowerCase("pt-BR")}
          </Dialog.Title>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={!!min && year === minimumYear && index <= parse(min).getUTCMonth()}
              aria-label="Mês anterior"
              onClick={() => setMonth(new Date(Date.UTC(year, index - 1, 1, 12)))}
              className="grid size-8 place-items-center rounded-lg text-neutral-500 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-[#722F37] disabled:opacity-25"
            >
              <ChevronLeft size={17} />
            </button>
            <p id={titleId} aria-live="polite" className="text-sm font-semibold capitalize">
              {monthName(month)} {year}
            </p>
            <button
              type="button"
              aria-label="Próximo mês"
              onClick={() => setMonth(new Date(Date.UTC(year, index + 1, 1, 12)))}
              className="grid size-8 place-items-center rounded-lg text-neutral-500 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-[#722F37]"
            >
              <ChevronRight size={17} />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <WeddingSelect
              label="Escolher mês"
              value={String(index)}
              onValueChange={(next) => setMonth(new Date(Date.UTC(year, Number(next), 1, 12)))}
              options={Array.from({ length: 12 }, (_, n) => ({
                value: String(n),
                label: monthName(new Date(Date.UTC(year, n, 1, 12))),
              }))}
            />
            <WeddingSelect
              label="Escolher ano"
              value={String(year)}
              onValueChange={(next) => setMonth(new Date(Date.UTC(Number(next), index, 1, 12)))}
              options={years}
            />
          </div>
          <div ref={calendar} className="mt-4" role="group" aria-labelledby={titleId}>
            <div
              className="grid grid-cols-7 text-center text-[10px] text-neutral-400"
              aria-hidden="true"
            >
              {["D", "S", "T", "Q", "Q", "S", "S"].map((day, n) => (
                <span key={n} className="pb-2">
                  {day}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: offset }, (_, n) => (
                <span key={`blank-${n}`} />
              ))}
              {Array.from({ length: count }, (_, n) => {
                const key = dateKey(new Date(Date.UTC(year, index, n + 1, 12)));
                return (
                  <button
                    key={key}
                    type="button"
                    data-date={key}
                    disabled={!!min && key < min}
                    tabIndex={key === focusKey ? 0 : -1}
                    aria-label={parse(key).toLocaleDateString("pt-BR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                    aria-pressed={key === value}
                    aria-current={key === today ? "date" : undefined}
                    onFocus={() => setFocused(key)}
                    onClick={() => choose(key)}
                    onKeyDown={(event) => {
                      const delta =
                        event.key === "ArrowLeft"
                          ? -1
                          : event.key === "ArrowRight"
                            ? 1
                            : event.key === "ArrowUp"
                              ? -7
                              : event.key === "ArrowDown"
                                ? 7
                                : event.key === "Home"
                                  ? -parse(key).getUTCDay()
                                  : event.key === "End"
                                    ? 6 - parse(key).getUTCDay()
                                    : null;
                      if (delta !== null) {
                        event.preventDefault();
                        moveFocus(key, delta);
                      }
                    }}
                    className={`grid aspect-square place-items-center rounded-lg text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#722F37] disabled:text-neutral-300 ${key === value ? "bg-[#722F37] font-semibold text-white" : key === today ? "bg-[#722F370a] font-semibold text-[#722F37] hover:bg-[#722F3715]" : "text-neutral-700 hover:bg-neutral-100"}`}
                  >
                    {n + 1}
                  </button>
                );
              })}
            </div>
          </div>
          {onTimeChange && (
            <div className="mt-4 border-t border-neutral-100 pt-4">
              <p className="mb-2 text-xs font-medium text-[#722F37]">Horário de Brasília</p>
              <div className="grid grid-cols-2 gap-2">
                <WeddingSelect
                  label="Hora da celebração"
                  value={time?.slice(0, 2) || "12"}
                  onValueChange={(hour) => onTimeChange(hour + ":" + (time?.slice(3, 5) || "00"))}
                  options={Array.from({ length: 24 }, (_, n) => ({
                    value: String(n).padStart(2, "0"),
                    label: String(n).padStart(2, "0") + " h",
                  }))}
                />
                <WeddingSelect
                  label="Minuto da celebração"
                  value={time?.slice(3, 5) || "00"}
                  onValueChange={(minute) =>
                    onTimeChange((time?.slice(0, 2) || "12") + ":" + minute)
                  }
                  options={Array.from({ length: 60 }, (_, n) => ({
                    value: String(n).padStart(2, "0"),
                    label: String(n).padStart(2, "0") + " min",
                  }))}
                />
              </div>
            </div>
          )}
          <div className="mt-3 flex justify-between border-t border-neutral-100 pt-3">
            <button
              type="button"
              disabled={!!min && today < min}
              onClick={() => choose(today)}
              className="rounded-lg px-2 py-1 text-xs text-[#722F37] hover:bg-neutral-50 disabled:opacity-40"
            >
              Hoje
            </button>
            <Dialog.Close className="rounded-lg px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-50">
              {onTimeChange ? "Concluir" : "Fechar"}
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  );
}
