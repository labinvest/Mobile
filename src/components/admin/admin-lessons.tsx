import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { LessonCard } from '@/components/lesson/lesson-card';
import { EmptyState, Screen, SegmentedControl, Text } from '@/components/ui';
import { useDriveApp } from '@/hooks/use-drive-app';
import { isOpen } from '@/lib/lessons';
import { openLesson } from '@/lib/navigation';
import { space } from '@/theme/tokens';

type Tab = 'open' | 'completed' | 'declined';

/** Admin: aulas recentes da plataforma (a API devolve as 200 mais recentes). */
export function AdminLessons() {
  const { appointments, refreshAppointments } = useDriveApp();
  const [tab, setTab] = useState<Tab>('open');
  const [refreshing, setRefreshing] = useState(false);
  const groups: Record<Tab, typeof appointments> = {
    open: appointments.filter(isOpen),
    completed: appointments.filter((item) => item.status === 'completed'),
    declined: appointments.filter((item) => item.status === 'declined'),
  };

  async function refresh() {
    setRefreshing(true);
    await refreshAppointments().catch(() => undefined);
    setRefreshing(false);
  }

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <View style={styles.header}>
        <Text variant="title1" accessibilityRole="header">Aulas</Text>
        <Text variant="callout" tone="muted">Pedidos e aulas mais recentes da plataforma.</Text>
      </View>
      <SegmentedControl
        value={tab}
        onChange={setTab}
        options={[{ value: 'open', label: 'Em aberto', count: groups.open.length }, { value: 'completed', label: 'Concluídas', count: groups.completed.length }, { value: 'declined', label: 'Recusadas', count: groups.declined.length }]}
      />
      <View style={styles.list}>
        {groups[tab].length === 0
          ? <EmptyState icon="calendar-blank-outline" title="Nada por aqui" />
          : groups[tab].map((lesson) => <LessonCard key={lesson.id} lesson={lesson} perspective="admin" onPress={() => openLesson(lesson)} />)}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: space.lg, paddingBottom: space.lg, gap: space.xs },
  list: { marginTop: space.lg, gap: space.md },
});
