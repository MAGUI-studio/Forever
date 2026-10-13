import {redirect} from "next/navigation";

/** Old gift-list links now land on the wedding's inline catalog. */
export default async function GiftsPage({params}:{params:Promise<{slug:string}>}) {
 const {slug}=await params;
 redirect(`/${slug}#presentes`);
}
