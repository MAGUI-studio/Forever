"use client";

import { useEffect, useState, Fragment, type ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUp, ArrowUpRight, Check, Heart, Loader2, Plus } from "lucide-react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";
import { readApiResponse } from "@/lib/api-response";
import { ForeverLogo } from "./ForeverLogo";
import { BotanicalClassicBranch, BotanicalClassicOrnaments } from "@/components/wedding/templates/BotanicalClassicOrnaments";
import { moduleCatalog, moduleKeys } from "@/config/modules";

const STUDIO_URL = "https://magui.studio";
const line = "border-[#16161612]";
const foreverProModules = new Set<string>(["checkIn", "tables", "buffet", "history", "team"]);

function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LinkedinIcon({ size = 16 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M5.4 7.5a2.1 2.1 0 1 0 0-4.2 2.1 2.1 0 0 0 0 4.2ZM3.6 9h3.6v12H3.6V9Zm5.9 0H13v1.6c.5-.9 1.6-1.9 3.6-1.9 3.8 0 4.5 2.4 4.5 5.5V21h-3.6v-6c0-1.4 0-3.1-1.9-3.1s-2.2 1.5-2.2 3V21H9.5V9Z" />
    </svg>
  );
}

function XIcon({ size = 14 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-7.4L5.5 22H2.3l7.2-8.4L.8 2h6.5l4.5 6.8L18.9 2Zm-1.1 18h1.7L6.3 3.9H4.5L17.8 20Z" />
    </svg>
  );
}

/* ---------- primitives ---------- */

