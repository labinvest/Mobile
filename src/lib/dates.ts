const WEEKDAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const SHORT_WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

const pad = (value: number) => String(value).padStart(2, '0');

/** Data local do aparelho no formato AAAA-MM-DD. */
export function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayIso() {
  return toIsoDate(new Date());
}

/** 'Quarta-feira, 7 de outubro' */
export function formatLongDate(date = new Date()) {
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

/** Próximos dias a partir de hoje, no formato dos botões de agendamento. */
export function upcomingDays(count: number, from = new Date()) {
  return Array.from({ length: count }, (_, offset) => {
    const date = new Date(from.getFullYear(), from.getMonth(), from.getDate() + offset);
    return { value: toIsoDate(date), label: `${SHORT_WEEKDAYS[date.getDay()]} ${date.getDate()}` };
  });
}

/** 'hoje', 'há 3 dias', 'há 2 semanas', 'há 4 meses' */
export function timeAgo(timestamp: number, now = Date.now()) {
  const days = Math.floor((now - timestamp) / 86_400_000);
  if (days < 1) return 'hoje';
  if (days < 7) return `há ${days} dia${days === 1 ? '' : 's'}`;
  if (days < 30) return `há ${Math.floor(days / 7)} semana${days < 14 ? '' : 's'}`;
  const months = Math.floor(days / 30);
  return `há ${months} ${months === 1 ? 'mês' : 'meses'}`;
}

/** 'Qui, 8 out' -> 'QUI, 8 OUT' a partir de AAAA-MM-DD */
export function shortDateLabel(iso: string) {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return `${SHORT_WEEKDAYS[date.getDay()]}, ${day} ${MONTHS[month - 1].slice(0, 3)}`.toUpperCase();
}
