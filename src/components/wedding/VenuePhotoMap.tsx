"use client";
import { useState, type ReactNode } from "react";
import { MapPin, Image as ImageIcon } from "lucide-react";
import { LocationMap, type LocationPoint } from "@/components/ui/LocationMap";

export function VenuePhotoMap({
  point,
  label,
  children,
  className = "",
}: {
  point?: LocationPoint | null;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const [hovered, setHovered] = useState(false),
    [expanded, setExpanded] = useState(false),
    [activated, setActivated] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const visible = hovered || expanded;
  const showMap = visible && mapReady;
  return (
    <div
      className={`relative isolate overflow-hidden ${className}`}
      onPointerEnter={(event) => {
        if (point && event.pointerType === "mouse") {
          setActivated(true);
          setHovered(true);
        }
      }}
      onPointerLeave={() => setHovered(false)}
    >
      <div
        className={`absolute inset-0 transition-[opacity,transform,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${showMap ? "scale-[1.035] opacity-0 blur-[3px]" : "scale-100 opacity-100 blur-0"}`}
      >
        {children}
      </div>
      {point && (
        <>
          {activated && (
            <div
              aria-hidden={!showMap}
              inert={!showMap}
              className={`absolute inset-0 z-10 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${showMap ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-1.5 scale-[1.025] opacity-0"}`}
            >
              <LocationMap
                point={point}
                label={label}
                fitContainer
                onReady={() => setMapReady(true)}
              />
            </div>
          )}
          <button
            type="button"
            aria-label={visible ? "Voltar à foto do local" : "Ver localização do local"}
            aria-expanded={visible}
            onClick={() => {
              setActivated(true);
              setHovered(false);
              setExpanded(!visible);
            }}
            className="absolute bottom-5 right-4 z-20 flex max-w-[calc(100%-2rem)] items-center gap-2 rounded-full border border-white/30 bg-white/90 px-3 py-2 text-[10px] font-medium leading-relaxed text-[#722f37] shadow-sm backdrop-blur-sm transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#722f37] sm:text-xs"
          >
            {visible ? (
              <ImageIcon size={14} className="shrink-0" />
            ) : (
              <MapPin size={14} className="shrink-0" />
            )}
            <span>
              {visible
                ? mapReady
                  ? "Voltar à foto"
                  : "Carregando localização…"
                : "Passe o mouse para ver a localização"}
            </span>
          </button>
        </>
      )}
    </div>
  );
}