function ForeverProHeartTooltip({ text = "Exclusivo do Forever PRO" }: { text?: string }) {
  return (
    <span className="group/tooltip relative inline-flex items-center" tabIndex={0} aria-label={text}>
      <span className="inline-flex cursor-help items-center justify-center p-0.5 text-[#722F37] transition-transform group-hover/tooltip:scale-125 focus:outline-none">
        <Heart size={14} className="fill-[#722F37] text-[#722F37]" />
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#722F37] px-2.5 py-1 text-[11px] font-medium text-white shadow-lg opacity-0 transition-all duration-200 group-hover/tooltip:opacity-100 group-hover/tooltip:translate-y-0 translate-y-1 group-focus-within/tooltip:opacity-100"
      >
        {text}
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[#722F37]"
        />
      </span>
    </span>
  );
}

function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-[#722F37]">{children}</p>;
}

function Accent({ children }: { children: ReactNode }) {
  return <em className="font-serif font-normal italic tracking-[-0.01em] text-[#722F37]">{children}</em>;
}

function PrimaryButton({ href, children, external = false }: { href: string; children: ReactNode; external?: boolean }) {
  const className =
    "group inline-flex h-12 items-center gap-3 rounded-full bg-[#722F37] pl-6 pr-2 text-sm font-medium text-white shadow-sm transition-all duration-300 hover:bg-[#5b242b] hover:shadow-lg hover:shadow-[#722F3725]";
  const content = (
    <>
      <span>{children}</span>
      <span className="grid size-8 place-items-center rounded-full bg-white/15 transition-colors duration-300 group-hover:bg-white/25">
        <ArrowUpRight size={15} className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
      </span>
    </>
  );
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {content}
    </a>
  ) : (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

function GhostButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex h-12 items-center gap-2 px-2 text-sm font-medium text-[#161616] transition-colors hover:text-[#722F37]"
    >
      <span>{children}</span>
      <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1.5" />
    </Link>
  );
}


/* ---------- hero preview ---------- */

function FloatingNote({ className, children, delay = 0 }: { className: string; children: ReactNode; delay?: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      aria-hidden="true"
      className={`absolute z-10 hidden items-center gap-2.5 rounded-full border ${line} bg-[#F1F1F1]/90 px-4 py-2.5 text-xs text-[#161616] shadow-[0_12px_40px_-16px_rgba(22,22,22,0.25)] backdrop-blur-md lg:flex ${className}`}
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={reduced ? undefined : { opacity: 1, y: [0, -6, 0] }}
      transition={{ opacity: { duration: 0.6, delay }, y: { duration: 7, repeat: Infinity, ease: "easeInOut", delay } }}
    >
      {children}
    </motion.div>
  );
}

function HeroPreview() {
  return (
    <div className="relative mx-auto mt-20 max-w-5xl sm:mt-24">
      {/* concentric hairlines */}
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 -z-0 -translate-x-1/2 -translate-y-1/2">
        <div className="size-[900px] rounded-full border border-[#722F370d]" />
        <div className="absolute inset-[110px] rounded-full border border-[#722F370d]" />
        <div className="absolute inset-[220px] rounded-full border border-[#722F370d]" />
      </div>

      <FloatingNote className="-left-8 -bottom-6" delay={0.6}>
        <span className="grid size-5 place-items-center rounded-full bg-[#722F37] text-white">
          <Check size={11} strokeWidth={3} />
        </span>
        Família Souza confirmou 4 presenças
      </FloatingNote>
      <FloatingNote className="-right-8 top-[12%]" delay={1.2}>
        <span className="size-1.5 rounded-full bg-[#2F7A4A]" />
        Convite aberto agora
      </FloatingNote>

      <div className={`relative rounded-[30px] border ${line} p-2`}>
        <div className={`overflow-hidden rounded-[24px] border ${line} bg-[#F1F1F1]`}>
          {/* browser bar */}
          <div className={`flex items-center gap-4 border-b ${line} px-5 py-3.5`}>
            <div className="flex gap-1.5" aria-hidden="true">
              <span className="size-2.5 rounded-full bg-[#722F37] transition-opacity hover:opacity-80" />
              <span className="size-2.5 rounded-full bg-[#C7B79D] transition-opacity hover:opacity-80" />
              <span className="size-2.5 rounded-full bg-[#5D613C] transition-opacity hover:opacity-80" />
            </div>
            <div className="mx-auto flex items-center gap-2 text-[11px] text-[#8C877F]">
              <span className="size-1 rounded-full bg-[#8C877F]" />
              forever.magui.studio/marina-e-lucas
            </div>
            <span className="w-10" />
          </div>

          {/* mini wedding site */}
          <div className="grid md:grid-cols-[1.15fr_1fr]">
            <div className="flex flex-col px-7 py-10 sm:px-12 sm:py-14">
              <div className="flex gap-5 text-[10px] uppercase tracking-[0.2em] text-[#8C877F]">
                <span>História</span>
                <span>Cerimônia</span>
                <span className="hidden sm:inline">Presentes</span>
                <span className="text-[#722F37]">RSVP</span>
              </div>
              <p className="mt-14 font-serif text-sm italic text-[#6B6760]">Vamos nos casar</p>
              <p className="mt-2 font-serif text-[clamp(44px,6vw,72px)] font-light leading-[0.95] tracking-[-0.02em] text-[#161616]">
                Marina <span className="italic text-[#722F37]">&</span>
                <br />
                Lucas
              </p>
              <p className="mt-5 text-xs tracking-[0.18em] text-[#6B6760] uppercase">12 · setembro · 2027</p>

              <div className={`mt-10 grid max-w-sm grid-cols-4 divide-x divide-[#16161612] border-y ${line}`}>
                {[
                  ["142", "dias"],
                  ["08", "horas"],
                  ["35", "min"],
                  ["12", "seg"],
                ].map(([value, label]) => (
                  <div key={label} className="py-3 text-center">
                    <span className="block font-serif text-2xl font-light text-[#161616]">{value}</span>
                    <span className="text-[9px] uppercase tracking-[0.2em] text-[#8C877F]">{label}</span>
                  </div>
                ))}
              </div>

              <span className="group mt-10 inline-flex w-fit items-center gap-2 rounded-full bg-[#722F37] px-5 py-2.5 text-xs font-medium text-white shadow-sm transition-all duration-300 hover:bg-[#5b242b]">
                <span>Confirmar presença</span>
                <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </div>

            <div className={`relative hidden items-center justify-center border-l ${line} p-10 md:flex`}>
              <div className="arch-frame relative flex h-[340px] w-[230px] items-end justify-center overflow-hidden border border-[#722F3726]">
                <div className="absolute inset-3 arch-frame border border-[#722F3714]" />
                <div className="w-40 text-[#722F37] opacity-40">
                  <BotanicalClassicBranch />
                </div>
              </div>
              <p className="absolute bottom-8 font-serif text-xs italic text-[#8C877F]">Espaço Jardim · São Paulo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- feature illustrations (line-drawn, no fills) ---------- */

function Toggle({ on }: { on: boolean }) {
  return (
    <span className={`relative h-4 w-7 rounded-full transition-colors ${on ? "bg-[#722F37]" : "bg-[#16161620]"}`}>
      <span className={`absolute top-0.5 size-3 rounded-full bg-white ${on ? "left-3.5" : "left-0.5"}`} />
    </span>
  );
}

function SiteArt() {
  const sections = ["Capa", "Nossa história", "Cerimônia e recepção", "Traje", "Lista de presentes", "Galeria", "Confirmação de presença"];
  return (
    <div className="w-full max-w-md">
      <div className={`flex items-center justify-between border-b ${line} pb-4 text-xs`}>
        <span className="text-[#6B6760]">Seções do site</span>
        <span className="inline-flex items-center gap-2 font-medium text-[#2F7A4A]">
          <span className="size-1.5 rounded-full bg-[#2F7A4A]" /> Publicado
        </span>
      </div>
      {sections.map((section, index) => (
        <div key={section} className={`flex items-center justify-between border-b ${line} py-3.5`}>
          <span className="flex items-center gap-5">
            <span className="w-5 font-mono text-[10px] text-[#A8A29A]">{String(index + 1).padStart(2, "0")}</span>
            <span className="text-sm text-[#161616]">{section}</span>
          </span>
          {section === "Galeria" ? <Toggle on /> : <span className="text-[11px] text-[#A8A29A]">Editar</span>}
        </div>
      ))}
      <div className="mt-5 flex items-center gap-3 text-xs text-[#6B6760]">
        <span className="font-serif text-base italic text-[#722F37]">Aa</span>
        Template · Romance Contemporâneo
      </div>
    </div>
  );
}

function RealInvitePdfMockup() {
  return (
    <div
      className="relative aspect-[148/210] w-full max-w-[320px] sm:max-w-[360px] md:max-w-[390px] shrink-0 overflow-hidden rounded-[10px] bg-[#FAF8F1] shadow-[0_25px_60px_-15px_rgba(45,35,25,0.22),0_4px_14px_rgba(45,35,25,0.06)] ring-1 ring-[#C7B79D]/70 select-none"
    >
      <svg
        viewBox="0 0 148 210"
        className="size-full"
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="geometricPrecision"
        textRendering="geometricPrecision"
      >
        {/* Paper Background */}
        <rect width="148" height="210" fill="#FAF8F1" />

        {/* Outer/Inner Rounded Frame: matches createInvitationPdf roundedRect(8, 8, 132, 194, 5, 5) */}
        <rect
          x="8"
          y="8"
          width="132"
          height="194"
          rx="5"
          ry="5"
          fill="none"
          stroke="#C7B79D"
          strokeWidth="0.32"
        />

        {/* Botanical corner artwork and floating hearts from buildInvitationArtwork */}
        <g
          fill="none"
          stroke="#C5B99F"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Top-Left leafy branch */}
          <g transform="translate(3 5) scale(.14)">
            <path d="M32 386C74 331 85 283 104 229S141 128 149 33" />
            <path d="M62 335C21 329 5 301 12 275C43 278 67 303 62 335Z" />
            <path d="M70 316C112 324 146 300 149 268C116 267 85 286 70 316Z" />
            <path d="M86 274C50 263 34 237 39 211C68 216 88 239 86 274Z" />
            <path d="M94 252C130 262 165 242 173 210C144 206 111 220 94 252Z" />
            <path d="M110 214C75 196 65 169 77 142C104 154 118 183 110 214Z" />
            <path d="M119 190C151 202 182 183 192 153C163 145 136 159 119 190Z" />
            <path d="M135 146C107 126 100 102 109 77C134 89 143 118 135 146Z" />
            <path d="M142 117C168 122 189 102 191 76C167 75 148 91 142 117Z" />
            <path d="M148 66C127 50 125 26 138 8C155 21 157 45 148 66Z" />
          </g>

          {/* Top-Right floral cluster */}
          <g transform="translate(116 10) scale(.14)">
            <path d="M60 350C112 257 117 199 107 81M95 252C78 205 56 184 40 165M109 207C148 176 158 145 165 122" />
            <path d="M82 298C41 288 21 261 30 235C65 242 86 267 82 298ZM98 260C138 269 170 240 172 215C139 217 110 232 98 260Z" />
            <g transform="translate(107 64) scale(1)">
              <ellipse cx="0" cy="-22" rx="13" ry="22" transform="rotate(0)" />
              <ellipse cx="0" cy="-22" rx="13" ry="22" transform="rotate(60)" />
              <ellipse cx="0" cy="-22" rx="13" ry="22" transform="rotate(120)" />
              <ellipse cx="0" cy="-22" rx="13" ry="22" transform="rotate(180)" />
              <ellipse cx="0" cy="-22" rx="13" ry="22" transform="rotate(240)" />
              <ellipse cx="0" cy="-22" rx="13" ry="22" transform="rotate(300)" />
              <circle r="9" />
            </g>
            <g transform="translate(36 150) scale(0.75)">
              <ellipse cx="0" cy="-22" rx="13" ry="22" transform="rotate(0)" />
              <ellipse cx="0" cy="-22" rx="13" ry="22" transform="rotate(60)" />
              <ellipse cx="0" cy="-22" rx="13" ry="22" transform="rotate(120)" />
              <ellipse cx="0" cy="-22" rx="13" ry="22" transform="rotate(180)" />
              <ellipse cx="0" cy="-22" rx="13" ry="22" transform="rotate(240)" />
              <ellipse cx="0" cy="-22" rx="13" ry="22" transform="rotate(300)" />
              <circle r="9" />
            </g>
            <g transform="translate(166 104) scale(0.7)">
              <ellipse cx="0" cy="-22" rx="13" ry="22" transform="rotate(0)" />
              <ellipse cx="0" cy="-22" rx="13" ry="22" transform="rotate(60)" />
              <ellipse cx="0" cy="-22" rx="13" ry="22" transform="rotate(120)" />
              <ellipse cx="0" cy="-22" rx="13" ry="22" transform="rotate(180)" />
              <ellipse cx="0" cy="-22" rx="13" ry="22" transform="rotate(240)" />
              <ellipse cx="0" cy="-22" rx="13" ry="22" transform="rotate(300)" />
              <circle r="9" />
            </g>
          </g>

          {/* Bottom-Right leafy branch */}
          <g transform="translate(144 204) rotate(180) scale(.13)">
            <path d="M32 386C74 331 85 283 104 229S141 128 149 33" />
            <path d="M62 335C21 329 5 301 12 275C43 278 67 303 62 335Z" />
            <path d="M70 316C112 324 146 300 149 268C116 267 85 286 70 316Z" />
            <path d="M86 274C50 263 34 237 39 211C68 216 88 239 86 274Z" />
            <path d="M94 252C130 262 165 242 173 210C144 206 111 220 94 252Z" />
            <path d="M110 214C75 196 65 169 77 142C104 154 118 183 110 214Z" />
            <path d="M119 190C151 202 182 183 192 153C163 145 136 159 119 190Z" />
            <path d="M135 146C107 126 100 102 109 77C134 89 143 118 135 146Z" />
            <path d="M142 117C168 122 189 102 191 76C167 75 148 91 142 117Z" />
            <path d="M148 66C127 50 125 26 138 8C155 21 157 45 148 66Z" />
          </g>

          {/* Bottom-Left floral cluster */}
          <g transform="translate(5 159) scale(.105)">
            <path d="M60 350C112 257 117 199 107 81M95 252C78 205 56 184 40 165M109 207C148 176 158 145 165 122" />
            <path d="M82 298C41 288 21 261 30 235C65 242 86 267 82 298ZM98 260C138 269 170 240 172 215C139 217 110 232 98 260Z" />
            <g transform="translate(107 64) scale(1)">
              <ellipse cx="0" cy="-22" rx="13" ry="22" transform="rotate(0)" />
              <ellipse cx="0" cy="-22" rx="13" ry="22" transform="rotate(60)" />
              <ellipse cx="0" cy="-22" rx="13" ry="22" transform="rotate(120)" />
              <ellipse cx="0" cy="-22" rx="13" ry="22" transform="rotate(180)" />
              <ellipse cx="0" cy="-22" rx="13" ry="22" transform="rotate(240)" />
              <ellipse cx="0" cy="-22" rx="13" ry="22" transform="rotate(300)" />
              <circle r="9" />
            </g>
            <g transform="translate(36 150) scale(0.75)">
              <ellipse cx="0" cy="-22" rx="13" ry="22" transform="rotate(0)" />
              <ellipse cx="0" cy="-22" rx="13" ry="22" transform="rotate(60)" />
              <ellipse cx="0" cy="-22" rx="13" ry="22" transform="rotate(120)" />
              <ellipse cx="0" cy="-22" rx="13" ry="22" transform="rotate(180)" />
              <ellipse cx="0" cy="-22" rx="13" ry="22" transform="rotate(240)" />
              <ellipse cx="0" cy="-22" rx="13" ry="22" transform="rotate(300)" />
              <circle r="9" />
            </g>
            <g transform="translate(166 104) scale(0.7)">
              <ellipse cx="0" cy="-22" rx="13" ry="22" transform="rotate(0)" />
              <ellipse cx="0" cy="-22" rx="13" ry="22" transform="rotate(60)" />
              <ellipse cx="0" cy="-22" rx="13" ry="22" transform="rotate(120)" />
              <ellipse cx="0" cy="-22" rx="13" ry="22" transform="rotate(180)" />
              <ellipse cx="0" cy="-22" rx="13" ry="22" transform="rotate(240)" />
              <ellipse cx="0" cy="-22" rx="13" ry="22" transform="rotate(300)" />
              <circle r="9" />
            </g>
          </g>

          {/* Floating Hearts */}
          <g transform="translate(16 106) rotate(-15) scale(.24)">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
          </g>
          <g transform="translate(127 83) rotate(12) scale(.22)">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
          </g>
          <g transform="translate(71.5 64.5) scale(.21)">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
          </g>
        </g>

        {/* Divider lines flanking the center heart at y=67 */}
        <line x1="54" y1="67" x2="68" y2="67" stroke="#C7B79D" strokeWidth="0.25" strokeLinecap="round" />
        <line x1="80" y1="67" x2="94" y2="67" stroke="#C7B79D" strokeWidth="0.25" strokeLinecap="round" />

        {/* 1. Top Headline at y=25 */}
        <text
          x="74"
          y="25"
          textAnchor="middle"
          fill="#80654E"
          fontFamily="var(--font-serif), 'Cormorant Garamond', Georgia, serif"
          fontStyle="italic"
          fontSize="3.9"
        >
          O amor em cada detalhe.
        </text>

        {/* 2. Couple Names at y=49 */}
        <text
          x="74"
          y="49"
          textAnchor="middle"
          fontFamily="var(--font-serif), 'Cormorant Garamond', Georgia, serif"
          fontWeight="300"
          fontSize="11.4"
        >
          <tspan fill="#3D2501">Marina </tspan>
          <tspan fill="#5D613C" fontStyle="italic">&amp;</tspan>
          <tspan fill="#3D2501"> Lucas</tspan>
        </text>

        {/* 3. Opening line 1 at y=79 */}
        <text
          x="74"
          y="79"
          textAnchor="middle"
          fill="#80654E"
          fontFamily="var(--font-serif), 'Cormorant Garamond', Georgia, serif"
          fontStyle="italic"
          fontSize="4.25"
        >
          Com alegria no coração
        </text>

        {/* 4. Opening line 2 at y=85 */}
        <text
          x="74"
          y="85"
          textAnchor="middle"
          fill="#80654E"
          fontFamily="var(--font-serif), 'Cormorant Garamond', Georgia, serif"
          fontSize="3.9"
        >
          Convidam você para celebrar esse momento tão especial
        </text>

        {/* 5. Guest Name at y=98 */}
        <text
          x="74"
          y="98"
          textAnchor="middle"
          fill="#5D613C"
          fontFamily="var(--font-serif), 'Cormorant Garamond', Georgia, serif"
          fontStyle="italic"
          fontSize="6.8"
        >
          Família Silva
        </text>

        {/* 6. Date & Time at y=110 */}
        <text
          x="74"
          y="110"
          textAnchor="middle"
          fill="#5D613C"
          fontFamily="var(--font-serif), 'Cormorant Garamond', Georgia, serif"
          fontSize="4.6"
        >
          12 de setembro de 2027 | 16h30
        </text>

        {/* 7. Place Name at y=122 */}
        <text
          x="74"
          y="122"
          textAnchor="middle"
          fill="#3D2501"
          fontFamily="var(--font-serif), 'Cormorant Garamond', Georgia, serif"
          fontSize="6.8"
        >
          Espaço Jardim
        </text>

        {/* 8. Address at y=129 */}
        <text
          x="74"
          y="129"
          textAnchor="middle"
          fill="#80654E"
          fontFamily="var(--font-serif), 'Cormorant Garamond', Georgia, serif"
          fontSize="3.55"
        >
          Av. das Hortênsias, 1420 - Jardim América
        </text>

        {/* 9. City/State at y=133.5 */}
        <text
          x="74"
          y="133.5"
          textAnchor="middle"
          fill="#80654E"
          fontFamily="var(--font-serif), 'Cormorant Garamond', Georgia, serif"
          fontSize="3.55"
        >
          São Paulo - SP
        </text>

        {/* 10. QR Box at (54, 140, 40, 40, rx=3) */}
        <rect
          x="54"
          y="140"
          width="40"
          height="40"
          rx="3"
          ry="3"
          fill="#FAF8F1"
          stroke="#C7B79D"
          strokeWidth="0.28"
        />

        {/* Real QR Code at (56, 142) size 36x36 */}
        <svg x="56" y="142" width="36" height="36" viewBox="0 0 37 37" shapeRendering="crispEdges">
          <path fill="#FAF8F1" d="M0 0h37v37H0z" />
          <path
            stroke="#3D2501"
            strokeWidth="1"
            d="M0 0.5h7m3 0h1m2 0h1m3 0h2m1 0h3m1 0h2m2 0h1m1 0h7M0 1.5h1m5 0h1m2 0h2m1 0h1m1 0h1m2 0h1m1 0h1m1 0h2m2 0h4m1 0h1m5 0h1M0 2.5h1m1 0h3m1 0h1m1 0h1m4 0h1m1 0h1m2 0h5m1 0h1m2 0h1m2 0h1m1 0h3m1 0h1M0 3.5h1m1 0h3m1 0h1m1 0h2m1 0h3m1 0h1m1 0h1m1 0h1m2 0h1m2 0h2m3 0h1m1 0h3m1 0h1M0 4.5h1m1 0h3m1 0h1m1 0h1m1 0h2m3 0h1m2 0h3m2 0h1m6 0h1m1 0h3m1 0h1M0 5.5h1m5 0h1m1 0h3m2 0h1m1 0h2m1 0h1m1 0h1m1 0h1m1 0h1m2 0h1m2 0h1m5 0h1M0 6.5h7m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h7M8 7.5h1m1 0h3m3 0h1m9 0h1M0 8.5h1m1 0h5m4 0h2m1 0h2m2 0h5m1 0h2m1 0h1m2 0h5M2 9.5h2m3 0h1m1 0h3m1 0h4m4 0h1m3 0h1m2 0h1m4 0h1m1 0h1M0 10.5h2m3 0h3m2 0h1m1 0h1m5 0h1m1 0h5m1 0h2m1 0h3m2 0h3M1 11.5h1m6 0h1m1 0h1m1 0h1m3 0h1m4 0h1m1 0h1m2 0h3m2 0h1m4 0h1M1 12.5h1m3 0h2m5 0h1m4 0h2m3 0h2m1 0h2m1 0h3m1 0h5M2 13.5h1m1 0h2m3 0h1m1 0h2m1 0h1m1 0h6m1 0h1m1 0h1m2 0h1m2 0h1M3 14.5h1m1 0h3m4 0h6m3 0h1m4 0h4m1 0h3m1 0h2M0 15.5h1m2 0h3m1 0h3m1 0h1m2 0h1m2 0h3m1 0h4m1 0h4m1 0h2m2 0h1M1 16.5h1m1 0h2m1 0h1m1 0h1m4 0h1m1 0h2m4 0h1m2 0h4m1 0h2m1 0h1m1 0h2M0 17.5h3m1 0h1m2 0h3m1 0h1m3 0h1m1 0h2m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m2 0h1m2 0h2M3 18.5h2m1 0h2m3 0h2m1 0h3m2 0h1m1 0h1m5 0h3m4 0h3M1 19.5h1m1 0h1m1 0h1m5 0h1m1 0h1m1 0h1m3 0h4m1 0h1m1 0h2m1 0h1m1 0h1m4 0h1M0 20.5h1m5 0h2m2 0h1m1 0h1m2 0h1m1 0h1m1 0h2m1 0h1m2 0h2m2 0h2m1 0h3M1 21.5h3m3 0h1m2 0h1m1 0h3m1 0h1m1 0h3m2 0h1m4 0h2m3 0h1M0 22.5h1m1 0h1m1 0h4m1 0h2m3 0h3m1 0h1m1 0h1m1 0h1m1 0h2m1 0h1m1 0h5m2 0h1M0 23.5h1m1 0h3m3 0h1m1 0h1m2 0h1m1 0h2m6 0h1m2 0h1m1 0h1m2 0h2m2 0h1M2 24.5h2m2 0h1m2 0h1m1 0h1m1 0h3m2 0h1m1 0h8m1 0h4m1 0h1m1 0h1M0 25.5h1m4 0h1m1 0h1m1 0h2m2 0h1m1 0h2m6 0h1m4 0h1m2 0h1m2 0h1M0 26.5h1m2 0h5m2 0h1m2 0h2m5 0h1m1 0h1m1 0h5m1 0h2m1 0h4M0 27.5h1m2 0h1m1 0h1m1 0h1m1 0h2m1 0h1m1 0h1m1 0h1m4 0h3m2 0h3m3 0h1m2 0h2M0 28.5h1m2 0h1m1 0h3m2 0h1m1 0h2m2 0h3m5 0h3m1 0h5m1 0h1m1 0h1M8 29.5h1m1 0h3m1 0h1m1 0h6m1 0h4m1 0h1m3 0h2m1 0h1M0 30.5h7m5 0h1m2 0h1m1 0h1m2 0h2m6 0h1m1 0h1m1 0h1m1 0h3M0 31.5h1m5 0h1m1 0h1m1 0h1m1 0h1m2 0h4m1 0h3m1 0h1m1 0h1m1 0h1m3 0h2m1 0h2M0 32.5h1m1 0h3m1 0h1m1 0h2m1 0h1m4 0h1m2 0h1m1 0h1m1 0h1m1 0h8m1 0h1m1 0h1M0 33.5h1m1 0h3m1 0h1m1 0h3m1 0h1m1 0h2m1 0h2m1 0h1m1 0h2m5 0h2m1 0h1m3 0h1M0 34.5h1m1 0h3m1 0h1m1 0h1m2 0h1m1 0h4m2 0h1m2 0h1m1 0h1m1 0h1m6 0h4M0 35.5h1m5 0h1m3 0h1m2 0h1m1 0h1m3 0h4m3 0h3m1 0h1m1 0h1m3 0h1M0 36.5h7m1 0h2m2 0h1m2 0h1m1 0h1m1 0h1m2 0h5m2 0h2m1 0h5"
          />
        </svg>

        {/* 11. Confirmation Title at y=188 */}
        <text
          x="74"
          y="188"
          textAnchor="middle"
          fill="#5D613C"
          fontFamily="var(--font-serif), 'Cormorant Garamond', Georgia, serif"
          fontSize="3.55"
          letterSpacing="1.2"
        >
          CONFIRME SUA PRESENÇA
        </text>

        {/* 12. Confirmation Subtitle at y=197 */}
        <text
          x="74"
          y="197"
          textAnchor="middle"
          fill="#80654E"
          fontFamily="var(--font-serif), 'Cormorant Garamond', Georgia, serif"
          fontSize="3.55"
        >
          Leia o QR Code ou toque aqui para responder
        </text>
      </svg>
    </div>
  );
}

function InviteArt() {
  const steps = [
    ["Enviado", "10 mar"],
    ["Aberto", "10 mar"],
    ["Respondido", "12 mar"],
  ];
  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-8 sm:flex-row sm:items-center sm:gap-10">
      <RealInvitePdfMockup />

      <div className="flex w-full max-w-xs flex-col sm:flex-1">
        <div className="relative">
          <span aria-hidden="true" className="absolute left-[5px] top-2 bottom-2 w-px bg-[#16161618]" />
          {steps.map(([label, date], index) => (
            <div key={label} className="relative flex items-start gap-4 pb-7 last:pb-0">
              <span
                className={`relative mt-1 size-[11px] rounded-full border ${
                  index === 2 ? "border-[#722F37] bg-[#722F37]" : "border-[#16161640] bg-[#F1F1F1]"
                }`}
              />
              <div>
                <span className="block text-sm text-[#161616]">{label}</span>
                <span className="text-[11px] text-[#8C877F]">{date}</span>
              </div>
            </div>
          ))}
        </div>
        <p className={`mt-6 border-t ${line} pt-4 text-xs text-[#6B6760]`}>
          <span className="font-serif text-xl text-[#161616]">4</span> de 4 presenças confirmadas · Família Silva
        </p>
      </div>
    </div>
  );
}

function CheckInArt() {
  const guests: [string, string, boolean][] = [
    ["Família Souza", "Mesa 03", true],
    ["Ana e Bruno Lima", "Mesa 07", true],
    ["Carla Mendes", "Mesa 07", false],
    ["Família Duarte", "Mesa 12", true],
    ["Paulo Ribeiro", "Mesa 05", false],
  ];
  return (
    <div className="w-full max-w-md">
      <div className="flex items-end justify-between">
        <div>
          <span className="text-xs text-[#6B6760]">Chegadas</span>
          <p className="font-serif text-5xl font-light leading-none text-[#161616]">
            86<span className="text-2xl text-[#A8A29A]"> / 120</span>
          </p>
        </div>
        <span className="inline-flex items-center gap-2 text-xs text-[#2F7A4A]">
          <span className="size-1.5 animate-pulse rounded-full bg-[#2F7A4A]" /> Ao vivo
        </span>
      </div>
      <div className="mt-5 h-px w-full bg-[#16161618]">
        <div className="h-px bg-[#722F37]" style={{ width: "72%" }} />
      </div>
      <div className="mt-4">
        {guests.map(([name, table, arrived]) => (
          <div key={name} className={`flex items-center justify-between border-b ${line} py-3.5`}>
            <span className="text-sm text-[#161616]">{name}</span>
            <span className="flex items-center gap-5">
              <span className="text-[11px] text-[#8C877F]">{table}</span>
              {arrived ? (
                <span className="grid size-5 place-items-center rounded-full bg-[#722F37] text-white">
                  <Check size={11} strokeWidth={3} />
                </span>
              ) : (
                <span className="size-5 rounded-full border border-[#16161630]" />
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- content ---------- */

const features = [
  {
    id: "site",
    index: "01",
    eyebrow: "O site",
    title: (
      <>
        Um site com a cara de vocês, <Accent>pronto em minutos.</Accent>
      </>
    ),
    text: "Escolham um template, contem a história do casal e reúnam cerimônia, recepção, traje e presentes em um só endereço. Editem em rascunho e publiquem quando tudo estiver perfeito.",
    bullets: ["Templates com tipografia e ilustrações exclusivas", "Editor com rascunho, pré-visualização e publicação", "Galeria de fotos, mapa e lista de presentes"],
    art: <SiteArt />,
  },
  {
    id: "convites",
    index: "02",
    eyebrow: "Convites e confirmação",
    title: (
      <>
        Cada convidado com <br />
        <Accent>o seu próprio convite.</Accent>
      </>
    ),
    text: "Cadastrem famílias ou convidados individuais. Cada convite tem um link exclusivo e vira um PDF elegante com QR Code — basta enviar pelo WhatsApp ou imprimir.",
    bullets: ["Confirmação individual de cada pessoa do convite", "Restrições alimentares e recados aos noivos", "Acompanhamento de envio, abertura e respostas"],
    art: <InviteArt />,
  },
  {
    id: "evento",
    index: "03",
    eyebrow: "No grande dia",
    title: (
      <>
        A recepção sabe quem chegou. <Accent>Em tempo real.</Accent>
      </>
    ),
    text: "Criem contas para a equipe da recepção, distribuam os convidados nas mesas e registrem cada chegada pelo celular. Sem planilhas, sem papel, sem filas na entrada.",
    bullets: ["Contas de recepção com acesso restrito", "Mesas e lugares com controle de capacidade", "Resumo alimentar pronto para o buffet"],
    art: <CheckInArt />,
  },
];

const pillars = [
  ["Site personalizado", "Templates editoriais"],
  ["Convites com QR Code", "PDF pronto para enviar"],
  ["Confirmação de presença", "Sem app e sem cadastro"],
  ["Controle de chegada", "Equipe em tempo real"],
];

const templates = [
  {
    name: "Botânico Clássico",
    plan: "essencial" as const,
    mood: "Ar livre, campo e jardim",
    text: "Folhagens desenhadas à mão, tons de oliva e areia e uma atmosfera acolhedora para celebrações ao ar livre.",
    color: "#5D613C",
    swatches: ["#5D613C", "#80654E", "#C7B79D", "#3D2501"],
  },
  {
    name: "Romance Contemporâneo",
    plan: "essencial" as const,
    mood: "Editorial, urbano e intimista",
    text: "Tipografia de impacto, tons de vinho e rosé e uma diagramação limpa inspirada em revistas de moda.",
    color: "#722F37",
    swatches: ["#722F37", "#82656C", "#D2B9BD", "#302329"],
  },
  {
    name: "Minimalista Moderno",
    plan: "foreverPro" as const,
    mood: "Alta costura e contemporâneo",
    text: "Preto, branco e detalhes dourados com tipografia elegante para casamentos minimalistas e cosmopolitas.",
    color: "#161616",
    swatches: ["#161616", "#8B6B35", "#D8C29A", "#FFFFFF"],
  },
  {
    name: "Brisa Serena",
    isComingSoon: true,
    plan: "foreverPro" as const,
    mood: "Beira-mar, linho e leveza",
    text: "Tons de azul marinho profundo e azul celeste suave, trazendo uma atmosfera calma, fresca e poética.",
    color: "#1E2D4A",
    swatches: ["#1E2D4A", "#457B9D", "#A8DADC", "#EBF2F7"],
  },
];

interface PricingRow {
  name: string;
  description?: string;
  essencial: boolean | string;
  foreverPro: boolean | string;
  isForeverProExclusive?: boolean;
}

interface PricingCategory {
  category: string;
  rows: PricingRow[];
}

const pricingComparison: PricingCategory[] = [
  {
    category: "Site & Design",
    rows: [
      {
        name: "Site completo personalizado",
        description: "História do casal, fotos, contagem regressiva e mapa do local",
        essencial: true,
        foreverPro: true,
      },
      {
        name: "Templates inclusos",
        description: "Design editorial com tipografia e ilustrações autorais",
        essencial: "2 templates base",
        foreverPro: "Todos os 4 templates",
      },
      {
        name: "Templates exclusivos (Minimalista & Brisa)",
        description: "Estilos minimalista em preto, branco & dourado e linho à beira-mar",
        essencial: false,
        foreverPro: true,
        isForeverProExclusive: true,
      },
      {
        name: "Galeria de fotos do casal",
        description: "Editor integrado com publicação e atualização em tempo real",
        essencial: true,
        foreverPro: true,
      },
      {
        name: "Validade e duração do acesso",
        description: "Sem mensalidades ou renovações automáticas",
        essencial: "Até a data do evento",
        foreverPro: "Até o evento + 3 meses",
        isForeverProExclusive: true,
      },
    ],
  },
  {
    category: "Convites & Confirmação (RSVP)",
    rows: [
      {
        name: "Capacidade de convidados",
        description: "Limite de pessoas cadastradas na lista e convites individuais",
        essencial: "Até 50 convidados",
        foreverPro: "Convidados ilimitados",
        isForeverProExclusive: true,
      },
      {
        name: "Lista de convidados e controle de envio",
        description: "Acompanhe quem recebeu, abriu e confirmou presença",
        essencial: true,
        foreverPro: true,
      },
      {
        name: "Convites digitais em PDF com QR Code",
        description: "Arquivo elegante em alta resolução pronto para WhatsApp ou impressão",
        essencial: "Até 50 convidados",
        foreverPro: "Convidados ilimitados",
      },
      {
        name: "Confirmação de presença (RSVP) individual",
        description: "Cada convidado confirma direto pelo navegador, sem aplicativo",
        essencial: true,
        foreverPro: true,
      },
      {
        name: "Restrições alimentares e recados aos noivos",
        description: "Coleta de alergias, preferências e mensagens de carinho",
        essencial: true,
        foreverPro: true,
      },
    ],
  },
  {
    category: "Lista de Presentes",
    rows: [
      {
        name: "Lista de presentes com link próprio",
        description: "Usem seu próprio link de pagamento ou chave bancária — 100% do valor vai direto para vocês",
        essencial: true,
        foreverPro: true,
      },
      {
        name: "Taxa ou comissão sobre presentes",
        description: "Diferente de outras plataformas, não cobramos taxa nem porcentagem",
        essencial: "0% de taxa",
        foreverPro: "0% de taxa",
      },
    ],
  },
  {
    category: "Organização & Recepção (Grande Dia)",
    rows: [
      {
        name: "Gestão de mesas e lugares",
        description: "Distribuição inteligente dos convidados com limite por mesa",
        essencial: false,
        foreverPro: true,
        isForeverProExclusive: true,
      },
      {
        name: "Controle de chegada (check-in ao vivo)",
        description: "Registro de chegada em tempo real pelo celular na portaria da festa",
        essencial: false,
        foreverPro: true,
        isForeverProExclusive: true,
      },
      {
        name: "Contas dedicadas para equipe da recepção",
        description: "Acesso restrito para recepcionistas sem expor dados privados dos noivos",
        essencial: false,
        foreverPro: true,
        isForeverProExclusive: true,
      },
      {
        name: "Relatório compilado para o buffet",
        description: "Visão consolidada de restrições alimentares pronta para a cozinha",
        essencial: false,
        foreverPro: true,
        isForeverProExclusive: true,
      },
      {
        name: "Histórico completo de alterações",
        description: "Auditoria detalhada de confirmações e mudanças de convites",
        essencial: false,
        foreverPro: true,
        isForeverProExclusive: true,
      },
      {
        name: "Suporte prioritário via WhatsApp",
        description: "Atendimento direto para tirar dúvidas dos noivos com agilidade",
        essencial: false,
        foreverPro: true,
        isForeverProExclusive: true,
      },
    ],
  },
];

const steps = [
  ["Criem a conta", "Escolham o plano e criem o acesso em segundos para começar a montar o site na hora."],
  ["Personalizem tudo", "Textos, fotos, templates, lista de presentes e convidados — tudo editável pelo painel."],
  ["Compartilhem e celebrem", "Convites com QR Code enviados, confirmações em tempo real e recepção organizada no dia."],
];

const faqs = [
  [
    "Como começo a usar o meu site?",
    "Assim que o pagamento for concluído, sua conta é criada na mesma hora e você já acessa o painel para personalizar fotos, textos, convidados e lista de presentes.",
  ],
  [
    "Qual a diferença entre os planos Forever Essencial e Forever PRO?",
    "O plano Forever Essencial (R$ 497) foi pensado para celebrações intimistas de até 50 convidados: inclui o site completo, fotos, convites em PDF com QR Code, lista de presentes com seu próprio link de pagamento e os templates base (Botânico Clássico e Romance Contemporâneo), com acesso até a data do evento. O plano Forever PRO (R$ 997) oferece convidados ilimitados, traz a central do grande dia (mesas, portaria com check-in ao vivo, contas para cerimonial), os templates exclusivos Minimalista Moderno e Brisa Serena e + 3 meses de acesso pós-evento.",
  ],
  [
    "O pagamento é único ou por mensalidade?",
    "É um pagamento único. Não cobramos mensalidades nem qualquer taxa ou comissão sobre os presentes que vocês receberem.",
  ],
  [
    "Os convidados precisam baixar algum aplicativo?",
    "Não. O convidado abre o link ou lê o QR Code do convite e confirma a presença direto pelo navegador, sem criar conta.",
  ],
  [
    "Podemos trocar de template depois?",
    "Sim. A troca pode ser feita a qualquer momento pelo painel e todo o conteúdo personalizado é preservado.",
  ],
  [
    "Como funciona a lista de presentes?",
    "Vocês cadastram os presentes e incluem o link de pagamento ou chave bancária de sua preferência. Os convidados compram e o valor cai direto para vocês, sem intermediários e com taxa zero da nossa parte.",
  ],
  [
    "O que a equipe da recepção consegue ver?",
    "No plano Forever PRO, a equipe vê somente o necessário para o dia: nomes, mesas e registro de chegada. Configurações, convites e recados continuam visíveis apenas para vocês.",
  ],
];

/* ---------- page ---------- */

interface UserWedding {
  destination: string;
  slug: string;
  role: string;
  plan: "essencial" | "foreverPro";
}

export function ForeverLandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [checkoutLoading, setCheckoutLoading] = useState<"essencial" | "foreverPro" | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userWedding, setUserWedding] = useState<UserWedding | null>(null);
  const modules = moduleKeys.filter(key => key !== "organization");

  useEffect(() => {
    let active = true;
    try {
      const auth = clientAuth();
      const unsubscribe = onAuthStateChanged(auth, async (account) => {
        if (!active) return;
        setUser(account);
        if (!account) {
          setUserWedding(null);
          return;
        }

        try {
          const token = await account.getIdToken();
          const res = await fetch("/api/auth/destination", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await readApiResponse(res);
            if (active && data) {
              setUserWedding({
                destination: data.destination,
                slug: data.slug,
                role: data.role,
                plan: data.plan,
              });
            }
          }
        } catch {
          // Usuário autenticado mas sem casamento vinculado ainda
        }
      });

      return () => {
        active = false;
        unsubscribe();
      };
    } catch {
      // Firebase não configurado no cliente
    }
  }, []);

  const panelHref = userWedding?.destination || (userWedding?.slug ? `/${userWedding.slug}/painel` : "/login");
  const receptionHref = userWedding?.slug ? `/${userWedding.slug}/recepcao` : "/login";

  async function handleCheckout(plan: "essencial" | "foreverPro", action: "new" | "upgrade" = "new") {
    if(action === "new"){window.location.assign(`/contratar?plan=${plan}`);return;}
    try {
      setCheckoutLoading(plan);
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(user ? {Authorization:`Bearer ${await user.getIdToken()}`} : {}), ...(userWedding?.slug ? {"x-wedding-slug":userWedding.slug} : {}) },
        body: JSON.stringify({
          plan,
          action,
          weddingSlug: userWedding?.slug,
          customerEmail: user?.email || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Erro ao iniciar pagamento.");
      }
      window.location.href = data.url;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao iniciar checkout.";
      alert(message);
      setCheckoutLoading(null);
    }
  }

  function renderPlanButton(targetPlan: "essencial" | "foreverPro", isFooter = false) {
    const currentPlan = userWedding?.plan;
    const heightClass = isFooter ? "h-10" : "h-11";
    const iconSize = isFooter ? 12 : 13;

    if (currentPlan === targetPlan) {
      return (
        <Link
          href={panelHref}
          className={`inline-flex ${heightClass} w-full items-center justify-center gap-2 rounded-full border-2 border-[#722F37] bg-[#722F3715] px-4 text-xs font-semibold text-[#722F37] transition-all hover:bg-[#722F3725]`}
        >
          <Check size={iconSize + 2} strokeWidth={2.5} className="text-[#722F37]" />
          <span>Seu plano atual (Ativo)</span>
        </Link>
      );
    }

    if (currentPlan === "foreverPro" && targetPlan === "essencial") {
      return (
        <div
          className={`inline-flex ${heightClass} w-full items-center justify-center gap-2 rounded-full border border-[#16161615] bg-[#16161608] px-4 text-xs font-medium text-[#8C877F] select-none cursor-default`}
        >
          <Check size={iconSize} className="text-[#8C877F]" />
          <span>Incluso no seu plano PRO</span>
        </div>
      );
    }

    if (currentPlan === "essencial" && targetPlan === "foreverPro") {
      return (
        <button
          type="button"
          disabled={checkoutLoading !== null}
          onClick={() => handleCheckout("foreverPro", "upgrade")}
          className={`inline-flex ${heightClass} w-full items-center justify-center gap-2 rounded-full bg-[#722F37] px-4 text-xs font-semibold text-white shadow-md shadow-[#722F3720] transition-all duration-300 hover:bg-[#5b242b] hover:shadow-lg hover:shadow-[#722F3730] disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {checkoutLoading === "foreverPro" ? (
            <>
              <Loader2 size={iconSize} className="animate-spin text-white" />
              <span>Redirecionando…</span>
            </>
          ) : (
            <>
              <Heart size={iconSize} className="fill-white text-white" />
              <span>Fazer upgrade para PRO</span>
              <ArrowUpRight size={iconSize} className="text-white/80" />
            </>
          )}
        </button>
      );
    }

    if (targetPlan === "essencial") {
      return (
        <button
          type="button"
          disabled={checkoutLoading !== null}
          onClick={() => handleCheckout("essencial", "new")}
          className={`inline-flex ${heightClass} w-full items-center justify-center gap-2 rounded-full border border-[#16161625] bg-white px-4 text-xs font-medium text-[#161616] shadow-xs transition-all hover:border-[#16161645] hover:bg-[#16161606] disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {checkoutLoading === "essencial" ? (
            <>
              <Loader2 size={iconSize} className="animate-spin text-[#161616]" />
              <span>{isFooter ? "Aguarde…" : "Redirecionando…"}</span>
            </>
          ) : (
            <>
              <span>Assinar Forever Essencial</span>
              <ArrowUpRight size={iconSize} className="text-[#8C877F]" />
            </>
          )}
        </button>
      );
    }

    return (
      <button
        type="button"
        disabled={checkoutLoading !== null}
        onClick={() => handleCheckout("foreverPro", "new")}
        className={`inline-flex ${heightClass} w-full items-center justify-center gap-2 rounded-full bg-[#722F37] px-4 text-xs font-semibold text-white shadow-md shadow-[#722F3720] transition-all duration-300 hover:bg-[#5b242b] hover:shadow-lg hover:shadow-[#722F3730] disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {checkoutLoading === "foreverPro" ? (
          <>
            <Loader2 size={iconSize} className="animate-spin text-white" />
            <span>{isFooter ? "Aguarde…" : "Redirecionando…"}</span>
          </>
        ) : (
          <>
            <Heart size={iconSize} className="fill-white text-white" />
            <span>Assinar Forever PRO</span>
            <ArrowUpRight size={iconSize} className="text-white/80" />
          </>
        )}
      </button>
    );
  }

  return (
    <div id="inicio" className="min-h-screen bg-[#F1F1F1] text-[#161616] selection:bg-[#722F3722]">
      {/* Header */}
      <header className="w-full">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-6 sm:px-10">
          <Link href="/" aria-label="Forever — início">
            <ForeverLogo className="w-28" />
          </Link>
          <nav className="hidden items-center gap-9 text-[13px] text-[#6B6760] md:flex">
            <a href="#recursos" className="transition-colors hover:text-[#161616]">Recursos</a>
            <a href="#modulos" className="transition-colors hover:text-[#161616]">Módulos</a>
            <a href="#templates" className="transition-colors hover:text-[#161616]">Templates</a>
            <a href="#preco" className="transition-colors hover:text-[#161616]">Preço</a>
            <a href="#duvidas" className="transition-colors hover:text-[#161616]">Dúvidas</a>
          </nav>
          <div className="flex items-center gap-5">
            {user ? (
              <Link
                href={panelHref}
                className="group inline-flex h-9 items-center gap-1.5 rounded-full bg-[#722F37] px-4 text-[13px] font-medium text-white shadow-sm transition-all duration-300 hover:bg-[#5b242b] hover:shadow-md hover:shadow-[#722F3725]"
              >
                <span>Acessar meu painel</span>
                <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden text-[13px] text-[#161616] transition-colors hover:text-[#722F37] sm:block">
                  Entrar
                </Link>
                <a
                  href="#preco"
                  className="group inline-flex h-9 items-center gap-1.5 rounded-full bg-[#722F37] px-4 text-[13px] font-medium text-white shadow-sm transition-all duration-300 hover:bg-[#5b242b] hover:shadow-md hover:shadow-[#722F3725]"
                >
                  <span>Criar meu site</span>
                  <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-6 pb-24 pt-20 sm:px-10 sm:pt-28">
          <BotanicalClassicOrnaments variant="botanical" tone="paper" />
          <div className="relative mx-auto max-w-4xl text-center">
            <Reveal delay={0.08}>
              <h1 className="text-[clamp(44px,7vw,96px)] font-medium leading-[0.98] tracking-[-0.05em] text-[#161616]">
                Um site à altura
                <br />
                do seu <Accent>grande dia.</Accent>
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-[#6B6760] sm:text-lg">
                Site personalizado, convites com QR Code, confirmação de presença e controle de chegada. Elegante para os
                convidados, simples para vocês.
              </p>
            </Reveal>
            <Reveal delay={0.24} className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {user ? (
                <>
                  <PrimaryButton href={panelHref}>
                    Acessar meu painel
                  </PrimaryButton>
                  <GhostButton href="#preco">
                    {userWedding?.plan ? "Ver meu plano" : "Ver planos"}
                  </GhostButton>
                </>
              ) : (
                <>
                  <PrimaryButton href="#preco">
                    Criar meu site
                  </PrimaryButton>
                  <GhostButton href="/login">Já tenho conta</GhostButton>
                </>
              )}
            </Reveal>
          </div>

          <Reveal delay={0.3}>
            <HeroPreview />
          </Reveal>
        </section>

        {/* Pillars */}
        <section className={`border-y ${line}`}>
          <div className={`mx-auto grid max-w-6xl grid-cols-2 lg:grid-cols-4 lg:divide-x divide-[#16161612]`}>
            {pillars.map(([title, detail], index) => (
              <div key={title} className="px-6 py-8 sm:px-10">
                <span className="font-mono text-[10px] text-[#A8A29A]">{String(index + 1).padStart(2, "0")}</span>
                <p className="mt-3 text-sm font-medium text-[#161616]">{title}</p>
                <p className="mt-1 text-xs text-[#8C877F]">{detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="recursos" className="relative overflow-clip scroll-mt-20 px-6 sm:px-10">
          <BotanicalClassicOrnaments variant="floral" tone="paper" />
          <div className="relative mx-auto max-w-6xl">
            <Reveal className="max-w-2xl pb-8 pt-28 sm:pt-36">
              <Eyebrow>Recursos</Eyebrow>
              <h2 className="mt-5 text-[clamp(34px,4.6vw,60px)] font-medium leading-[1.02] tracking-[-0.045em]">
                Do primeiro convite <br className="hidden sm:block" />
                ao último <Accent>brinde.</Accent>
              </h2>
            </Reveal>

            {features.map((feature, index) => (
              <article
                key={feature.id}
                id={feature.id}
                className={`grid scroll-mt-20 items-center gap-14 border-t ${line} py-20 sm:py-28 lg:grid-cols-2 lg:gap-24`}
              >
                <Reveal className={index % 2 ? "lg:order-2" : ""}>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs text-[#A8A29A]">{feature.index}</span>
                    <span className="h-px w-8 bg-[#16161626]" />
                    <Eyebrow>{feature.eyebrow}</Eyebrow>
                  </div>
                  <h3 className="mt-6 text-[clamp(28px,3.2vw,42px)] font-medium leading-[1.08] tracking-[-0.04em]">{feature.title}</h3>
                  <p className="mt-6 max-w-md text-[15px] leading-relaxed text-[#6B6760]">{feature.text}</p>
                  <ul className="mt-8 max-w-md">
                    {feature.bullets.map(bullet => (
                      <li key={bullet} className={`flex items-center gap-3 border-t ${line} py-3.5 text-sm text-[#161616]`}>
                        <Check size={14} className="shrink-0 text-[#722F37]" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </Reveal>
                <Reveal delay={0.12} className={`flex justify-center ${index % 2 ? "lg:order-1 lg:justify-start" : "lg:justify-end"}`}>
                  {feature.art}
                </Reveal>
              </article>
            ))}
          </div>
        </section>

        {/* Modules index */}
        <section id="modulos" className={`relative overflow-clip scroll-mt-20 border-t ${line} px-6 py-28 sm:px-10 sm:py-36`}>
          <BotanicalClassicOrnaments variant="hearts" tone="paper" />
          <div className="relative mx-auto grid max-w-6xl gap-16 lg:grid-cols-[1fr_1.6fr] lg:gap-24">
            <Reveal className="lg:sticky lg:top-32 lg:self-start">
              <Eyebrow>Módulos</Eyebrow>
              <h2 className="mt-5 text-[clamp(32px,4vw,52px)] font-medium leading-[1.04] tracking-[-0.045em]">
                Recursos modulares. <br />
                <Accent>Ativem só o que usar.</Accent>
              </h2>
              <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-[#6B6760]">
                Cada celebração tem seu próprio ritmo. Ativem e desativem os recursos do seu plano a qualquer momento — o painel se molda às escolhas de vocês.
              </p>
              <div className="mt-8 flex items-center gap-2 text-xs text-[#8C877F]">
                <Heart size={13} className="fill-[#722F37] text-[#722F37]" />
                <span>Exclusivo do Forever PRO</span>
              </div>
            </Reveal>
            <div className="grid sm:grid-cols-2 sm:gap-x-12">
              {modules.map((key, index) => {
                const isForeverPro = foreverProModules.has(key);
                return (
                  <Reveal key={key} delay={(index % 4) * 0.04}>
                    <div className={`border-t ${line} py-6`}>
                      <div className="flex items-baseline gap-4">
                        <span className="font-mono text-[10px] text-[#A8A29A]">{String(index + 1).padStart(2, "0")}</span>
                        <div className="flex items-center gap-2">
                          <p className="text-[15px] font-medium text-[#161616]">{moduleCatalog[key].label}</p>
                          {isForeverPro && <ForeverProHeartTooltip />}
                        </div>
                      </div>
                      <p className="mt-2 pl-8 text-[13px] leading-relaxed text-[#8C877F]">{moduleCatalog[key].description}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* Templates */}
        <section id="templates" className={`relative overflow-clip scroll-mt-20 border-t ${line} px-6 py-28 sm:px-10 sm:py-36`}>
          <BotanicalClassicOrnaments variant="vows" tone="paper" />
          <div className="relative mx-auto max-w-6xl">
            <Reveal className="mx-auto max-w-2xl text-center">
              <Eyebrow>Templates</Eyebrow>
              <h2 className="mt-5 text-[clamp(32px,4.4vw,56px)] font-medium leading-[1.04] tracking-[-0.045em]">
                Design de papelaria fina, <Accent>em cada tela.</Accent>
              </h2>
              <p className="mx-auto mt-6 max-w-lg text-[15px] leading-relaxed text-[#6B6760]">
                Estilos autorais criados pela MAGUI.studio — do site ao convite em PDF. Os templates base estão disponíveis em todos os planos, e os exclusivos integram o Forever PRO.
              </p>
            </Reveal>

            <div className={`mt-20 grid border-y ${line} md:grid-cols-2`}>
              {templates.map((template, index) => {
                const isRightCol = index % 2 === 1;
                const isSecondRow = index >= 2;
                return (
                  <Reveal key={template.name} delay={index * 0.08}>
                    <div
                      className={`flex h-full flex-col justify-between px-6 py-12 sm:px-12 ${
                        index > 0 ? `border-t ${line} md:border-t-0` : ""
                      } ${isSecondRow ? `md:border-t ${line}` : ""} ${
                        !isRightCol ? `md:border-r ${line}` : ""
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[11px] uppercase tracking-[0.22em] text-[#8C877F]">{template.mood}</span>
                          {template.plan === "foreverPro" && <ForeverProHeartTooltip text="Exclusivo do Forever PRO" />}
                        </div>
                        <p className="mt-8 font-serif text-[clamp(64px,7vw,96px)] font-light leading-none" style={{ color: template.color }}>
                          Aa<span className="italic">&</span>
                        </p>
                        <h3 className="mt-8 font-serif text-3xl font-normal text-[#161616]">{template.name}{"isComingSoon" in template && template.isComingSoon && <span className="ml-3 inline-block align-middle rounded-full bg-[#16161608] px-3 py-1 font-sans text-[10px] uppercase tracking-widest text-[#6B6760]">Em breve</span>}</h3>
                        <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#6B6760]">{template.text}</p>
                      </div>
                      <div className="mt-10 flex items-center gap-2">
                        {template.swatches.map(color => (
                          <span key={color} className="size-6 rounded-full ring-1 ring-[#16161618]" style={{ background: color }} />
                        ))}
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* Process */}
        <section className={`relative overflow-clip border-t ${line} px-6 py-28 sm:px-10 sm:py-36`}>
          <BotanicalClassicOrnaments variant="botanical" tone="paper" />
          <div className="relative mx-auto max-w-6xl">
            <Reveal className="max-w-2xl">
              <Eyebrow>Como funciona</Eyebrow>
              <h2 className="mt-5 text-[clamp(32px,4.4vw,56px)] font-medium leading-[1.04] tracking-[-0.045em]">
                Três passos até o <Accent>sim.</Accent>
              </h2>
            </Reveal>
            <div className="mt-20 grid gap-12 md:grid-cols-3 md:gap-10">
              {steps.map(([title, text], index) => (
                <Reveal key={title} delay={index * 0.1}>
                  <div className="relative">
                    <div className="flex items-center gap-4">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full border border-[#722F37] font-serif text-lg text-[#722F37]">
                        {index + 1}
                      </span>
                      <span className="h-px flex-1 bg-[#16161618]" />
                    </div>
                    <h3 className="mt-8 text-xl font-medium tracking-[-0.02em]">{title}</h3>
                    <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#6B6760]">{text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="preco" className={`relative overflow-clip scroll-mt-20 border-t ${line} px-6 py-28 sm:px-10 sm:py-36`}>
          <BotanicalClassicOrnaments variant="vows" tone="paper" />
          <div className="relative mx-auto max-w-6xl">
            <Reveal className="max-w-2xl">
              <Eyebrow>Preço</Eyebrow>
              <h2 className="mt-5 text-[clamp(32px,4vw,52px)] font-medium leading-[1.04] tracking-[-0.045em]">
                Dois planos feitos para o <br />
                <Accent>tamanho da sua celebração.</Accent>
              </h2>
              <p className="mt-6 text-[15px] leading-relaxed text-[#6B6760]">
                Pagamento único, sem mensalidades e com 0% de comissão sobre seus presentes. Compare os recursos lado a lado e escolham o plano ideal.
              </p>
            </Reveal>

            {/* Guarantees bar */}
            <Reveal delay={0.05}>
              <div className={`mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 border-y ${line} py-4 text-xs text-[#8C877F]`}>
                <span className="flex items-center gap-2">
                  <Check size={13} className="text-[#722F37]" /> Pagamento seguro via Stripe
                </span>
                <span className="flex items-center gap-2">
                  <Check size={13} className="text-[#722F37]" /> 0% de comissão sobre presentes (link próprio)
                </span>
                <span className="flex items-center gap-2">
                  <Check size={13} className="text-[#722F37]" /> Acesso liberado no mesmo instante
                </span>
                <span className="flex items-center gap-2">
                  <Check size={13} className="text-[#722F37]" /> Acesso até o evento (+ 3 meses no Forever PRO)
                </span>
              </div>
            </Reveal>

            {/* SaaS Comparison Table */}
            <Reveal delay={0.1} className="mt-14">
              <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
                <table className="w-full min-w-[700px] border-collapse text-left">
                  <thead>
                    <tr className={`border-b ${line}`}>
                      <th className="w-[44%] pb-8 pr-6 align-bottom">
                        <span className="text-xs uppercase tracking-[0.2em] text-[#8C877F]">Comparativo</span>
                        <h3 className="mt-1 text-2xl font-medium text-[#161616]">Recursos por plano</h3>
                        <p className="mt-2 text-xs leading-relaxed text-[#6B6760]">
                          Transparência total em cada funcionalidade.
                        </p>
                      </th>

                      {/* Column Forever Essencial */}
                      <th className={`w-[28%] border-l ${line} px-6 pb-8 text-center align-bottom`}>
                        <span className="text-[11px] uppercase tracking-[0.2em] text-[#8C877F]">Básico & Completo</span>
                        <div className="mt-1 flex items-center justify-center gap-1.5">
                          <h4 className="text-xl font-medium text-[#161616]">Forever Essencial</h4>
                        </div>
                        {userWedding?.plan === "essencial" && (
                          <div className="mt-1.5">
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#722F3715] px-2.5 py-0.5 text-[10px] font-semibold text-[#722F37]">
                              <Check size={11} strokeWidth={2.5} /> Seu plano atual
                            </span>
                          </div>
                        )}
                        <div className="mt-3">
                          <p className="font-serif text-[clamp(36px,4vw,48px)] font-light leading-none text-[#161616]">
                            <span className="font-sans text-base font-normal text-[#8C877F] align-super">R$&nbsp;</span>497
                          </p>
                          <span className="mt-4 block text-[11px] text-[#8C877F]">Pagamento único · Até 50 convidados</span>
                        </div>
                        <div className="mt-5">
                          {renderPlanButton("essencial", false)}
                        </div>
                      </th>

                      {/* Column Forever PRO */}
                      <th className={`w-[28%] border-l ${line} px-6 pb-8 text-center align-bottom`}>
                        <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-[#722F37]">
                          <Heart size={11} className="fill-[#722F37] text-[#722F37]" />
                          <span>Organização & Recepção</span>
                        </div>
                        <div className="mt-1 flex items-center justify-center gap-1.5">
                          <h4 className="text-xl font-medium text-[#161616]">Forever PRO</h4>
                        </div>
                        {userWedding?.plan === "foreverPro" && (
                          <div className="mt-1.5">
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#722F3715] px-2.5 py-0.5 text-[10px] font-semibold text-[#722F37]">
                              <Heart size={11} className="fill-[#722F37] text-[#722F37]" /> Seu plano atual
                            </span>
                          </div>
                        )}
                        <div className="mt-3">
                          <p className="font-serif text-[clamp(36px,4vw,48px)] font-light leading-none text-[#161616]">
                            <span className="font-sans text-xl font-normal text-[#8C877F] align-super">R$&nbsp;</span>997
                          </p>
                          <span className="mt-4 block text-[11px] text-[#8C877F]">Pagamento único · Convidados ilimitados</span>
                        </div>
                        <div className="mt-5">
                          {renderPlanButton("foreverPro", false)}
                        </div>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {pricingComparison.map(section => (
                      <Fragment key={section.category}>
                        <tr className={`border-t ${line}`}>
                          <td colSpan={3} className="pt-8 pb-3 text-[11px] uppercase tracking-[0.24em] font-semibold text-[#722F37]">
                            {section.category}
                          </td>
                        </tr>
                        {section.rows.map(row => (
                          <tr
                            key={row.name}
                            className="border-t border-[#1616160d] transition-colors hover:bg-[#16161604]"
                          >
                            <td className="py-4 pr-6 align-middle">
                              <p className="text-sm font-medium text-[#161616]">{row.name}</p>
                              {row.description && (
                                <p className="mt-0.5 text-xs text-[#8C877F]">{row.description}</p>
                              )}
                            </td>
                            <td className={`border-l ${line} px-6 py-4 text-center align-middle`}>
                              {typeof row.essencial === "boolean" ? (
                                row.essencial ? (
                                  <span className="mx-auto inline-grid size-6 place-items-center rounded-full bg-[#2F7A4A12] text-[#2F7A4A]">
                                    <Check size={14} strokeWidth={2.5} />
                                  </span>
                                ) : (
                                  <span className="text-base font-medium text-[#8C877F40]">—</span>
                                )
                              ) : (
                                <span className="text-xs font-medium text-[#6B6760]">{row.essencial}</span>
                              )}
                            </td>
                            <td className={`border-l ${line} px-6 py-4 text-center align-middle`}>
                              {typeof row.foreverPro === "boolean" ? (
                                row.foreverPro ? (
                                  row.isForeverProExclusive ? (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#722F3730] bg-[#722F3710] px-2.5 py-1 text-[11px] font-medium text-[#722F37]">
                                      <Heart size={11} className="fill-[#722F37] text-[#722F37]" />
                                      Incluso
                                    </span>
                                  ) : (
                                    <span className="mx-auto inline-grid size-6 place-items-center rounded-full bg-[#722F3712] text-[#722F37]">
                                      <Check size={14} strokeWidth={2.5} />
                                    </span>
                                  )
                                ) : (
                                  <span className="text-base font-medium text-[#8C877F40]">—</span>
                                )
                              ) : (
                                <span className="text-xs font-medium text-[#161616]">{row.foreverPro}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                  </tbody>

                  <tfoot>
                    <tr className={`border-t ${line}`}>
                      <td className="pt-8 pr-6 text-xs text-[#8C877F]">
                        Checkout seguro via Stripe com aprovação imediata. Pagamento único com 0% de comissão sobre seus presentes.
                      </td>
                      <td className={`border-l ${line} px-6 pt-8 text-center`}>
                        {renderPlanButton("essencial", true)}
                      </td>
                      <td className={`border-l ${line} px-6 pt-8 text-center`}>
                        {renderPlanButton("foreverPro", true)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Reveal>
          </div>
        </section>

        {/* FAQ */}
        <section id="duvidas" className={`relative overflow-clip scroll-mt-20 border-t ${line} px-6 py-28 sm:px-10 sm:py-36`}>
          <BotanicalClassicOrnaments variant="floral" tone="paper" />
          <div className="relative mx-auto grid max-w-6xl gap-16 lg:grid-cols-[1fr_1.6fr] lg:gap-24">
            <Reveal>
              <Eyebrow>Dúvidas</Eyebrow>
              <h2 className="mt-5 text-[clamp(32px,4vw,52px)] font-medium leading-[1.04] tracking-[-0.045em]">
                Perguntas <Accent>frequentes.</Accent>
              </h2>
              <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-[#6B6760]">
                Tire suas dúvidas sobre o funcionamento da plataforma, pagamentos e personalização.
              </p>
            </Reveal>
            <div className={`border-b ${line}`}>
              {faqs.map(([question, answer], index) => {
                const open = openFaq === index;
                return (
                  <div key={question} className={`border-t ${line}`}>
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenFaq(open ? null : index)}
                      className="flex w-full items-center justify-between gap-6 py-6 text-left text-base font-medium text-[#161616] transition-colors hover:text-[#722F37]"
                    >
                      {question}
                      <Plus size={18} className={`shrink-0 text-[#722F37] transition-transform duration-300 ${open ? "rotate-45" : ""}`} />
                    </button>
                    <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                      <div className="overflow-hidden">
                        <p className="max-w-xl pb-6 text-[15px] leading-relaxed text-[#6B6760]">{answer}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className={`relative overflow-hidden border-t ${line} px-6 py-32 text-center sm:px-10 sm:py-44`}>
          <BotanicalClassicOrnaments variant="hearts" tone="paper" />
          <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="size-[640px] rounded-full border border-[#722F370f]" />
            <div className="absolute inset-[90px] rounded-full border border-[#722F370f]" />
          </div>
          <Reveal className="relative mx-auto max-w-3xl">
            <Eyebrow>Forever</Eyebrow>
            <h2 className="mt-6 text-[clamp(40px,6vw,84px)] font-medium leading-[0.98] tracking-[-0.05em]">
              Vamos começar o <br />
              seu <Accent>para sempre?</Accent>
            </h2>
            <p className="mx-auto mt-8 max-w-md text-base leading-relaxed text-[#6B6760]">
              Crie o site do seu casamento em poucos minutos. Sem burocracia, pronto para usar na mesma hora.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {user ? (
                <>
                  <PrimaryButton href={panelHref}>
                    Ir para o meu painel
                  </PrimaryButton>
                  <GhostButton href="#preco">
                    {userWedding?.plan ? "Ver meu plano" : "Ver planos"}
                  </GhostButton>
                </>
              ) : (
                <>
                  <PrimaryButton href="#preco">
                    Ver plano e começar
                  </PrimaryButton>
                  <GhostButton href="/login">Acessar meu painel</GhostButton>
                </>
              )}
            </div>
          </Reveal>
        </section>
      </main>

      {/* Footer */}
      <footer className={`border-t ${line} px-6 pt-16 pb-12 sm:px-10 sm:pt-20`}>
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr] lg:gap-20">
            {/* Brand side */}
            <div>
              <Link href="/" aria-label="Forever — início" className="inline-block">
                <ForeverLogo className="w-28" />
              </Link>
              <p className="mt-5 text-sm font-medium text-[#161616]">
                Feito para guardar o que importa.
              </p>
              <p className="mt-2 max-w-sm text-xs leading-relaxed text-[#6B6760]">
                O site do seu casamento com tipografia autoral, convites em PDF com QR Code exclusivo e organização completa para o grande dia.
              </p>
              <div className="mt-6 flex items-center gap-2">
                <a
                  href="https://www.instagram.com/_magui.studio"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram da MAGUI.studio (abre em nova aba)"
                  className="grid size-9 place-items-center rounded-full border border-[#16161615] bg-[#16161606] text-[#6B6760] transition-colors hover:border-[#722F37] hover:bg-[#722F3710] hover:text-[#722F37]"
                >
                  <InstagramIcon size={15} />
                </a>
                <a
                  href="https://www.linkedin.com/company/magui-studio"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn da MAGUI.studio (abre em nova aba)"
                  className="grid size-9 place-items-center rounded-full border border-[#16161615] bg-[#16161606] text-[#6B6760] transition-colors hover:border-[#722F37] hover:bg-[#722F3710] hover:text-[#722F37]"
                >
                  <LinkedinIcon size={15} />
                </a>
                <a
                  href="https://x.com/magui_studio"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X da MAGUI.studio (abre em nova aba)"
                  className="grid size-9 place-items-center rounded-full border border-[#16161615] bg-[#16161606] text-[#6B6760] transition-colors hover:border-[#722F37] hover:bg-[#722F3710] hover:text-[#722F37]"
                >
                  <XIcon size={14} />
                </a>
                <span className="ml-2 text-[11px] text-[#8C877F]">
                  Acompanhe o studio
                </span>
              </div>
            </div>

            {/* Links columns */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3">
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#722F37]">
                  Explore o Forever
                </h3>
                <ul className="mt-4 space-y-3 text-xs">
                  <li>
                    <a href="#recursos" className="text-[#6B6760] transition-colors hover:text-[#161616]">
                      Recursos
                    </a>
                  </li>
                  <li>
                    <a href="#modulos" className="text-[#6B6760] transition-colors hover:text-[#161616]">
                      Módulos
                    </a>
                  </li>
                  <li>
                    <a href="#templates" className="text-[#6B6760] transition-colors hover:text-[#161616]">
                      Templates
                    </a>
                  </li>
                  <li>
                    <a href="#preco" className="text-[#6B6760] transition-colors hover:text-[#161616]">
                      Preço
                    </a>
                  </li>
                  <li>
                    <a href="#duvidas" className="text-[#6B6760] transition-colors hover:text-[#161616]">
                      Dúvidas frequentes
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#722F37]">
                  Seu espaço
                </h3>
                <ul className="mt-4 space-y-3 text-xs">
                  {user ? (
                    <>
                      <li>
                        <Link href={panelHref} className="text-[#6B6760] transition-colors hover:text-[#161616]">
                          Acessar meu painel
                        </Link>
                      </li>
                      <li>
                        <Link href={receptionHref} className="text-[#6B6760] transition-colors hover:text-[#161616]">
                          Área da recepção
                        </Link>
                      </li>
                      <li>
                        <a href="#preco" className="text-[#6B6760] transition-colors hover:text-[#161616]">
                          {userWedding?.plan ? "Meu plano & Assinatura" : "Planos & Assinatura"}
                        </a>
                      </li>
                    </>
                  ) : (
                    <>
                      <li>
                        <a href="#preco" className="text-[#6B6760] transition-colors hover:text-[#161616]">
                          Criar meu site
                        </a>
                      </li>
                      <li>
                        <Link href="/login" className="text-[#6B6760] transition-colors hover:text-[#161616]">
                          Acessar meu painel
                        </Link>
                      </li>
                      <li>
                        <Link href="/login" className="text-[#6B6760] transition-colors hover:text-[#161616]">
                          Área da recepção
                        </Link>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#722F37]">
                  Por trás do Forever
                </h3>
                <ul className="mt-4 space-y-3 text-xs">
                  <li>
                    <a
                      href={STUDIO_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1 text-[#6B6760] transition-colors hover:text-[#161616]"
                    >
                      <span>MAGUI.studio</span>
                      <ArrowUpRight size={11} className="text-[#8C877F] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://portfolio.magui.studio/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1 text-[#6B6760] transition-colors hover:text-[#161616]"
                    >
                      <span>Nosso portfólio</span>
                      <ArrowUpRight size={11} className="text-[#8C877F] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://flow.magui.studio/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1 text-[#6B6760] transition-colors hover:text-[#161616]"
                    >
                      <span>Flow</span>
                      <ArrowUpRight size={11} className="text-[#8C877F] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className={`mt-14 flex flex-col gap-5 border-t ${line} pt-8 sm:flex-row sm:items-center sm:justify-between text-xs text-[#8C877F]`}>
            <a
              href={STUDIO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex w-fit items-center gap-1 hover:text-[#161616] transition-colors"
            >
              <span>Um produto</span>
              <strong className="font-medium text-[#161616] group-hover:underline">MAGUI.studio</strong>
              <ArrowUpRight size={12} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
              <span>© {new Date().getFullYear()} Forever. Todos os direitos reservados.</span>
              <a
                href="#inicio"
                className="group inline-flex items-center gap-1 hover:text-[#722F37] transition-colors"
              >
                <span>Voltar ao topo</span>
                <ArrowUp size={12} className="transition-transform duration-300 group-hover:-translate-y-1" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
