"use client";

import {Heart} from "lucide-react";

export function RomanceFooterHearts(){
 return <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden text-white opacity-[0.06]">
  <Heart className="h-auto w-[min(90vw,900px)] shrink-0 -rotate-12" strokeWidth={0.5}/>
 </div>;
}
