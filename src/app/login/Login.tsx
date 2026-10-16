"use client";
import {RequiredMark,RequiredFieldsNotice} from "@/components/ui/RequiredFields";
import { useFeedbackToasts } from "@/components/ui/ForeverToaster";
import {useEffect,useState} from "react";
import {onAuthStateChanged,signInWithEmailAndPassword,signOut} from "firebase/auth";
import {clientAuth} from "@/lib/firebase/client";
import {readApiResponse} from "@/lib/api-response";
import {useRouter, useSearchParams} from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {Heart,Mail,KeyRound,ArrowUpRight,ArrowLeft,LockKeyhole,Eye,EyeOff} from "lucide-react";
import {foreverTheme} from "@/config/brand";
import {ForeverLogo} from "@/components/forever/ForeverLogo";
import {ForeverBackground} from "@/components/forever/ForeverBackground";
import {AdminContainer} from "@/app/admin/AdminContainer";
import {StudioLoading} from "@/components/forever/StudioLoading";
export function Login(){
 const router=useRouter();
 const initialPlanRequired=useSearchParams().get("reason") === "sem-plano";
 const [planRequired,setPlanRequired]=useState(initialPlanRequired);
 const [showPassword,setShowPassword]=useState(false),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false),[ready,setReady]=useState(false),[resolving,setResolving]=useState(true),[authenticated,setAuthenticated]=useState(false);
 useFeedbackToasts(error);
 useEffect(()=>{let active=true;try{const unsubscribe=onAuthStateChanged(clientAuth(),account=>{if(!active)return;setReady(true);setAuthenticated(!!account);setError("");if(!account){setResolving(false);return;}setResolving(true);void account.getIdToken().then(token=>fetch("/api/auth/destination",{headers:{Authorization:"Bearer "+token}})).then(response=>readApiResponse(response,{redirectOnPlanRequired:false})).then(data=>{if(active)router.replace(data.destination);}).catch(async e=>{if(!active)return;if(e.code === "PLAN_REQUIRED"){setPlanRequired(true);setPassword("");await signOut(clientAuth());if(active){setAuthenticated(false);setResolving(false);setBusy(false);}return;}setError(e.message);setResolving(false);});});return ()=>{active=false;unsubscribe();};}catch(e){queueMicrotask(()=>{setReady(true);setResolving(false);setError((e as Error).message);});}},[router]);
 async function action(work:()=>Promise<unknown>){setBusy(true);setError("");try{await work();}catch{setError("Não foi possível entrar. Confira seu e-mail e senha e tente novamente.");}finally{setBusy(false);}}

 if(!ready)return <StudioLoading/>;
 return <main style={foreverTheme} className="relative mx-auto min-h-svh w-full max-w-440 overflow-hidden bg-[var(--page-background,#F1F1F1)] text-[#161616]">
  <ForeverBackground/>
  <AdminContainer centered className="relative">
<div className="admin-login-grid">
            <aside className="admin-login-scene after:border-white/20!">

              <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -right-20 opacity-[0.06]"><Image src="/forever/icon_white.svg" alt="" width={350} height={350}/></div>
              <div className="admin-scene-copy">
                <p className="admin-eyebrow">Plataforma Forever</p>
                <ForeverLogo light className="my-7 w-56 sm:w-72"/>
                <h1>
                  Um site à altura
                  <br />
                  do seu
                  <br />
                  <em>grande dia.</em>
                </h1>
                <div className="admin-scene-rule">
                  <Heart size={15} strokeWidth={1} aria-hidden="true" />
                </div>
                <p>
                  Convites com QR Code, confirmações
                  <br />
                  em tempo real e gestão do evento.
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
            ><RequiredFieldsNotice/>
              {planRequired && <div role="status" className="mb-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4"><p className="text-sm font-medium text-neutral-900">Seu casamento está sem plano</p><p className="mt-2 text-xs leading-relaxed text-neutral-600">Assine novamente para recuperar o acesso ao painel e ao site. Seus dados continuam preservados.</p><Link href="/contratar" className="group mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#722F37] px-4 py-2 text-xs font-medium text-white">Escolher um plano<ArrowUpRight size={15} aria-hidden="true" className="transition-transform duration-300 ease-out group-hover:translate-x-1 group-hover:-translate-y-1 group-focus-visible:translate-x-1 group-focus-visible:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none" /></Link></div>}
              <div className="admin-login-intro">
                <span className="admin-lock border-[#722F3720]! bg-[#722F3708]!">
                  <LockKeyhole size={21} strokeWidth={1.2} aria-hidden="true" />
                </span>
                <p className="admin-eyebrow text-[#722F37]!">Painel de Acesso</p>
                <h2>
                  Bem-vindos
                  <br />
                  <em>de volta.</em>
                </h2>
                <p>
                  Acesse sua conta para gerenciar seu site, convites e
                  confirmações de presença.
                </p>
              </div>
              <label className="block">
                <span className="admin-field-label">
                  <Mail size={14} aria-hidden="true" /> E-mail
                <RequiredMark/></span>
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
                <RequiredMark/></span>
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
                className="group guest-button admin-login-submit bg-[#722F37]! enabled:hover:bg-[#5B242B]!"
                disabled={busy || resolving}
              >
                {busy || resolving ? "Verificando acesso…" : "Entrar no painel"}
                <ArrowUpRight size={17} aria-hidden="true" className="transition-transform duration-300 ease-out group-hover:translate-x-1 group-hover:-translate-y-1 group-focus-visible:translate-x-1 group-focus-visible:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none" />
              </button>
              <p className="admin-login-note">
                <LockKeyhole size={12} aria-hidden="true" /> Acesso seguro reservado às
                contas autorizadas.
              </p>
              <div className="flex items-center justify-between border-t border-[#16161612] pt-4 text-xs text-[#8C877F]">
                <Link href="/" className="group inline-flex items-center gap-1.5 transition-colors hover:text-[#722F37]">
                  <ArrowLeft size={14} aria-hidden="true" className="transition-transform duration-300 ease-out group-hover:-translate-x-1 group-focus-visible:-translate-x-1 motion-reduce:transform-none motion-reduce:transition-none" />Voltar ao início
                </Link>
                <Link href="/#preco" className="font-medium text-[#722F37] transition-colors hover:underline">
                  Conhecer planos
                </Link>
              </div>
            </form>
          </div>

   {error&&<p role="alert" className="mx-auto w-full max-w-[1060px] rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
   {authenticated&&<button disabled={busy || resolving} type="button" onClick={()=>void signOut(clientAuth())} className="mt-4 text-center text-xs text-[#722F37] hover:underline">Entrar com outra conta</button>}
  </AdminContainer>
 </main>;
}
