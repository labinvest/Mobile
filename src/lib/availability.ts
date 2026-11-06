import type { IconName } from '@/components/ui';
import type { Period } from '@/types/api';

/** Mesma lista de Backend/src/lib/availability.ts. */
export const PERIODS: { value: Period; icon: IconName; shift: string }[] = [
  { value: '08h às 10h', icon: 'weather-sunset-up', shift: 'Manhã' },
  { value: '10h às 12h', icon: 'white-balance-sunny', shift: 'Manhã' },
  { value: '13h às 15h', icon: 'white-balance-sunny', shift: 'Tarde' },
  { value: '15h às 17h', icon: 'weather-partly-cloudy', shift: 'Tarde' },
  { value: '18h às 20h', icon: 'weather-night', shift: 'Noite' },
];

export const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const WEEKDAYS_LONG = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

/** Ordem de exibição: segunda a domingo. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
