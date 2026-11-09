import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { LessonReviewSection } from '@/components/lesson/lesson-review';
import { Avatar, Badge, BottomBar, Button, EmptyState, Header, Icon, ListRow, Notice, Screen, SectionHeader, Surface, Text, type IconName } from '@/components/ui';
import { useDriveApp } from '@/hooks/use-drive-app';
import { errorMessage } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { lessonFocus, statusMeta } from '@/lib/lessons';
import { openInstructor } from '@/lib/navigation';
import type { Appointment } from '@/types/api';
import { colors, radius, space } from '@/theme/tokens';

/** Intervalo para ver as ações da outra parte (aceite, confirmação, início, fim). */
const SYNC_INTERVAL_MS = 5000;

const initialsOf = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return [hours, minutes, seconds % 60].map((part) => String(part).padStart(2, '0')).join(':');
}

export default function LessonScreen() {
  const { role, appointments, refreshAppointments, cancelLesson, confirmLesson, startLesson, finishLesson, respondToLesson, submitLessonReview } = useDriveApp();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const lesson = appointments.find((appointment) => String(appointment.id) === id);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const waiting = lesson?.status === 'requested' || lesson?.status === 'scheduled' || lesson?.status === 'in-progress';

  useEffect(() => {
    if (lesson?.status !== 'in-progress') return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [lesson?.status]);

  useFocusEffect(
    useCallback(() => {
      refreshAppointments().catch(() => undefined);
      if (!waiting) return;
      const timer = setInterval(() => refreshAppointments().catch(() => undefined), SYNC_INTERVAL_MS);
      return () => clearInterval(timer);
    }, [refreshAppointments, waiting]),
  );

  if (!lesson) {
    return (
      <Screen header={<Header title="Aula" />}>
        <EmptyState icon="calendar-question" title="Aula não encontrada" message="Ela pode ter sido removida ou ainda estar carregando." actionLabel="Ver minhas aulas" onAction={() => router.replace('/(tabs)/schedule')} />
      </Screen>
    );
  }

  const me = role === 'student' || role === 'teacher' ? role : null;
  const otherName = me === 'teacher' ? lesson.studentName : lesson.teacherName;
  const myConfirmed = me === 'student' ? lesson.studentConfirmed : me === 'teacher' ? lesson.teacherConfirmed : true;
  const bothConfirmed = lesson.studentConfirmed && lesson.teacherConfirmed;
  const meta = statusMeta[lesson.status];
  // Pedido o instrutor responde com "Recusar"; depois de aceita, qualquer um dos dois pode cancelar.
  const canCancel = lesson.status === 'scheduled' ? !!me : lesson.status === 'requested' && me === 'student';
  const elapsed = lesson.status === 'completed' ? lesson.durationSeconds ?? 0 : lesson.startedAt ? Math.max(0, Math.floor((now - lesson.startedAt) / 1000)) : 0;

  async function run(key: string, action: () => Promise<unknown>) {
    setError('');
    setBusy(key);
    try {
      await action();
      haptic.success();
    } catch (caught) {
      haptic.error();
      setError(errorMessage(caught));
    } finally {
      setBusy(null);
    }
  }

  const footer = me && renderAction();

  function renderAction() {
    if (!lesson || !me) return null;
    if (lesson.status === 'requested' && me === 'teacher') {
      return (
        <View style={styles.actions}>
          <Button label="Recusar" variant="secondary" loading={busy === 'decline'} disabled={!!busy} onPress={() => run('decline', () => respondToLesson(lesson.id, false))} style={styles.flex} />
          <Button label="Aceitar aula" icon="check" loading={busy === 'accept'} disabled={!!busy} onPress={() => run('accept', () => respondToLesson(lesson.id, true))} style={styles.flex} />
        </View>
      );
    }
    if (lesson.status === 'scheduled' && !myConfirmed) {
      return <Button label="Confirmar minha presença" size="lg" icon="account-check-outline" loading={busy === 'confirm'} onPress={() => run('confirm', () => confirmLesson(lesson.id))} fullWidth />;
    }
    if (lesson.status === 'scheduled') {
      return <Button label={bothConfirmed ? 'Iniciar aula' : `Aguardando ${otherName.split(' ')[0]} confirmar`} size="lg" icon="steering" disabled={!bothConfirmed} loading={busy === 'start'} onPress={() => run('start', () => startLesson(lesson.id))} fullWidth />;
    }
    if (lesson.status === 'in-progress') {
      return confirmFinish ? (
        <View style={styles.actions}>
          <Button label="Continuar aula" variant="secondary" onPress={() => setConfirmFinish(false)} style={styles.flex} />
          <Button label="Sim, finalizar" variant="danger" loading={busy === 'finish'} onPress={() => run('finish', () => finishLesson(lesson.id)).then(() => setConfirmFinish(false))} style={styles.flex} />
        </View>
      ) : (
        <Button label="Finalizar aula" size="lg" icon="flag-checkered" variant="secondary" onPress={() => setConfirmFinish(true)} fullWidth />
      );
    }
    if ((lesson.status === 'declined' || lesson.status === 'cancelled') && me === 'student') {
      return <Button label="Escolher outro horário" size="lg" icon="calendar-search" onPress={() => openInstructor({ id: lesson.teacherId })} fullWidth />;
    }
    return null;
  }

  return (
    <Screen header={<Header title="Aula" />} footer={footer ? <BottomBar>{footer}</BottomBar> : undefined}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <Text variant="overline" tone="inverseMuted" style={styles.flex}>{lessonFocus(lesson.lesson)}</Text>
          <Badge label={meta.label} tone={lesson.status === 'in-progress' ? 'accent' : 'inverse'} />
        </View>
        {lesson.status === 'in-progress' ? (
          <View>
            <Text variant="display" style={styles.timer} accessibilityLabel={`Tempo de aula ${formatDuration(elapsed)}`}>{formatDuration(elapsed)}</Text>
            <Text variant="callout" tone="inverseMuted">Aula em andamento · {lesson.time}</Text>
          </View>
        ) : (
          <View>
            <Text variant="display" tone="inverse">{lesson.date}</Text>
            <Text variant="title2" style={styles.time}>{lesson.time}</Text>
          </View>
        )}
        <View style={styles.person}>
          <Avatar initials={initialsOf(otherName)} seed={me === 'teacher' ? lesson.studentId : lesson.teacherId} size={44} />
          <View style={styles.flex}>
            <Text variant="bodyStrong" tone="inverse">{me === 'teacher' ? lesson.studentName : lesson.teacherName}</Text>
            <Text variant="footnote" tone="inverseMuted">{me === 'teacher' ? 'Aluno(a)' : 'Instrutor(a)'}{role === 'admin' ? ` · aluno(a): ${lesson.studentName}` : ''}</Text>
          </View>
        </View>
      </View>

      {!!error && <Notice tone="danger" message={error} style={styles.block} />}

      <StatusPanel lesson={lesson} me={me} otherName={otherName} elapsed={elapsed} />

      {lesson.status === 'completed' && me && (
        <View style={styles.section}>
          <SectionHeader title="Avaliações" />
          <LessonReviewSection
            targetName={otherName}
            mine={lesson.reviews[me]}
            theirs={lesson.reviews[me === 'student' ? 'teacher' : 'student']}
            onSubmit={(rating, comment) => submitLessonReview(lesson.id, rating, comment)}
          />
        </View>
      )}

      <View style={styles.section}>
        <SectionHeader title="Detalhes" />
        <Surface padded={false} style={styles.details}>
          <Detail icon="map-marker-outline" label="Local de encontro" value={lesson.meetingPoint || 'A combinar'} />
          <Detail icon="car-outline" label="Veículo" value={lesson.vehicle} />
          {!!lesson.price && <Detail icon="cash" label="Valor combinado" value={`${lesson.price} · pago direto ao instrutor`} />}
          {!!lesson.notes && <Detail icon="message-text-outline" label={me === 'student' ? 'Seu recado para o instrutor' : 'Recado do aluno'} value={lesson.notes} />}
          <Detail icon="pound" label="Código da aula" value={`#${lesson.id}`} last />
        </Surface>
      </View>

      {canCancel && (confirmCancel ? (
        <View style={[styles.actions, styles.section]}>
          <Button label="Manter" variant="secondary" disabled={!!busy} onPress={() => setConfirmCancel(false)} style={styles.flex} />
          <Button label="Sim, cancelar" variant="danger" loading={busy === 'cancel'} disabled={!!busy} onPress={() => run('cancel', () => cancelLesson(lesson.id)).then(() => setConfirmCancel(false))} style={styles.flex} />
        </View>
      ) : (
        <Button label={lesson.status === 'requested' ? 'Cancelar pedido' : 'Cancelar aula'} variant="ghost" onPress={() => setConfirmCancel(true)} style={styles.section} />
      ))}
    </Screen>
  );
}

/** Explica o momento da aula e o que falta acontecer. */
function StatusPanel({ lesson, me, otherName, elapsed }: { lesson: Appointment; me: 'student' | 'teacher' | null; otherName: string; elapsed: number }) {
  const first = otherName.split(' ')[0];
  if (lesson.status === 'requested') {
    return me === 'teacher'
      ? <Notice tone="warning" title="Novo pedido" message="Confira dia, período e local. Ao aceitar, o horário fica reservado para este aluno." style={styles.block} />
      : <Notice tone="warning" title={`Aguardando ${first}`} message="O instrutor recebe o pedido e responde por aqui. Você é avisado quando ele aceitar." style={styles.block} />;
  }
  if (lesson.status === 'declined') {
    return <Notice tone="danger" title="Pedido recusado" message={me === 'student' ? `${first} não pôde aceitar este horário. Você pode escolher outro.` : 'Você recusou este pedido.'} style={styles.block} />;
  }
  if (lesson.status === 'cancelled') {
    if (!lesson.cancelledBy) return <Notice tone="info" title="Aula não realizada" message="A data marcada passou sem a aula começar, então este horário foi encerrado." style={styles.block} />;
    const who = lesson.cancelledBy === me ? 'Você' : (lesson.cancelledBy === 'student' ? lesson.studentName : lesson.teacherName).split(' ')[0];
    return <Notice tone="info" title="Aula cancelada" message={`${who} cancelou este horário.`} style={styles.block} />;
  }
  if (lesson.status === 'scheduled') {
    return (
      <View style={styles.section}>
        <SectionHeader title="Antes de começar" />
        <Surface style={styles.checklist}>
          <Check done={lesson.teacherConfirmed} label="Instrutor confirmou presença" />
          <Check done={lesson.studentConfirmed} label="Aluno confirmou presença" />
          <Text variant="footnote" tone="muted">A aula só pode ser iniciada com as duas confirmações, feitas por cada um no próprio celular.</Text>
        </Surface>
      </View>
    );
  }
  if (lesson.status === 'completed') {
    return (
      <Surface style={[styles.block, styles.summary]}>
        <View style={styles.summaryIcon}><Icon name="flag-checkered" color={colors.brand} /></View>
        <View style={styles.flex}>
          <Text variant="headline">Aula concluída</Text>
          <Text variant="callout" tone="muted">Duração registrada: {formatDuration(elapsed)}</Text>
        </View>
      </Surface>
    );
  }
  return null;
}

function Check({ done, label }: { done: boolean; label: string }) {
  return (
    <View style={styles.check} accessible accessibilityLabel={`${label}: ${done ? 'sim' : 'ainda não'}`}>
      <View style={[styles.checkDot, done && styles.checkDone]}>{done && <Icon name="check" size={16} color={colors.onBrand} />}</View>
      <Text variant="body" tone={done ? 'default' : 'muted'}>{label}</Text>
    </View>
  );
}

function Detail({ icon, label, value, last }: { icon: IconName; label: string; value: string; last?: boolean }) {
  return <ListRow title={value} subtitle={label} divider={!last} leading={<View style={styles.detailIcon}><Icon name={icon} size={20} color={colors.brand} /></View>} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  hero: { backgroundColor: colors.asphalt, borderRadius: radius.xl, padding: space.xl, gap: space.lg, marginTop: space.sm },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  time: { color: colors.accent, marginTop: space.xxs },
  timer: { color: colors.accent, fontVariant: ['tabular-nums'] },
  person: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingTop: space.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.asphaltRaised },
  block: { marginTop: space.lg },
  section: { marginTop: space.xxl },
  checklist: { gap: space.md },
  check: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  checkDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  checkDone: { backgroundColor: colors.brand, borderColor: colors.brand },
  summary: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  summaryIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  details: { paddingHorizontal: space.lg },
  detailIcon: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: space.md },
});
