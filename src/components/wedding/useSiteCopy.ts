"use client";
import {useWedding} from "./WeddingProvider";
import {siteCopy} from "@/config/templates/registry";
export function useSiteCopy(){const {config}=useWedding();return (key:string)=>siteCopy(config.copy,key);}
