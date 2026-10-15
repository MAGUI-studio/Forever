"use client";
import {foreverTheme} from "@/config/brand";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";
import { LogOut,  LayoutDashboard } from "lucide-react";
import { ForeverLogo } from "./ForeverLogo";
import { ForeverBackground } from "./ForeverBackground";
import { StudioButton } from "./StudioButton";

export const studioTheme=foreverTheme;

export function StudioShell({children,email}:{children:ReactNode;email?:string}) {
  const pathname=usePathname(),router=useRouter();
  return <main style={studioTheme} className="relative mx-auto min-h-svh w-full max-w-440 bg-[var(--page-background,#F1F1F1)] text-[#161616]">
    <ForeverBackground/>
    <div className="relative px-5 pb-6 sm:px-8 lg:px-12">
      <header className="flex flex-wrap items-center justify-between gap-5 border-b border-[#16161610] py-5 sm:py-6">
        <Link href="/studio" aria-label="Forever Studio — casamentos"><ForeverLogo className="w-44 sm:w-56"/></Link>
        <nav aria-label="Administração Forever" className="order-last flex w-full gap-2 sm:order-none sm:w-auto">{[{href:"/studio",label:"Casamentos",Icon:LayoutDashboard}].map(({href,label,Icon})=><Link key={href} href={href} aria-current={pathname===href?"page":undefined} className={"inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm transition-colors "+(pathname===href?"bg-[#722F37] text-white":"text-[#77736c] hover:bg-[#722F3708] hover:text-[#722F37]")}><Icon size={16}/>{label}</Link>)}</nav>
        <div className="flex items-center gap-2"><span className="hidden text-xs text-[#77736c] xl:block">{email}</span><StudioButton variant="ghost" onClick={()=>void signOut(clientAuth()).then(()=>router.replace("/login"))}><LogOut size={16}/><span className="hidden sm:inline">Sair</span></StudioButton></div>
      </header>
      <div className="pt-8 md:pt-12">{children}</div>
    </div>
  </main>;
}
