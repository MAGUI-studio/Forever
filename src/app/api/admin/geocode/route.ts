import {z} from "zod";
import {requireAccess,assertModule,limitedBody,HttpError,reply,failure} from "@/lib/guest-server";
const recent=new Map<string,number>();
const normalize=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]/g,"");
const schema=z.object({address:z.string().trim().min(3).max(500),cityState:z.string().trim().min(3).max(200),postalCode:z.string().regex(/^(\d{8})?$/).optional(),addressDetails:z.object({street:z.string().trim().max(500),number:z.string().trim().max(20),complement:z.string().trim().max(500),neighborhood:z.string().trim().max(500),city:z.string().trim().max(500),state:z.string().regex(/^([A-Z]{2})?$/)}).strict().optional()}).strict();
export async function POST(request:Request){
  try{
    const access=await requireAccess(request);assertModule(access.wedding,"siteEditor");
    if(access.role!=="admin")throw new HttpError(403,"Acesso exclusivo da administração.");
    const data=schema.parse(JSON.parse(new TextDecoder().decode(await limitedBody(request,4096))));
    if(Date.now()-(recent.get(access.uid)??0)<2000)throw new HttpError(429,"Aguarde um instante antes de buscar novamente.");
    if(recent.size>1000)recent.clear();recent.set(access.uid,Date.now());
    const url=new URL(process.env.PHOTON_URL||"https://photon.komoot.io/api/");
    const a=data.addressDetails;
    // Neighborhood and complement are display details, not part of a house-number search.
    url.searchParams.set("q",(a?[a.street,a.number,a.city,a.state,data.postalCode,"Brasil"]:[data.address,data.cityState,data.postalCode,"Brasil"]).filter(Boolean).join(", "));url.searchParams.set("limit","5");
    const response=await fetch(url,{next:{revalidate:86400},signal:AbortSignal.timeout(25000),headers:{Accept:"application/json","User-Agent":"Forever/1.0"}}).catch(()=>{throw new HttpError(502,"A busca de localização está indisponível. Tente novamente ou marque o ponto no mapa.");});
    if(!response.ok)throw new HttpError(502,"Não foi possível buscar o local. Marque o ponto diretamente no mapa.");
    const result=await response.json();
    const candidates=(Array.isArray(result.features)?result.features:[]).flatMap((f:{geometry?:{coordinates?:number[]};properties?:Record<string,string>})=>{
      const p=f.properties??{},[longitude,latitude]=f.geometry?.coordinates??[];
      if(p.countrycode?.toUpperCase()!=="BR"||!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180)return [];
      // Photon may return other streets with the same house number. Never auto-pin those.
      if(a&&(![p.street,p.name].some(street=>street&&normalize(street)===normalize(a.street))||(p.city&&normalize(p.city)!==normalize(a.city))))return [];
      return [{latitude,longitude,label:[p.name,p.street,p.housenumber,p.district,p.city,p.state].filter(Boolean).join(", ")}];
    });
    return reply({candidates});
  }catch(error){return failure(error);}
}
