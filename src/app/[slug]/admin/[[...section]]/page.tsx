import {WeddingPreview} from "@/app/admin/WeddingPreview";
import {redirect} from "next/navigation";
import {AdminPanel} from "@/app/admin/panel";
import {SitePreviewFrame} from "@/app/admin/SitePreviewFrame";
import {notFound} from "next/navigation";
export default async function Page({params}:{params:Promise<{slug:string;section?:string[]}>}){const {section}=await params;const name=section?.[0]??"dashboard";if((section?.length??0)>1)notFound();if(name==="preview")return <WeddingPreview/>;if(name==="editor-preview")return <SitePreviewFrame/>;if(name==="site-settings")redirect(`/${(await params).slug}/admin/site`);if(name==="site")return <AdminPanel view="dashboard" section={name}/>;if(name==="login")redirect("/login");if(name==="dashboard")return <AdminPanel view="dashboard"/>;if(!["guests","check-in","tables","buffet","history","team"].includes(name))notFound();return <AdminPanel view="dashboard" section={name as "guests"|"check-in"|"tables"|"buffet"|"history"|"team"}/>;}
