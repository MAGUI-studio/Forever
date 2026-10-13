import fs from "node:fs";
import { cert, initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if(fs.existsSync(".env"))process.loadEnvFile(".env");
const paymentLink=process.argv.find(value=>value.startsWith("--payment-link="))?.slice(15);
if(!paymentLink||new URL(paymentLink).protocol!=="https:")throw Error("Provide --payment-link=https://...");
const gifts=JSON.parse(fs.readFileSync(new URL("./data/giovanna-e-edson-gifts.json",import.meta.url),"utf8"));
if(gifts.length!==82||gifts.some(gift=>!gift.title||!Number.isFinite(gift.price)||gift.price<=0))throw Error("Invalid gift catalog");
const app=initializeApp({credential:cert({projectId:process.env.FIREBASE_PROJECT_ID,clientEmail:process.env.FIREBASE_CLIENT_EMAIL,privateKey:process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g,"\n")})});
try {
  const db=getFirestore(app),ref=db.doc("weddings/giovanna-e-edson");
  const now=new Date().toISOString(),backup=ref.collection("giftCatalogBackups").doc();
  await db.runTransaction(async transaction=>{
    const snapshot=await transaction.get(ref),current=snapshot.data();
    if(!current?.config||current.slug!=="giovanna-e-edson")throw Error("Wedding scope mismatch");
    transaction.set(backup,{at:now,gifts:current.config.gifts??[],giftPaymentLink:current.config.giftPaymentLink??"",siteRevision:current.siteRevision??0});
    const revision=(current.siteRevision??0)+1;
    const update={"config.gifts":gifts,"config.giftPaymentLink":paymentLink,siteRevision:revision,updatedAt:now};
    if(current.siteDraft){update.siteDraft={...current.siteDraft,config:{...current.siteDraft.config,gifts,giftPaymentLink:paymentLink},baseRevision:current.siteDraft.baseRevision===(current.siteRevision??0)?revision:current.siteDraft.baseRevision,updatedAt:now};}
    transaction.update(ref,update);
    transaction.set(ref.collection("auditLog").doc(),{at:now,actor:"MAGUI.studio",action:"Lista de presentes atualizada",target:"giovanna-e-edson",details:"82 presentes cadastrados com os valores informados pelo casal."});
  });
  const saved=(await ref.get()).data().config.gifts;
  if(saved.length!==82||saved.some((gift,index)=>gift.price!==gifts[index].price||gift.title!==gifts[index].title))throw Error("Verification failed");
  console.log(JSON.stringify({wedding:"giovanna-e-edson",count:saved.length,missingPrices:saved.filter(gift=>!gift.price).length,total:saved.reduce((sum,gift)=>sum+gift.price,0),backup:backup.path}));
} finally {await deleteApp(app);}
