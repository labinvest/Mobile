import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Switch } from 'react-native-paper';

import { ActionButton, AppText, Screen, SectionHeading, StatusTag, TopBar } from '@/components/drive-ui';
import { DriveColors } from '@/constants/drive-theme';
import { useApiData } from '@/hooks/use-api-data';
import { useDriveApp } from '@/hooks/use-drive-app';
import { errorMessage } from '@/lib/api';
import { formatLongDate, shortDateLabel, todayIso } from '@/lib/dates';
import type { AdminOverview, Appointment, AppointmentStatus } from '@/types/api';

const openLesson = (appointment: Appointment) => router.push({ pathname: '/(tabs)/lesson', params: { id: String(appointment.id) } });

export default function ScheduleScreen() {
  const { role, user, appointments, refreshAppointments } = useDriveApp();

  // Pedidos e confirmações chegam de outras pessoas: atualiza sempre que a agenda abre.
  useFocusEffect(
    useCallback(() => {
      refreshAppointments().catch(() => undefined);
    }, [refreshAppointments]),
  );

  if (role === 'teacher') return <TeacherSchedule />;
  if (role === 'admin') return <AdminSchedule />;

  const studentAppointments = appointments.filter((appointment) => appointment.studentId === user?.id);
  const nextAppointment = studentAppointments[0];

  return (
    <Screen>
      <TopBar roleLabel="Aulas e horários" />
      <View style={styles.heading}><AppText style={styles.title}>Sua agenda</AppText><AppText style={styles.subtitle}>Aulas confirmadas e solicitações.</AppText></View>
      <View style={styles.dateBand}>
        <AppText style={styles.dateNumber}>{nextAppointment?.date.match(/\d+/)?.[0] ?? '--'}</AppText>
        <View style={styles.dateCopy}>
          <AppText style={styles.dateWeekday}>{nextAppointment?.date ?? 'SEM PEDIDOS'}</AppText>
          <AppText style={styles.dateLabel}>{nextAppointment?.status === 'requested' ? 'Aguardando resposta do instrutor' : nextAppointment?.status === 'declined' ? 'Pedido recusado' : nextAppointment?.status === 'completed' ? 'Última aula' : 'Próxima aula'}</AppText>
        </View>
        {!!nextAppointment && <StatusTag label={getStatusLabel(nextAppointment.status)} />}
      </View>
      <SectionHeading title="Pedidos e próximas aulas" aside={`${studentAppointments.length} item${studentAppointments.length === 1 ? '' : 's'}`} />
      {studentAppointments.map((appointment, index) => (
        <LessonRow key={appointment.id} time={appointment.time} name={appointment.teacherName} detail={`${appointment.lesson} · ${appointment.vehicle}`} date={appointment.date} statusLabel={getStatusLabel(appointment.status)} last={index === studentAppointments.length - 1} onPress={appointment.status === 'declined' ? undefined : () => openLesson(appointment)} />
      ))}
      {studentAppointments.length === 0 && <AppText style={styles.emptyRequests}>Você ainda não tem pedidos de aula.</AppText>}
      <View style={styles.helpBlock}>
        <AppText style={styles.helpTitle}>Quer praticar mais?</AppText>
        <AppText style={styles.helpText}>Encontre horários disponíveis e peça uma nova aula.</AppText>
        <View style={styles.helpButton}><ActionButton label="Buscar instrutores" variant="secondary" onPress={() => router.navigate('/(tabs)/teachers')} /></View>
      </View>
    </Screen>
  );
}

