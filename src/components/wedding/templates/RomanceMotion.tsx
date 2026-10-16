"use client";
import { useRef, type ReactNode } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
const ease = [0.22, 1, 0.36, 1] as const;
export function RomanceReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: reduced ? 0 : 1, delay: reduced ? 0 : delay, ease }}
    >
      {children}
    </motion.div>
  );
}

export function RomancePhoto({
  src,
  className = "",
  preload = false,
  parallax = true,
  sizes = "(min-width: 1024px) 50vw, 100vw",
}: {
  src: string;
  className?: string;
  preload?: boolean;
  parallax?: boolean;
  sizes?: string;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: frame, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);
  if (!src) return null;
  return (
    <motion.div
      ref={frame}
      className={`relative isolate overflow-hidden bg-[var(--forever-primary)]/10 ${className}`}
      initial={reduced || preload ? false : { clipPath: "inset(8% 0 8% 0)" }}
      whileInView={{ clipPath: "inset(0% 0 0% 0)" }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: reduced ? 0 : 1.2, ease }}
    >
      <motion.div
        className="absolute -inset-y-[8%] inset-x-0"
        style={reduced || !parallax ? undefined : { y }}
      >
        <Image src={src} alt="" fill preload={preload} sizes={sizes} className="object-cover" />
      </motion.div>
    </motion.div>
  );
}
