import type { User } from "firebase/auth";
import type { WeddingPlan } from "@/config/forever";
import { readApiResponse } from "./api-response";

export type AuthDestination = {
  destination: string;
  slug?: string;
  role: string;
  plan: WeddingPlan | null;
};

export async function resolveAuthDestination(account: User): Promise<AuthDestination> {
  try {
    const token = await account.getIdToken();
    const response = await fetch("/api/auth/destination", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = await readApiResponse(response, { redirectOnPlanRequired: false });
    if (typeof data.destination !== "string" || !/^\/(?!\/)/.test(data.destination)) {
      throw new Error("Não foi possível identificar o destino da sua conta.");
    }
    return data;
  } catch (error) {
    if ((error as { code?: string }).code === "PLAN_REQUIRED") {
      return { destination: "/contratar?reason=sem-plano", role: "customer", plan: null };
    }
    throw error;
  }
}
