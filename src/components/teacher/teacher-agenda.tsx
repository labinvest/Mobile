import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { LessonCard } from '@/components/lesson/lesson-card';
import { Avatar, Button, EmptyState, Icon, IconTile, ListRow, Notice, Screen, SectionHeader, SegmentedControl, Surface, SwitchRow, Text } from '@/components/ui';
import { useDriveApp } from '@/hooks/use-drive-app';
import { errorMessage } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { initialsOf, isOpen, lessonFocus } from '@/lib/lessons';
import { openLesson } from '@/lib/navigation';
import type { Appointment } from '@/types/api';
import { colors, radius, space } from '@/theme/tokens';

type Tab = 'upcoming' | 'done';

/** Agenda do instrutor: pedidos para responder, aulas confirmadas e histórico. */
export function TeacherAgenda() {
  const { user, appointments, respondToLesson, setAvailability, refreshAppointments } = useDriveApp();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [responding, setResponding] = useState<{ id: number; accepted: boolean } | null>(null);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const teacher = user?.teacher;

  const mine = appointments.filter((appointment) => appointment.teacherId === user?.id);
  // Pedidos: o mais antigo primeiro, para ninguém ficar esperando.
  const requests = mine.filter((appointment) => appointment.status === 'requested').sort((a, b) => a.id - b.id);
  const upcoming = mine.filter((appointment) => appointment.status === 'scheduled' || appointment.status === 'in-progress').sort((a, b) => a.lessonDate.localeCompare(b.lessonDate) || a.time.localeCompare(b.time));
  const done = mine.filter((appointment) => !isOpen(appointment)).sort((a, b) => b.lessonDate.localeCompare(a.lessonDate));
  const list = tab === 'upcoming' ? upcoming : done;

  async function respond(appointment: Appointment, accepted: boolean) {
    setError('');
    setResponding({ id: appointment.id, accepted });
    try {
      await respondToLesson(appointment.id, accepted);
      haptic.success();
    } catch (caught) {
      haptic.error();
      setError(errorMessage(caught));
    } finally {
      setResponding(null);
    }
  }

  async function changeAvailability(value: boolean) {
    setError('');
    setSavingAvailability(true);
    try {
      await setAvailability(value);
      haptic.selection();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSavingAvailability(false);
    }
  }

  async function refresh() {
    setRefreshing(true);
    await refreshAppointments().catch(() => undefined);
    setRefreshing(false);
  }

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <View style={styles.header}>
        <Text variant="title1" accessibilityRole="header">Agenda</Text>
        <Text variant="callout" tone="muted">Pedidos, aulas confirmadas e histórico.</Text>
      </View>

      <Surface padded={false} style={styles.settings}>
        <SwitchRow
          title="Receber novos pedidos"
          subtitle={teacher?.available ? 'Seu perfil aparece nas buscas' : 'Perfil pausado: alunos não te encontram'}
          value={teacher?.available ?? false}
          disabled={savingAvailability || !teacher}
          onChange={changeAvailability}
        />
        <ListRow title="Horários e valor" subtitle={teacher?.weeklySlots.length ? `${teacher.weeklySlots.length} períodos por semana · ${teacher.price}` : 'Ainda não publicados'} leading={<IconTile icon="calendar-clock" />} onPress={() => router.push('/teaching-profile')} divider={false} />
      </Surface>

      {!!error && <Notice tone="danger" message={error} style={styles.notice} />}

      {requests.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title={`Pedidos · ${requests.length}`} />
          <View style={styles.list}>
            {requests.map((request) => (
              <Surface key={request.id} style={styles.request}>
                <View style={styles.requestTop}>
                  <Avatar initials={initialsOf(request.studentName)} seed={request.studentId} size={40} />
                  <View style={styles.flex}>
                    <Text variant="bodyStrong">{request.studentName}</Text>
                    <Text variant="footnote" tone="muted">{lessonFocus(request.lesson)}</Text>
                  </View>
                </View>
                <View style={styles.requestFacts}>
                  <Fact icon="calendar-blank-outline" text={`${request.date} · ${request.time}`} />
                  <Fact icon="map-marker-outline" text={request.meetingPoint || 'Local a combinar'} />
                  {!!request.notes && <Fact icon="message-text-outline" text={`“${request.notes}”`} />}
                </View>
                <View style={styles.actions}>
                  <Button label="Recusar" variant="secondary" disabled={!!responding} loading={responding?.id === request.id && !responding.accepted} onPress={() => respond(request, false)} style={styles.flex} />
                  <Button label="Aceitar" icon="check" disabled={!!responding} loading={responding?.id === request.id && responding.accepted} onPress={() => respond(request, true)} style={styles.flex} />
                </View>
                <Button label="Ver detalhes" variant="ghost" onPress={() => openLesson(request)} style={styles.detailsLink} />
              </Surface>
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <SegmentedControl value={tab} onChange={setTab} options={[{ value: 'upcoming', label: 'Confirmadas', count: upcoming.length }, { value: 'done', label: 'Histórico', count: done.length }]} />
        <View style={[styles.list, styles.listTop]}>
          {list.length === 0 ? (
            <EmptyState
              compact
              icon={tab === 'upcoming' ? 'calendar-check-outline' : 'history'}
              title={tab === 'upcoming' ? 'Nenhuma aula confirmada' : 'Sem aulas no histórico'}
              message={tab === 'upcoming' ? 'Ao aceitar um pedido, a aula aparece aqui.' : 'Aulas concluídas, recusadas e canceladas ficam guardadas aqui.'}
            />
          ) : (
            list.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} perspective="teacher" onPress={() => openLesson(lesson)} />)
          )}
        </View>
      </View>
    </Screen>
  );
}

function Fact({ icon, text }: { icon: 'calendar-blank-outline' | 'map-marker-outline' | 'message-text-outline'; text: string }) {
  return (
    <View style={styles.fact}>
      <Icon name={icon} size={16} color={colors.muted} />
      <Text variant="footnote" tone="secondary" style={styles.flex}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  header: { paddingTop: space.lg, paddingBottom: space.lg, gap: space.xs },
  settings: { paddingHorizontal: space.lg },
  notice: { marginTop: space.lg },
  section: { marginTop: space.xxl },
  list: { gap: space.md },
  listTop: { marginTop: space.lg },
  request: { gap: space.md, borderColor: colors.accent, borderWidth: 1.5 },
  requestTop: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  requestFacts: { gap: space.xs, padding: space.md, borderRadius: radius.md, backgroundColor: colors.background },
  fact: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  actions: { flexDirection: 'row', gap: space.md },
  detailsLink: { alignSelf: 'center', minHeight: 40 },
});
