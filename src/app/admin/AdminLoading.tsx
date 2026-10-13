"use client";
import {LoadingScreen} from "@/components/ui/LoadingScreen";
import {WeddingOrnaments,WeddingLoadingIcon} from "@/components/wedding/WeddingOrnaments";

export function AdminLoading(){return <LoadingScreen icon={<WeddingLoadingIcon/>} background={<WeddingOrnaments variant="floral" tone="paper"/>} description="Estamos carregando as informações do seu casamento. Só um instante…"/>;}
