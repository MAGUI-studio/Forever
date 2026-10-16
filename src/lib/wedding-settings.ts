import type {EventLocation,WeddingConfig} from "@/types/wedding";

/** Hide an inherited same-location note without discarding other arrival advice. */
export function venueDisplayTips(venue:Pick<EventLocation,"tips">,sameVenue?:boolean):string {
  const tips=venue.tips??"";
  return sameVenue===false
    ?tips.replace(/A cerimônia e a recepção acontecerão no mesmo local[.!]?/gi,"").trim()
    :tips;
}

/** Keep legacy display fields derived from the single date and venue inputs. */
export function synchronizeWeddingSettings(config:WeddingConfig):WeddingConfig {
  const date=new Date(config.couple.weddingDate);
  const time=Number.isNaN(date.getTime())?"":date.toLocaleTimeString("pt-BR",{timeZone:"America/Sao_Paulo",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).replace(":","h");
  const details=config.ceremony.addressDetails;
  const cityState=details?[details.city,details.state].filter(Boolean).join(" — "):config.ceremony.cityState||config.couple.locationSummary;
  return {...config,couple:{...config.couple,locationSummary:cityState},ceremony:{...config.ceremony,time}};
}

export function venueMapUrl(venue:EventLocation):string {
  if(venue.coordinates){const {latitude,longitude}=venue.coordinates;return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=18/${latitude}/${longitude}`;}
  const address=[venue.address,venue.cityState].filter(Boolean).join(", ");
  return address?`https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`:"";
}

export function weddingDateTimeInput(value:string):string {
  const date=new Date(value);
  if(Number.isNaN(date.getTime()))return "";
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(date);
  const part=(name:string)=>parts.find(item=>item.type===name)?.value??"";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}
