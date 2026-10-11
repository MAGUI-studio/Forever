import type {ReactNode} from "react";
import {WeddingBranch} from "@/components/wedding/WeddingOrnaments";
export function AdminPageHeading({eyebrow,title,description}:{eyebrow:string;title:ReactNode;description:ReactNode}){
 return <div className="admin-list-heading items-start! gap-5"><div className="min-w-0"><p className="admin-eyebrow">{eyebrow}</p><h2>{title}</h2><p className="max-w-xl leading-relaxed!">{description}</p></div><span className="admin-heading-branch shrink-0" aria-hidden="true"><WeddingBranch/></span></div>;
}
