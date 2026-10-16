"use client";
export default function WeddingError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[60svh] max-w-lg flex-col items-center justify-center gap-5 px-6 text-center">
      <h1 className="font-serif text-4xl">Não foi possível carregar este espaço</h1>
      <p className="text-sm text-[#80654E]">Tente novamente em alguns instantes.</p>
      <button
        onClick={reset}
        className="rounded-2xl bg-[#5D613C] px-6 py-3 text-white hover:bg-[#4b4f30]"
      >
        Tentar novamente
      </button>
    </main>
  );
}
