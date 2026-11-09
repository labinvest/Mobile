import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { EmptyState, Header, Icon, Notice, Screen, Skeleton, Text, type IconName } from '@/components/ui';
import { useApiData } from '@/hooks/use-api-data';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/dates';
import { openLesson } from '@/lib/navigation';
import type { AppNotification, NotificationKind } from '@/types/api';
import { colors, radius, space } from '@/theme/tokens';

const kindStyle: Record<NotificationKind, { icon: IconName; bg: string; fg: string }> = {
  request: { icon: 'calendar-plus', bg: colors.warningSoft, fg: colors.warning },
  accepted: { icon: 'check-decagram-outline', bg: colors.successSoft, fg: colors.success },
  confirm: { icon: 'account-check-outline', bg: colors.brandSoft, fg: colors.brand },
  declined: { icon: 'calendar-remove-outline', bg: colors.dangerSoft, fg: colors.danger },
  cancelled: { icon: 'calendar-remove-outline', bg: colors.dangerSoft, fg: colors.danger },
  started: { icon: 'steering', bg: colors.accent, fg: colors.accentInk },
  completed: { icon: 'flag-checkered', bg: colors.brandSoft, fg: colors.brand },
  review: { icon: 'star-outline', bg: colors.warningSoft, fg: colors.star },
};

export default function NotificationsScreen() {
  const { data, loading, error, reload } = useApiData<{ notifications: AppNotification[]; unread: number }>('/notifications');
  const [refreshing, setRefreshing] = useState(false);
  const unread = data?.unread ?? 0;

  // Abriu a tela: o que estava novo passa a ser visto (o destaque continua até sair daqui).
  useEffect(() => {
    if (unread > 0) api('/notifications/seen', { method: 'POST' }).catch(() => undefined);
  }, [unread]);

  async function refresh() {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }

  return (
    <Screen header={<Header title="Notificações" />} onRefresh={refresh} refreshing={refreshing}>
      {error ? (
        <Notice tone="danger" message={error} actionLabel="Tentar de novo" onAction={reload} style={styles.top} />
      ) : loading && !data ? (
        <View style={styles.top}>{[0, 1, 2].map((key) => <Skeleton key={key} height={72} rounded={radius.lg} style={styles.gap} />)}</View>
      ) : !data?.notifications.length ? (
        <EmptyState icon="bell-outline" title="Tudo em dia" message="Pedidos, confirmações e avaliações das suas aulas aparecem aqui." />
      ) : (
        <View style={styles.top}>
          {data.notifications.map((item) => {
            const look = kindStyle[item.kind];
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`${item.unread ? 'Nova. ' : ''}${item.title}. ${item.body}. ${timeAgo(item.at)}`}
                onPress={() => openLesson({ id: item.appointmentId })}
                style={({ pressed }) => [styles.item, item.unread && styles.unread, pressed && styles.pressed]}>
                <View style={[styles.icon, { backgroundColor: look.bg }]}><Icon name={look.icon} size={22} color={look.fg} /></View>
                <View style={styles.body}>
                  <Text variant="bodyStrong">{item.title}</Text>
                  <Text variant="footnote" tone="secondary">{item.body}</Text>
                  <Text variant="caption" tone="muted">{timeAgo(item.at)}</Text>
                </View>
                {item.unread && <View style={styles.dot} />}
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { marginTop: space.sm },
  gap: { marginBottom: space.md },
  item: { flexDirection: 'row', gap: space.md, padding: space.md, borderRadius: radius.lg, marginBottom: space.sm },
  unread: { backgroundColor: colors.surface },
  pressed: { opacity: 0.7 },
  icon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brand, marginTop: 6 },
});
