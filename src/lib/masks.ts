// Máscaras aplicadas enquanto a pessoa digita. A API recebe o texto mascarado e extrai os dígitos.

const digits = (value: string, max: number) => value.replace(/\D/g, '').slice(0, max);

/** 12345678901 -> 123.456.789-01 */
export function maskCpf(value: string) {
  const d = digits(value, 11);
  return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

/** 11987654321 -> (11) 98765-4321 · 1133334444 -> (11) 3333-4444 */
export function maskPhone(value: string) {
  const d = digits(value, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  const local = d.slice(2);
  const split = d.length === 11 ? 5 : 4;
  return `(${d.slice(0, 2)}) ${local.length > split ? `${local.slice(0, split)}-${local.slice(split)}` : local}`;
}

/** 01022030 -> 01/02/2030 */
export function maskDate(value: string) {
  const d = digits(value, 8);
  return [d.slice(0, 2), d.slice(2, 4), d.slice(4)].filter(Boolean).join('/');
}

/** 'R$ 85' -> 8500 · '85,5' ou '85.5' -> 8550 · '1.000,50' -> 100050; null se não der para ler. */
export function parsePriceToCents(value: string) {
  const match = /^(\d+|\d{1,3}(?:\.\d{3})+)?(?:[.,](\d{0,2}))?$/.exec(value.replace(/[^\d.,]/g, ''));
  if (!match || !(match[1] || match[2])) return null;
  const reais = Number((match[1] ?? '').replace(/\./g, ''));
  const cents = Number((match[2] ?? '').padEnd(2, '0'));
  return reais * 100 + cents;
}
