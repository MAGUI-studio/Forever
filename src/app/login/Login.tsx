"use client";
import {useEffect,useState} from "react";
import {onAuthStateChanged,signInWithEmailAndPassword,signOut,sendPasswordResetEmail} from "firebase/auth";
import {clientAuth} from "@/lib/firebase/client";
import {readApiResponse} from "@/lib/api-response";
import {useRouter} from "next/navigation";
import {WeddingOrnaments} from "@/components/wedding/WeddingOrnaments";
import {AdminContainer} from "@/app/admin/AdminContainer";
import {Heart,LockKeyhole,Mail,KeyRound,ArrowUpRight,Flower2,Eye,EyeOff} from "lucide-react";
export function Login(){const router=useRouter();const [showPassword,setShowPassword]=useState(false);const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[error,setError]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false),[ready,setReady]=useState(false),[resolving,setResolving]=useState(true),[authenticated,setAuthenticated]=useState(false);
 useEffect(()=>{let active=true;try{const unsubscribe=onAuthStateChanged(clientAuth(),account=>{if(!active)return;setReady(true);setAuthenticated(!!account);setError("");if(!account){setResolving(false);return;}setResolving(true);void account.getIdToken().then(token=>fetch("/api/auth/destination",{headers:{Authorization:"Bearer "+token}})).then(readApiResponse).then(data=>{if(active)router.replace(data.destination);}).catch(e=>{if(active){setError(e.message);setResolving(false);}});});return ()=>{active=false;unsubscribe();};}catch(e){queueMicrotask(()=>{setReady(true);setResolving(false);setError((e as Error).message);});}},[router]);
 async function action(work:()=>Promise<unknown>){setBusy(true);setError("");setNotice("");try{await work();}catch{setError("Não foi possível entrar. Confira seu e-mail e senha e tente novamente.");}finally{setBusy(false);}}
 return <main className="admin-wedding admin-wedding--login"><div className="admin-background" aria-hidden="true"><div className="admin-floral-layer"><WeddingOrnaments variant="floral" tone="paper"/></div><div className="admin-background-wash"/></div><AdminContainer centered>{!ready||resolving?<div className="admin-loading" role="status"><Flower2 strokeWidth={1}/><p>Preparando nosso espaço…</p></div>:<><div className="admin-login-grid">
            <aside className="admin-login-scene">
              <div
                className="admin-scene-photo"
                aria-hidden="true"
                style={{
                  backgroundImage:
                    "linear-gradient(160deg, #424A30D9, #2F351FD9), url(" +
                    "/detalhes/aliancas-florais.jpg" +
                    ")",
                }}
              />
              <WeddingOrnaments variant="floral" tone="photo" />
              <div className="admin-scene-copy">
                <p className="admin-eyebrow">O amor mora nos detalhes</p>
                <div className="admin-monogram" aria-hidden="true">
                  F
                </div>
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
              className="admin-login-card"
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
                <span className="admin-lock">
                  <LockKeyhole size={21} strokeWidth={1.2} aria-hidden="true" />
                </span>
                <p className="admin-eyebrow">Espaço dos noivos</p>
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
                  className="guest-input mt-2"
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
                  className="guest-input pr-12!"
                  id="login-password"
                  placeholder="Sua senha de acesso"
                  type={showPassword?"text":"password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                  <button type="button" aria-label={showPassword?"Ocultar senha":"Mostrar senha"} aria-pressed={showPassword} aria-controls="login-password" onClick={()=>setShowPassword(value=>!value)} className="absolute inset-y-0 right-1 flex w-11 items-center justify-center rounded-[var(--wedding-radius)] text-[#5D613C] hover:bg-[#5d613c10] focus-visible:outline-2 focus-visible:outline-[#5D613C]">{showPassword?<EyeOff size={18} aria-hidden="true"/>:<Eye size={18} aria-hidden="true"/>}</button>
                </div>
              </label>
              <button
                className="guest-button admin-login-submit"
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
 {error&&<p role="alert" className="admin-alert admin-alert--error">{error}</p>}{notice&&<p role="status" className="mt-4 text-center text-sm text-[#5D613C]">{notice}</p>}<div className="mt-4 flex flex-wrap justify-center gap-5"><button disabled={busy||!email} onClick={()=>void action(async()=>{await sendPasswordResetEmail(clientAuth(),email);setNotice("Se houver uma conta para este e-mail, enviaremos as instruções.");})} className="text-xs text-[#5D613C]">Esqueci minha senha</button>{authenticated&&<button onClick={()=>void signOut(clientAuth())} className="text-xs text-[#5D613C]">Entrar com outra conta</button>}</div></>}</AdminContainer></main>;
}
