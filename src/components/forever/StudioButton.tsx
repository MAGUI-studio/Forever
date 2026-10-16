import type { ComponentPropsWithoutRef } from "react";

export function StudioButton({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ComponentPropsWithoutRef<"button"> & { variant?: "primary" | "ghost" }) {
  return (
    <button
      type={type}
      className={
        "inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#722F37] disabled:cursor-not-allowed disabled:opacity-50 " +
        (variant === "primary"
          ? "bg-[var(--forever-primary,#722F37)] text-white enabled:hover:bg-[var(--forever-primary-hover,#5B252C)]"
          : "bg-transparent text-[#722F37] enabled:hover:bg-[#722F3708] enabled:hover:text-[#5B252C]") +
        " " +
        className
      }
      {...props}
    />
  );
}
