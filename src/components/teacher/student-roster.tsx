import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar, Badge, EmptyState, Icon, Notice, ProgressBar, Screen, Skeleton, Surface, Text, TextField } from '@/components/ui';
import { useApiData } from '@/hooks/use-api-data';
import type { TeacherStudent } from '@/types/api';
import { colors, radius, space } from '@/theme/tokens';

/** Alunos do instrutor com o avanço de cada um rumo à própria meta de aulas. */
export function StudentRoster() {
  const { data, loading, error, reload } = useApiData<{ students: TeacherStudent[] }>('/teachers/me/students');
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const all = data?.students ?? [];
  const students = all.filter((student) => student.name.toLowerCase().includes(query.trim().toLowerCase()));

  async function refresh() {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <View style={styles.header}>
        <Text variant="title1" accessibilityRole="header">Alunos</Text>
        <Text variant="callout" tone="muted">{all.length ? `${all.length} aluno${all.length === 1 ? '' : 's'} já pediram aula com você.` : 'Quem pedir aula com você aparece aqui.'}</Text>
      </View>

      {all.length > 4 && <TextField label="Buscar aluno" icon="magnify" placeholder="Nome" value={query} onChangeText={setQuery} />}

      {error ? (
        <Notice tone="danger" message={error} actionLabel="Tentar de novo" onAction={reload} />
      ) : loading && !data ? (
        <View style={styles.list}>{[0, 1, 2].map((key) => <Skeleton key={key} height={96} rounded={radius.lg} />)}</View>
      ) : students.length === 0 ? (
        <EmptyState icon="account-group-outline" title={query ? 'Nenhum aluno com esse nome' : 'Nenhum aluno ainda'} message={query ? undefined : 'Mantenha seus horários publicados para receber os primeiros pedidos.'} />
      ) : (
        <View style={styles.list}>
          {students.map((student) => (
            <Surface key={student.id} style={styles.card}>
              <View style={styles.top}>
                <Avatar initials={student.initials} seed={student.id} size={48} />
                <View style={styles.flex}>
                  <Text variant="headline" numberOfLines={1}>{student.name}</Text>
                  <Text variant="footnote" tone="muted">Categoria {student.category}{student.lastLesson ? ` · última: ${student.lastLesson}` : ''}</Text>
                </View>
                {student.rating && <Badge label={`${student.rating} ★`} tone="warning" />}
              </View>
              <View style={styles.progress}>
                <View style={styles.progressLabels}>
                  <Text variant="caption" tone="secondary">{student.completedLessons} de {student.lessonsGoal} aulas da meta</Text>
                  <Text variant="caption" tone="brand">{student.progress}%</Text>
                </View>
                <ProgressBar value={student.progress / 100} label={`${student.name}: ${student.progress}% da meta`} />
              </View>
              <View style={styles.footer}>
                <Icon name="steering" size={16} color={colors.muted} />
                <Text variant="footnote" tone="muted">{student.lessonsWithMe} aula{student.lessonsWithMe === 1 ? '' : 's'} concluída{student.lessonsWithMe === 1 ? '' : 's'} com você</Text>
              </View>
            </Surface>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  header: { paddingTop: space.lg, paddingBottom: space.lg, gap: space.xs },
  list: { gap: space.md },
  card: { gap: space.md },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  progress: { gap: space.xs },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
});
