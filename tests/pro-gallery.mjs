import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function load(file,requireMock) {
 const source=readFileSync(new URL(file,import.meta.url),"utf8");
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX},reportDiagnostics:true});
 assert.equal(compiled.diagnostics.length,0);
 const exports={};
 vm.runInNewContext(compiled.outputText,{exports,require:requireMock});
 return exports;
}
const gallery=load("../src/config/gallery.ts",()=>{throw Error("Unexpected dependency");});
let context;
const dispatcher=()=>null;
const jsx=(type,props)=>({type,props});
const fallback=new Proxy({}, {get:()=>()=>null});
const {ProGallery}=load("../src/components/wedding/templates/ProTemplateSections.tsx",name=>{
 if(name==="react")return {useState:()=>[null,()=>{}]};
 if(name==="react/jsx-runtime")return {jsx,jsxs:jsx};
 if(name==="../WeddingProvider")return {useWedding:()=>context};
 if(name==="../useSiteCopy")return {useSiteCopy:()=>key=>key};
 if(name==="../GalleryStyles")return {GalleryGridDispatcher:dispatcher};
 if(name==="@/config/gallery")return gallery;
 return fallback;
});
function find(node) {
 if(!node||typeof node!=="object")return null;
 if(node.type===dispatcher)return node;
 for(const child of [node.props?.children].flat(Infinity)) {const found=find(child);if(found)return found;}
 return null;
}
for(const templateId of ["minimalist-modern","serene-breeze"]) {
 for(const style of [...gallery.galleryStyles.map(item=>item.value),undefined]) {
  context={templateId,config:{gallery:[{id:"1",url:"/photo.png"}],galleryStyle:style}};
  const result=find(ProGallery());
  assert.ok(result,`${templateId} must always use the editor's gallery dispatcher`);
  assert.equal(result.props.style,style??"polaroid");
  assert.equal(result.props.photos[0].url,"/photo.png");
 }
 context.config.sections={gallery:false};
 assert.equal(ProGallery(),null);
 context.config.sections={gallery:true};
 context.config.gallery=[];
 assert.equal(ProGallery(),null,"An empty form must not render placeholder photos");
}
console.log("Both PRO templates respect all five gallery styles and the default.");
