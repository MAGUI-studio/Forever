"use client";
import {useEffect, useRef, useState} from "react";
import type {Map as LeafletMap, Marker} from "leaflet";
export type LocationPoint = {latitude:number; longitude:number};

export function LocationMap({point,onChange,label="Local da celebração",fitContainer=false,onReady}:{point?:LocationPoint|null;onChange?:(point:LocationPoint)=>void;label?:string;fitContainer?:boolean;onReady?:()=>void}) {
  const element=useRef<HTMLDivElement>(null), instance=useRef<LeafletMap|null>(null), marker=useRef<Marker|null>(null);
  const callback=useRef(onChange); callback.current=onChange;
  const readyCallback=useRef(onReady);readyCallback.current=onReady;
  const [ready,setReady]=useState(false),[error,setError]=useState(false);
  useEffect(()=>{
    let disposed=false; let observer:ResizeObserver|undefined;
    void import("leaflet").then(L=>{
      if(disposed||!element.current)return;
      const map=L.map(element.current,{scrollWheelZoom:false,zoomControl:!fitContainer}).setView([-14.2,-51.9],4);
      if(fitContainer)L.control.zoom({position:"bottomleft"}).addTo(map);
      instance.current=map;
      L.tileLayer(process.env.NEXT_PUBLIC_MAP_TILES_URL||"https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).on("load",()=>{if(!disposed)readyCallback.current?.();}).on("tileerror",()=>{if(!disposed){setError(true);readyCallback.current?.();}}).addTo(map);
      const pin=L.divIcon({className:"",html:'<div style="width:28px;height:28px;border:3px solid white;border-radius:50% 50% 50% 0;background:#722f37;transform:rotate(-45deg);box-shadow:0 2px 8px #0004"></div>',iconSize:[28,36],iconAnchor:[14,36]});
      marker.current=L.marker([-14.2,-51.9],{icon:pin,draggable:!!callback.current,title:label});
      marker.current.on("dragend",()=>{const p=marker.current!.getLatLng();callback.current?.({latitude:p.lat,longitude:p.lng});});
      map.on("click",event=>callback.current?.({latitude:event.latlng.lat,longitude:event.latlng.lng}));
      observer=new ResizeObserver(()=>map.invalidateSize());observer.observe(element.current);setReady(true);
    }).catch(()=>{if(!disposed){setError(true);readyCallback.current?.();}});
    return ()=>{disposed=true;observer?.disconnect();instance.current?.remove();instance.current=null;marker.current=null;};
  },[label,fitContainer]);
  useEffect(()=>{
    if(!ready||!instance.current||!marker.current)return;
    if(!point){marker.current.remove();return;}
    marker.current.setLatLng([point.latitude,point.longitude]).addTo(instance.current);
    instance.current.setView([point.latitude,point.longitude],16);
  },[point,ready]);
  return <div className={"relative isolate overflow-hidden bg-white text-[#292929] "+(fitContainer?"h-full w-full":"rounded-2xl border border-black/10")}>
    <div ref={element} role="region" aria-label={`Mapa: ${label}`} className={"relative z-0 w-full bg-neutral-100 "+(fitContainer?"h-full":"h-64 sm:h-72")}/>
    {error&&<p role="status" className={"px-4 py-2 text-xs "+(fitContainer?"absolute inset-x-0 top-1/2 z-10 bg-white/90":"")}>Não foi possível carregar o mapa completo. Use o botão de rota ou tente novamente.</p>}
  </div>;
}
