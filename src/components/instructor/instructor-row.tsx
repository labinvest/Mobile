import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Badge, Icon, Rating, Skeleton, Text, type BadgeTone } from '@/components/ui';
import type { Teacher } from '@/types/api';
import { colors, space } from '@/theme/tokens';

/** Instrutor na lista do Explorar: identidade, reputação, veículo e preço numa leitura. */
export function InstructorRow({ teacher, onPress, status }: { teacher: Teacher; onPress: () => void; status?: { label: string; tone: BadgeTone } }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${teacher.name}. ${teacher.rating ? `Nota ${teacher.rating}` : 'Novo'}. ${teacher.area}. ${teacher.price} por aula`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <Avatar initials={teacher.initials} seed={teacher.id} size={56} />
      <View style={styles.body}>
        <View style={styles.top}>
          <Text variant="headline" numberOfLines={1} style={styles.flex}>{teacher.name}</Text>
          <Rating value={teacher.rating} count={teacher.reviewCount} />
        </View>
        <View style={styles.line}>
          <Icon name="map-marker-outline" size={15} color={colors.muted} />
          <Text variant="footnote" tone="muted" numberOfLines={1} style={styles.flex}>{teacher.area}</Text>
        </View>
        <View style={styles.line}>
          <Icon name="car-outline" size={15} color={colors.muted} />
          <Text variant="footnote" tone="muted" numberOfLines={1} style={styles.flex}>{teacher.vehicle?.label ?? 'Veículo a confirmar'}</Text>
        </View>
        <View style={styles.bottom}>
          <Text variant="bodyStrong">{teacher.price}<Text variant="footnote" tone="muted"> / aula</Text></Text>
          {status ? <Badge label={status.label} tone={status.tone} /> : <Badge label={`Cat. ${teacher.cnhCategory}`} tone="brand" />}
        </View>
      </View>
    </Pressable>
  );
}

export function InstructorRowSkeleton() {
  return (
    <View style={styles.row}>
      <Skeleton width={56} height={56} rounded={28} />
      <View style={[styles.body, { gap: space.sm }]}>
        <Skeleton width="60%" height={18} />
        <Skeleton width="45%" />
        <Skeleton width="50%" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  row: { flexDirection: 'row', gap: space.lg, paddingVertical: space.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.lineStrong },
  pressed: { opacity: 0.65 },
  body: { flex: 1, gap: 3 },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  line: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.xs },
});
