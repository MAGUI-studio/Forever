import { twMerge } from "tailwind-merge";
import Image from "next/image";

export function ForeverLogo({
  light = false,
  className = "",
}: {
  light?: boolean;
  className?: string;
}) {
  return (
    <Image
      src={light ? "/forever/logo_white_no_text.svg" : "/forever/logo_black_no_text.svg"}
      alt="Forever"
      width={1422}
      height={454}
      priority
      className={twMerge("h-auto w-48", className)}
    />
  );
}
