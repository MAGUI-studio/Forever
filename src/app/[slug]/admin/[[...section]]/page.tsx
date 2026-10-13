import {pageMetadata} from "@/lib/seo";
import {WeddingPreview} from "@/app/admin/WeddingPreview";
import {redirect} from "next/navigation";
import {AdminPanel} from "@/app/admin/panel";
import {SitePreviewFrame} from "@/app/admin/SitePreviewFrame";
import {notFound} from "next/navigation";
export async function generateMetadata({params}:{params:Promise<{slug:string;section?:string[]}>}){
 const {slug,section}=await params;
 const titles:Record<string,string>={dashboard:"Painel do casamento",guests:"Lista de convidados","check-in":"Controle de chegada",tables:"Mesas e lugares",buffet:"Alimentação e buffet",history:"Histórico de alterações",team:"Equipe da recepção",site:"Editor do site",preview:"Prévia do site","editor-preview":"Prévia do editor"};
 const name=section?.[0]??"dashboard";
 return pageMetadata({title:(titles[name]??"Painel administrativo")+" | Forever",description:"Área reservada do casamento no Forever.",path:"/"+encodeURIComponent(slug)+"/admin"+(section?.length?"/"+section.map(encodeURIComponent).join("/"):""),index:false});
}
export default async function Page({params}:{params:Promise<{slug:string;section?:string[]}>}){const {section}=await params;const name=section?.[0]??"dashboard";if((section?.length??0)>1)notFound();if(name==="preview")return <WeddingPreview/>;if(name==="editor-preview")return <SitePreviewFrame/>;if(name==="site-settings")redirect(`/${(await params).slug}/admin/site`);if(name==="site")return <AdminPanel view="dashboard" section={name}/>;if(name==="login")redirect("/login");if(name==="dashboard")return <AdminPanel view="dashboard"/>;if(!["guests","check-in","tables","buffet","history","team"].includes(name))notFound();return <AdminPanel view="dashboard" section={name as "guests"|"check-in"|"tables"|"buffet"|"history"|"team"}/>;}
