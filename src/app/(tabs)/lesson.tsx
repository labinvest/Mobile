import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Card, IconButton } from 'react-native-paper';

import { ActionButton, AppText, BackBar, FormField, Screen, SectionHeading, StatusTag, TopBar } from '@/components/drive-ui';
import { DriveColors } from '@/constants/drive-theme';
import { LessonReview, useDriveApp } from '@/hooks/use-drive-app';

const starIcons = {
  filled: { ios: 'star.fill', android: 'star', web: 'star' },
  outline: { ios: 'star', android: 'star_outline', web: 'star_outline' },
} as const;

export default function LessonScreen() {
  const { role, accountName, appointments, confirmLesson, startLesson, finishLesson, submitLessonReview } = useDriveApp();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const selectedLesson = id ? appointments.find((appointment) => String(appointment.id) === id) : undefined;
  const activeLesson = appointments.find((appointment) => {
    if (!['requested', 'scheduled', 'in-progress'].includes(appointment.status)) return false;
    if (role === 'teacher') return appointment.teacherName === accountName;
    if (role === 'student') return appointment.studentName === accountName;
    return false;
  });
  const lesson = selectedLesson ?? activeLesson;
  const [now, setNow] = useState(0);
  const [attemptedStart, setAttemptedStart] = useState(false);

  useEffect(() => {
    if (lesson?.status !== 'in-progress') return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [lesson?.status]);

  if (!lesson) {
    return (
      <Screen>
        <TopBar roleLabel={role === 'teacher' ? 'Instrutor' : role === 'admin' ? 'Administração' : 'Aluno'} />
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}><SymbolView name={{ ios: 'car.fill', android: 'directions_car', web: 'directions_car' }} tintColor={DriveColors.green} size={28} /></View>
          <StatusTag label="SEM AULA EM ESPERA" />
          <AppText style={styles.emptyTitle}>Nenhuma aula para iniciar agora.</AppText>
          <AppText style={styles.emptyCopy}>{role === 'student' ? 'Quando um instrutor aceitar seu pedido, a aula aparecerá aqui para as confirmações.' : role === 'teacher' ? 'Quando você aceitar um pedido, poderá confirmar a presença e iniciar a aula por aqui.' : 'Não há aula ativa para este perfil.'}</AppText>
          <ActionButton label={role === 'student' ? 'Encontrar instrutor' : 'Ver agenda'} onPress={() => router.navigate(role === 'student' ? '/(tabs)/teachers' : '/(tabs)/schedule')} variant="secondary" />
        </View>
      </Screen>
    );
  }

  const confirmedCount = Number(lesson.studentConfirmed) + Number(lesson.teacherConfirmed);
  const elapsedSeconds = lesson.status === 'completed'
    ? lesson.durationSeconds ?? 0
    : lesson.status === 'in-progress' && lesson.startedAt
      ? Math.max(0, Math.floor((now - lesson.startedAt) / 1000))
      : 0;

  function beginLesson() {
    if (!lesson) return;
    if (confirmedCount < 2) {
      setAttemptedStart(true);
      return;
    }
    startLesson(lesson.id);
  }

  return (
    <Screen>
      <BackBar title="Sala da aula" />
      <View style={styles.heading}>
        <View style={styles.statusLine}><AppText style={styles.eyebrow}>{lesson.lesson.toUpperCase()}</AppText><StatusTag label={getStatusLabel(lesson.status)} /></View>
        <AppText style={styles.title}>{lesson.date} · {lesson.time}</AppText>
        <AppText style={styles.subtitle}>{lesson.vehicle}</AppText>
      </View>

      {lesson.status === 'requested' && <View style={styles.requestNotice}><AppText style={styles.requestNoticeTitle}>Pedido enviado</AppText><AppText style={styles.requestNoticeText}>O instrutor ainda precisa confirmar este horário. Você poderá confirmar presença quando a aula for aceita.</AppText></View>}
      {lesson.status === 'declined' && <View style={styles.declinedNotice}><AppText style={styles.requestNoticeTitle}>Horário não confirmado</AppText><AppText style={styles.requestNoticeText}>O instrutor não conseguiu aceitar este pedido. Escolha outro horário ou profissional.</AppText><ActionButton label="Buscar outro horário" variant="secondary" onPress={() => router.navigate('/(tabs)/teachers')} /></View>}

      {lesson.status !== 'requested' && lesson.status !== 'declined' && (
        <View style={styles.people}>
          <SectionHeading title="Confirmação de presença" aside={`${confirmedCount} de 2`} />
          <Participant name={lesson.studentName} role="Aluno" initials={getInitials(lesson.studentName)} confirmed={lesson.studentConfirmed} disabled={lesson.status !== 'scheduled'} onConfirm={() => confirmLesson(lesson.id, 'student')} />
          <Participant name={lesson.teacherName} role="Instrutor(a)" initials={getInitials(lesson.teacherName)} confirmed={lesson.teacherConfirmed} disabled={lesson.status !== 'scheduled'} onConfirm={() => confirmLesson(lesson.id, 'teacher')} />
          <AppText style={styles.demoNote}>Demonstração: cada participante confirma na própria sessão quando houver autenticação conectada.</AppText>
        </View>
      )}

      {lesson.status === 'scheduled' && (
        <View style={styles.startBlock}>
          <View style={styles.readyPanel}><StatusTag label="PRONTA PARA COMEÇAR" /><AppText style={styles.requestNoticeText}>Confirme a presença dos dois participantes. A checagem de proximidade com o ESP32 será adicionada quando o dispositivo estiver integrado.</AppText></View>
          {attemptedStart && confirmedCount < 2 && <AppText style={styles.warning}>As duas confirmações são necessárias para iniciar.</AppText>}
          <ActionButton label={confirmedCount === 2 ? 'Iniciar aula' : 'Aguardando confirmações'} onPress={beginLesson} disabled={confirmedCount < 2} />
        </View>
      )}

      {lesson.status === 'in-progress' && (
        <View style={styles.activeBlock}>
          <View style={styles.activeTop}><View style={styles.liveDot} /><AppText style={styles.activeLabel}>AULA EM ANDAMENTO</AppText></View>
          <AppText style={styles.timer}>{formatDuration(elapsedSeconds)}</AppText>
          <AppText style={styles.gpsPending}>Duração em tempo real · GPS aguardando integração</AppText>
          <View style={styles.gpsBanner}><StatusTag label="GPS / IoT" /><AppText style={styles.gpsBannerText}>O percurso e a velocidade serão registrados quando o dispositivo de localização estiver conectado.</AppText></View>
          <View style={styles.finishButton}><ActionButton label="Finalizar aula" onPress={() => finishLesson(lesson.id)} variant="secondary" /></View>
        </View>
      )}

      {lesson.status === 'completed' && (
        <View style={styles.summary}>
          <View style={styles.completedHeading}><View><AppText style={styles.completedLabel}>AULA CONCLUÍDA</AppText><AppText style={styles.timer}>{formatDuration(elapsedSeconds)}</AppText></View><StatusTag label="RESUMO DEMONSTRATIVO" /></View>
          <SectionHeading title="Percurso da aula" aside="GPS futuro" />
          <RoutePreview />
          <View style={styles.metrics}>
            <Metric label="Distância" value="8,4 km" />
            <Metric label="Velocidade média" value="24 km/h" />
            <Metric label="Pico de velocidade" value="48 km/h" />
            <Metric label="Paradas" value="2" />
          </View>
          <AppText style={styles.disclaimer}>Valores ilustrativos para esta demonstração. O histórico real dependerá do GPS conectado ao veículo.</AppText>
        </View>
      )}

      {lesson.status === 'completed' && role !== 'admin' && (
        <LessonReviews
          targetName={role === 'student' ? lesson.teacherName : lesson.studentName}
          targetLabel={role === 'student' ? 'instrutor' : 'aluno'}
          currentReview={lesson.reviews?.[role]}
          otherReview={lesson.reviews?.[role === 'student' ? 'teacher' : 'student']}
          onSubmit={(rating, comment) => submitLessonReview(lesson.id, role, rating, comment)}
        />
      )}

      <View style={styles.details}>
        <SectionHeading title="Detalhes" />
        <Detail label="Instrutor" value={lesson.teacherName} />
        <Detail label="Veículo" value={lesson.vehicle} />
        <Detail label="Ponto de encontro" value={lesson.meetingPoint || 'A combinar com o instrutor'} />
        {!!lesson.notes && <Detail label="Observações" value={lesson.notes} />}
      </View>
    </Screen>
  );
}

