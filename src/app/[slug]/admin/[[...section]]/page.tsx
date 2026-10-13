import {WeddingPreview} from "@/app/admin/WeddingPreview";
import {redirect} from "next/navigation";
import {AdminPanel} from "@/app/admin/panel";
import {WeddingEditor} from "@/app/admin/WeddingEditor";
import {notFound} from "next/navigation";
export default async function Page({params}:{params:Promise<{slug:string;section?:string[]}>}){const {section}=await params;const name=section?.[0]??"dashboard";if((section?.length??0)>1)notFound();if(name==="preview")return <WeddingPreview/>;if(name==="site")return <WeddingEditor/>;if(name==="login")redirect("/login");if(name==="dashboard")return <AdminPanel view="dashboard"/>;if(!["guests","check-in","tables","buffet","history","team"].includes(name))notFound();return <AdminPanel view="dashboard" section={name as "guests"|"check-in"|"tables"|"buffet"|"history"|"team"}/>;}
