import { Suspense } from "react";
import { PurchaseFlow } from "./PurchaseFlow";
export const metadata = {
  title: "Contratar plano | Forever",
  robots: { index: false, follow: false },
};
export default function PurchasePage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm">Preparando sua contratação…</p>}>
      <PurchaseFlow />
    </Suspense>
  );
}
