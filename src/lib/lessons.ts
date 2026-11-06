import type { BadgeTone } from '@/components/ui';
import type { Appointment, AppointmentStatus } from '@/types/api';

/** Mesma lista do backend (Backend/src/lib/lesson-rules.ts). */
export const OPEN_STATUSES: AppointmentStatus[] = ['requested', 'scheduled', 'in-progress'];

export const isOpen = (appointment: Appointment) => OPEN_STATUSES.includes(appointment.status);

export const statusMeta: Record<AppointmentStatus, { label: string; tone: BadgeTone }> = {
  requested: { label: 'Aguardando instrutor', tone: 'warning' },
  scheduled: { label: 'Confirmada', tone: 'success' },
  'in-progress': { label: 'Em andamento', tone: 'accent' },
  completed: { label: 'Concluída', tone: 'neutral' },
  declined: { label: 'Recusada', tone: 'danger' },
};

/** Tira o prefixo "Aula prática · " que o agendamento grava no nome da aula. */
export const lessonFocus = (lesson: string) => lesson.replace(/^Aula prática · /, '');

/** Horas de prática somando as aulas concluídas, ex.: '3h 20min'. */
export function practiceTime(appointments: Appointment[]) {
  const seconds = appointments.filter((item) => item.status === 'completed').reduce((sum, item) => sum + (item.durationSeconds ?? 0), 0);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h${minutes ? ` ${minutes}min` : ''}` : `${minutes}min`;
}

/** 8550 -> 'R$ 85,50' */
export const formatCents = (cents: number) => `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;

/** Soma do valor das aulas concluídas no mês corrente (o pagamento é combinado fora do app). */
export function monthTotals(appointments: Appointment[], now = new Date()) {
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const done = appointments.filter((item) => item.status === 'completed' && item.lessonDate.startsWith(month));
  return { lessons: done.length, cents: done.reduce((sum, item) => sum + (item.priceCents ?? 0), 0) };
}

export const initialsOf = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? '';

export function greeting(date = new Date()) {
  const hour = date.getHours();
  return hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
}
