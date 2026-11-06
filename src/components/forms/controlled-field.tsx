import { useState } from 'react';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';

import { Chip, Icon, IconButton, Text, TextField, type TextFieldProps } from '@/components/ui';
import { haptic } from '@/lib/haptics';
import { colors, radius, space } from '@/theme/tokens';

/** TextField ligado ao React Hook Form: valor, erro do Zod e máscara opcional. */
export function ControlledField<T extends FieldValues>({ control, name, mask, ...props }: Omit<TextFieldProps, 'value' | 'onChangeText'> & {
  control: Control<T>;
  name: Path<T>;
  mask?: (value: string) => string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...props}
          value={field.value ?? ''}
          onChangeText={(text) => field.onChange(mask ? mask(text) : text)}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

/** Senha com botão de mostrar/ocultar. */
export function PasswordField<T extends FieldValues>(props: Omit<TextFieldProps, 'value' | 'onChangeText'> & { control: Control<T>; name: Path<T> }) {
  const [visible, setVisible] = useState(false);
  return (
    <ControlledField
      icon="lock-outline"
      autoCapitalize="none"
      autoCorrect={false}
      {...props}
      secureTextEntry={!visible}
      trailing={<IconButton icon={visible ? 'eye-off-outline' : 'eye-outline'} label={visible ? 'Ocultar senha' : 'Mostrar senha'} onPress={() => setVisible(!visible)} style={styles.eye} />}
    />
  );
}

/** Escolha única entre poucas opções, como chips. */
export function ControlledChoice<T extends FieldValues>({ control, name, label, options }: { control: Control<T>; name: Path<T>; label: string; options: { value: string; label: string }[] }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <View style={styles.choice}>
          <Text variant="caption" tone="secondary">{label}</Text>
          <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel={label}>
            {options.map((option) => <Chip key={option.value} label={option.label} selected={field.value === option.value} onPress={() => field.onChange(option.value)} />)}
          </View>
        </View>
      )}
    />
  );
}

/** Caixa de seleção com texto clicável inteiro e erro abaixo. */
export function ControlledCheckbox<T extends FieldValues>({ control, name, title, detail }: { control: Control<T>; name: Path<T>; title: string; detail?: string }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const checked = field.value === true;
        return (
          <View style={styles.wrap}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              accessibilityLabel={title}
              onPress={() => {
                haptic.selection();
                field.onChange(!checked);
              }}
              style={styles.row}>
              <View style={[styles.box, checked && styles.boxChecked, !!fieldState.error && styles.boxError]}>
                {checked && <Icon name="check" size={16} color={colors.onBrand} />}
              </View>
              <View style={styles.copy}>
                <Text variant="bodyStrong">{title}</Text>
                {!!detail && <Text variant="footnote" tone="muted">{detail}</Text>}
              </View>
            </Pressable>
            {!!fieldState.error && <Text variant="footnote" tone="danger" style={styles.error}>{fieldState.error.message}</Text>}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs },
  row: { flexDirection: 'row', gap: space.md, minHeight: 48, alignItems: 'flex-start', paddingVertical: space.xs },
  box: { width: 24, height: 24, borderRadius: radius.sm - 2, borderWidth: 2, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center', marginTop: 1, backgroundColor: colors.surface },
  boxChecked: { backgroundColor: colors.brand, borderColor: colors.brand },
  boxError: { borderColor: colors.danger },
  copy: { flex: 1, gap: 2 },
  error: { marginLeft: 36 },
  eye: { marginRight: -space.sm },
  choice: { gap: space.xs + 2, marginBottom: space.lg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
