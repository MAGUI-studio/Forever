import type {ComponentPropsWithoutRef} from "react";
export function AdminButton({variant="primary",className="",type="button",...props}:ComponentPropsWithoutRef<"button">&{variant?:"primary"|"ghost"}){
 return <button type={type} className={"inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[var(--wedding-radius)] px-5 text-xs font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forever-primary,#5D613C)] disabled:cursor-not-allowed disabled:opacity-50 "+(variant==="primary"?"bg-[var(--forever-primary,#5D613C)]! text-white! enabled:hover:bg-[#4b4f30]!":"bg-transparent! text-[var(--forever-primary,#5D613C)]! enabled:hover:bg-[#5d613c0d]!")+" "+className} {...props}/>;
}
