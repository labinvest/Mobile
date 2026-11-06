import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { colors, radius, space } from '@/theme/tokens';

import { Button } from './button';
import { Icon, type IconName } from './icon';
import { Text } from './text';

/** Bloco de carregamento. Pulsa suavemente; fica parado se o sistema pede menos movimento. */
export function Skeleton({ width = '100%', height = 16, rounded = radius.sm, style }: { width?: DimensionValue; height?: number; rounded?: number; style?: StyleProp<ViewStyle> }) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!reduceMotion) opacity.value = withRepeat(withTiming(0.45, { duration: 800 }), -1, true);
  }, [opacity, reduceMotion]);

  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View accessibilityElementsHidden style={[{ width, height, borderRadius: rounded, backgroundColor: colors.surfaceAlt }, animated, style]} />;
}

/** Estado vazio: diz o que vai aparecer aqui e qual o próximo passo. */
export function EmptyState({ icon, title, message, actionLabel, onAction, compact }: { icon: IconName; title: string; message?: string; actionLabel?: string; onAction?: () => void; compact?: boolean }) {
  return (
    <View style={[styles.empty, compact && styles.emptyCompact]}>
      <View style={styles.emptyIcon}><Icon name={icon} size={26} color={colors.brand} /></View>
      <Text variant="headline" align="center">{title}</Text>
      {!!message && <Text variant="callout" tone="muted" align="center" style={styles.emptyMessage}>{message}</Text>}
      {!!actionLabel && <Button label={actionLabel} variant="secondary" onPress={onAction} style={styles.emptyAction} />}
    </View>
  );
}

const noticeTones = {
  danger: { bg: colors.dangerSoft, fg: colors.danger, icon: 'alert-circle-outline' },
  warning: { bg: colors.warningSoft, fg: colors.warning, icon: 'clock-alert-outline' },
  info: { bg: colors.infoSoft, fg: colors.info, icon: 'information-outline' },
  success: { bg: colors.successSoft, fg: colors.success, icon: 'check-circle-outline' },
} as const;

/** Aviso em linha (erro de rede, cadastro em análise, sucesso). */
export function Notice({ tone = 'info', title, message, actionLabel, onAction, style }: { tone?: keyof typeof noticeTones; title?: string; message: string; actionLabel?: string; onAction?: () => void; style?: StyleProp<ViewStyle> }) {
  const palette = noticeTones[tone];
  return (
    <View style={[styles.notice, { backgroundColor: palette.bg }, style]} accessibilityRole={tone === 'danger' ? 'alert' : undefined}>
      <Icon name={palette.icon} color={palette.fg} size={20} />
      <View style={styles.noticeCopy}>
        {!!title && <Text variant="bodyStrong" style={{ color: palette.fg }}>{title}</Text>}
        <Text variant="footnote" tone="secondary">{message}</Text>
        {!!actionLabel && <Button label={actionLabel} variant="ghost" onPress={onAction} style={styles.noticeAction} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', paddingVertical: space.xxxl, paddingHorizontal: space.xl, gap: space.sm },
  emptyCompact: { paddingVertical: space.xl },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center', marginBottom: space.xs },
  emptyMessage: { maxWidth: 300 },
  emptyAction: { marginTop: space.sm },
  notice: { flexDirection: 'row', gap: space.md, padding: space.md, borderRadius: radius.md },
  noticeCopy: { flex: 1, gap: 2 },
  noticeAction: { alignSelf: 'flex-start', paddingHorizontal: 0, minHeight: 40 },
});
