"use client";

import Link from 'next/link';
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { WeddingOrnaments } from "./WeddingOrnaments";
import {useWedding} from "./WeddingProvider";
import { formatCurrency } from "@/lib/utils";
import { GiftItem } from "@/types/wedding";
import { PixModal } from "./PixModal";
import { Search, ArrowUpRight } from "lucide-react";

export function GiftList({ preview = false }: { preview?: boolean }) {
  const {config:weddingConfig,path}=useWedding();
  const { gifts } = weddingConfig;

  const [selectedCategory, setSelectedCategory] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
  const [customAmountModal, setCustomAmountModal] = useState<boolean>(false);
  const [customValue, setCustomValue] = useState<string>("");

  const categories = [
    { id: "todos", label: "Todos os Presentes" },
    ...Array.from(new Set(gifts.map(gift => gift.category))).map(category => ({ id: category, label: category })),
  ];

  const filteredGifts = useMemo(() => {
    return gifts.filter((item) => {
      const matchesCategory =
        selectedCategory === "todos" || item.category === selectedCategory;
      const matchesSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description ?? "").toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [gifts, selectedCategory, searchTerm]);

  const visibleGifts = preview ? gifts.slice(0, 6) : filteredGifts;

  return (
    <section
      id="presentes"
      className="cinematic-section relative overflow-hidden w-full py-16 sm:py-24 px-6 sm:px-12 lg:px-20 bg-[#F1F1F1] text-[#3D2501]"
    >
      <WeddingOrnaments variant="hearts" tone="paper" />
      <div className="relative z-10 max-w-7xl mx-auto space-y-12 sm:space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-5">
          {!preview && <Link href={path()} className="inline-flex text-xs text-[#80654E] hover:text-[#3D2501] transition-colors">← Voltar ao início</Link>}
          <p data-cinema-copy className="cinema-eyebrow text-[#5D613C]">Um gesto de carinho</p>
          <h2 className="font-serif text-5xl sm:text-7xl font-light tracking-[-0.04em] leading-[1.08]">Lista de <span className="italic">presentes</span></h2>
          <p data-cinema-copy className="font-serif italic text-xl sm:text-2xl text-[#80654E]">Sua presença é o nosso maior presente.</p>
          <p data-cinema-copy className="text-sm sm:text-base text-[#80654E] font-light leading-[1.8] max-w-2xl mx-auto">Para quem desejar nos presentear, preparamos esta lista com carinho.</p>
        </div>

        {!preview && <>
        {/* Filtros e Busca em Barra Linear */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6">
          {/* Categorias em Texto com Underline */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`text-xs px-4 py-2.5 rounded-full transition-colors relative ${
                    isActive
                      ? "bg-[#5D613C] text-white font-medium"
                      : "bg-[#C7B79D]/15 text-[#80654E] hover:bg-[#C7B79D]/30"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Campo de Busca Minimalista */}
          <div className="relative w-full md:w-64 bg-white/70 rounded-full px-4 py-3 ring-1 ring-[#3D2501]/10 focus-within:ring-[#5D613C] transition-colors">
            <Search className="w-3.5 h-3.5 text-[#80654E] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar presentes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-6 text-sm bg-transparent text-[#3D2501] placeholder-[#80654E]/70 focus:outline-none"
            />
          </div>
        </div>

        {/* Cota Aberta Personalizada (Linha Minimalista) */}
        <div className="py-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#5D613C] block font-semibold">
              UM PRESENTE NO SEU VALOR
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-light text-[#3D2501]">
              Deseja presentear com outro valor?
            </h3>
            <p className="text-xs sm:text-sm text-[#80654E] font-light">
              Escolha uma quantia livre de sua preferência para contribuir via PIX ou Cartão de Crédito.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center focus-within:border-[#5D613C] pb-1">
              <span className="font-mono text-sm text-[#80654E] mr-2">R$</span>
              <input
                type="number"
                min="10" aria-label="Valor do presente em reais"
                step="0.01"
                placeholder="150"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                className="guest-input wedding-amount-input"
              />
            </div>
            <button
              onClick={() => {
                setSelectedGift(null);
                if (Number.isFinite(Number(customValue)) && Number(customValue) >= 10) setCustomAmountModal(true);
              }}
              disabled={!Number.isFinite(Number(customValue)) || Number(customValue) < 10} className="disabled:opacity-40 disabled:cursor-not-allowed px-6 py-2.5 text-xs font-mono uppercase tracking-[0.2em] bg-[#3D2501] text-[#F5F5DA] hover:bg-[#80654E] transition-colors rounded-full font-medium"
            >
              Presentear
            </button>
          </div>
        </div>

        </>}
        {/* Catálogo de Presentes */}
        {visibleGifts.length === 0 ? (
          <div className="py-20 text-center ">
            <p className="font-serif text-xl font-light text-[#80654E]">
              Nenhum item encontrado para esta busca.
            </p>
          </div>
        ) : (
          <div className={preview ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-12" : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 sm:gap-12"}>
            {visibleGifts.map((gift, index) => (
              <motion.div
                key={gift.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: (index % 4) * 0.1 }}
                className="cinema-gift group flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
            {!preview && <Link href={path()} className="inline-flex text-xs text-[#80654E] hover:text-[#3D2501] transition-colors">← Voltar ao início</Link>}
                  {/* Foto com Zoom Suave */}
                  <div className="relative rounded-t-[3.5rem] rounded-b-2xl aspect-[4/3] overflow-hidden bg-[#C7B79D]/15">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={gift.image}
                      alt={gift.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  </div>

                  {/* Categoria & Título */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-[#5D613C] block font-semibold">
                      {gift.categoryLabel}
                    </span>
                    <h4 className="font-serif text-xl sm:text-2xl font-light text-[#3D2501] line-clamp-2 group-hover:text-[#5D613C] transition-colors">
                      {gift.title}
                    </h4>
                    <p className="text-xs text-[#80654E] font-light line-clamp-2 leading-relaxed">
                      {gift.description}
                    </p>
                  </div>
                </div>

                {/* Preço e Botão */}
                <div className="pt-3 flex items-baseline justify-between">
                  <span className="font-serif text-xl font-light text-[#80654E]">
                    {gift.price ? formatCurrency(gift.price) : "Em breve"}
                  </span>

                  <button
                    onClick={() => {
                      setCustomAmountModal(false);
                      if (gift.price) setSelectedGift(gift);
                    }}
                    disabled={!gift.price} className="disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1 text-xs font-mono uppercase tracking-[0.15em] text-[#5D613C] hover:text-[#3D2501] font-semibold transition-colors group/btn"
                  >
                    <span>Presentear</span>
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {preview && (
          <div className="flex justify-center">
            <Link href={path("presentes")} className="cinema-button bg-[#3D2501] text-[#F1F1F1] hover:bg-[#5D613C] gap-3">
              Ver todos os presentes <ArrowUpRight size={18} />
            </Link>
          </div>
        )}
        {/* Modal PIX */}
        {(selectedGift || customAmountModal) && (
          <PixModal
            gift={selectedGift}
            customAmount={customAmountModal ? Number(customValue) : undefined}
            onClose={() => {
              setSelectedGift(null);
              setCustomAmountModal(false);
            }}
          />
        )}
      </div>
    </section>
  );
}
