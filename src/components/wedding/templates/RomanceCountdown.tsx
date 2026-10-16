"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Heart } from "lucide-react";
import { useSiteCopy } from "../useSiteCopy";

export function RomanceCountdown({ date }: { date: string }) {
  const copy = useSiteCopy();
  const reduced = useReducedMotion();
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setRemaining(Math.max(0, new Date(date).getTime() - Date.now()));
    const first = setTimeout(update, 0),
      timer = setInterval(update, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [date]);
  const values =
    remaining === null
      ? null
      : [
          Math.floor(remaining / 86400000),
          Math.floor(remaining / 3600000) % 24,
          Math.floor(remaining / 60000) % 60,
          Math.floor(remaining / 1000) % 60,
        ];
  return (
    <div id="contagem-regressiva" className="mx-auto mt-10 w-full max-w-[410px]">
      {remaining === 0 ? (
        <p
          role="status"
          className="flex items-center justify-center gap-3 font-serif text-2xl italic text-white"
        >
          <Heart size={18} strokeWidth={1} />
          {copy("romance.countdown.arrived")}
        </p>
      ) : (
        <>
          <p className="mb-4 font-serif text-lg italic text-white/85">
            {copy("romance.countdown.intro")}
          </p>
          <div
            aria-label="Contagem regressiva para o casamento"
            aria-busy={remaining === null}
            className="grid grid-cols-4 gap-2 sm:gap-3"
          >
            {["dias", "horas", "minutos", "segundos"].map((label, index) => {
              const value = values ? String(values[index]).padStart(2, "0") : "--";
              return (
                <div
                  key={label}
                  className="relative overflow-hidden rounded-t-xl rounded-b-md border border-white/50 bg-[#F1F1F1] px-1 pb-3 pt-4 text-[#722F37] shadow-[0_8px_24px_#250d1814]"
                >
                  <span
                    aria-hidden="true"
                    className="absolute left-2 top-2 size-1 rounded-full bg-[#722F37]/20"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute right-2 top-2 size-1 rounded-full bg-[#722F37]/20"
                  />
                  <div className="relative h-11 overflow-hidden border-b border-[#722F37]/15 pb-2 sm:h-12">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={value}
                        initial={reduced ? false : { y: -18, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={reduced ? undefined : { y: 18, opacity: 0 }}
                        transition={{ duration: reduced ? 0 : 0.28 }}
                        className="block font-serif text-3xl font-light leading-none tabular-nums sm:text-4xl"
                      >
                        {value}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                  <span className="mt-2 block text-[8px] uppercase tracking-[0.12em] text-[#82656C] sm:text-[9px]">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
