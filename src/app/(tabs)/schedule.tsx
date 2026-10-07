import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Switch } from 'react-native-paper';

import { ActionButton, AppText, Screen, SectionHeading, StatusTag, TopBar } from '@/components/drive-ui';
import { DriveColors } from '@/constants/drive-theme';
import { useDriveApp } from '@/hooks/use-drive-app';

export default function ScheduleScreen() {
  const { role, appointments, setAvailability } = useDriveApp();
  const [available, setAvailable] = useState(true);

  if (role === 'teacher') {
    return (
      <Screen>
        <TopBar roleLabel="Sua rotina" />
        <View style={styles.heading}><AppText style={styles.title}>Agenda</AppText><AppText style={styles.subtitle}>Quarta-feira, 7 de outubro</AppText></View>
        <View style={styles.availabilityRow}>
          <View style={styles.availabilityCopy}><AppText style={styles.availabilityTitle}>Receber novos alunos</AppText><AppText style={styles.availabilityDetail}>{available ? 'Seu perfil aparece nas buscas' : 'Seu perfil está pausado'}</AppText></View>
          <Switch value={available} color={DriveColors.green} onValueChange={(value) => { setAvailable(value); setAvailability(value); }} />
        </View>
        <SectionHeading title="Hoje" aside="4 aulas" />
        {[
          ['09:00', 'Rafael Costa', 'Fundamentos · Onix'],
          ['10:30', 'Julia Martins', 'Trânsito urbano · Onix'],
          ['14:00', 'Lara Alves', 'Simulado · Onix'],
          ['16:30', 'Felipe Nunes', 'Primeira aula · Onix'],
        ].map(([time, student, description], index) => <LessonRow key={time} time={time} name={student} detail={description} last={index === 3} onPress={student === 'Julia Martins' ? () => router.push({ pathname: '/lesson', params: { id: '1' } }) : undefined} />)}
        <View style={styles.weekHeader}><SectionHeading title="Próximos dias" /></View>
        <View style={styles.nextDay}><AppText style={styles.nextDate}>QUI, 8 OUT</AppText><AppText style={styles.nextDescription}>2 aulas agendadas</AppText><AppText style={styles.chevron}>›</AppText></View>
        <View style={styles.nextDay}><AppText style={styles.nextDate}>SEX, 9 OUT</AppText><AppText style={styles.nextDescription}>1 aula agendada</AppText><AppText style={styles.chevron}>›</AppText></View>
      </Screen>
    );
  }

  if (role === 'admin') {
    return (
      <Screen>
        <TopBar roleLabel="Operação" />
        <View style={styles.heading}><AppText style={styles.title}>Aulas e reservas</AppText><AppText style={styles.subtitle}>Visão operacional da plataforma.</AppText></View>
        <View style={styles.adminStats}><Stat value="86" label="Este mês" /><Stat value="12" label="Hoje" /><Stat value="4" label="Aguardando" /></View>
        <SectionHeading title="Reservas recentes" aside="Ver todas" />
        <LessonRow time="09:00" name="Julia Martins" detail="Ana Paula · HB20 · Confirmada" onPress={() => router.push({ pathname: '/lesson', params: { id: '1' } })} />
        <LessonRow time="10:30" name="Rafael Costa" detail="Marcos Vieira · Onix · Confirmada" />
        <LessonRow time="14:00" name="Lara Alves" detail="Roberta Nunes · Argo · Pendente" last />
        <View style={styles.adminNotice}><StatusTag label="ATENÇÃO" /><AppText style={styles.noticeText}>2 solicitações aguardam confirmação do instrutor.</AppText></View>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar roleLabel="Aulas e horários" />
      <View style={styles.heading}><AppText style={styles.title}>Sua agenda</AppText><AppText style={styles.subtitle}>Aulas confirmadas e solicitações.</AppText></View>
      <View style={styles.dateBand}><AppText style={styles.dateNumber}>08</AppText><View style={styles.dateCopy}><AppText style={styles.dateWeekday}>QUI, OUTUBRO</AppText><AppText style={styles.dateLabel}>Sua próxima aula</AppText></View><StatusTag label="CONFIRMADA" /></View>
      <SectionHeading title="Próximas aulas" aside={`${appointments.length} agendada${appointments.length === 1 ? '' : 's'}`} />
      {appointments.map((appointment, index) => (
        <LessonRow key={appointment.id} time={appointment.time} name={appointment.teacherName} detail={`${appointment.lesson} · ${appointment.vehicle}`} date={appointment.date} last={index === appointments.length - 1} onPress={() => router.push({ pathname: '/lesson', params: { id: String(appointment.id) } })} />
      ))}
      <View style={styles.helpBlock}>
        <AppText style={styles.helpTitle}>Quer praticar mais?</AppText>
        <AppText style={styles.helpText}>Encontre horários disponíveis e peça uma nova aula.</AppText>
        <View style={styles.helpButton}><ActionButton label="Buscar instrutores" variant="secondary" onPress={() => router.navigate('/(tabs)/teachers')} /></View>
      </View>
    </Screen>
  );
}

function LessonRow({ time, name, detail, date, last, onPress }: { time: string; name: string; detail: string; date?: string; last?: boolean; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} disabled={!onPress} onPress={onPress} style={[styles.lessonRow, last && styles.lastLesson]}>
      <View style={styles.timeColumn}><AppText style={styles.time}>{time}</AppText>{!!date && <AppText style={styles.lessonDate}>{date}</AppText>}</View>
      <View style={styles.timeline}><View style={styles.timelineDot} /><View style={styles.timelineLine} /></View>
      <View style={styles.lessonInfo}><AppText style={styles.lessonName}>{name}</AppText><AppText style={styles.lessonDetail}>{detail}</AppText></View>
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
  toggle: { width: 46, height: 27, borderRadius: 14, padding: 3, justifyContent: 'center', backgroundColor: '#CDD4CD' },
  toggleOn: { backgroundColor: DriveColors.green },
  toggleKnob: { width: 21, height: 21, borderRadius: 11, backgroundColor: DriveColors.white },
  toggleKnobOn: { alignSelf: 'flex-end' },
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
  adminStats: { flexDirection: 'row', gap: 9, marginBottom: 25 },
  stat: { flex: 1, minHeight: 72, backgroundColor: DriveColors.surfaceMuted, borderRadius: 8, padding: 12, justifyContent: 'center' },
  statValue: { color: DriveColors.ink, fontSize: 21, fontWeight: '700' },
  statLabel: { color: DriveColors.muted, fontSize: 11, marginTop: 3 },
  adminNotice: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 15, borderTopWidth: 1, borderColor: DriveColors.line, marginTop: 12 },
  noticeText: { flex: 1, color: DriveColors.ink, fontSize: 12, lineHeight: 18 },
});