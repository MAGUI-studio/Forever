import type { ComponentPropsWithoutRef } from "react";

type AdminContainerProps = ComponentPropsWithoutRef<"div"> & {
  variant?: "page" | "content";
  centered?: boolean;
};

/** Shared page width, gutters and spacing below the admin header. */
export function AdminContainer({ variant = "page", centered = false, className = "", ...props }: AdminContainerProps) {
  const layout = variant === "content"
    ? "pt-8! md:pt-12!"
    : "mx-auto w-[calc(100%-36px)] min-[701px]:w-[calc(100%-56px)] min-[1001px]:w-[min(1240px,calc(100%-96px))] " +
      (centered ? "flex min-h-svh flex-col justify-center py-8" : "pb-6");
  return <div className={layout + " " + className} {...props} />;
}
