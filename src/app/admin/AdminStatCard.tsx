import type {ReactNode} from "react";
export function AdminStatCard({label,value,icon,primary=false,caption,loading=false}: {label:string;value:number;icon:ReactNode;primary?:boolean;caption?:string;loading?:boolean}){
 return <article aria-busy={loading} className={"relative isolate flex min-h-36 flex-col justify-between overflow-hidden rounded-[var(--wedding-radius)] p-4 sm:min-h-40 sm:p-5 "+(primary?"bg-[var(--forever-primary,#5D613C)] text-[#F5F5DA]":"border border-[#5d613c20] bg-[#fffdfa] text-[var(--forever-primary,#5D613C)]")}>
  <span aria-hidden="true" className="pointer-events-none absolute -right-4 -bottom-4 rotate-[-12deg] opacity-10 [&>svg]:size-[110px]">{icon}</span>
  <p className="relative text-xs sm:text-sm">{label}</p><strong className="relative my-2 font-serif text-4xl font-normal leading-none sm:text-5xl">{loading?<span className="inline-block h-[1em] w-[1ch] animate-pulse rounded bg-current opacity-15 motion-reduce:animate-none"/>:value}</strong>
  {caption&&<span className="relative text-[10px] opacity-75 sm:text-xs">{caption}</span>}
 </article>;
}
