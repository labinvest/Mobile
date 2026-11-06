import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { IconButton, Text } from '@/components/ui';
import { useApiData } from '@/hooks/use-api-data';
import { colors } from '@/theme/tokens';

/** Sino com a contagem de avisos novos; atualiza toda vez que a tela volta ao foco. */
export function NotificationBell() {
  const { data } = useApiData<{ unread: number }>('/notifications');
  const unread = data?.unread ?? 0;
  return (
    <View>
      <IconButton icon="bell-outline" label={unread ? `Notificações, ${unread} novas` : 'Notificações'} onPress={() => router.push('/notifications')} />
      {unread > 0 && (
        <View style={styles.badge}>
          <Text variant="caption" style={styles.count}>{unread > 9 ? '9+' : unread}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { pointerEvents: 'none', position: 'absolute', top: 6, right: 4, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.background },
  count: { color: colors.onBrand, fontSize: 10, lineHeight: 12 },
});
