import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { haptic } from '@/lib/haptics';
import { colors, radius, space, touchTarget } from '@/theme/tokens';

import { Icon, type IconName } from './icon';
import { Text } from './text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent' | 'inverse';

const palette: Record<Variant, { bg: string; pressed: string; fg: string; border?: string }> = {
  primary: { bg: colors.brand, pressed: colors.brandPressed, fg: colors.onBrand },
  secondary: { bg: colors.surface, pressed: colors.surfaceAlt, fg: colors.ink, border: colors.lineStrong },
  ghost: { bg: 'transparent', pressed: colors.surfaceAlt, fg: colors.brand },
  danger: { bg: colors.dangerSoft, pressed: '#F8D5D1', fg: colors.danger },
  accent: { bg: colors.accent, pressed: '#B4DD4C', fg: colors.accentInk },
  inverse: { bg: colors.asphaltRaised, pressed: '#28392F', fg: colors.onAsphalt },
};

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: 'md' | 'lg';
  icon?: IconName;
  trailingIcon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, variant = 'primary', size = 'md', icon, trailingIcon, loading, disabled, fullWidth, accessibilityHint, style }: ButtonProps) {
  const tone = palette[variant];
  const inactive = disabled || loading;
  const fg = inactive && variant !== 'ghost' ? colors.disabled : tone.fg;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={() => {
        haptic.tap();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' && styles.large,
        fullWidth && styles.fullWidth,
        { backgroundColor: inactive && variant !== 'ghost' ? colors.surfaceAlt : pressed ? tone.pressed : tone.bg },
        tone.border && { borderWidth: 1, borderColor: inactive ? colors.line : tone.border },
        pressed && styles.pressed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.content}>
          {icon && <Icon name={icon} size={20} color={fg} />}
          <Text variant="bodyStrong" style={{ color: fg }} numberOfLines={1}>{label}</Text>
          {trailingIcon && <Icon name={trailingIcon} size={20} color={fg} />}
        </View>
      )}
    </Pressable>
  );
}

/** Botão só de ícone, com área de toque de 48dp. */
export function IconButton({ icon, label, onPress, tone = 'default', style }: { icon: IconName; label: string; onPress?: () => void; tone?: 'default' | 'inverse' | 'brand'; style?: StyleProp<ViewStyle> }) {
  const color = tone === 'inverse' ? colors.onAsphalt : tone === 'brand' ? colors.brand : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      onPress={() => {
        haptic.tap();
        onPress?.();
      }}
      style={({ pressed }) => [styles.iconButton, pressed && { backgroundColor: tone === 'inverse' ? colors.asphaltRaised : colors.surfaceAlt }, style]}>
      <Icon name={icon} color={color} size={24} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: touchTarget, paddingHorizontal: space.xl, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  large: { minHeight: 56, borderRadius: radius.lg },
  fullWidth: { alignSelf: 'stretch' },
  pressed: { transform: [{ scale: 0.98 }] },
  content: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  iconButton: { width: touchTarget, height: touchTarget, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
