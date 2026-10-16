import Image from "next/image";

export function ForeverBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -right-40 -top-48 size-[700px] rounded-full border border-[#722F3708]" />
      <div className="absolute -right-24 -top-32 size-[570px] rounded-full border border-[#722F3708]" />
      <Image
        src="/forever/icon_black.svg"
        alt=""
        width={500}
        height={500}
        className="absolute -bottom-28 -right-20 w-[420px] -rotate-12 opacity-[0.025]"
      />
      <div className="absolute -left-20 top-1/3 size-64 rotate-45 rounded-[48px] border border-[#722F3706]" />
    </div>
  );
}
