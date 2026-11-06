import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { PERIODS, WEEK_ORDER, WEEKDAYS_LONG } from '@/lib/availability';
import type { WeeklySlot } from '@/types/api';
import { colors, space } from '@/theme/tokens';

/** Leitura da agenda semanal: um dia por linha, com os períodos atendidos. */
export function WeeklySchedule({ slots }: { slots: WeeklySlot[] }) {
  if (slots.length === 0) {
    return <Text variant="callout" tone="muted">Agenda ainda não publicada. O instrutor combina o horário ao aceitar o pedido.</Text>;
  }
  return (
    <View>
      {WEEK_ORDER.map((weekday, index) => {
        const periods = PERIODS.filter((period) => slots.some((slot) => slot.weekday === weekday && slot.period === period.value));
        return (
          <View key={weekday} style={[styles.row, index > 0 && styles.divider]}>
            <Text variant="bodyStrong" style={styles.day}>{WEEKDAYS_LONG[weekday]}</Text>
            <Text variant="callout" tone={periods.length ? 'secondary' : 'muted'} style={styles.flex}>
              {periods.length ? periods.map((period) => period.value).join(' · ') : 'Não atende'}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: space.md, paddingVertical: space.sm + 2 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  day: { width: 76 },
});
