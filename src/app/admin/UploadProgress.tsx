import { Check, Loader2 } from "lucide-react";
export function UploadProgress({
  isUploading,
  isAutoSaving,
  progress,
  variant,
}: {
  isUploading: boolean;
  isAutoSaving: boolean;
  progress: number;
  variant: "single" | "gallery";
}) {
  const gallery = variant === "gallery";
  return (
    <div className={gallery ? "mt-4 space-y-2" : "space-y-1.5 pt-1"}>
      <div className="flex items-center justify-between text-xs text-[var(--forever-primary,#722F37)]">
        <span className="flex items-center gap-1.5 font-medium">
          <Loader2 size={gallery ? 13 : 12} className="animate-spin" />
          {isUploading
            ? gallery
              ? "Enviando fotos para a nuvem…"
              : "Enviando foto para a nuvem…"
            : isAutoSaving
              ? gallery
                ? "Salvando alterações automaticamente no site…"
                : "Salvando alterações no site…"
              : gallery
                ? "Atualizando galeria…"
                : "Atualizando foto…"}
        </span>
        <span className="font-semibold">
          {isUploading ? `${progress}%` : <Check size={gallery ? 14 : 13} />}
        </span>
      </div>
      <div
        className={
          gallery
            ? "h-2 w-full overflow-hidden rounded-full bg-[var(--forever-sand,#EFECE6)]"
            : "h-1.5 w-full overflow-hidden rounded-full bg-[var(--forever-sand,#EFECE6)]"
        }
      >
        <div
          className="h-full rounded-full bg-[var(--forever-primary,#722F37)] transition-all duration-300"
          style={{ width: isUploading ? `${progress}%` : "100%" }}
        />
      </div>
    </div>
  );
}