function TeacherSchedule() {
  const { user, appointments, respondToLesson, setAvailability } = useDriveApp();
  const [available, setAvailable] = useState(user?.teacher?.available ?? true);
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const today = todayIso();

  const teacherLessons = appointments.filter((appointment) => appointment.teacherId === user?.id);
  const teacherRequests = teacherLessons.filter((appointment) => appointment.status === 'requested');
  const confirmedTeacherLessons = teacherLessons.filter((appointment) => appointment.status === 'scheduled');
  const completedTeacherLessons = teacherLessons.filter((appointment) => appointment.status === 'completed');
  const todayLessons = teacherLessons
    .filter((appointment) => appointment.lessonDate === today && ['scheduled', 'in-progress', 'completed'].includes(appointment.status))
    .sort((a, b) => a.time.localeCompare(b.time));
  const upcomingByDay = Object.entries(
    confirmedTeacherLessons
      .filter((appointment) => appointment.lessonDate > today)
      .reduce<Record<string, number>>((days, appointment) => ({ ...days, [appointment.lessonDate]: (days[appointment.lessonDate] ?? 0) + 1 }), {}),
  ).sort(([a], [b]) => a.localeCompare(b));

  async function changeAvailability(value: boolean) {
    setAvailable(value);
    setError('');
    try {
      await setAvailability(value);
    } catch (caught) {
      setAvailable(!value);
      setError(errorMessage(caught));
    }
  }

  async function respond(appointmentId: number, accepted: boolean) {
    setError('');
    setRespondingId(appointmentId);
    try {
      await respondToLesson(appointmentId, accepted);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setRespondingId(null);
    }
  }

  return (
    <Screen>
      <TopBar roleLabel="Sua rotina" />
      <View style={styles.heading}><AppText style={styles.title}>Agenda</AppText><AppText style={styles.subtitle}>{formatLongDate()}</AppText></View>
      <View style={styles.availabilityRow}>
        <View style={styles.availabilityCopy}><AppText style={styles.availabilityTitle}>Receber novos alunos</AppText><AppText style={styles.availabilityDetail}>{available ? 'Seu perfil aparece nas buscas' : 'Seu perfil está pausado'}</AppText></View>
        <Switch value={available} color={DriveColors.green} onValueChange={changeAvailability} />
      </View>
      {user?.teacher?.approvalStatus !== 'approved' && (
        <View style={styles.pendingNotice}><StatusTag label="CADASTRO EM ANÁLISE" /><AppText style={styles.noticeText}>Seu perfil aparece para os alunos assim que a equipe aprovar o cadastro e o veículo.</AppText></View>
      )}
      {!!error && <AppText style={styles.error}>{error}</AppText>}
      <View style={styles.requestsSection}>
        <SectionHeading title="Pedidos de aula" aside={`${teacherRequests.length} pendentes`} />
        {teacherRequests.length > 0
          ? teacherRequests.map((appointment) => <RequestCard key={appointment.id} appointment={appointment} busy={respondingId === appointment.id} onAccept={() => respond(appointment.id, true)} onDecline={() => respond(appointment.id, false)} />)
          : <AppText style={styles.emptyRequests}>Novos pedidos de alunos aparecerão aqui.</AppText>}
      </View>
      {confirmedTeacherLessons.length > 0 && (
        <View style={styles.requestsSection}>
          <SectionHeading title="Novas aulas confirmadas" aside={`${confirmedTeacherLessons.length}`} />
          {confirmedTeacherLessons.map((appointment) => <LessonRow key={appointment.id} time={appointment.time} name={appointment.studentName} detail={`${appointment.lesson} · ${appointment.vehicle}`} date={appointment.date} statusLabel="ACEITA" onPress={() => openLesson(appointment)} />)}
        </View>
      )}
      <View style={styles.requestsSection}>
        <SectionHeading title="Aulas concluídas" aside={`${completedTeacherLessons.length}`} />
        {completedTeacherLessons.map((appointment) => <LessonRow key={appointment.id} time={appointment.time} name={appointment.studentName} detail={`${appointment.lesson} · ${appointment.vehicle}`} date={appointment.date} statusLabel={appointment.reviews.teacher ? `NOTA ENVIADA · ${appointment.reviews.teacher.rating}/5` : 'AVALIAR ALUNO'} onPress={() => openLesson(appointment)} />)}
        {completedTeacherLessons.length === 0 && <AppText style={styles.emptyRequests}>As avaliações aparecem aqui depois que uma aula é finalizada.</AppText>}
      </View>
      <SectionHeading title="Hoje" aside={`${todayLessons.length} aula${todayLessons.length === 1 ? '' : 's'}`} />
      {todayLessons.map((appointment, index) => <LessonRow key={appointment.id} time={appointment.time} name={appointment.studentName} detail={appointment.lesson.replace(/^Aula prática · /, '')} statusLabel={getStatusLabel(appointment.status)} last={index === todayLessons.length - 1} onPress={() => openLesson(appointment)} />)}
      {todayLessons.length === 0 && <AppText style={styles.emptyRequests}>Nenhuma aula marcada para hoje.</AppText>}
      <View style={styles.weekHeader}><SectionHeading title="Próximos dias" /></View>
      {upcomingByDay.map(([day, count]) => (
        <View key={day} style={styles.nextDay}><AppText style={styles.nextDate}>{shortDateLabel(day)}</AppText><AppText style={styles.nextDescription}>{count} aula{count === 1 ? '' : 's'} agendada{count === 1 ? '' : 's'}</AppText><AppText style={styles.chevron}>›</AppText></View>
      ))}
      {upcomingByDay.length === 0 && <AppText style={styles.emptyRequests}>Sem aulas confirmadas nos próximos dias.</AppText>}
    </Screen>
  );
}

