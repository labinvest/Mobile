import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar, EmptyState, Icon, ListRow, Notice, Screen, SectionHeader, Skeleton, Surface, Text, type IconName } from '@/components/ui';
import { useApiData } from '@/hooks/use-api-data';
import { formatLongDate } from '@/lib/dates';
import type { AdminOverview } from '@/types/api';
import { colors, radius, space } from '@/theme/tokens';

/** Painel do admin: tamanho da operação e a fila do que precisa de análise. */
export function AdminHome() {
  const { data, error, reload } = useApiData<AdminOverview>('/admin/overview');
  const [refreshing, setRefreshing] = useState(false);
  const pending = (data?.pendingTeachers ?? 0) + (data?.pendingVehicles ?? 0);

  async function refresh() {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <View style={styles.header}>
        <Text variant="overline" tone="muted">{formatLongDate()}</Text>
        <Text variant="title1" accessibilityRole="header">Painel da operação</Text>
      </View>

      {error ? (
        <Notice tone="danger" message={error} actionLabel="Tentar de novo" onAction={reload} />
      ) : !data ? (
        <View style={styles.grid}>{[0, 1, 2, 3].map((key) => <Skeleton key={key} width="48%" height={96} rounded={radius.lg} />)}</View>
      ) : (
        <>
          <View style={styles.grid}>
            <Metric icon="school-outline" value={data.students} label="alunos" />
            <Metric icon="steering" value={data.teachers} label="instrutores" />
            <Metric icon="calendar-month-outline" value={data.lessonsThisMonth} label="aulas no mês" />
            <Metric icon="calendar-today" value={data.lessonsToday} label="aulas hoje" />
          </View>
          {data.pendingRequests > 0 && (
            <Notice tone="info" message={`${data.pendingRequests} pedido${data.pendingRequests === 1 ? '' : 's'} de aula aguardando resposta dos instrutores.`} actionLabel="Ver aulas" onAction={() => router.navigate('/(tabs)/schedule')} style={styles.notice} />
          )}

          <View style={styles.section}>
            <SectionHeader title={pending ? `Para analisar · ${pending}` : 'Para analisar'} />
            {data.pendingItems.length === 0 ? (
              <Surface><EmptyState compact icon="check-all" title="Fila vazia" message="Nenhum cadastro ou veículo aguardando análise." /></Surface>
            ) : (
              <Surface padded={false} style={styles.list}>
                {data.pendingItems.map((item, index) => (
                  <ListRow
                    key={`${item.kind}-${item.id}`}
                    title={item.title}
                    subtitle={item.detail}
                    leading={<Avatar initials={item.initials} seed={item.id} size={40} />}
                    onPress={() => router.navigate(item.kind === 'teacher' ? '/(tabs)/teachers' : '/(tabs)/account')}
                    divider={index < data.pendingItems.length - 1}
                  />
                ))}
              </Surface>
            )}
          </View>
        </>
      )}
    </Screen>
  );
}

function Metric({ icon, value, label }: { icon: IconName; value: number; label: string }) {
  return (
    <Surface style={styles.metric}>
      <Icon name={icon} color={colors.brand} />
      <Text variant="number">{value}</Text>
      <Text variant="footnote" tone="muted">{label}</Text>
    </Surface>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: space.lg, paddingBottom: space.xl, gap: space.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: space.md },
  metric: { width: '48%', gap: 2 },
  notice: { marginTop: space.lg },
  section: { marginTop: space.xxxl },
  list: { paddingHorizontal: space.lg },
});
