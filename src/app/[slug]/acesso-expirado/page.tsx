import Link from "next/link";
import { Clock, ArrowUpRight } from "lucide-react";
import { findWedding } from "@/lib/wedding-server";
import { isPlanExpired, PRO_SUPPORT_URL } from "@/config/plan-access";
import { notFound, redirect } from "next/navigation";

export const metadata = {
  title: "Acesso expirado | Forever",
  robots: { index: false, follow: false },
};
export default async function ExpiredAccess({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const wedding = await findWedding(slug);
  if (!wedding) notFound();
  if (!isPlanExpired(wedding)) redirect(`/${slug}/painel`);
  return (
    <main className="flex min-h-svh items-center justify-center bg-neutral-100 px-5 py-12">
      <section className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-7 shadow-sm sm:p-10">
        <Clock size={32} className="text-[#722F37]" aria-hidden="true" />
        <p className="mt-5 text-xs uppercase tracking-wider text-neutral-500">
          Forever · Sua história continua
        </p>
        <h1 className="mt-3 font-serif text-3xl text-neutral-900">
          O prazo do seu plano terminou.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-neutral-600">
          Você pode continuar entrando na sua conta. O acesso às páginas de gestão e às alterações
          está encerrado, e o site público está indisponível.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">
          Seus dados foram preservados. Entre em contato para conversar sobre o acesso ao seu
          casamento.
        </p>
        {wedding.plan === "foreverPro" && (
          <a
            href={PRO_SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#722F37] px-4 py-3 text-sm text-white"
          >
            Falar com o suporte PRO
            <ArrowUpRight size={16} />
          </a>
        )}
        <Link
          href="/login"
          className="mt-5 block text-sm text-neutral-500 underline underline-offset-4"
        >
          Voltar para minha conta
        </Link>
      </section>
    </main>
  );
}
