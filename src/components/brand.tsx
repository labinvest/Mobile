import { StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { colors, radius } from '@/theme/tokens';

/** Marca do Rota: volante no quadrado lima + nome. `inverse` para fundos escuros. */
export function Brand({ inverse = false, size = 36 }: { inverse?: boolean; size?: number }) {
  return (
    <View style={styles.row} accessible accessibilityRole="image" accessibilityLabel="Rota">
      <View style={[styles.mark, { width: size, height: size, borderRadius: size * 0.3 }]}>
        <Icon name="steering" size={size * 0.62} color={colors.accentInk} />
      </View>
      <Text variant="title2" style={{ color: inverse ? colors.onAsphalt : colors.ink, fontSize: size * 0.62, lineHeight: size * 0.8, fontWeight: '800', letterSpacing: -0.5 }}>Rota</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
});
