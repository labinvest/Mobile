import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { colors, typography, type TypographyVariant } from '@/theme/tokens';

const tones = {
  default: colors.ink,
  secondary: colors.inkSecondary,
  muted: colors.muted,
  brand: colors.brand,
  danger: colors.danger,
  success: colors.success,
  warning: colors.warning,
  inverse: colors.onAsphalt,
  inverseMuted: colors.onAsphaltMuted,
} as const;

export type TextTone = keyof typeof tones;

export type TextProps = RNTextProps & { variant?: TypographyVariant; tone?: TextTone; align?: 'left' | 'center' | 'right' };

/** Todo texto do app. Respeita o tamanho de fonte do sistema, com teto nos títulos grandes para não quebrar o layout. */
export function Text({ variant = 'body', tone = 'default', align, style, ...props }: TextProps) {
  const large = variant === 'display' || variant === 'title1' || variant === 'number';
  return (
    <RNText
      maxFontSizeMultiplier={large ? 1.3 : 1.8}
      {...props}
      style={[typography[variant], { color: tones[tone] }, align && { textAlign: align }, style]}
    />
  );
}
