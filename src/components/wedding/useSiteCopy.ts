"use client";
import {useWedding} from "./WeddingProvider";
import {siteCopy} from "@/config/templates/registry";
export function useSiteCopy(){const {config,templateId}=useWedding();return (key:string)=>siteCopy(config.copy,key,templateId);}
