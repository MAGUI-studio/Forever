"use client";
import { useSiteCopy } from "./useSiteCopy";

import { useState, useEffect } from "react";

interface CountdownProps {
  targetDateISO: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

export function Countdown({ targetDateISO }: CountdownProps) {
  const copy = useSiteCopy();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const difference = +new Date(targetDateISO) - +new Date();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isPast: false,
      });
    };
    const initialTick = setTimeout(() => {
      setMounted(true);
      calculateTime();
    }, 0);
    const interval = setInterval(calculateTime, 1000);
    return () => {
      clearTimeout(initialTick);
      clearInterval(interval);
    };
  }, [targetDateISO]);

  if (!Number.isFinite(Date.parse(targetDateISO))) return null;

  if (timeLeft.isPast) {
    return (
      <div
        id="contagem-regressiva"
        className="inline-flex items-center gap-3 py-2 text-white font-serif text-xl sm:text-2xl tracking-widest uppercase"
      >
        <span>{copy("countdown.text1")}</span>
      </div>
    );
  }

  const units = [
    { label: copy("countdown.text4"), value: timeLeft.days },
    { label: copy("countdown.text5"), value: timeLeft.hours },
    { label: copy("countdown.text6"), value: timeLeft.minutes },
    { label: copy("countdown.text7"), value: timeLeft.seconds },
  ];

  return (
    <div
      id="contagem-regressiva"
      aria-busy={!mounted}
      className="inline-flex items-baseline justify-center gap-4 sm:gap-8 md:gap-12 select-none"
    >
      {units.map((unit, index) => (
        <div key={unit.label} className="flex items-baseline gap-4 sm:gap-8 md:gap-12">
          <div className="flex flex-col items-center">
            <span
              className={`inline-block text-center font-serif text-4xl sm:text-5xl md:text-6xl font-light text-white tracking-tight tabular-nums ${index === 0 ? "w-[3ch]" : "w-[2ch]"}`}
            >
              {mounted ? unit.value.toString().padStart(2, "0") : index === 0 ? "---" : "--"}
            </span>
            <span className="text-[9px] sm:text-[10px] font-mono tracking-[0.3em] text-white uppercase mt-1">
              {unit.label}
            </span>
          </div>
          {index < units.length - 1 && (
            <span className="font-serif text-2xl sm:text-3xl text-white/60 font-light select-none">
              {copy("countdown.text2")}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
