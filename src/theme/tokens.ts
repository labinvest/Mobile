import { Platform, type TextStyle, type ViewStyle } from 'react-native';

/**
 * Tokens do design system do Rota. Todo valor visual do app sai daqui.
 *
 * Paleta: o verde-pista profundo carrega confiança e segurança (é a cor de "pode seguir" do trânsito,
 * escurecida para não parecer brinquedo). O lima é o acento de avanço/progresso e só aparece como
 * preenchimento com texto escuro por cima (lima sobre branco não tem contraste). Os neutros são
 * levemente quentes para o app não parecer um painel corporativo frio.
 */
export const colors = {
  brand: '#14523A',
  brandPressed: '#0E3B2A',
  brandSoft: '#E2EEE6',
  accent: '#C6EF5E',
  accentInk: '#1B2A12',

  /** Superfície escura de destaque (asfalto). Usada só no cartão principal de cada tela. */
  asphalt: '#13201A',
  asphaltRaised: '#1E2E26',
  onAsphalt: '#FFFFFF',
  onAsphaltMuted: '#B4C2B9',

  background: '#F4F5F1',
  surface: '#FFFFFF',
  surfaceAlt: '#ECEEE8',
  line: '#E1E4DD',
  lineStrong: '#C8CDC5',

  ink: '#121A16',
  inkSecondary: '#46524B',
  muted: '#5F6A63',
  disabled: '#A3ABA5',
  onBrand: '#FFFFFF',

  success: '#1E7A4C',
  successSoft: '#E1F2E8',
  warning: '#8A5A00',
  warningSoft: '#FCEFD2',
  danger: '#B42318',
  dangerSoft: '#FCE8E6',
  info: '#1D5AA6',
  infoSoft: '#E6EFFA',
  star: '#D99A27',

  scrim: 'rgba(10, 18, 14, 0.45)',
} as const;

export const space = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 48 } as const;

/** Margem lateral padrão das telas. */
export const gutter = space.xl;

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;

/** Área mínima de toque (48dp Android / 44pt iOS). */
export const touchTarget = 48;

const family = Platform.select({ ios: 'System', android: 'sans-serif', default: undefined });
const familyMedium = Platform.select({ android: 'sans-serif-medium', default: family });

function type(size: number, lineHeight: number, weight: TextStyle['fontWeight'], extra: TextStyle = {}): TextStyle {
  const medium = weight === '500' || weight === '600';
  return { fontFamily: medium ? familyMedium : family, fontSize: size, lineHeight, fontWeight: weight, ...extra };
}

export const typography = {
  display: type(32, 38, '800', { letterSpacing: -0.6 }),
  title1: type(26, 32, '700', { letterSpacing: -0.4 }),
  title2: type(20, 26, '700', { letterSpacing: -0.2 }),
  headline: type(17, 22, '600'),
  body: type(15, 22, '400'),
  bodyStrong: type(15, 22, '600'),
  callout: type(14, 20, '400'),
  footnote: type(13, 18, '400'),
  caption: type(12, 16, '600'),
  overline: type(11, 14, '700', { letterSpacing: 0.8, textTransform: 'uppercase' }),
  number: type(28, 32, '800', { letterSpacing: -0.5, fontVariant: ['tabular-nums'] }),
} as const;

export type TypographyVariant = keyof typeof typography;

// boxShadow funciona em Android, iOS e web na nova arquitetura do React Native (padrão no Expo 57).
export const elevation: Record<'none' | 'card' | 'raised', ViewStyle> = {
  none: {},
  card: { boxShadow: '0 3px 10px rgba(11, 20, 16, 0.06)' },
  raised: { boxShadow: '0 8px 24px rgba(11, 20, 16, 0.14)' },
};

export const motion = { fast: 140, base: 220, slow: 320 } as const;
