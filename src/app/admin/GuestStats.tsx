import { UsersIcon, HeartIcon, ClockIcon, UserMinusIcon } from "@phosphor-icons/react";
import type { Guest } from "@/types/guests";

export function GuestStats({guests, loading = false}: {guests: Guest[]; loading?: boolean}) {
  const stats = [
    {label:"Convidados ativos", count:guests.length, icon:UsersIcon, primary:true},
    {label:"Confirmados", count:guests.filter(g => g.status === "confirmado").length, icon:HeartIcon},
    {label:"Pendentes", count:guests.filter(g => g.status === "pendente").length, icon:ClockIcon},
    {label:"Não comparecerão", count:guests.filter(g => g.status === "recusado").length, icon:UserMinusIcon},
  ];
  return <div className="grid w-full grid-cols-2 gap-3 sm:gap-4" aria-label={loading ? "Carregando resumo de convidados" : "Resumo da lista de convidados"} aria-busy={loading}>
    {stats.map(({label,count,icon:Icon,primary}) => <div key={label} className={"relative isolate flex min-h-36 flex-col justify-between overflow-hidden rounded-[var(--wedding-radius)] p-4 sm:min-h-40 sm:p-5 " + (primary ? "bg-[#5D613C] text-[#F5F5DA]" : "border border-[#5d613c20] bg-[#fffdfa] text-[#5D613C]")}>
      <Icon size={110} weight="duotone" aria-hidden="true" className="pointer-events-none absolute -right-4 -bottom-4 -z-10 -rotate-12 opacity-10" />
      <p className="text-xs sm:text-sm">{label}</p>
      <strong className="my-2 font-serif text-4xl font-normal leading-none sm:text-5xl">{loading ? <span className="inline-block h-[1em] w-[1ch] animate-pulse rounded bg-current opacity-15 motion-reduce:animate-none" /> : count}</strong>
      <span className="text-[10px] opacity-75 sm:text-xs">pessoas na nossa lista</span>
    </div>)}
  </div>;
}
