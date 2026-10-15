import "server-only";
import type Stripe from "stripe";
import { services } from "@/lib/firebase/admin";

export async function handlePaymentSuccess(session: Stripe.Checkout.Session) {
  if (session.status !== "complete" || !["paid", "no_payment_required"].includes(session.payment_status)) return false;
  const metadata = session.metadata || {};
  const action = metadata.action || "new";
  const plan = metadata.plan || "foreverPro";
  const weddingSlug = metadata.weddingSlug;
  const now = new Date().toISOString();

  const { db } = services();

  return db.runTransaction(async transaction => {
    const orderRef = db.doc(`orders/${session.id}`);
    const order = await transaction.get(orderRef);
    if (order.data()?.fulfilledAt) return true;
    if (action === "upgrade") {
      if (!weddingSlug || plan !== "foreverPro") throw new Error("Upgrade sem casamento ou plano válido.");
      const weddingRef = db.doc(`weddings/${weddingSlug}`);
      const wedding = await transaction.get(weddingRef);
      if (!wedding.exists) throw new Error("Casamento do upgrade não encontrado.");
      transaction.update(weddingRef, {plan:"foreverPro",updatedAt:now});
      transaction.set(weddingRef.collection("audit").doc(session.id), {
        action:"plan_upgraded",from:wedding.data()?.plan ?? null,to:"foreverPro",
        stripeSessionId:session.id,amountTotal:session.amount_total,currency:session.currency,createdAt:now,
      });
    }
  // 2. Persist order record in orders collection
  transaction.set(orderRef,
    {
      fulfilledAt: now,
      sessionId: session.id,
      plan,
      action,
      weddingSlug: weddingSlug || null,
      amountTotal: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_details?.email || metadata.customerEmail || null,
      customerName: session.customer_details?.name || null,
      paymentStatus: session.payment_status,
      createdAt: now,
      updatedAt: now,
    },
    { merge: true },
  );
    return true;
  });
}
