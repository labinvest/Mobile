import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { LessonCard } from '@/components/lesson/lesson-card';
import { EmptyState, Screen, SegmentedControl, Text } from '@/components/ui';
import { useDriveApp } from '@/hooks/use-drive-app';
import { isOpen, practiceTime } from '@/lib/lessons';
import { openLesson } from '@/lib/navigation';
import { space } from '@/theme/tokens';

type Tab = 'upcoming' | 'history';

/** Minhas aulas do aluno: o que vem pela frente e o histórico. */
export function MyLessons() {
  const { user, appointments, refreshAppointments } = useDriveApp();
  const [view, setView] = useState<Tab>('upcoming');
  const [refreshing, setRefreshing] = useState(false);

  const mine = appointments.filter((appointment) => appointment.studentId === user?.id);
  const upcoming = mine.filter(isOpen);
  // Histórico: mais recentes primeiro.
  const history = mine.filter((appointment) => !isOpen(appointment)).sort((a, b) => b.lessonDate.localeCompare(a.lessonDate) || b.id - a.id);
  const completed = history.filter((appointment) => appointment.status === 'completed').length;
  const list = view === 'upcoming' ? upcoming : history;

  async function refresh() {
    setRefreshing(true);
    await refreshAppointments().catch(() => undefined);
    setRefreshing(false);
  }

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <View style={styles.header}>
        <Text variant="title1" accessibilityRole="header">Minhas aulas</Text>
        <Text variant="callout" tone="muted">
          {completed > 0 ? `${completed} aula${completed === 1 ? '' : 's'} concluída${completed === 1 ? '' : 's'} · ${practiceTime(mine)} ao volante` : 'Seus pedidos e aulas aparecem aqui.'}
        </Text>
      </View>

      <SegmentedControl
        value={view}
        onChange={setView}
        options={[{ value: 'upcoming', label: 'Próximas', count: upcoming.length }, { value: 'history', label: 'Histórico', count: history.length }]}
      />

      <View style={styles.list}>
        {list.length === 0 ? (
          view === 'upcoming' ? (
            <EmptyState icon="calendar-blank-outline" title="Nenhuma aula marcada" message="Escolha um instrutor e peça um horário. O pedido aparece aqui até ele responder." actionLabel="Explorar instrutores" onAction={() => router.navigate('/(tabs)/teachers')} />
          ) : (
            <EmptyState icon="history" title="Histórico vazio" message="Aulas concluídas, recusadas e canceladas ficam guardadas aqui." />
          )
        ) : (
          list.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} perspective="student" onPress={() => openLesson(lesson)} />)
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: space.lg, paddingBottom: space.lg, gap: space.xs },
  list: { marginTop: space.lg, gap: space.md },
});
