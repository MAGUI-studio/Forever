import {PublicWedding} from "@/components/wedding/PublicWedding";
import {WeddingSite} from "@/components/wedding/WeddingSite";
import {findWedding} from "@/lib/wedding-server";
import {pageMetadata,weddingMetadata,jsonLd,SEO_ORIGIN,SEO_IMAGE} from "@/lib/seo";
export const dynamic="force-dynamic";
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 try{const wedding=await findWedding(slug);if(wedding?.status==="published"&&wedding.plan!==null)return weddingMetadata(wedding);}catch{return pageMetadata({title:"Casamento indisponível | Forever",path:"/"+encodeURIComponent(slug),index:false});}
 return pageMetadata({title:"Casamento indisponível | Forever",path:"/"+encodeURIComponent(slug),index:false});
}
export default async function HomePage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const wedding=await findWedding(slug);const meta=wedding?.status==="published"&&wedding.plan!==null?weddingMetadata(wedding):null;return <PublicWedding slug={slug}>{meta&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd({"@context":"https://schema.org","@type":"WebPage",name:wedding!.config.couple.partner1+" & "+wedding!.config.couple.partner2,description:meta.description,url:SEO_ORIGIN+"/"+slug,inLanguage:"pt-BR",image:SEO_IMAGE.url,isPartOf:{"@id":SEO_ORIGIN+"/#website"}})}}/>}<WeddingSite/></PublicWedding>;}
