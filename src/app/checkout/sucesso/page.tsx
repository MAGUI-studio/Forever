import { Suspense } from "react";
import { PurchaseFlow } from "@/app/contratar/PurchaseFlow";
export const metadata={title:"Confirmação de pagamento | Forever",robots:{index:false,follow:false}};
export default function CheckoutSuccessPage(){return <Suspense fallback={<p className="p-8 text-sm">Consultando seu pagamento…</p>}><PurchaseFlow confirmation /></Suspense>;}
