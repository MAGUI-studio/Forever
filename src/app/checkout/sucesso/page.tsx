import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Heart, ArrowRight, ShieldCheck, Mail, Sparkles } from "lucide-react";
import { getStripe } from "@/lib/stripe";
import { PLAN_PRICING } from "@/config/pricing";

export const metadata: Metadata = {
  title: "Pagamento Confirmado · Forever",
  description: "Seu pagamento foi aprovado com sucesso no Forever.",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const { session_id } = await searchParams;

  let customerEmail: string | null = null;
  let customerName: string | null = null;
  let planKey: "essencial" | "foreverPro" = "foreverPro";
  let amountPaid = 0;

  if (session_id) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(session_id);
      customerEmail = session.customer_details?.email || null;
      customerName = session.customer_details?.name || null;
      if (session.metadata?.plan === "essencial") {
        planKey = "essencial";
      }
      amountPaid = session.amount_total ? session.amount_total / 100 : 0;
    } catch {
      // Graceful fallback if session retrieval is unavailable
    }
  }

  const planInfo = PLAN_PRICING[planKey];

  return (
    <main className="min-h-screen bg-[#FBF9F5] text-[#161616] antialiased selection:bg-[#722F37] selection:text-white flex flex-col justify-between">
      {/* Top branding */}
      <header className="border-b border-[#16161612] bg-[#FBF9F5]/80 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-serif text-2xl font-light tracking-[-0.04em] text-[#161616] transition-opacity hover:opacity-80"
          >
            <span>Forever</span>
            <span className="font-sans text-[10px] font-semibold uppercase tracking-widest text-[#722F37] rounded-full bg-[#722F3715] px-2 py-0.5">
              Casamentos
            </span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-[#8C877F]">
            <ShieldCheck size={14} className="text-[#5D613C]" />
            <span>Pagamento Seguro</span>
          </div>
        </div>
      </header>

      {/* Main card */}
      <div className="my-auto px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-xl">
          <div className="rounded-3xl border border-[#16161615] bg-white p-8 sm:p-10 shadow-xl shadow-[#16161608] text-center">
            {/* Success icon */}
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-[#5D613C15] text-[#5D613C]">
              <CheckCircle2 size={36} strokeWidth={2} />
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#722F3730] bg-[#722F370d] px-3 py-1 text-xs font-medium text-[#722F37]">
              <Heart size={12} className="fill-[#722F37]" />
              Pagamento Aprovado
            </span>

            <h1 className="mt-4 font-serif text-3xl sm:text-4xl font-light tracking-tight text-[#161616]">
              Parabéns! Seu plano foi ativado com sucesso.
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-[#6B6760]">
              {customerName ? `Obrigado, ${customerName}! ` : "Obrigado! "}
              Sua celebração agora conta com a estrutura exclusiva do{" "}
              <strong className="text-[#161616] font-semibold">{planInfo.name}</strong>.
            </p>

            {/* Plan card summary */}
            <div className="mt-8 rounded-2xl border border-[#16161610] bg-[#FBF9F5] p-5 text-left">
              <div className="flex items-center justify-between border-b border-[#16161610] pb-3">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-[#8C877F]">Plano contratado</span>
                  <h2 className="text-base font-semibold text-[#161616] flex items-center gap-1.5">
                    {planInfo.name}
                    {planKey === "foreverPro" && <Heart size={13} className="fill-[#722F37] text-[#722F37]" />}
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-[11px] uppercase tracking-wider text-[#8C877F]">Valor</span>
                  <p className="font-serif text-lg text-[#161616]">
                    {amountPaid > 0 ? `R$ ${amountPaid.toFixed(2).replace(".", ",")}` : planInfo.formattedPrice}
                  </p>
                </div>
              </div>

              <div className="pt-3 text-xs text-[#6B6760] space-y-1.5">
                <p className="flex items-center gap-2">
                  <Sparkles size={13} className="text-[#722F37] shrink-0" />
                  <span>{planInfo.headline}</span>
                </p>
                {customerEmail && (
                  <p className="flex items-center gap-2">
                    <Mail size={13} className="text-[#8C877F] shrink-0" />
                    <span>Recibo enviado para: <strong>{customerEmail}</strong></span>
                  </p>
                )}
              </div>
            </div>

            {/* Next steps list */}
            <div className="mt-8 text-left space-y-3">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-[#8C877F]">Próximos passos</h3>
              <div className="flex items-start gap-3 rounded-xl border border-[#1616160c] p-3.5 text-xs text-[#161616]">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#722F3715] font-semibold text-[#722F37]">1</span>
                <div>
                  <strong>Acesse seu painel</strong>
                  <p className="text-[#6B6760] mt-0.5">Faça login com o e-mail cadastrado para começar a personalizar o site dos seus sonhos.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-[#1616160c] p-3.5 text-xs text-[#161616]">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#722F3715] font-semibold text-[#722F37]">2</span>
                <div>
                  <strong>Personalize e publique</strong>
                  <p className="text-[#6B6760] mt-0.5">Cadastre o casal, horários da cerimônia, lista de presentes e convidados.</p>
                </div>
              </div>
            </div>

            {/* CTA action buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/login"
                className="group inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#722F37] px-6 text-sm font-medium text-white shadow-md shadow-[#722F3720] transition-all hover:bg-[#5b242b]"
              >
                <span>Acessar Meu Painel</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/"
                className="inline-flex h-12 items-center justify-center rounded-full border border-[#16161620] bg-white px-6 text-sm font-medium text-[#161616] transition-colors hover:bg-[#16161606]"
              >
                Página Inicial
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#16161610] py-6 text-center text-xs text-[#8C877F]">
        <p>© {new Date().getFullYear()} Forever · Uma criação MAGUI.studio · Processado com segurança via Stripe</p>
      </footer>
    </main>
  );
}
