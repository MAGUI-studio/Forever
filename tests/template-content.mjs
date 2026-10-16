import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {createRequire} from "node:module";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const require=createRequire(import.meta.url);
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/,"$1")),"..");
const cache=new Map();
function load(file){
 file=path.resolve(root,file);
 if(cache.has(file))return cache.get(file);
 if(file.endsWith(".json"))return JSON.parse(readFileSync(file,"utf8"));
 const exports={};cache.set(file,exports);
 const output=ts.transpileModule(readFileSync(file,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText;
 vm.runInNewContext(output,{exports,process,URL,require:name=>{
  let dependency=name.startsWith("@/")?path.resolve(root,"src",name.slice(2)):name.startsWith(".")?path.resolve(path.dirname(file),name):null;
  if(!dependency)return require(name);
  if(!path.extname(dependency))dependency+=".ts";
  assert(existsSync(dependency),dependency);return load(dependency);
 }});return exports;
}
const registry=load("src/config/templates/registry.ts");
const {weddingConfigSchema}=load("src/lib/wedding-schema.ts");
const {venueDisplayTips}=load("src/lib/wedding-settings.ts");
const templates=["botanical-classic","contemporary-romance","minimalist-modern"];
for(const template of templates){
 for(const style of ["botanical","minimalist"]){
  const fields=registry.templateCopyFields(template,style);
  assert.equal(new Set(fields.map(field=>field.key)).size,fields.length,"Duplicate editor fields");
  const authored=Object.fromEntries(fields.map(field=>[field.key,`Personalizado: ${field.key}`]));
  const parsed=weddingConfigSchema.pick({copy:true}).parse({copy:authored});
  for(const field of fields)assert.equal(registry.siteCopy(parsed.copy,field.key,template),authored[field.key],`${template}: ${field.key} must survive save and render`);
  for(const key of ["events.separateIntro","events.ceremonyDescription","events.partyDescription","gifts.emptyMessage","rsvp.text2","rsvp.text3"]){assert(fields.some(field=>field.key===key),`${template}: missing ${key}`);}
  for(const key of style==="botanical"?["dressCode.color1Hex","dressCode.color2Hex"]:["pro.dress.label","pro.dress.dosTitle","pro.dress.dontsTitle","pro.dress.paletteTitle"])assert(fields.some(field=>field.key===key),`${template}: missing ${key}`);
 }
 const blank={"events.separateIntro":"","footer.text2":""};
 const saved=registry.switchTemplateCopy(blank,template,template);
 assert.equal(saved["events.separateIntro"],"");assert.equal(saved["footer.text2"],"");
}
assert.equal(venueDisplayTips({tips:"A cerimônia e a recepção acontecerão no mesmo local. Entrada pelo jardim."},false),"Entrada pelo jardim.");
assert.equal(venueDisplayTips({tips:"Entrada pelo jardim."},true),"Entrada pelo jardim.");
console.log("All three templates preserve editable content, both dress styles and intentional empty text.");
