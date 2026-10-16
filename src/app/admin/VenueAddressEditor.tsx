"use client";
import { useEffect, useRef, useState } from "react";
import type { User } from "firebase/auth";
import type { EventLocation } from "@/types/wedding";
import { WeddingInput } from "@/components/ui/WeddingInput";
import { LocationMap, type LocationPoint } from "@/components/ui/LocationMap";
import { venueMapUrl } from "@/lib/wedding-settings";
import { readApiResponse } from "@/lib/api-response";

type Details = NonNullable<EventLocation["addressDetails"]>;
function detailsOf(value: EventLocation): Details {
  const [city = "", state = ""] = value.cityState.split(/\s+[—–-]\s+/);
  return (
    value.addressDetails ?? {
      street: value.address,
      number: "",
      complement: "",
      neighborhood: "",
      city,
      state: /^[A-Z]{2}$/.test(state) ? state : "",
    }
  );
}
function formatted(d: Details) {
  return {
    address: [d.street, d.number, d.complement, d.neighborhood].filter(Boolean).join(", "),
    cityState: [d.city, d.state].filter(Boolean).join(" — "),
  };
}
type Candidate = LocationPoint & { label: string };
export function VenueAddressEditor({
  value,
  onChange,
  user,
  slug,
}: {
  value: EventLocation;
  onChange: (value: EventLocation) => void;
  user: User | null;
  slug: string;
}) {
  const latest = useRef(value);
  latest.current = value;
  const callback = useRef(onChange);
  callback.current = onChange;
  const details = detailsOf(value);
  const [cepMessage, setCepMessage] = useState(""),
    [cepLoading, setCepLoading] = useState(false);
  const key = JSON.stringify([
    value.postalCode,
    details.street,
    details.number,
    details.neighborhood,
    details.city,
    details.state,
  ]);
  const previousKey = useRef(key);
  const pendingKey = useRef("");
  const locateRef = useRef<() => Promise<void>>(async () => {});
  useEffect(() => {
    if (previousKey.current !== key) {
      previousKey.current = key;
      pendingKey.current = key;
    }
    if (
      pendingKey.current !== key ||
      cepLoading ||
      value.coordinates ||
      !value.addressDetails ||
      !details.street.trim() ||
      !details.number.trim() ||
      !details.city.trim() ||
      !details.state.trim() ||
      value.postalCode?.length !== 8
    )
      return;
    const stamp = version.current;
    const timer = setTimeout(() => {
      if (stamp === version.current) {
        pendingKey.current = "";
        void locateRef.current();
      }
    }, 1200);
    return () => clearTimeout(timer);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, cepLoading]);
  function editDetails(patch: Partial<Details>) {
    const next = { ...detailsOf(latest.current), ...patch };
    if ("complement" in patch) {
      callback.current({ ...latest.current, ...formatted(next), addressDetails: next });
      return;
    }
    edit({ ...formatted(next), addressDetails: next });
  }
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [candidates, setCandidates] = useState<Candidate[]>([]);
  const version = useRef(0),
    request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  function edit(patch: Partial<EventLocation>) {
    version.current++;
    request.current?.abort();
    setBusy(false);
    setCandidates([]);
    setMessage("");
    onChange({ ...latest.current, ...patch, coordinates: null });
  }
  useEffect(() => {
    const cep = value.postalCode;
    setCepMessage("");
    setCepLoading(false);
    if (!cep || cep.length !== 8 || latest.current.coordinates) return;
    setCepLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setCepMessage("Buscando endereço pelo CEP…");
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (
          controller.signal.aborted ||
          latest.current.postalCode !== cep ||
          latest.current.coordinates
        )
          return;
        if (data.erro) {
          pendingKey.current = "";
          setCepMessage("CEP não encontrado. Preencha o endereço manualmente.");
          return;
        }
        const next = {
          ...detailsOf(latest.current),
          street: data.logradouro ?? "",
          neighborhood: data.bairro ?? "",
          city: data.localidade ?? "",
          state: data.uf ?? "",
        };
        version.current++;
        request.current?.abort();
        setBusy(false);
        setCandidates([]);
        callback.current({
          ...latest.current,
          ...formatted(next),
          addressDetails: next,
          coordinates: null,
        });
        setCepMessage(
          next.number
            ? "Endereço encontrado. Localizando automaticamente no mapa."
            : "Endereço encontrado. Informe o número para localizar automaticamente no mapa.",
        );
      } catch {
        if (!controller.signal.aborted) {
          pendingKey.current = "";
          setCepMessage("Não foi possível consultar o CEP. Você pode preencher manualmente.");
        }
      } finally {
        if (!controller.signal.aborted) setCepLoading(false);
      }
    }, 500);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.postalCode]);
  async function locate() {
    if (!user) return;
    const stamp = version.current,
      controller = new AbortController();
    request.current?.abort();
    request.current = controller;
    setBusy(true);
    setMessage("");
    setCandidates([]);
    try {
      const result = await readApiResponse(
        await fetch("/api/admin/geocode", {
          method: "POST",
          signal: controller.signal,
          headers: {
            Authorization: "Bearer " + (await user.getIdToken()),
            "x-wedding-slug": slug,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            address: value.address,
            cityState: value.cityState,
            postalCode: value.postalCode ?? "",
            addressDetails: value.addressDetails,
          }),
        }),
      );
      if (controller.signal.aborted || stamp !== version.current) return;
      if (result.candidates.length) {
        pin(result.candidates[0]);
        setCandidates(result.candidates.length > 1 ? result.candidates : []);
      } else setMessage("Nenhum resultado encontrado. Marque o ponto diretamente no mapa.");
    } catch (error) {
      if (!controller.signal.aborted) setMessage((error as Error).message);
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  locateRef.current = locate;
  function pin({ latitude, longitude }: LocationPoint) {
    version.current++;
    request.current?.abort();
    setBusy(false);
    setCandidates([]);
    onChange({
      ...latest.current,
      coordinates: { latitude, longitude },
      googleMapsUrl: venueMapUrl({ ...latest.current, coordinates: { latitude, longitude } }),
      wazeUrl: "",
    });
    setMessage(
      "Localização aproximada encontrada. Confira e arraste o marcador até a entrada do local, se necessário.",
    );
  }
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium">Endereço e localização</h3>
        <p className="mt-1 text-xs leading-relaxed text-neutral-500">
          Comece pelo CEP e informe o número. O endereço será localizado automaticamente no mapa.
        </p>
      </div>
      <div className="site-editor-address-grid">
        <label data-address-field="postalCode" className="block text-xs font-medium">
          CEP
          <WeddingInput
            className="mt-2"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            value={(value.postalCode ?? "").replace(/^(\d{5})(\d)/, "$1-$2")}
            onChange={(e) => edit({ postalCode: e.target.value.replace(/\D/g, "").slice(0, 8) })}
          />
        </label>
        {(
          [
            ["street", "Logradouro", "Rua / avenida", "address-line1"],
            ["number", "Número", "123 ou S/N", "off"],
            ["complement", "Complemento (opcional)", "Sala, andar, bloco…", "address-line2"],
            ["neighborhood", "Bairro", "Bairro", "address-level3"],
            ["city", "Cidade", "Cidade", "address-level2"],
            ["state", "UF", "SP", "address-level1"],
          ] as const
        ).map(([field, label, placeholder, autoComplete]) => (
          <label key={field} data-address-field={field} className="block text-xs font-medium">
            {label}
            <WeddingInput
              className="mt-2"
              value={details[field]}
              placeholder={placeholder}
              autoComplete={autoComplete}
              maxLength={field === "state" ? 2 : field === "number" ? 20 : 150}
              onChange={(event) =>
                editDetails({
                  [field]:
                    field === "state"
                      ? event.target.value.replace(/[^a-z]/gi, "").toUpperCase()
                      : event.target.value,
                })
              }
            />
          </label>
        ))}
      </div>
      {cepMessage && (
        <p role="status" className="text-xs leading-relaxed text-neutral-500">
          {cepMessage}
        </p>
      )}
      <button
        type="button"
        disabled={busy || !user || value.address.length < 3 || value.cityState.length < 3}
        onClick={locate}
        className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm text-[#722f37] transition-colors hover:bg-neutral-50 disabled:opacity-50"
      >
        {busy ? "Localizando…" : "Buscar novamente no mapa"}
      </button>
      <p role="status" className="text-xs leading-relaxed text-neutral-500">
        {busy
          ? "Localizando endereço…"
          : message ||
            "Você também pode clicar no mapa ou arrastar o marcador para ajustar a entrada do local."}
      </p>
      {candidates.length > 0 && (
        <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-200">
          {candidates.map((candidate, index) => (
            <li key={index}>
              <button
                type="button"
                onClick={() => pin(candidate)}
                className="w-full px-3 py-3 text-left text-xs leading-relaxed transition-colors hover:bg-neutral-50"
              >
                {candidate.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      <LocationMap point={value.coordinates} onChange={pin} />
    </div>
  );
}
