/** Stable, readable address generated from the couple's first names. */
export function weddingAddress(partner1:string,partner2:string):string {
  const first=(value:string)=>value.trim().split(/\s+/)[0].normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
  const one=first(partner1),two=first(partner2);
  return one && two ? `${one}-e-${two}` : "";
}
