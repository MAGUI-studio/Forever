"use client";
import {useEffect,useState} from "react";
import {onAuthStateChanged,signInWithEmailAndPassword,signOut} from "firebase/auth";
import {clientAuth} from "@/lib/firebase/client";
import {readApiResponse} from "@/lib/api-response";
import {useRouter} from "next/navigation";
import Image from "next/image";
import {Heart,Mail,KeyRound,ArrowUpRight,LockKeyhole,Eye,EyeOff} from "lucide-react";
import {foreverTheme} from "@/config/brand";
import {ForeverLogo} from "@/components/forever/ForeverLogo";
import {ForeverBackground} from "@/components/forever/ForeverBackground";
import {AdminContainer} from "@/app/admin/AdminContainer";
import {StudioLoading} from "@/components/forever/StudioLoading";
export function Login(){
 const router=useRouter();
 const [showPassword,setShowPassword]=useState(false),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false),[ready,setReady]=useState(false),[resolving,setResolving]=useState(true),[authenticated,setAuthenticated]=useState(false);
 useEffect(()=>{let active=true;try{const unsubscribe=onAuthStateChanged(clientAuth(),account=>{if(!active)return;setReady(true);setAuthenticated(!!account);setError("");if(!account){setResolving(false);return;}setResolving(true);void account.getIdToken().then(token=>fetch("/api/auth/destination",{headers:{Authorization:"Bearer "+token}})).then(readApiResponse).then(data=>{if(active)router.replace(data.destination);}).catch(e=>{if(active){setError(e.message);setResolving(false);}});});return ()=>{active=false;unsubscribe();};}catch(e){queueMicrotask(()=>{setReady(true);setResolving(false);setError((e as Error).message);});}},[router]);
 async function action(work:()=>Promise<unknown>){setBusy(true);setError("");try{await work();}catch{setError("Não foi possível entrar. Confira seu e-mail e senha e tente novamente.");}finally{setBusy(false);}}

 if(!ready||resolving)return <StudioLoading/>;
 return <main style={foreverTheme} className="relative mx-auto min-h-svh w-full max-w-440 overflow-hidden bg-[#f6f5f2] text-[#161616]">
  <ForeverBackground/>
  <AdminContainer centered className="relative">
<div className="admin-login-grid">
            <aside className="admin-login-scene after:border-white/20!">

              <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -right-20 opacity-[0.06]"><Image src="/forever/icon_white.svg" alt="" width={350} height={350}/></div>
              <div className="admin-scene-copy">
                <p className="admin-eyebrow">O amor mora nos detalhes</p>
                <ForeverLogo light className="my-7 w-56 sm:w-72"/>
                <h1>
                  Cada presença,
                  <br />
                  uma parte da
                  <br />
                  <em>nossa história.</em>
                </h1>
                <div className="admin-scene-rule">
                  <Heart size={15} strokeWidth={1} aria-hidden="true" />
                </div>
                <p>
                  Um dia especial, rodeado
                  <br />
                  de pessoas que amamos.
                </p>
              </div>
            </aside>
            <form
              className="admin-login-card bg-white!"
              onSubmit={(e) => {
                e.preventDefault();
                void action(async () => {
                  await signInWithEmailAndPassword(
                    clientAuth(),
                    email,
                    password,
                  );
                  setPassword("");
                });
              }}
            >
              <div className="admin-login-intro">
                <span className="admin-lock border-[#722F3720]! bg-[#722F3708]!">
                  <LockKeyhole size={21} strokeWidth={1.2} aria-hidden="true" />
                </span>
                <p className="admin-eyebrow text-[#722F37]!">Seu espaço Forever</p>
                <h2>
                  Bem-vindos
                  <br />
                  <em>ao nosso espaço.</em>
                </h2>
                <p>
                  Entre para organizar os convites e acompanhar cada
                  confirmação.
                </p>
              </div>
              <label className="block">
                <span className="admin-field-label">
                  <Mail size={14} aria-hidden="true" /> E-mail
                </span>
                <input
                  className="guest-input focus-visible:outline-[#722F37]! mt-2"
                  placeholder="seu@email.com"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="admin-field-label">
                  <KeyRound size={14} aria-hidden="true" /> Senha
                </span>
                <div className="relative mt-2">
                <input
                  className="guest-input focus-visible:outline-[#722F37]! pr-12!"
                  id="login-password"
                  placeholder="Sua senha de acesso"
                  type={showPassword?"text":"password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                  <button type="button" aria-label={showPassword?"Ocultar senha":"Mostrar senha"} aria-pressed={showPassword} aria-controls="login-password" onClick={()=>setShowPassword(value=>!value)} className="absolute inset-y-0 right-1 flex w-11 items-center justify-center rounded-[var(--wedding-radius)] text-[#722F37] hover:bg-[#722f3710] focus-visible:outline-2 focus-visible:outline-[#722F37]">{showPassword?<EyeOff size={18} aria-hidden="true"/>:<Eye size={18} aria-hidden="true"/>}</button>
                </div>
              </label>
              <button
                className="guest-button admin-login-submit enabled:hover:bg-[#5B252C]!"
                disabled={busy}
              >
                {busy ? "Entrando…" : "Entrar no painel"}
                <ArrowUpRight size={17} aria-hidden="true" />
              </button>
              <p className="admin-login-note">
                <LockKeyhole size={12} aria-hidden="true" /> Acesso reservado às
                contas autorizadas.
              </p>
            </form>
          </div>

   {error&&<p role="alert" className="mx-auto w-full max-w-[1060px] rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
   {authenticated&&<button disabled={busy} type="button" onClick={()=>void signOut(clientAuth())} className="mt-4 text-center text-xs text-[#722F37] hover:underline">Entrar com outra conta</button>}
  </AdminContainer>
 </main>;
}
