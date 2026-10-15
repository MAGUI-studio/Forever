import { z } from "zod";

export const passwordRequirements = [
  {label:"Pelo menos 8 caracteres",test:(value:string)=>value.length>=8},
  {label:"Uma letra maiúscula",test:(value:string)=>/\p{Lu}/u.test(value)},
  {label:"Uma letra minúscula",test:(value:string)=>/\p{Ll}/u.test(value)},
  {label:"Um número",test:(value:string)=>/\d/.test(value)},
  {label:"Um símbolo (ex.: !, @, #)",test:(value:string)=>/[^\p{L}\p{N}\s]/u.test(value)},
];

export const accountSchema=z.object({
  email:z.string().trim().email("Informe um e-mail válido."),
  password:z.string().min(1,"Informe sua senha.").max(128,"Use no máximo 128 caracteres."),
  confirmPassword:z.string(),
  mode:z.enum(["create","login"]),
}).superRefine((data,context)=>{
  if(data.mode !== "create")return;
  for(const requirement of passwordRequirements)if(!requirement.test(data.password))context.addIssue({code:"custom",path:["password"],message:requirement.label+" é obrigatório."});
  if(!data.confirmPassword)context.addIssue({code:"custom",path:["confirmPassword"],message:"Confirme sua senha."});
  else if(data.password !== data.confirmPassword)context.addIssue({code:"custom",path:["confirmPassword"],message:"As senhas precisam ser iguais."});
});
export type AccountValues=z.infer<typeof accountSchema>;
