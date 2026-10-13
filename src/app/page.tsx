import {foreverTheme} from "@/config/brand";
import {ForeverLogo} from "@/components/forever/ForeverLogo";
import Link from "next/link";
export default function ForeverHome(){return <main style={foreverTheme} className="flex min-h-[85svh] flex-col items-center justify-center gap-7 px-6 text-center"><h1><ForeverLogo className="w-80 max-w-full sm:w-[420px]"/></h1><p className="max-w-md text-[var(--forever-accent,#80654E)]">Um endereço para celebrar sua história. Um espaço para cuidar de cada detalhe do seu casamento.</p><Link href="/login" className="rounded-2xl bg-[var(--forever-primary,#5D613C)] px-7 py-4 text-white hover:bg-[#5B252C]">Acessar meu espaço</Link><a href="https://magui.studio" className="text-sm text-[var(--forever-primary,#5D613C)]">Conheça a MAGUI.studio</a></main>;}
