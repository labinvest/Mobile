import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { haptic } from '@/lib/haptics';
import { colors, radius, space, typography } from '@/theme/tokens';

import { Icon, type IconName } from './icon';
import { Text } from './text';

export type TextFieldProps = TextInputProps & { label: string; icon?: IconName; error?: string; helper?: string; maxLength?: number; trailing?: ReactNode };

/** Campo com rótulo fixo acima (não some ao digitar), erro e contador opcionais. */
export function TextField({ label, icon, error, helper, maxLength, multiline, style, onFocus, onBlur, trailing, ...props }: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const length = typeof props.value === 'string' ? props.value.length : 0;

  return (
    <View style={styles.field}>
      <Text variant="caption" tone="secondary" nativeID={`${label}-label`}>{label}</Text>
      <View style={[styles.inputWrap, multiline && styles.inputWrapMultiline, focused && styles.inputFocused, !!error && styles.inputError]}>
        {icon && <View style={multiline && styles.iconTop}><Icon name={icon} size={20} color={focused ? colors.brand : colors.muted} /></View>}
        <TextInput
          accessibilityLabel={label}
          accessibilityLabelledBy={`${label}-label`}
          placeholderTextColor={colors.muted}
          selectionColor={colors.brand}
          cursorColor={colors.brand}
          maxLength={maxLength}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={(event) => { setFocused(true); onFocus?.(event); }}
          onBlur={(event) => { setFocused(false); onBlur?.(event); }}
          {...props}
          style={[styles.input, multiline && styles.inputMultiline, style]}
        />
        {trailing}
      </View>
      <View style={styles.footer}>
        {error ? <Text variant="footnote" tone="danger" style={styles.flex} accessibilityLiveRegion="polite">{error}</Text>
          : helper ? <Text variant="footnote" tone="muted" style={styles.flex}>{helper}</Text>
          : <View style={styles.flex} />}
        {!!maxLength && multiline && <Text variant="footnote" tone="muted">{length}/{maxLength}</Text>}
      </View>
    </View>
  );
}

/** Opção selecionável (filtros, tipo de aula, horários). */
export function Chip({ label, selected, onPress, icon, disabled }: { label: string; selected: boolean; onPress: () => void; icon?: IconName; disabled?: boolean }) {
  const fg = disabled ? colors.disabled : selected ? colors.onBrand : colors.ink;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, checked: selected, disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => {
        haptic.selection();
        onPress();
      }}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && !selected && styles.chipPressed]}>
      {icon && <Icon name={icon} size={18} color={fg} />}
      <Text variant="callout" style={[{ color: fg }, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

/** Alternância entre 2–3 visões da mesma lista (ex.: Próximas / Histórico). */
export function SegmentedControl<T extends string>({ options, value, onChange }: { options: { value: T; label: string; count?: number }[]; value: T; onChange: (value: T) => void }) {
  return (
    <View style={styles.segmented} accessibilityRole="tablist">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.count !== undefined ? `${option.label}, ${option.count}` : option.label}
            onPress={() => {
              haptic.selection();
              onChange(option.value);
            }}
            style={[styles.segment, selected && styles.segmentSelected]}>
            <Text variant="callout" style={[styles.segmentText, selected && styles.segmentTextSelected]}>
              {option.label}{option.count !== undefined ? ` · ${option.count}` : ''}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  segmented: { flexDirection: 'row', padding: 4, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  segment: { flex: 1, minHeight: 40, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  segmentSelected: { backgroundColor: colors.surface, boxShadow: '0 1px 3px rgba(11, 20, 16, 0.12)' },
  segmentText: { color: colors.muted, fontWeight: '600' },
  segmentTextSelected: { color: colors.ink },
  field: { gap: space.xs + 2 },
  inputWrap: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md + 2, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.lineStrong },
  inputWrapMultiline: { alignItems: 'flex-start', paddingVertical: space.md },
  inputFocused: { borderColor: colors.brand, borderWidth: 2, paddingHorizontal: space.md + 1 },
  inputError: { borderColor: colors.danger },
  iconTop: { paddingTop: 1 },
  input: { flex: 1, ...typography.body, color: colors.ink, paddingVertical: space.sm, outlineStyle: 'none' } as never,
  inputMultiline: { minHeight: 84, paddingVertical: 0 },
  footer: { flexDirection: 'row', gap: space.sm, minHeight: 18, marginBottom: space.sm },
  chip: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: space.xs + 2, paddingHorizontal: space.lg, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.lineStrong, backgroundColor: colors.surface },
  chipSelected: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipPressed: { backgroundColor: colors.surfaceAlt },
  chipTextSelected: { fontWeight: '600' },
});
