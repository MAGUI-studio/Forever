import "server-only";
import type Stripe from "stripe";
import { services } from "@/lib/firebase/admin";

export async function handlePaymentSuccess(session: Stripe.Checkout.Session) {
  if (
    session.status !== "complete" ||
    !["paid", "no_payment_required"].includes(session.payment_status)
  )
    return false;
  const metadata = session.metadata || {};
  const action = metadata.action || "new";
  const plan = metadata.plan || "foreverPro";
  const weddingSlug = metadata.weddingSlug;
  const now = new Date().toISOString();

  const { db } = services();

  return db.runTransaction(async (transaction) => {
    const orderRef = db.doc(`orders/${session.id}`);
    const order = await transaction.get(orderRef);
    if (order.data()?.fulfilledAt) return true;
    if (action === "new") {
      if (
        !weddingSlug ||
        !metadata.ownerUid ||
        !metadata.purchaseAttempt ||
        !["essencial", "foreverPro"].includes(plan)
      )
        throw new Error("Compra sem vínculo válido com a conta e o casamento.");
      const weddingRef = db.doc(`weddings/${weddingSlug}`);
      const wedding = await transaction.get(weddingRef);
      const member = await transaction.get(weddingRef.collection("members").doc(metadata.ownerUid));
      if (!wedding.exists || !member.data()?.active || member.data()?.role !== "admin")
        throw new Error("Responsável da compra não autorizado.");
      if (wedding.data()?.status === "suspended" || wedding.data()?.status === "archived")
        throw new Error("Casamento suspenso ou arquivado exige revisão da compra.");
      if (wedding.data()?.plan === null) transaction.update(weddingRef, { plan, updatedAt: now });
      else if (wedding.data()?.plan !== plan)
        throw new Error("O plano foi alterado durante a compra. Revise o pedido.");
      transaction.set(weddingRef.collection("audit").doc(session.id), {
        action: "plan_purchased",
        to: plan,
        actorUid: metadata.ownerUid,
        stripeSessionId: session.id,
        amountTotal: session.amount_total,
        currency: session.currency,
        createdAt: now,
      });
    }
    if (action === "upgrade") {
      if (!weddingSlug || plan !== "foreverPro")
        throw new Error("Upgrade sem casamento ou plano válido.");
      const weddingRef = db.doc(`weddings/${weddingSlug}`);
      const wedding = await transaction.get(weddingRef);
      if (!wedding.exists) throw new Error("Casamento do upgrade não encontrado.");
      transaction.update(weddingRef, { plan: "foreverPro", updatedAt: now });
      transaction.set(weddingRef.collection("audit").doc(session.id), {
        action: "plan_upgraded",
        from: wedding.data()?.plan ?? null,
        to: "foreverPro",
        stripeSessionId: session.id,
        amountTotal: session.amount_total,
        currency: session.currency,
        createdAt: now,
      });
    }

    transaction.set(
      orderRef,
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