function LessonReviews({ targetName, targetLabel, currentReview, otherReview, onSubmit }: {
  targetName: string;
  targetLabel: string;
  currentReview?: LessonReview;
  otherReview?: LessonReview;
  onSubmit: (rating: number, comment: string) => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  return (
    <View style={styles.reviewsSection}>
      <SectionHeading title="Avaliações da aula" />
      {currentReview ? (
        <ReviewSummary title={`Sua avaliação de ${targetName}`} review={currentReview} />
      ) : (
        <Card mode="outlined" style={styles.reviewCard}>
          <Card.Content style={styles.reviewCardContent}>
            <AppText style={styles.reviewPrompt}>Como foi sua experiência com {targetLabel === 'aluno' ? 'o aluno' : 'o instrutor'} {targetName}?</AppText>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((value) => (
                <IconButton
                  key={value}
                  accessibilityLabel={`Nota ${value} de 5`}
                  icon={({ color, size }) => <SymbolView name={value <= rating ? starIcons.filled : starIcons.outline} tintColor={value <= rating ? '#D99A27' : color} size={size} />}
                  size={26}
                  onPress={() => setRating(value)}
                />
              ))}
              <AppText style={styles.ratingValue}>{rating ? `${rating}/5` : 'Escolha uma nota'}</AppText>
            </View>
            <FormField
              label="Comentário (opcional)"
              accessibilityLabel="Comentário da avaliação"
              multiline
              numberOfLines={3}
              onChangeText={setComment}
              placeholder="Conte como foi a aula"
              style={styles.reviewComment}
              value={comment}
            />
            <ActionButton label="Enviar avaliação" onPress={() => onSubmit(rating, comment)} disabled={rating === 0} />
          </Card.Content>
        </Card>
      )}
      {otherReview ? (
        <ReviewSummary title={`Avaliação de ${otherReview.authorName}`} review={otherReview} />
      ) : (
        <AppText style={styles.awaitingReview}>A avaliação do outro participante aparecerá aqui quando for enviada.</AppText>
      )}
      <AppText style={styles.reviewPrivacy}>As avaliações ficam registradas nesta aula e ajudam a construir a reputação de alunos e instrutores.</AppText>
    </View>
  );
}

