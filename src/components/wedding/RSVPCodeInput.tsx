"use client";

import { useEffect, useRef } from "react";

type RSVPCodeInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (code: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  autoFocus?: boolean;
};

export function RSVPCodeInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  hasError = false,
  autoFocus = false,
}: RSVPCodeInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Parse current string into array of 6 characters
  const clean = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const digits = Array.from({ length: 6 }, (_, i) => clean[i] || "");

  useEffect(() => {
    if (autoFocus && inputsRef.current[0] && !clean) {
      inputsRef.current[0].focus();
    }
  }, [autoFocus, clean]);

  function handleChange(index: number, char: string) {
    const raw = char.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (!raw) return;

    if (raw.length > 1) {
      handlePastedString(raw);
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = raw[0];
    const newClean = nextDigits.join("");
    const formatted =
      newClean.length >= 3
        ? newClean.slice(0, 3) + "-" + newClean.slice(3)
        : newClean;

    onChange(formatted);

    // Auto-advance to next input
    if (index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are filled
    if (newClean.length === 6) {
      onSubmit(newClean.slice(0, 3) + "-" + newClean.slice(3));
    }
  }

  function handleKeyDown(
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Backspace") {
      event.preventDefault();
      const nextDigits = [...digits];
      if (nextDigits[index]) {
        nextDigits[index] = "";
      } else if (index > 0) {
        nextDigits[index - 1] = "";
        inputsRef.current[index - 1]?.focus();
      }
      const newClean = nextDigits.join("");
      const formatted =
        newClean.length >= 3
          ? newClean.slice(0, 3) + "-" + newClean.slice(3)
          : newClean;
      onChange(formatted);
    } else if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputsRef.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < 5) {
      event.preventDefault();
      inputsRef.current[index + 1]?.focus();
    } else if (event.key === "Enter") {
      event.preventDefault();
      const full = digits.join("");
      if (full.length === 6) {
        onSubmit(full.slice(0, 3) + "-" + full.slice(3));
      }
    }
  }

  function handlePastedString(pasted: string) {
    const cleanPasted = pasted
      .replace(/[^A-Za-z0-9]/g, "")
      .toUpperCase()
      .slice(0, 6);
    if (!cleanPasted) return;

    const formatted =
      cleanPasted.length >= 3
        ? cleanPasted.slice(0, 3) + "-" + cleanPasted.slice(3)
        : cleanPasted;

    onChange(formatted);

    const targetFocus = Math.min(cleanPasted.length, 5);
    inputsRef.current[targetFocus]?.focus();

    if (cleanPasted.length === 6) {
      onSubmit(cleanPasted.slice(0, 3) + "-" + cleanPasted.slice(3));
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text");
    handlePastedString(pasted);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        role="group"
        aria-label="Código de convite de 6 caracteres"
        className="flex items-center justify-center gap-1.5 sm:gap-3"
      >
        {/* First group of 3 */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {[0, 1, 2].map((idx) => (
            <input
              key={idx}
              ref={(el) => {
                inputsRef.current[idx] = el;
              }}
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="one-time-code"
              spellCheck="false"
              maxLength={2}
              value={digits[idx] || ""}
              disabled={disabled}
              onChange={(e) => handleChange(idx, e.target.value.slice(-1))}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={handlePaste}
              aria-label={`Dígito ${idx + 1} de 6`}
              className={`h-13 w-10 sm:h-15 sm:w-12 rounded-[var(--wedding-radius,12px)] border text-center font-mono text-xl sm:text-2xl font-semibold uppercase transition-all select-all ${
                hasError
                  ? "border-red-400 bg-red-50/40 text-red-900 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                  : digits[idx]
                  ? "border-[var(--forever-primary,#5D613C)]/50 bg-[#fffdfa] text-[var(--forever-ink,#3D2501)] focus:border-[var(--forever-primary,#5D613C)] focus:ring-2 focus:ring-[var(--forever-primary,#5D613C)]/20"
                  : "border-[#5d613c25] bg-[#fffdfa] text-[var(--forever-ink,#3D2501)] hover:border-[var(--forever-primary,#5D613C)]/40 focus:border-[var(--forever-primary,#5D613C)] focus:ring-2 focus:ring-[var(--forever-primary,#5D613C)]/20"
              } outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
            />
          ))}
        </div>

        {/* Separator hyphen */}
        <span
          aria-hidden="true"
          className="px-0.5 text-lg sm:text-2xl font-medium text-[var(--forever-accent,#80654E)] select-none opacity-60"
        >
          —
        </span>

        {/* Second group of 3 */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {[3, 4, 5].map((idx) => (
            <input
              key={idx}
              ref={(el) => {
                inputsRef.current[idx] = el;
              }}
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="one-time-code"
              spellCheck="false"
              maxLength={2}
              value={digits[idx] || ""}
              disabled={disabled}
              onChange={(e) => handleChange(idx, e.target.value.slice(-1))}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={handlePaste}
              aria-label={`Dígito ${idx + 1} de 6`}
              className={`h-13 w-10 sm:h-15 sm:w-12 rounded-[var(--wedding-radius,12px)] border text-center font-mono text-xl sm:text-2xl font-semibold uppercase transition-all select-all ${
                hasError
                  ? "border-red-400 bg-red-50/40 text-red-900 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                  : digits[idx]
                  ? "border-[var(--forever-primary,#5D613C)]/50 bg-[#fffdfa] text-[var(--forever-ink,#3D2501)] focus:border-[var(--forever-primary,#5D613C)] focus:ring-2 focus:ring-[var(--forever-primary,#5D613C)]/20"
                  : "border-[#5d613c25] bg-[#fffdfa] text-[var(--forever-ink,#3D2501)] hover:border-[var(--forever-primary,#5D613C)]/40 focus:border-[var(--forever-primary,#5D613C)] focus:ring-2 focus:ring-[var(--forever-primary,#5D613C)]/20"
              } outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
