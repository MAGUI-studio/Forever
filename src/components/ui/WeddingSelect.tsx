"use client";
import { useRef, useState, type CSSProperties } from "react";
import * as Select from "@radix-ui/react-select";
import { CaretDownIcon, CaretUpIcon, CheckIcon } from "@phosphor-icons/react";
export type WeddingSelectOption = { value: string; label: string; disabled?: boolean };
export function WeddingSelect({
  value,
  onValueChange,
  options,
  placeholder = "Selecione uma opção",
  label,
  id,
  disabled,
  required,
  tone = "wedding",
  className = "",
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: WeddingSelectOption[];
  placeholder?: string;
  label?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  tone?: "wedding" | "studio";
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const [portalStyle, setPortalStyle] = useState<CSSProperties>({});
  function syncPortalTheme(open: boolean) {
    if (!open || !trigger.current) return;
    const style = getComputedStyle(trigger.current);
    setPortalStyle(
      Object.fromEntries(
        [
          "--forever-primary",
          "--forever-primary-hover",
          "--forever-ink",
          "--forever-accent",
          "--forever-sand",
          "--forever-hover-tint",
          "--forever-hover-border",
          "--forever-focus",
          "--wedding-radius",
        ]
          .map((key) => [key, style.getPropertyValue(key)])
          .filter(([, value]) => value.trim()),
      ) as CSSProperties,
    );
  }
  return (
    <Select.Root
      onOpenChange={syncPortalTheme}
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      required={required}
    >
      <Select.Trigger
        ref={trigger}
        id={id}
        className={
          "guest-input wedding-select-trigger " +
          (tone === "studio"
            ? "border-[#16161620]! bg-white! text-[#161616]! focus-visible:outline-[#722F37]! "
            : "") +
          className
        }
        aria-label={label}
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon>
          <CaretDownIcon size={15} weight="bold" aria-hidden="true" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          style={tone === "wedding" ? portalStyle : undefined}
          className={
            "wedding-select-content " +
            (tone === "studio"
              ? "[--forever-primary:#722F37] [--forever-ink:#161616] [--wedding-radius:12px] border-[#16161615]! bg-white! text-[#161616]! [&_[data-highlighted]]:bg-[#722F3708]! [&_[data-highlighted]]:text-[#722F37]!"
              : "")
          }
          position="popper"
          sideOffset={7}
          collisionPadding={12}
        >
          <Select.ScrollUpButton className="wedding-select-scroll">
            <CaretUpIcon size={15} aria-hidden="true" />
          </Select.ScrollUpButton>
          <Select.Viewport className="wedding-select-viewport">
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="wedding-select-item"
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className="wedding-select-check">
                  <CheckIcon size={15} weight="bold" aria-hidden="true" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
          <Select.ScrollDownButton className="wedding-select-scroll">
            <CaretDownIcon size={15} aria-hidden="true" />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
