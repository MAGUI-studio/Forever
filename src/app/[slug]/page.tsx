import {PublicWedding} from "@/components/wedding/PublicWedding";
import {WeddingSite} from "@/components/wedding/WeddingSite";
import {findWedding} from "@/lib/wedding-server";
import {FOREVER_ORIGIN} from "@/config/forever";
export const dynamic="force-dynamic";
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const wedding=await findWedding(slug);if(!wedding||wedding.status!=="published")return {title:"Casamento indisponível",robots:{index:false}};const couple=wedding.config.couple;return {title:couple.partner1+" & "+couple.partner2+" | Forever",alternates:{canonical:FOREVER_ORIGIN+"/"+slug},openGraph:{title:couple.partner1+" & "+couple.partner2,images:[couple.coverImage]}};}
export default async function HomePage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return <PublicWedding slug={slug}><WeddingSite/></PublicWedding>;}
