import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { NotificationBell } from '@/components/notification-bell';
import { InstructorCard, InstructorCardSkeleton } from '@/components/instructor/instructor-card';
import { Avatar, EmptyState, Icon, Notice, Screen, SectionHeader, Surface, Text } from '@/components/ui';
import { useApiData } from '@/hooks/use-api-data';
import { useDriveApp } from '@/hooks/use-drive-app';
import { formatLongDate } from '@/lib/dates';
import { firstName, greeting, isOpen, practiceTime } from '@/lib/lessons';
import { openInstructor, openLesson } from '@/lib/navigation';
import type { Teacher } from '@/types/api';
import { colors, gutter, radius, space } from '@/theme/tokens';

import { CnhJourney, LearningProgress } from './learning-progress';
import { NextLessonCard } from './next-lesson-card';

const goToExplore = () => router.navigate('/(tabs)/teachers');

export function StudentHome() {
  const { user, appointments, refreshAppointments, refreshAccount } = useDriveApp();
  const teachers = useApiData<{ teachers: Teacher[] }>('/teachers');
  const [refreshing, setRefreshing] = useState(false);

  const mine = appointments.filter((appointment) => appointment.studentId === user?.id);
  // A lista da API já vem ordenada: em andamento, agendadas, pedidos.
  const nextLesson = mine.find(isOpen);
  const completedLessons = mine.filter((appointment) => appointment.status === 'completed');
  const toReview = completedLessons.find((appointment) => !appointment.reviews.student);
  const completed = user?.student?.completedLessons ?? completedLessons.length;
  const goal = user?.student?.lessonsGoal ?? 20;
  const busyTeacherIds = new Set(mine.filter(isOpen).map((appointment) => appointment.teacherId));
  const suggestions = (teachers.data?.teachers ?? [])
    .filter((teacher) => teacher.available && !busyTeacherIds.has(teacher.id))
    .sort((a, b) => Number((b.rating ?? '0').replace(',', '.')) - Number((a.rating ?? '0').replace(',', '.')) || b.reviewCount - a.reviewCount)
    .slice(0, 6);

  async function refresh() {
    setRefreshing(true);
    await Promise.allSettled([refreshAppointments(), refreshAccount(), teachers.reload()]);
    setRefreshing(false);
  }

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text variant="overline" tone="muted">{formatLongDate()}</Text>
          <Text variant="title1" accessibilityRole="header">{greeting()}, {firstName(user?.name ?? '')}</Text>
        </View>
        <NotificationBell />
        <Pressable accessibilityRole="button" accessibilityLabel="Abrir meu perfil" onPress={() => router.navigate('/(tabs)/account')} hitSlop={8}>
          <Avatar initials={user?.initials ?? ''} seed={user?.id} size={44} />
        </Pressable>
      </View>

      <NextLessonCard lesson={nextLesson} onOpen={openLesson} onFindInstructor={goToExplore} />

      {toReview && (
        <Surface onPress={() => openLesson(toReview)} accessibilityLabel={`Avaliar aula com ${toReview.teacherName}`} style={styles.review}>
          <View style={styles.reviewIcon}><Icon name="star-outline" color={colors.star} /></View>
          <View style={styles.flex}>
            <Text variant="bodyStrong">Como foi a aula com {firstName(toReview.teacherName)}?</Text>
            <Text variant="footnote" tone="muted">Sua avaliação ajuda outros alunos a escolher.</Text>
          </View>
          <Icon name="chevron-right" color={colors.muted} />
        </Surface>
      )}

      <View style={styles.section}>
        <SectionHeader title="Sua evolução" />
        <LearningProgress
          completed={completed}
          goal={goal}
          practiceTime={practiceTime(mine)}
          instructors={new Set(completedLessons.map((appointment) => appointment.teacherId)).size}
          category={user?.student?.category ?? 'B'}
        />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Instrutores para você" actionLabel="Ver todos" onAction={goToExplore} />
        {teachers.error ? (
          <Notice tone="danger" message={teachers.error} actionLabel="Tentar de novo" onAction={teachers.reload} />
        ) : teachers.loading && !teachers.data ? (
          <View style={styles.carouselRow}><InstructorCardSkeleton /><InstructorCardSkeleton /></View>
        ) : suggestions.length === 0 ? (
          <Surface><EmptyState compact icon="account-search-outline" title="Nenhum instrutor disponível agora" message="Novos instrutores entram toda semana. Volte em breve." /></Surface>
        ) : (
          <FlatList
            horizontal
            data={suggestions}
            keyExtractor={(teacher) => String(teacher.id)}
            renderItem={({ item }) => <InstructorCard teacher={item} onPress={() => openInstructor(item)} />}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carousel}
            style={styles.bleed}
            ItemSeparatorComponent={() => <View style={{ width: space.md }} />}
          />
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Etapas da habilitação" />
        <Surface>
          <CnhJourney practiceDone={completed >= goal} />
        </Surface>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingTop: space.lg, paddingBottom: space.xl },
  section: { marginTop: space.xxxl },
  review: { marginTop: space.lg, flexDirection: 'row', alignItems: 'center', gap: space.md },
  reviewIcon: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.warningSoft, alignItems: 'center', justifyContent: 'center' },
  bleed: { marginHorizontal: -gutter },
  carousel: { paddingHorizontal: gutter, paddingBottom: space.xs },
  carouselRow: { flexDirection: 'row', gap: space.md },
});
