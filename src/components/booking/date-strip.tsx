import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { haptic } from '@/lib/haptics';
import type { upcomingDays } from '@/lib/dates';
import { colors, gutter, radius, space } from '@/theme/tokens';

type Day = ReturnType<typeof upcomingDays>[number];

/** Faixa horizontal de dias, rolável com o dedo. `isDisabled` marca dias sem horário livre (aparecem esmaecidos e não são selecionáveis). */
export function DateStrip({ days, value, onChange, isDisabled }: { days: Day[]; value: string; onChange: (value: string) => void; isDisabled?: (value: string) => boolean }) {
  return (
    <FlatList
      horizontal
      data={days}
      keyExtractor={(day) => day.value}
      showsHorizontalScrollIndicator={false}
      style={styles.bleed}
      contentContainerStyle={styles.content}
      ItemSeparatorComponent={() => <View style={{ width: space.sm }} />}
      accessibilityRole="radiogroup"
      renderItem={({ item }) => {
        const selected = item.value === value;
        const disabled = !!isDisabled?.(item.value);
        return (
          <Pressable
            accessibilityRole="radio"
            accessibilityLabel={disabled ? `${item.label}, sem horários livres` : item.label}
            accessibilityState={{ selected, checked: selected, disabled }}
            disabled={disabled}
            onPress={() => {
              haptic.selection();
              onChange(item.value);
            }}
            style={({ pressed }) => [styles.day, selected && styles.selected, pressed && !selected && styles.pressed, disabled && styles.disabled]}>
            <Text variant="caption" style={{ color: selected ? colors.accent : colors.muted }}>{item.weekday}</Text>
            <Text variant="title1" style={{ color: selected ? colors.onBrand : colors.ink }}>{item.day}</Text>
            <Text variant="footnote" style={{ color: selected ? colors.onAsphaltMuted : colors.muted }}>{item.month}</Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  bleed: { marginHorizontal: -gutter, flexGrow: 0 },
  content: { paddingHorizontal: gutter },
  day: { width: 68, paddingVertical: space.md, alignItems: 'center', gap: 2, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  selected: { backgroundColor: colors.brand, borderColor: colors.brand },
  pressed: { backgroundColor: colors.surfaceAlt },
  disabled: { opacity: 0.4, borderStyle: 'dashed' },
});
