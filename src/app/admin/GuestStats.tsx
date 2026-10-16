import { AdminStatCard } from "./AdminStatCard";
import { UsersIcon, HeartIcon, ClockIcon, UserMinusIcon } from "@phosphor-icons/react";
import type { Guest } from "@/types/guests";

export function GuestStats({ guests, loading = false }: { guests: Guest[]; loading?: boolean }) {
  const stats = [
    { label: "Convidados ativos", count: guests.length, icon: UsersIcon, primary: true },
    {
      label: "Confirmados",
      count: guests.filter((g) => g.status === "confirmado").length,
      icon: HeartIcon,
    },
    {
      label: "Pendentes",
      count: guests.filter((g) => g.status === "pendente").length,
      icon: ClockIcon,
    },
    {
      label: "Não comparecerão",
      count: guests.filter((g) => g.status === "recusado").length,
      icon: UserMinusIcon,
    },
  ];
  return (
    <div
      className="grid w-full grid-cols-2 gap-3 sm:gap-4"
      aria-label={loading ? "Carregando resumo de convidados" : "Resumo da lista de convidados"}
      aria-busy={loading}
    >
      {stats.map(({ label, count, icon: Icon, primary }) => (
        <AdminStatCard
          key={label}
          label={label}
          value={count}
          icon={<Icon weight="duotone" />}
          primary={primary}
          caption="pessoas na nossa lista"
          loading={loading}
        />
      ))}
    </div>
  );
}
