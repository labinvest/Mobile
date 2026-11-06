import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Switch as RNSwitch, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, elevation, radius, space } from '@/theme/tokens';

import { Icon, type IconName } from './icon';
import { Text } from './text';

// Avatar ---------------------------------------------------------------------------------------

const avatarTints = [
  { bg: '#DCEBDF', fg: '#14523A' },
  { bg: '#E3E9F5', fg: '#244A85' },
  { bg: '#F4E6D6', fg: '#7A4512' },
  { bg: '#EDE3F1', fg: '#5B3270' },
  { bg: '#E0EEEE', fg: '#1D5C5C' },
];

/** Iniciais com cor estável por pessoa (mesmo nome, mesma cor em todo o app). */
export function Avatar({ initials, seed, size = 44 }: { initials: string; seed?: string | number; size?: number }) {
  const key = String(seed ?? initials);
  const tint = avatarTints[[...key].reduce((sum, char) => sum + char.charCodeAt(0), 0) % avatarTints.length];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: tint.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text variant="caption" style={{ color: tint.fg, fontSize: size * 0.34, lineHeight: size * 0.42, fontWeight: '700' }}>{initials}</Text>
    </View>
  );
}

// Badge ----------------------------------------------------------------------------------------

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'inverse';

const badgeTones: Record<BadgeTone, { bg: string; fg: string }> = {
  neutral: { bg: colors.surfaceAlt, fg: colors.inkSecondary },
  brand: { bg: colors.brandSoft, fg: colors.brand },
  success: { bg: colors.successSoft, fg: colors.success },
  warning: { bg: colors.warningSoft, fg: colors.warning },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
  info: { bg: colors.infoSoft, fg: colors.info },
  accent: { bg: colors.accent, fg: colors.accentInk },
  inverse: { bg: colors.asphaltRaised, fg: colors.onAsphalt },
};

export function Badge({ label, tone = 'neutral', icon }: { label: string; tone?: BadgeTone; icon?: IconName }) {
  const palette = badgeTones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      {icon && <Icon name={icon} size={14} color={palette.fg} />}
      <Text variant="caption" style={{ color: palette.fg }} numberOfLines={1}>{label}</Text>
    </View>
  );
}

// Surface (cartão) -----------------------------------------------------------------------------

/** Único nível de cartão do app. Não aninhe um Surface dentro de outro. */
export function Surface({ children, onPress, accessibilityLabel, style, padded = true }: { children: ReactNode; onPress?: () => void; accessibilityLabel?: string; style?: StyleProp<ViewStyle>; padded?: boolean }) {
  if (!onPress) return <View style={[styles.surface, padded && styles.surfacePadding, style]}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.surface, padded && styles.surfacePadding, pressed && styles.surfacePressed, style]}>
      {children}
    </Pressable>
  );
}

// Section header -------------------------------------------------------------------------------

export function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text variant="title2" accessibilityRole="header" style={styles.flex}>{title}</Text>
      {!!actionLabel && (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={12} style={styles.sectionAction}>
          <Text variant="callout" tone="brand" style={styles.bold}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

// List row -------------------------------------------------------------------------------------

export function ListRow({ title, subtitle, leading, trailing, onPress, chevron = !!onPress, divider = true, accessibilityLabel }: {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  divider?: boolean;
  accessibilityLabel?: string;
}) {
  const content = (
    <>
      {leading}
      <View style={styles.flex}>
        <Text variant="bodyStrong" numberOfLines={1}>{title}</Text>
        {!!subtitle && <Text variant="footnote" tone="muted" numberOfLines={2}>{subtitle}</Text>}
      </View>
      {trailing}
      {chevron && <Icon name="chevron-right" color={colors.muted} />}
    </>
  );
  const style = [styles.row, divider && styles.rowDivider];
  if (!onPress) return <View style={style}>{content}</View>;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? title} onPress={onPress} style={({ pressed }) => [...style, pressed && styles.rowPressed]}>
      {content}
    </Pressable>
  );
}

// Rating ---------------------------------------------------------------------------------------

export function Rating({ value, count, tone = 'default' }: { value: string | null; count: number; tone?: 'default' | 'inverse' }) {
  return (
    <View style={styles.rating} accessibilityLabel={value ? `Nota ${value}, ${count} avaliações` : 'Instrutor novo, sem avaliações'}>
      <Icon name="star" size={16} color={colors.star} />
      <Text variant="caption" tone={tone === 'inverse' ? 'inverse' : 'default'}>{value ?? 'Novo'}</Text>
      {count > 0 && <Text variant="caption" tone={tone === 'inverse' ? 'inverseMuted' : 'muted'} style={styles.regular}>({count})</Text>}
    </View>
  );
}

// Icon tile ------------------------------------------------------------------------------------

/** Ícone em quadrado suave, usado no início de linhas de lista. */
export function IconTile({ icon, size = 36 }: { icon: IconName; size?: number }) {
  return <View style={[styles.tile, { width: size, height: size }]}><Icon name={icon} size={size * 0.56} color={colors.brand} /></View>;
}

// Progress bar ---------------------------------------------------------------------------------

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <View style={styles.track} accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max: 100, now: pct }}>
      <View style={[styles.fill, { width: `${pct}%` }]} />
    </View>
  );
}

// Switch row -----------------------------------------------------------------------------------

/** Linha com interruptor nativo; a linha inteira é o alvo de toque. */
export function SwitchRow({ title, subtitle, value, onChange, disabled }: { title: string; subtitle?: string; value: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: value, disabled }} accessibilityLabel={title} disabled={disabled} onPress={() => onChange(!value)} style={styles.switchRow}>
      <View style={styles.flex}>
        <Text variant="bodyStrong">{title}</Text>
        {!!subtitle && <Text variant="footnote" tone="muted">{subtitle}</Text>}
      </View>
      {/* activeThumbColor só existe no react-native-web; sem ele o botão ligado fica azul na web. */}
      <RNSwitch value={value} onValueChange={onChange} disabled={disabled} trackColor={{ true: colors.brand, false: colors.lineStrong }} thumbColor={colors.surface} importantForAccessibility="no" {...({ activeThumbColor: colors.surface } as object)} />
    </Pressable>
  );
}

// Divider --------------------------------------------------------------------------------------

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  bold: { fontWeight: '600' },
  regular: { fontWeight: '400' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: space.xs, alignSelf: 'flex-start', paddingHorizontal: space.sm, paddingVertical: 3, borderRadius: radius.pill },
  surface: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, ...elevation.card },
  surfacePadding: { padding: space.lg },
  surfacePressed: { backgroundColor: '#FAFBF8', transform: [{ scale: 0.99 }] },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.md },
  sectionAction: { minHeight: 32, justifyContent: 'center' },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.lineStrong },
  rowPressed: { opacity: 0.7 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.lineStrong },
  tile: { borderRadius: radius.sm, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.brand },
  switchRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
});