function AdminSchedule() {
  const { appointments } = useDriveApp();
  const { data: overview } = useApiData<AdminOverview>('/admin/overview');
  const recent = [...appointments].sort((a, b) => b.id - a.id).slice(0, 5);

  return (
    <Screen>
      <TopBar roleLabel="Operação" />
      <View style={styles.heading}><AppText style={styles.title}>Aulas e reservas</AppText><AppText style={styles.subtitle}>Visão operacional da plataforma.</AppText></View>
      <View style={styles.adminStats}>
        <Stat value={overview ? String(overview.lessonsThisMonth) : '–'} label="Este mês" />
        <Stat value={overview ? String(overview.lessonsToday) : '–'} label="Hoje" />
        <Stat value={overview ? String(overview.pendingRequests) : '–'} label="Aguardando" />
      </View>
      <SectionHeading title="Reservas recentes" aside={`${appointments.length} no total`} />
      {recent.map((appointment, index) => (
        <LessonRow key={appointment.id} time={appointment.time} date={appointment.date} name={appointment.studentName} detail={`${appointment.teacherName} · ${appointment.vehicle} · ${getStatusLabel(appointment.status).toLowerCase()}`} last={index === recent.length - 1} onPress={() => openLesson(appointment)} />
      ))}
      {recent.length === 0 && <AppText style={styles.emptyRequests}>Nenhuma reserva na plataforma ainda.</AppText>}
      {!!overview?.pendingRequests && (
        <View style={styles.adminNotice}><StatusTag label="ATENÇÃO" /><AppText style={styles.noticeText}>{overview.pendingRequests} solicitaç{overview.pendingRequests === 1 ? 'ão aguarda' : 'ões aguardam'} confirmação do instrutor.</AppText></View>
      )}
    </Screen>
  );
}

function RequestCard({ appointment, busy, onAccept, onDecline }: { appointment: Appointment; busy: boolean; onAccept: () => void; onDecline: () => void }) {
  return (
    <View style={styles.requestCard}>
      <View style={styles.requestTop}><AppText style={styles.requestStudent}>{appointment.studentName}</AppText><StatusTag label="NOVO PEDIDO" /></View>
      <AppText style={styles.requestDetail}>{appointment.date} · {appointment.time}</AppText>
      <AppText style={styles.requestDetail}>{appointment.lesson} · {appointment.vehicle}</AppText>
      <AppText style={styles.requestDetail}>Encontro: {appointment.meetingPoint || 'a combinar'}</AppText>
      {!!appointment.notes && <AppText style={styles.requestNotes}>“{appointment.notes}”</AppText>}
      <View style={styles.requestActions}>
        <View style={styles.requestAction}><ActionButton label="Recusar" variant="secondary" compact onPress={onDecline} disabled={busy} /></View>
        <View style={styles.requestAction}><ActionButton label="Aceitar horário" compact onPress={onAccept} loading={busy} /></View>
      </View>
    </View>
  );
}

function getStatusLabel(status: AppointmentStatus) {
  if (status === 'requested') return 'AGUARDANDO';
  if (status === 'declined') return 'RECUSADA';
  if (status === 'in-progress') return 'EM ANDAMENTO';
  if (status === 'completed') return 'CONCLUÍDA';
  return 'CONFIRMADA';
}

function LessonRow({ time, name, detail, date, last, onPress, statusLabel }: { time: string; name: string; detail: string; date?: string; last?: boolean; onPress?: () => void; statusLabel?: string }) {
  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} disabled={!onPress} onPress={onPress} style={[styles.lessonRow, last && styles.lastLesson]}>
      <View style={styles.timeColumn}><AppText style={styles.time}>{time}</AppText>{!!date && <AppText style={styles.lessonDate}>{date}</AppText>}</View>
      <View style={styles.timeline}><View style={styles.timelineDot} /><View style={styles.timelineLine} /></View>
      <View style={styles.lessonInfo}><AppText style={styles.lessonName}>{name}</AppText><AppText style={styles.lessonDetail}>{detail}</AppText>{!!statusLabel && <AppText style={styles.lessonStatus}>{statusLabel}</AppText>}</View>
    </Pressable>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return <View style={styles.stat}><AppText style={styles.statValue}>{value}</AppText><AppText style={styles.statLabel}>{label}</AppText></View>;
}

