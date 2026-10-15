import type { WeddingPlan } from "./forever";

type PlanAccess = { plan?: WeddingPlan | null; config?: { couple?: { weddingDate?: string } } };

/** Access includes the entire final calendar day in São Paulo. */
export function planAccessEndsAt(wedding: PlanAccess): Date | null {
  const raw = wedding.config?.couple?.weddingDate;
  if (!raw || Number.isNaN(Date.parse(raw))) return null;
  const calendar = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : new Intl.DateTimeFormat("en-CA", {timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(raw));
  const [year,month,day] = calendar.split("-").map(Number);
  const offset = wedding.plan === "essencial" ? 0 : 3;
  const target = new Date(Date.UTC(year,month-1+offset,1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(),target.getUTCMonth()+1,0)).getUTCDate();
  return new Date(Date.UTC(target.getUTCFullYear(),target.getUTCMonth(),Math.min(day,lastDay)+1,3));
}

export function isPlanExpired(wedding: PlanAccess, now = new Date()): boolean {
  const endsAt = planAccessEndsAt(wedding);
  return !!endsAt && now.getTime() >= endsAt.getTime();
}

export const PRO_SUPPORT_URL = "https://wa.me/5512981847553?text=" + encodeURIComponent("Olá! Sou cliente Forever PRO e preciso de ajuda com meu casamento.");