function ReviewSummary({ title, review }: { title: string; review: LessonReview }) {
  return (
    <View style={styles.reviewSummary}>
      <View style={styles.reviewSummaryTop}><AppText style={styles.reviewSummaryTitle}>{title}</AppText><AppText style={styles.reviewScore}>★ {review.rating}/5</AppText></View>
      {!!review.comment && <AppText style={styles.reviewCommentText}>{review.comment}</AppText>}
    </View>
  );
}

function Participant({ name, role, initials, confirmed, disabled, onConfirm }: { name: string; role: string; initials: string; confirmed: boolean; disabled: boolean; onConfirm: () => void }) {
  return (
    <View style={styles.participant}>
      <View style={styles.avatar}><AppText style={styles.avatarText}>{initials}</AppText></View>
      <View style={styles.participantCopy}><AppText style={styles.participantName}>{name}</AppText><AppText style={styles.participantRole}>{role}</AppText></View>
      <Pressable accessibilityRole="button" accessibilityState={{ checked: confirmed, disabled }} disabled={disabled} onPress={onConfirm} style={[styles.confirmButton, confirmed && styles.confirmedButton, disabled && !confirmed && styles.confirmDisabled]}>
        <AppText style={[styles.confirmText, confirmed && styles.confirmedText]}>{confirmed ? 'Confirmado' : 'Confirmar'}</AppText>
      </Pressable>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <View style={styles.metric}><AppText style={styles.metricValue}>{value}</AppText><AppText style={styles.metricLabel}>{label}</AppText></View>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={styles.detail}><AppText style={styles.detailLabel}>{label}</AppText><AppText style={styles.detailValue}>{value}</AppText></View>;
}

function RoutePreview() {
  return (
    <View style={styles.map}>
      <View style={styles.streetHorizontalOne} /><View style={styles.streetHorizontalTwo} />
      <View style={styles.streetVerticalOne} /><View style={styles.streetVerticalTwo} />
      <View style={styles.routeFirst} /><View style={styles.routeSecond} /><View style={styles.routeThird} />
      <View style={styles.routeStart} /><View style={styles.routeEnd} />
      <View style={styles.mapLegend}><View style={styles.legendDot} /><AppText style={styles.legendText}>Percurso ilustrativo · São Paulo</AppText></View>
    </View>
  );
}

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return [hours, minutes, remainingSeconds].map((part) => String(part).padStart(2, '0')).join(':');
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function getStatusLabel(status: 'requested' | 'declined' | 'scheduled' | 'in-progress' | 'completed') {
  if (status === 'requested') return 'AGUARDANDO';
  if (status === 'declined') return 'RECUSADA';
  if (status === 'in-progress') return 'EM ANDAMENTO';
  if (status === 'completed') return 'FINALIZADA';
  return 'CONFIRMADA';
}

const styles = StyleSheet.create({
  heading: { marginTop: 20, marginBottom: 22, gap: 7 },
  statusLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { color: DriveColors.green, fontSize: 10, fontWeight: '700' },
  title: { color: DriveColors.ink, fontSize: 25, lineHeight: 31, fontWeight: '700' },
  subtitle: { color: DriveColors.muted, fontSize: 13 },
  people: { marginBottom: 18 },
  participant: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderColor: DriveColors.line },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#E7EEE8', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: DriveColors.green, fontSize: 12, fontWeight: '700' },
  participantCopy: { flex: 1, gap: 3 },
  participantName: { color: DriveColors.ink, fontSize: 13, fontWeight: '600' },
  participantRole: { color: DriveColors.muted, fontSize: 11 },
  confirmButton: { minHeight: 34, minWidth: 91, alignItems: 'center', justifyContent: 'center', backgroundColor: DriveColors.lime, borderRadius: 7, paddingHorizontal: 9 },
  confirmedButton: { backgroundColor: '#E8EFE8' },
  confirmDisabled: { backgroundColor: DriveColors.surfaceMuted },
  confirmText: { color: DriveColors.ink, fontSize: 11, fontWeight: '700' },
  confirmedText: { color: DriveColors.green },
  demoNote: { color: DriveColors.muted, fontSize: 10, lineHeight: 15, marginTop: 10 },
  startBlock: { marginBottom: 20 },
  readyPanel: { backgroundColor: DriveColors.surfaceMuted, borderRadius: 9, padding: 13, gap: 8, marginBottom: 12 },
  warning: { color: DriveColors.danger, fontSize: 12, marginBottom: 9 },
  requestNotice: { backgroundColor: DriveColors.surfaceMuted, borderRadius: 9, padding: 14, gap: 6, marginBottom: 20 },
  declinedNotice: { backgroundColor: '#F7E9E7', borderRadius: 9, padding: 14, gap: 8, marginBottom: 20 },
  requestNoticeTitle: { color: DriveColors.ink, fontSize: 14, fontWeight: '700' },
  requestNoticeText: { color: DriveColors.muted, fontSize: 12, lineHeight: 17 },
  reviewsSection: { marginBottom: 22 },
  reviewCard: { borderColor: DriveColors.line, borderRadius: 9, backgroundColor: DriveColors.white, marginBottom: 10 },
  reviewCardContent: { gap: 10 },
  reviewPrompt: { color: DriveColors.ink, fontSize: 13, fontWeight: '600', lineHeight: 19 },
  stars: { flexDirection: 'row', alignItems: 'center', marginLeft: -8 },
  ratingValue: { color: DriveColors.muted, fontSize: 11, marginLeft: 5 },
  reviewComment: { minHeight: 82 },
  reviewSummary: { padding: 12, backgroundColor: DriveColors.surfaceMuted, borderRadius: 8, gap: 6, marginBottom: 8 },
  reviewSummaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  reviewSummaryTitle: { flex: 1, color: DriveColors.ink, fontSize: 12, fontWeight: '700' },
  reviewScore: { color: '#9A6900', fontSize: 12, fontWeight: '700' },
  reviewCommentText: { color: DriveColors.muted, fontSize: 12, lineHeight: 17 },
  awaitingReview: { color: DriveColors.muted, fontSize: 11, lineHeight: 16, marginBottom: 8 },
  reviewPrivacy: { color: DriveColors.muted, fontSize: 10, lineHeight: 15 },
  activeBlock: { backgroundColor: DriveColors.ink, borderRadius: 10, padding: 17, marginBottom: 22 },
  activeTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: DriveColors.lime },
  activeLabel: { color: '#D6E1D8', fontSize: 10, fontWeight: '700' },
  timer: { color: DriveColors.ink, fontSize: 31, fontWeight: '700', marginTop: 11 },
  gpsPending: { color: DriveColors.muted, fontSize: 11, marginTop: 2 },
  gpsBanner: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#2C3A31', borderRadius: 8, padding: 11, marginTop: 16 },
  gpsBannerText: { flex: 1, color: '#D6E1D8', fontSize: 10, lineHeight: 15 },
  finishButton: { marginTop: 14 },
  summary: { marginBottom: 22 },
  completedHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  completedLabel: { color: DriveColors.green, fontSize: 10, fontWeight: '700' },
  map: { height: 150, borderRadius: 9, backgroundColor: '#E9EEE8', overflow: 'hidden', position: 'relative', marginBottom: 10 },
  streetHorizontalOne: { position: 'absolute', left: 0, top: 36, width: '100%', height: 13, backgroundColor: '#D5DDD4' },
  streetHorizontalTwo: { position: 'absolute', left: 0, top: 104, width: '100%', height: 11, backgroundColor: '#D5DDD4' },
  streetVerticalOne: { position: 'absolute', left: '28%', top: 0, width: 12, height: '100%', backgroundColor: '#D5DDD4' },
  streetVerticalTwo: { position: 'absolute', left: '75%', top: 0, width: 11, height: '100%', backgroundColor: '#D5DDD4' },
  routeFirst: { position: 'absolute', left: '27%', top: 41, width: '26%', height: 4, backgroundColor: DriveColors.green },
  routeSecond: { position: 'absolute', left: '51%', top: 41, width: 4, height: 51, backgroundColor: DriveColors.green },
  routeThird: { position: 'absolute', left: '51%', top: 89, width: '26%', height: 4, backgroundColor: DriveColors.green },
  routeStart: { position: 'absolute', left: '24%', top: 35, width: 15, height: 15, borderRadius: 8, backgroundColor: DriveColors.lime, borderWidth: 3, borderColor: DriveColors.green },
  routeEnd: { position: 'absolute', left: '73%', top: 83, width: 15, height: 15, borderRadius: 8, backgroundColor: DriveColors.white, borderWidth: 3, borderColor: DriveColors.green },
  mapLegend: { position: 'absolute', left: 10, bottom: 9, flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: DriveColors.green },
  legendText: { color: DriveColors.muted, fontSize: 10 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metric: { width: '48%', minHeight: 63, backgroundColor: DriveColors.surfaceMuted, borderRadius: 8, padding: 11, justifyContent: 'center' },
  metricValue: { color: DriveColors.ink, fontSize: 17, fontWeight: '700' },
  metricLabel: { color: DriveColors.muted, fontSize: 10, marginTop: 3 },
  disclaimer: { color: DriveColors.muted, fontSize: 10, lineHeight: 15, marginTop: 10 },
  details: { borderTopWidth: 1, borderColor: DriveColors.line, paddingTop: 12 },
  detail: { minHeight: 47, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderBottomWidth: 1, borderColor: DriveColors.line },
  detailLabel: { color: DriveColors.muted, fontSize: 11 },
  detailValue: { flex: 1, color: DriveColors.ink, fontSize: 11, fontWeight: '600', textAlign: 'right' },
  emptyTitle: { color: DriveColors.ink, fontSize: 20, fontWeight: '700', marginVertical: 20 },
  emptyState: { alignItems: 'flex-start', paddingTop: 52, gap: 12 },
  emptyIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: DriveColors.lime, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyCopy: { color: DriveColors.muted, fontSize: 14, lineHeight: 20, marginBottom: 6 },
});