const styles = StyleSheet.create({
  heading: { marginTop: 26, marginBottom: 22, gap: 5 },
  title: { color: DriveColors.ink, fontSize: 28, lineHeight: 34, fontWeight: '700' },
  subtitle: { color: DriveColors.muted, fontSize: 14, lineHeight: 20 },
  availabilityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: DriveColors.line, marginBottom: 25 },
  availabilityCopy: { gap: 4 },
  availabilityTitle: { color: DriveColors.ink, fontSize: 14, fontWeight: '600' },
  availabilityDetail: { color: DriveColors.muted, fontSize: 12 },
  lessonRow: { minHeight: 78, flexDirection: 'row', alignItems: 'stretch' },
  lastLesson: { minHeight: 62 },
  timeColumn: { width: 56, paddingTop: 3 },
  time: { color: DriveColors.ink, fontSize: 13, fontWeight: '700' },
  lessonDate: { color: DriveColors.muted, fontSize: 10, marginTop: 4 },
  timeline: { width: 20, alignItems: 'center' },
  timelineDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: DriveColors.green, marginTop: 5 },
  timelineLine: { flex: 1, width: 1, backgroundColor: DriveColors.line, marginTop: 5 },
  lessonInfo: { flex: 1, paddingLeft: 9, paddingBottom: 17, gap: 5 },
  lessonName: { color: DriveColors.ink, fontSize: 14, fontWeight: '600' },
  lessonDetail: { color: DriveColors.muted, fontSize: 12, lineHeight: 17 },
  weekHeader: { marginTop: 8 },
  nextDay: { minHeight: 49, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: DriveColors.line, gap: 12 },
  nextDate: { color: DriveColors.green, fontSize: 11, fontWeight: '700', width: 88 },
  nextDescription: { flex: 1, color: DriveColors.ink, fontSize: 13 },
  chevron: { color: DriveColors.muted, fontSize: 22 },
  dateBand: { minHeight: 76, backgroundColor: DriveColors.surfaceMuted, borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 12, marginBottom: 24 },
  dateNumber: { color: DriveColors.green, fontSize: 31, fontWeight: '700' },
  dateCopy: { flex: 1, gap: 3 },
  dateWeekday: { color: DriveColors.muted, fontSize: 10, fontWeight: '700' },
  dateLabel: { color: DriveColors.ink, fontSize: 13, fontWeight: '600' },
  helpBlock: { borderTopWidth: 1, borderColor: DriveColors.line, marginTop: 13, paddingTop: 18 },
  helpTitle: { color: DriveColors.ink, fontSize: 16, fontWeight: '700' },
  helpText: { color: DriveColors.muted, fontSize: 13, lineHeight: 18, marginTop: 5 },
  helpButton: { marginTop: 14 },
  requestsSection: { marginBottom: 21 },
  emptyRequests: { color: DriveColors.muted, fontSize: 12, lineHeight: 18, paddingVertical: 12 },
  requestCard: { backgroundColor: DriveColors.white, borderWidth: 1, borderColor: DriveColors.line, borderRadius: 9, padding: 13, marginBottom: 9, gap: 5 },
  requestTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 2 },
  requestStudent: { color: DriveColors.ink, fontSize: 14, fontWeight: '700' },
  requestDetail: { color: DriveColors.muted, fontSize: 11, lineHeight: 16 },
  requestNotes: { color: DriveColors.ink, fontSize: 12, lineHeight: 17, marginTop: 4 },
  requestActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 9 },
  requestAction: { minWidth: 112 },
  lessonStatus: { color: DriveColors.green, fontSize: 10, fontWeight: '700', marginTop: 2 },
  adminStats: { flexDirection: 'row', gap: 9, marginBottom: 25 },
  stat: { flex: 1, minHeight: 72, backgroundColor: DriveColors.surfaceMuted, borderRadius: 8, padding: 12, justifyContent: 'center' },
  statValue: { color: DriveColors.ink, fontSize: 21, fontWeight: '700' },
  statLabel: { color: DriveColors.muted, fontSize: 11, marginTop: 3 },
  adminNotice: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 15, borderTopWidth: 1, borderColor: DriveColors.line, marginTop: 12 },
  pendingNotice: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 9, backgroundColor: DriveColors.surfaceMuted, marginBottom: 21 },
  noticeText: { flex: 1, color: DriveColors.ink, fontSize: 12, lineHeight: 18 },
  error: { color: DriveColors.danger, fontSize: 12, lineHeight: 17, marginBottom: 12 },
});
