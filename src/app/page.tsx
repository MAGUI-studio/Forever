import Link from "next/link";
import {ArrowUpRight,ArrowRight} from "lucide-react";
import {foreverTheme} from "@/config/brand";
import {ForeverLogo} from "@/components/forever/ForeverLogo";
import {ForeverBackground} from "@/components/forever/ForeverBackground";

export default function ForeverHome(){
 return <main style={foreverTheme} className="relative mx-auto flex min-h-svh w-full max-w-440 flex-col overflow-hidden bg-[#f6f5f2] px-6 text-[#161616] sm:px-10">
  <ForeverBackground/>
  <div className="relative flex flex-1 flex-col items-center justify-center py-16 text-center sm:py-24">
   <ForeverLogo className="mb-10 w-72 max-w-full sm:mb-12 sm:w-[400px]"/>
   <span className="inline-flex items-center gap-2 rounded-full border border-[#722F3720] bg-[#722F3705] px-4 py-2 text-[10px] font-medium uppercase tracking-[0.22em] text-[#722F37]"><span aria-hidden="true" className="size-1.5 rounded-full bg-[#722F37]"/>Em breve</span>
   <h1 className="mt-7 max-w-3xl font-serif text-[clamp(42px,6vw,78px)] leading-[1.02] tracking-[-0.035em]">Um novo começo.<br/><em className="font-light text-[#722F37]">Infinitas histórias.</em></h1>
   <p className="mt-6 max-w-md text-sm leading-relaxed text-[#77736c] sm:text-base">Nossa página inicial está em construção. Estamos preparando um lugar especial para apresentar tudo o que o Forever pode fazer pelo seu grande dia.</p>
   <div className="mt-9 flex flex-col items-center gap-4"><Link href="/login" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl bg-[#722F37] px-7 py-4 text-sm font-medium text-white transition-colors hover:bg-[#5B252C] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#722F37]">Acessar meu espaço<ArrowRight size={17}/></Link><p className="text-xs text-[#928b82]">Já faz parte do Forever? Seu painel continua disponível.</p></div>
  </div>
  <footer className="relative flex flex-wrap items-center justify-center gap-4 border-t border-[#16161608] py-6 text-xs text-[#928b82]"><span>Feito para guardar o que importa.</span><span aria-hidden="true" className="hidden h-3 w-px bg-[#16161615] sm:block"/><a href="https://magui.studio" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#722F37] transition-colors hover:text-[#5B252C]">Conheça a MAGUI.studio<ArrowUpRight size={13}/></a></footer>
 </main>;
}
