"use client";

import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, Flower2, Heart, Sparkles, Waves } from "lucide-react";
import { templateCatalog, type TemplateId } from "@/config/templates/registry";
import { templatePalettes } from "@/config/templates/theme";
import { foreverTheme } from "@/config/brand";

function TemplateIcon({ id }: { id: string }) {
  if (id === "contemporary-romance")
    return <Heart size={76} strokeWidth={1.25} aria-hidden="true" />;
  if (id === "minimalist-modern")
    return <Sparkles size={76} strokeWidth={1.25} aria-hidden="true" />;
  if (id === "serene-breeze") return <Waves size={76} strokeWidth={1.25} aria-hidden="true" />;
  return <Flower2 size={76} strokeWidth={1.25} aria-hidden="true" />;
}

export function TemplateSelect({
  value,
  onValueChange,
}: {
  value: TemplateId;
  onValueChange: (value: TemplateId) => void;
}) {
  const selected = templateCatalog.find((template) => template.id === value) ?? templateCatalog[0];
  const selectedPalette = templatePalettes[value] ?? templatePalettes["botanical-classic"];
  return (
    <Select.Root value={value} onValueChange={(next) => onValueChange(next as TemplateId)}>
      <Select.Trigger
        aria-label="Template do site"
        className="group relative flex h-20 w-full items-stretch overflow-hidden rounded-[var(--wedding-radius)] border border-neutral-200/80 bg-white text-left transition-colors hover:border-[#722F37] focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
      >
        <span
          aria-hidden="true"
          className="w-1.5 shrink-0 transition-colors"
          style={{ backgroundColor: selectedPalette.primary }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-3 right-9 rotate-[-12deg] opacity-[0.09]"
          style={{ color: selectedPalette.primary }}
        >
          <TemplateIcon id={value} />
        </span>
        <span className="relative flex min-w-0 flex-1 flex-col justify-center gap-1 px-3">
          <span className="text-[9px] uppercase tracking-[0.16em] text-[var(--forever-accent,#77736c)]">
            Template selecionado
          </span>
          <Select.Value>
            <span className="block text-[13px] font-medium leading-5 text-[var(--forever-ink,#161616)]">
              {selected.name}
            </span>
          </Select.Value>
        </span>
        <Select.Icon className="relative flex w-9 shrink-0 items-center justify-center text-[var(--forever-primary,#722F37)]">
          <ChevronDown
            size={18}
            className="transition-transform group-data-[state=open]:rotate-180"
          />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={8}
          collisionPadding={12}
          style={{
            ...foreverTheme,
            position: "relative",
            zIndex: 10000,
            pointerEvents: "auto",
            backgroundColor: "#ffffff",
          }}
          className="isolate max-h-[var(--radix-select-content-available-height)] w-[var(--radix-select-trigger-width)] overflow-y-auto rounded-[var(--wedding-radius)] border border-neutral-200/80 bg-white shadow-[0_16px_48px_rgba(22,22,22,0.1)]"
        >
          <Select.Viewport style={{ backgroundColor: "#ffffff" }}>
            {templateCatalog.map((template) => {
              const isComingSoon = "isComingSoon" in template && Boolean(template.isComingSoon);
              const palette =
                templatePalettes[template.id] ?? templatePalettes["botanical-classic"];
              return (
                <Select.Item
                  key={template.id}
                  value={template.id}
                  disabled={isComingSoon}
                  textValue={template.name}
                  className={`group relative flex h-20 items-stretch overflow-hidden border-b border-[#722f3715] last:border-b-0 outline-none transition-colors ${
                    isComingSoon
                      ? "cursor-not-allowed opacity-55 select-none"
                      : "cursor-pointer data-[highlighted]:bg-[#722F370d] data-[state=checked]:bg-[#722F370d]"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="w-1.5 shrink-0"
                    style={{ backgroundColor: palette.primary }}
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-3 right-9 rotate-[-12deg] opacity-[0.09]"
                    style={{ color: palette.primary }}
                  >
                    <TemplateIcon id={template.id} />
                  </span>
                  <span className="relative flex min-w-0 flex-1 flex-col justify-center px-3">
                    <Select.ItemText>
                      <span className="flex items-center gap-2 text-[13px] font-medium leading-5 text-[var(--forever-ink,#161616)]">
                        {template.name}
                        {isComingSoon && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#722F3730] bg-[#722F3712] px-2 py-0.5 text-[10px] font-medium text-[#722F37]">
                            <Heart size={9} className="fill-[#722F37]" />
                            Forever PRO · Em breve
                          </span>
                        )}
                      </span>
                    </Select.ItemText>
                    <span className="mt-0.5 block text-[11px] leading-4 text-[var(--forever-accent,#77736c)]">
                      {template.description}
                    </span>
                  </span>
                  <span className="relative flex w-9 shrink-0 items-center justify-center text-[var(--forever-primary,#722F37)]">
                    {!isComingSoon && (
                      <Select.ItemIndicator>
                        <Check size={16} aria-hidden="true" />
                      </Select.ItemIndicator>
                    )}
                  </span>
                </Select.Item>
              );
            })}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
