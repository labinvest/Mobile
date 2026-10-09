import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, SegmentedButtons } from 'react-native-paper';

import { ActionButton, AppText, BackBar, FormField, Screen, SectionHeading, StatusTag } from '@/components/drive-ui';
import { DriveColors } from '@/constants/drive-theme';
import { useDriveApp } from '@/hooks/use-drive-app';
import { errorMessage } from '@/lib/api';
import { upcomingDays } from '@/lib/dates';

const timeOptions = [
  { value: '09h às 11h', label: '09h–11h' },
  { value: '13h às 15h', label: '13h–15h' },
  { value: '17h às 19h', label: '17h–19h' },
];

const lessonOptions = [
  { value: 'Primeira aula', label: 'Início' },
  { value: 'Trânsito urbano', label: 'Trânsito' },
  { value: 'Estacionamento', label: 'Estacionar' },
];

export default function BookingScreen() {
  const { teacherId, teacherName, vehicle, area, price } = useLocalSearchParams<{
    teacherId?: string;
    teacherName?: string;
    vehicle?: string;
    area?: string;
    price?: string;
  }>();
  const { requestLesson } = useDriveApp();
  const [dateOptions] = useState(() => upcomingDays(3));
  const [date, setDate] = useState(dateOptions[0].value);
  const [time, setTime] = useState(timeOptions[0].value);
  const [lesson, setLesson] = useState(lessonOptions[0].value);
  const [meetingPoint, setMeetingPoint] = useState(area ?? '');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function sendRequest() {
    if (!teacherId) {
      setError('Escolha um instrutor antes de pedir a aula.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await requestLesson({
        teacherId: Number(teacherId),
        date,
        time,
        lesson: `Aula prática · ${lesson}`,
        meetingPoint: meetingPoint.trim(),
        notes: notes.trim(),
      });
      router.replace('/(tabs)/schedule');
    } catch (caught) {
      setError(errorMessage(caught));
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <BackBar title="Solicitar uma aula" />
      <View style={styles.heading}>
        <AppText style={styles.eyebrow}>PEDIDO DE AGENDAMENTO</AppText>
        <AppText style={styles.title}>Combine os detalhes da aula.</AppText>
        <AppText style={styles.subtitle}>O instrutor recebe seu pedido e confirma o horário.</AppText>
      </View>

      <Card mode="outlined" style={styles.teacherCard}>
        <Card.Content style={styles.teacherContent}>
          <View style={styles.teacherCopy}>
            <AppText style={styles.teacherName}>{teacherName ?? 'Instrutor'}</AppText>
            <AppText style={styles.teacherDetail}>{vehicle ?? 'Veículo a combinar'}</AppText>
            <AppText style={styles.teacherDetail}>{area ?? 'Região a combinar'}</AppText>
          </View>
          <View style={styles.priceBlock}>
            <StatusTag label="POR AULA" />
            <AppText style={styles.price}>{price ?? '—'}</AppText>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.fieldGroup}>
        <SectionHeading title="Qual dia funciona para você?" />
        <SegmentedButtons value={date} onValueChange={setDate} buttons={dateOptions} />
      </View>

      <View style={styles.fieldGroup}>
        <SectionHeading title="Período preferido" />
        <SegmentedButtons value={time} onValueChange={setTime} buttons={timeOptions} />
      </View>

      <View style={styles.fieldGroup}>
        <SectionHeading title="O que quer praticar?" />
        <SegmentedButtons value={lesson} onValueChange={setLesson} buttons={lessonOptions} />
      </View>

      <View style={styles.fieldGroup}>
        <FormField
          label="Local de encontro"
          accessibilityLabel="Local de encontro"
          onChangeText={setMeetingPoint}
          placeholder="Informe um endereço ou ponto de referência"
          value={meetingPoint}
        />
        <FormField
          label="Observações para o instrutor (opcional)"
          accessibilityLabel="Observações para o instrutor"
          multiline
          numberOfLines={3}
          onChangeText={setNotes}
          placeholder="Conte se há algo importante para preparar a aula"
          style={styles.notes}
          value={notes}
        />
      </View>

      <View style={styles.submitBlock}>
        {!!error && <AppText style={styles.error}>{error}</AppText>}
        <ActionButton label="Enviar pedido de aula" onPress={sendRequest} loading={submitting} />
        <AppText style={styles.helper}>A aula só entra como confirmada depois da resposta do instrutor.</AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { marginTop: 24, marginBottom: 18, gap: 6 },
  eyebrow: { color: DriveColors.green, fontSize: 10, fontWeight: '700' },
  title: { color: DriveColors.ink, fontSize: 27, lineHeight: 33, fontWeight: '700' },
  subtitle: { color: DriveColors.muted, fontSize: 13, lineHeight: 19 },
  teacherCard: { borderColor: DriveColors.line, borderRadius: 10, backgroundColor: DriveColors.white, marginBottom: 23 },
  teacherContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  teacherCopy: { flex: 1, gap: 4 },
  teacherName: { color: DriveColors.ink, fontSize: 15, fontWeight: '700' },
  teacherDetail: { color: DriveColors.muted, fontSize: 12 },
  priceBlock: { alignItems: 'flex-end', gap: 5 },
  price: { color: DriveColors.green, fontSize: 16, fontWeight: '700' },
  fieldGroup: { gap: 3, marginBottom: 19 },
  notes: { minHeight: 88 },
  submitBlock: { marginTop: 2, marginBottom: 14 },
  helper: { color: DriveColors.muted, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 10 },
  error: { color: DriveColors.danger, fontSize: 12, lineHeight: 17, marginBottom: 10 },
});