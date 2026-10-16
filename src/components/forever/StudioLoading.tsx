import Image from "next/image";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { foreverTheme } from "@/config/brand";
import { ForeverBackground } from "./ForeverBackground";

export function StudioLoading() {
  return (
    <LoadingScreen
      style={foreverTheme}
      icon={
        <Image
          src="/forever/icon_black.svg"
          alt=""
          width={40}
          height={40}
          priority
          className="size-10 object-contain"
        />
      }
      background={<ForeverBackground />}
      description="Estamos carregando as informações do Forever. Só um instante…"
    />
  );
}
