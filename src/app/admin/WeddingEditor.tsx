"use client";
import { AdminDialog } from "./AdminDialog";
import { useQueryState, parseAsStringEnum } from "nuqs";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";
import { useWedding } from "@/components/wedding/WeddingProvider";
import { readApiResponse } from "@/lib/api-response";
import { AdminButton } from "./AdminButton";
import { AdminContainer } from "./AdminContainer";
import { SkeletonBlock } from "./skeleton";
import type { WeddingConfig } from "@/types/wedding";
import type { WeddingTheme } from "@/types/forever";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Save, Plus, Trash2, Download } from "lucide-react";
const field =
  "mt-2 w-full rounded-[var(--wedding-radius)] border border-[#5d613c30] bg-white p-3 text-sm outline-none focus:border-[var(--forever-primary,#5D613C)] focus:ring-2 focus:ring-[#5d613c20]";
function Input({
  label,
  value,
  onChange,
  required = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block text-sm text-[var(--forever-primary,#5D613C)]">
      {label}
      {required && <span className="ml-1 text-red-600">*</span>}
      <input
        required={required}
        type={type}
        className={field}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
export function WeddingEditor() {
  const {
      slug,
      config,
      setConfig,
      setTheme: setWeddingTheme,
      path,
    } = useWedding(),
    router = useRouter();
  const [memberAction, setMemberAction] = useQueryState(
    "action",
    parseAsStringEnum(["add-owner"]).withOptions({
      history: "push",
      scroll: false,
    }),
  );
  const [members, setMembers] = useState<
      { id: string; email: string; active: boolean }[]
    >([]),
    [memberEmail, setMemberEmail] = useState(""),
    [memberPassword, setMemberPassword] = useState("");
  function closeMember() {
    setMemberPassword("");
    void setMemberAction(null, { history: "replace" });
  }
  async function loadMembers(account = user) {
    const data = await api("/api/admin/members", "GET", undefined, account);
    setMembers(data.members);
  }

  const [draft, setDraft] = useState<WeddingConfig>(config),
    [theme, setTheme] = useState<WeddingTheme>("botanical"),
    [status, setStatus] = useState("draft"),
    [user, setUser] = useState<User | null>(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  async function api(
    endpoint: string,
    method = "GET",
    data?: unknown,
    account = user,
  ) {
    if (!account) throw Error("Entre para continuar.");
    return readApiResponse(
      await fetch(endpoint, {
        method,
        headers: {
          Authorization: "Bearer " + (await account.getIdToken()),
          "x-wedding-slug": slug,
          "Content-Type": "application/json",
        },
        ...(data ? { body: JSON.stringify(data) } : {}),
      }),
    );
  }
  useEffect(()=>{
   try{return onAuthStateChanged(clientAuth(),account=>{
    setUser(account);if(!account){router.replace("/login");return;}
    const read=async(endpoint:string)=>readApiResponse(await fetch(endpoint,{headers:{Authorization:"Bearer "+await account.getIdToken(),"x-wedding-slug":slug}}));
    void read("/api/admin/session").then(async data=>{
     if(data.role!=="admin"){router.replace(path("admin/check-in"));return;}
     setDraft(data.wedding.config);setTheme(data.wedding.theme);setWeddingTheme(data.wedding.theme);setStatus(data.wedding.status);setConfig(data.wedding.config);
     setMembers((await read("/api/admin/members")).members);
    }).catch(e=>setError(e.message)).finally(()=>setLoading(false));
   });}catch(e){queueMicrotask(()=>{setError((e as Error).message);setLoading(false);});}
  },[slug,router,path,setConfig,setWeddingTheme]);
  function couple(key: string, value: unknown) {
    setDraft((d) => ({ ...d, couple: { ...d.couple, [key]: value } }));
  }
  async function upload(file: File, onUpload: (url: string) => void) {
    if (!user) return;
    setBusy(true);
    setError("");
    try {
      const data = new FormData();
      data.append("file", file);
      const result = await readApiResponse(
        await fetch("/api/admin/media", {
          method: "POST",
          headers: {
            Authorization: "Bearer " + (await user.getIdToken()),
            "x-wedding-slug": slug,
          },
          body: data,
        }),
      );
      onUpload(result.url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function image(label: string, value: string, onChange: (v: string) => void) {
    return (
      <div>
        <Input label={label} value={value} onChange={onChange} />
        <label className="mt-2 block text-xs text-[var(--forever-accent,#80654E)]">
          Enviar JPG, PNG ou WebP (até 8 MB)
          <input
            disabled={busy}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="mt-2 block w-full text-xs"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file, onChange);
            }}
          />
        </label>
      </div>
    );
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api("/api/admin/profile", "PUT", { config: draft, theme, status });
      setConfig(draft);
      setWeddingTheme(theme);
      setNotice("Alterações salvas.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="admin-wedding">
      <AdminContainer>
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#5d613c20] py-6">
          <Link href={path("admin/dashboard")} className="font-serif text-3xl">
            Forever · Personalizar site
          </Link>
          <div className="flex gap-4">
            <Link
              className="text-sm text-[var(--forever-primary,#5D613C)]"
              href={path("admin/dashboard")}
            >
              Painel do casamento
            </Link>
            <Link
              className="text-sm text-[var(--forever-primary,#5D613C)]"
              href={path("admin/preview")}
            >
              Visualizar conteúdo salvo
            </Link>
          </div>
        </header>
        <section className="py-8">
          {loading ? (
            <div className="grid gap-5">
              <SkeletonBlock className="h-12 w-64" />
              <SkeletonBlock className="h-72 w-full" />
            </div>
          ) : (
            <form onSubmit={save} className="space-y-7">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="font-serif text-4xl">
                    Cada detalhe do seu site
                  </h1>
                  <p className="mt-2 text-sm text-[var(--forever-accent,#80654E)]">
                    forever.magui.studio/{slug}
                  </p>
                  <p className="mt-2 text-xs">
                    Campos marcados com <span className="text-red-600">*</span>{" "}
                    são obrigatórios.
                  </p>
                </div>
                <AdminButton type="submit" disabled={busy}>
                  <Save size={16} />
                  {busy ? "Salvando…" : "Salvar alterações"}
                </AdminButton>
              </div>
              <fieldset disabled={busy} className="space-y-7">
                <section className="grid gap-5 rounded-2xl bg-[#fffdfa] p-5 sm:grid-cols-2">
                  <h2 className="font-serif text-3xl sm:col-span-2">O casal</h2>
                  <Input
                    required
                    label="Primeira pessoa"
                    value={draft.couple.partner1}
                    onChange={(v) => couple("partner1", v)}
                  />
                  <Input
                    required
                    label="Segunda pessoa"
                    value={draft.couple.partner2}
                    onChange={(v) => couple("partner2", v)}
                  />
                  <Input
                    label="Data e horário (com fuso)"
                    value={draft.couple.weddingDate}
                    onChange={(v) => couple("weddingDate", v)}
                  />
                  <Input
                    label="Cidade e estado"
                    value={draft.couple.locationSummary}
                    onChange={(v) => couple("locationSummary", v)}
                  />
                  <Input
                    label="Frase do casal"
                    value={draft.couple.headline ?? ""}
                    onChange={(v) => couple("headline", v)}
                  />
                  <Input
                    label="Hashtag"
                    value={draft.couple.hashtag}
                    onChange={(v) => couple("hashtag", v)}
                  />
                  {image("Foto de capa", draft.couple.coverImage, (v) =>
                    couple("coverImage", v),
                  )}
                  <label className="text-sm">
                    Tema
                    <select
                      className={field}
                      value={theme}
                      onChange={(e) => setTheme(e.target.value as WeddingTheme)}
                    >
                      <option value="botanical">Botânico</option>
                      <option value="rose">Rosa</option>
                      <option value="ocean">Oceano</option>
                    </select>
                  </label>
                </section>
                <section className="space-y-5 rounded-2xl bg-[#fffdfa] p-5">
                  <h2 className="font-serif text-3xl">Nossa história</h2>
                  <label className="flex gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={draft.couple.story?.enabled ?? false}
                      onChange={(e) =>
                        couple("story", {
                          ...draft.couple.story,
                          title: draft.couple.story?.title ?? "Nossa história",
                          text: draft.couple.story?.text ?? [],
                          enabled: e.target.checked,
                        })
                      }
                    />
                    Mostrar a história
                  </label>
                  <Input
                    label="Título"
                    value={draft.couple.story?.title ?? ""}
                    onChange={(v) =>
                      couple("story", {
                        ...draft.couple.story,
                        enabled: draft.couple.story?.enabled ?? false,
                        text: draft.couple.story?.text ?? [],
                        title: v,
                      })
                    }
                  />
                  <label className="block text-sm">
                    História (separe os parágrafos com uma linha vazia)
                    <textarea
                      className={field}
                      rows={6}
                      value={draft.couple.story?.text.join("\n\n") ?? ""}
                      onChange={(e) =>
                        couple("story", {
                          ...draft.couple.story,
                          title: draft.couple.story?.title ?? "",
                          enabled: draft.couple.story?.enabled ?? false,
                          text: e.target.value.split("\n\n"),
                        })
                      }
                    />
                  </label>
                </section>
                {(["ceremony", "party"] as const).map((key) => (
                  <section
                    key={key}
                    className="grid gap-5 rounded-2xl bg-[#fffdfa] p-5 sm:grid-cols-2"
                  >
                    <h2 className="font-serif text-3xl sm:col-span-2">
                      {key === "ceremony" ? "Cerimônia" : "Recepção"}
                    </h2>
                    {(
                      [
                        "title",
                        "subtitle",
                        "time",
                        "placeName",
                        "address",
                        "cityState",
                        "googleMapsUrl",
                        "tips",
                      ] as const
                    ).map((property, index) => (
                      <Input
                        key={property}
                        label={
                          [
                            "Título",
                            "Subtítulo",
                            "Horário",
                            "Nome do local",
                            "Endereço",
                            "Cidade e estado",
                            "Link do mapa",
                            "Informações adicionais",
                          ][index]
                        }
                        value={draft[key][property] ?? ""}
                        onChange={(v) =>
                          setDraft((d) => ({
                            ...d,
                            [key]: { ...d[key], [property]: v },
                          }))
                        }
                      />
                    ))}
                    {image("Imagem do local", draft[key].image ?? "", (v) =>
                      setDraft((d) => ({
                        ...d,
                        [key]: { ...d[key], image: v },
                      })),
                    )}
                  </section>
                ))}
                <section className="space-y-5 rounded-2xl bg-[#fffdfa] p-5">
                  <h2 className="font-serif text-3xl">Trajes</h2>
                  <Input
                    label="Título"
                    value={draft.dressCode.title}
                    onChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        dressCode: { ...d.dressCode, title: v },
                      }))
                    }
                  />
                  <Input
                    label="Orientações"
                    value={draft.dressCode.description}
                    onChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        dressCode: { ...d.dressCode, description: v },
                      }))
                    }
                  />
                  {(["dos", "donts"] as const).map((key) => (
                    <Input
                      key={key}
                      label={
                        key === "dos"
                          ? "Sugestões (separe por ponto e vírgula)"
                          : "Evite (separe por ponto e vírgula)"
                      }
                      value={draft.dressCode[key].join("; ")}
                      onChange={(v) =>
                        setDraft((d) => ({
                          ...d,
                          dressCode: {
                            ...d.dressCode,
                            [key]: v
                              .split(";")
                              .map((t) => t.trim())
                              .filter(Boolean),
                          },
                        }))
                      }
                    />
                  ))}
                </section>
                <section className="space-y-5 rounded-2xl bg-[#fffdfa] p-5">
                  <h2 className="font-serif text-3xl">Galeria</h2>
                  {draft.gallery.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="grid gap-4 border-b border-[#5d613c20] pb-5 sm:grid-cols-2"
                    >
                      {image("Imagem", photo.url, (url) =>
                        setDraft((d) => ({
                          ...d,
                          gallery: d.gallery.map((p, i) =>
                            i === index ? { ...p, url } : p,
                          ),
                        })),
                      )}
                      <Input
                        label="Legenda"
                        value={photo.caption ?? ""}
                        onChange={(caption) =>
                          setDraft((d) => ({
                            ...d,
                            gallery: d.gallery.map((p, i) =>
                              i === index ? { ...p, caption } : p,
                            ),
                          }))
                        }
                      />
                      <AdminButton
                        variant="ghost"
                        onClick={() =>
                          setDraft((d) => ({
                            ...d,
                            gallery: d.gallery.filter((_, i) => i !== index),
                          }))
                        }
                      >
                        <Trash2 size={16} />
                        Remover foto
                      </AdminButton>
                    </div>
                  ))}
                  <AdminButton
                    variant="ghost"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        gallery: [
                          ...d.gallery,
                          {
                            id: crypto.randomUUID(),
                            url: "",
                            caption: "",
                            aspect: "square",
                          },
                        ],
                      }))
                    }
                  >
                    <Plus size={16} />
                    Adicionar foto
                  </AdminButton>
                </section>
                <section className="space-y-5 rounded-2xl bg-[#fffdfa] p-5">
                  <h2 className="font-serif text-3xl">Presentes</h2>
                  {draft.gifts.map((gift, index) => (
                    <div
                      key={gift.id}
                      className="grid gap-4 border-b border-[#5d613c20] pb-5 sm:grid-cols-2"
                    >
                      {(
                        [
                          "title",
                          "price",
                          "image",
                          "description",
                          "creditCardUrl",
                        ] as const
                      ).map((property) => (
                        <Input
                          key={property}
                          label={
                            {
                              title: "Nome do presente",
                              price: "Valor",
                              image: "Imagem (URL)",
                              description: "Descrição",
                              creditCardUrl: "Link do pagamento",
                            }[property]
                          }
                          value={String(gift[property] ?? "")}
                          type={property === "price" ? "number" : "text"}
                          onChange={(v) =>
                            setDraft((d) => ({
                              ...d,
                              gifts: d.gifts.map((g, i) =>
                                i === index
                                  ? {
                                      ...g,
                                      [property]:
                                        property === "price"
                                          ? v
                                            ? Number(v)
                                            : undefined
                                          : v,
                                    }
                                  : g,
                              ),
                            }))
                          }
                        />
                      ))}
                      <AdminButton
                        variant="ghost"
                        onClick={() =>
                          setDraft((d) => ({
                            ...d,
                            gifts: d.gifts.filter((_, i) => i !== index),
                          }))
                        }
                      >
                        <Trash2 size={16} />
                        Remover presente
                      </AdminButton>
                    </div>
                  ))}
                  <AdminButton
                    variant="ghost"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        gifts: [
                          ...d.gifts,
                          {
                            id: crypto.randomUUID(),
                            title: "",
                            category: "outros",
                            categoryLabel: "Outros",
                            image: "/detalhes/aliancas-florais.jpg",
                          },
                        ],
                      }))
                    }
                  >
                    <Plus size={16} />
                    Adicionar presente
                  </AdminButton>
                </section>
                <section className="grid gap-5 rounded-2xl bg-[#fffdfa] p-5 sm:grid-cols-2">
                  <h2 className="font-serif text-3xl sm:col-span-2">
                    Pix e contato
                  </h2>
                  {(
                    [
                      "key",
                      "receiverName",
                      "city",
                      "whatsappConfirmationPhone",
                    ] as const
                  ).map((key, index) => (
                    <Input
                      key={key}
                      label={
                        [
                          "Chave Pix",
                          "Nome do recebedor",
                          "Cidade do recebedor",
                          "WhatsApp para confirmação",
                        ][index]
                      }
                      value={draft.pix[key]}
                      onChange={(v) =>
                        setDraft((d) => ({ ...d, pix: { ...d.pix, [key]: v } }))
                      }
                    />
                  ))}
                  <label className="text-sm">
                    Tipo de chave
                    <select
                      className={field}
                      value={draft.pix.keyType}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          pix: {
                            ...d.pix,
                            keyType: e.target
                              .value as WeddingConfig["pix"]["keyType"],
                          },
                        }))
                      }
                    >
                      {["cpf", "cnpj", "email", "phone", "random"].map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Input
                    label="WhatsApp de contato"
                    value={draft.rsvp.contactWhatsApp}
                    onChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        rsvp: { ...d.rsvp, contactWhatsApp: v },
                      }))
                    }
                  />
                </section>
                <section className="space-y-5 rounded-2xl bg-[#fffdfa] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-serif text-3xl">
                      Responsáveis pelo casamento
                    </h2>
                    <AdminButton
                      onClick={() => {
                        setMemberEmail("");
                        setMemberPassword("");
                        void setMemberAction("add-owner");
                      }}
                    >
                      <Plus size={16} />
                      Adicionar responsável
                    </AdminButton>
                  </div>
                  {members
                    .filter((member) => member.active)
                    .map((member) => (
                      <div
                        key={member.id}
                        className="flex flex-wrap items-center justify-between gap-3"
                      >
                        <p className="break-all text-sm">
                          {member.email || member.id}
                        </p>
                        <AdminButton
                          variant="ghost"
                          disabled={busy || member.id === user?.uid}
                          onClick={async () => {
                            setBusy(true);
                            setError("");
                            try {
                              await api("/api/admin/members", "POST", {
                                action: "remove",
                                uid: member.id,
                              });
                              await loadMembers();
                            } catch (e) {
                              setError((e as Error).message);
                            } finally {
                              setBusy(false);
                            }
                          }}
                        >
                          <Trash2 size={16} />
                          Remover acesso
                        </AdminButton>
                      </div>
                    ))}
                </section>
                <section className="space-y-5 rounded-2xl bg-[#fffdfa] p-5">
                  <h2 className="font-serif text-3xl">Seções do site</h2>
                  {(["gallery", "dressCode", "gifts", "rsvp"] as const).map(
                    (key, index) => (
                      <label
                        key={key}
                        className="flex items-center gap-3 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={draft.sections?.[key] !== false}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              sections: {
                                ...d.sections,
                                [key]: e.target.checked,
                              },
                            }))
                          }
                        />
                        {
                          [
                            "Galeria",
                            "Trajes",
                            "Presentes",
                            "Confirmação de presença",
                          ][index]
                        }
                      </label>
                    ),
                  )}
                </section>
                <section className="space-y-5 rounded-2xl bg-[#fffdfa] p-5">
                  <h2 className="font-serif text-3xl">Publicação</h2>
                  <label className="block text-sm">
                    Visibilidade
                    <select
                      className={field}
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="draft">
                        Rascunho — site indisponível ao público
                      </option>
                      <option value="published">
                        Publicado — site disponível aos convidados
                      </option>
                    </select>
                  </label>
                  <p className="text-xs text-[var(--forever-accent,#80654E)]">
                    Para publicar, preencha a data do casamento e o local da
                    cerimônia.
                  </p>
                  <AdminButton type="submit" disabled={busy}>
                    <Save size={16} />
                    Salvar alterações
                  </AdminButton>
                  <AdminButton
                    variant="ghost"
                    onClick={async () => {
                      setBusy(true);
                      try {
                        const data = await api("/api/admin/export");
                        const blob = new Blob(
                            [
                              JSON.stringify(
                                { slug, config: draft, theme, ...data },
                                null,
                                2,
                              ),
                            ],
                            { type: "application/json" },
                          ),
                          url = URL.createObjectURL(blob),
                          link = document.createElement("a");
                        link.href = url;
                        link.download = "forever-" + slug + ".json";
                        link.click();
                        URL.revokeObjectURL(url);
                      } catch (e) {
                        setError((e as Error).message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <Download size={16} />
                    Exportar dados do casamento
                  </AdminButton>
                </section>
              </fieldset>
            </form>
          )}
          {error && (
            <p role="alert" className="mt-5 text-sm text-red-700">
              {error}
            </p>
          )}
          {notice && (
            <p
              role="status"
              className="mt-5 text-sm text-[var(--forever-primary,#5D613C)]"
            >
              {notice}
            </p>
          )}
        </section>
      </AdminContainer>
      <AdminDialog
        open={memberAction === "add-owner"}
        onClose={closeMember}
        busy={busy}
        title="Adicionar responsável"
        description="Esta pessoa poderá administrar todo o casamento. Contas existentes mantêm a senha."
      >
        <form
          className="mt-5 grid gap-5"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              await api("/api/admin/members", "POST", {
                action: "add",
                email: memberEmail,
                ...(memberPassword ? { password: memberPassword } : {}),
              });
              closeMember();
              await loadMembers();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Input
            label="E-mail"
            required
            type="email"
            value={memberEmail}
            onChange={setMemberEmail}
          />
          <Input
            label="Senha inicial (necessária para uma nova conta)"
            type="password"
            value={memberPassword}
            onChange={setMemberPassword}
          />
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <AdminButton type="submit" disabled={busy}>
            Adicionar responsável
          </AdminButton>
        </form>
      </AdminDialog>
    </main>
  );
}
