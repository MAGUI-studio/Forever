import { z } from "zod";

import { passwordRequirements } from "@/lib/password-requirements";
export { passwordRequirements } from "@/lib/password-requirements";

export const accountSchema = z
  .object({
    email: z.string().trim().email("Informe um e-mail válido."),
    password: z.string().min(1, "Informe sua senha.").max(128, "Use no máximo 128 caracteres."),
    confirmPassword: z.string(),
    mode: z.enum(["create", "login"]),
  })
  .superRefine((data, context) => {
    if (data.mode !== "create") return;
    for (const requirement of passwordRequirements)
      if (!requirement.test(data.password))
        context.addIssue({
          code: "custom",
          path: ["password"],
          message: requirement.label + " é obrigatório.",
        });
    if (!data.confirmPassword)
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Confirme sua senha.",
      });
    else if (data.password !== data.confirmPassword)
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "As senhas precisam ser iguais.",
      });
  });
export type AccountValues = z.infer<typeof accountSchema>;
