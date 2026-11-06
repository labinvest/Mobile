import { StyleSheet, View } from 'react-native';

import { Avatar, Icon, Rating, Skeleton, Surface, Text } from '@/components/ui';
import type { Teacher } from '@/types/api';
import { colors, space } from '@/theme/tokens';

export const INSTRUCTOR_CARD_WIDTH = 240;

/** Cartão compacto de instrutor para carrosséis horizontais. */
export function InstructorCard({ teacher, onPress }: { teacher: Teacher; onPress: () => void }) {
  return (
    <Surface onPress={onPress} accessibilityLabel={`${teacher.name}, ${teacher.area}, ${teacher.price} por aula`} style={styles.card}>
      <View style={styles.top}>
        <Avatar initials={teacher.initials} seed={teacher.id} size={48} />
        <Rating value={teacher.rating} count={teacher.reviewCount} />
      </View>
      <Text variant="headline" numberOfLines={1}>{teacher.name}</Text>
      <View style={styles.line}>
        <Icon name="map-marker-outline" size={16} color={colors.muted} />
        <Text variant="footnote" tone="muted" numberOfLines={1} style={styles.flex}>{teacher.area}</Text>
      </View>
      <View style={styles.line}>
        <Icon name="car-outline" size={16} color={colors.muted} />
        <Text variant="footnote" tone="muted" numberOfLines={1} style={styles.flex}>{teacher.vehicle?.label ?? 'Veículo a confirmar'}</Text>
      </View>
      <View style={styles.price}>
        <Text variant="bodyStrong">{teacher.price}</Text>
        <Text variant="footnote" tone="muted"> / aula</Text>
      </View>
    </Surface>
  );
}

export function InstructorCardSkeleton() {
  return (
    <View style={[styles.card, styles.skeleton]}>
      <Skeleton width={48} height={48} rounded={24} />
      <Skeleton width="70%" height={18} />
      <Skeleton width="50%" />
      <Skeleton width="60%" />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { width: INSTRUCTOR_CARD_WIDTH, gap: space.xs + 2 },
  skeleton: { gap: space.sm, padding: space.lg, borderRadius: 16, backgroundColor: colors.surface },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: space.xs },
  line: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  price: { flexDirection: 'row', alignItems: 'baseline', marginTop: space.sm, paddingTop: space.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
});
