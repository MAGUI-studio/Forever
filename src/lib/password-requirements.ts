export const passwordRequirements = [
  { label: "Pelo menos 8 caracteres", test: (value: string) => value.length >= 8 },
  { label: "Uma letra maiúscula", test: (value: string) => /\p{Lu}/u.test(value) },
  { label: "Uma letra minúscula", test: (value: string) => /\p{Ll}/u.test(value) },
  { label: "Um número", test: (value: string) => /\d/.test(value) },
  { label: "Um símbolo (ex.: !, @, #)", test: (value: string) => /[^\p{L}\p{N}\s]/u.test(value) },
];
