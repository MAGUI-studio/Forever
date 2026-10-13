"use client";
import {LoadingScreen} from "@/components/ui/LoadingScreen";
import {WeddingOrnaments,WeddingLoadingIcon} from "@/components/wedding/WeddingOrnaments";

export function AdminLoading({description = "Buscando os detalhes do seu casamento…"}:{description?:string}){return <LoadingScreen icon={<WeddingLoadingIcon/>} background={<WeddingOrnaments variant="floral" tone="paper"/>} description={description}/>;}
