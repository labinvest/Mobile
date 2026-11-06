import { z } from 'zod';

// Validação dos formulários no app. Espelha Backend/src/lib/schemas.ts para o erro aparecer no campo
// antes do envio; a API continua sendo a fonte da verdade e valida tudo de novo.

export const onlyDigits = (value: string) => value.replace(/\D/g, '');

export function isValidCpf(value: string) {
  const digits = onlyDigits(value);
  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false;
  const checkDigit = (length: number) => {
    let sum = 0;
    for (let index = 0; index < length; index++) sum += Number(digits[index]) * (length + 1 - index);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return checkDigit(9) === Number(digits[9]) && checkDigit(10) === Number(digits[10]);
}

/** 'DD/MM/AAAA' que existe no calendário. */
export function isValidBrDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return false;
  const [, day, month, year] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

const required = (message: string, min = 1) => z.string().trim().min(min, message);

export const fields = {
  name: required('Informe o nome completo.', 3).refine((value) => value.trim().includes(' '), 'Informe nome e sobrenome.'),
  email: z.string().trim().toLowerCase().pipe(z.email('Informe um e-mail válido.')),
  phone: z.string().refine((value) => [10, 11].includes(onlyDigits(value).length), 'Informe um celular com DDD.'),
  cpf: z.string().refine(isValidCpf, 'Confira o CPF: os dígitos não batem.'),
  city: required('Informe a cidade.', 2),
  newPassword: z.string().min(6, 'Use pelo menos 6 caracteres.').max(72, 'Use no máximo 72 caracteres.'),
  category: z.enum(['A', 'B', 'AB']),
};

export const loginSchema = z.object({
  email: fields.email,
  password: z.string().min(1, 'Informe a senha.'),
});

export const studentSignupSchema = z.object({
  name: fields.name,
  email: fields.email,
  phone: fields.phone,
  cpf: fields.cpf,
  city: fields.city,
  category: fields.category,
  password: fields.newPassword,
});

export const teacherSignupSchema = z.object({
  name: fields.name,
  cpf: fields.cpf,
  email: fields.email,
  phone: fields.phone,
  city: fields.city,
  password: fields.newPassword,
  passwordConfirmation: z.string(),
  cnhNumber: z.string().refine((value) => onlyDigits(value).length >= 9 && onlyDigits(value).length <= 11, 'O registro da CNH tem de 9 a 11 dígitos.'),
  cnhCategory: fields.category,
  cnhExpiry: z.string().refine(isValidBrDate, 'Use o formato DD/MM/AAAA.'),
  experience: required('Informe há quanto tempo você ensina.'),
  vehicleModel: required('Informe o modelo do veículo.', 2),
  vehicleYear: z.string().refine((value) => {
    const year = Number(value);
    return Number.isInteger(year) && year >= 1990 && year <= new Date().getFullYear() + 1;
  }, 'Ano do veículo inválido.'),
  plate: z.string().refine((value) => /^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(value.toUpperCase().replace(/[^A-Z0-9]/g, '')), 'Placa inválida (ex.: ABC1D23).'),
  transmission: z.enum(['Manual', 'Automático']),
  dualControl: z.boolean().refine(Boolean, 'O veículo precisa ter duplo comando para aulas práticas.'),
  termsAccepted: z.boolean().refine(Boolean, 'Confirme que os dados estão corretos.'),
}).refine((data) => data.password === data.passwordConfirmation, { path: ['passwordConfirmation'], message: 'As senhas não são iguais.' });

export type LoginForm = z.infer<typeof loginSchema>;
export type StudentSignupForm = z.input<typeof studentSignupSchema>;
export type TeacherSignupForm = z.input<typeof teacherSignupSchema>;
