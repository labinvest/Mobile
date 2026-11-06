import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { DateStrip } from '@/components/booking/date-strip';
import { Avatar, BottomBar, Button, Chip, Divider, EmptyState, Icon, Notice, Rating, Screen, Header, Skeleton, Text, TextField } from '@/components/ui';
import { useApiData } from '@/hooks/use-api-data';
import { useDriveApp } from '@/hooks/use-drive-app';
import { errorMessage } from '@/lib/api';
import { upcomingDays } from '@/lib/dates';
import { PERIODS } from '@/lib/availability';
import { haptic } from '@/lib/haptics';
import type { Period, TeacherAvailability } from '@/types/api';
import { colors, space } from '@/theme/tokens';

const FOCUS = ['Primeira aula', 'Trânsito urbano', 'Estacionamento e baliza', 'Ladeiras e arrancadas', 'Preparação para a prova'];

const BOOKING_DAYS = 14;

export default function BookingScreen() {
  const params = useLocalSearchParams<{ teacherId?: string; teacherName?: string; initials?: string; vehicle?: string; area?: string; price?: string; rating?: string; reviewCount?: string }>();
  const { requestLesson } = useDriveApp();
  const [days] = useState(() => upcomingDays(BOOKING_DAYS));
  const availability = useApiData<TeacherAvailability>(params.teacherId ? `/teachers/${params.teacherId}/availability` : null);
  // null até a pessoa escolher; enquanto isso, usa o primeiro dia (a partir de amanhã) com horário livre.
  const [pickedDate, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<Period | null>(null);
  const [focus, setFocus] = useState(FOCUS[0]);
  const [meetingPoint, setMeetingPoint] = useState('');
  const [notes, setNotes] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!params.teacherId) {
    return (
      <Screen header={<Header title="Agendar aula" />}>
        <EmptyState icon="account-search-outline" title="Escolha um instrutor primeiro" message="O agendamento começa pelo perfil de um instrutor." actionLabel="Explorar instrutores" onAction={() => router.replace('/(tabs)/teachers')} />
      </Screen>
    );
  }

  const periodsByDay = new Map(availability.data?.days.map((day) => [day.date, day.periods]) ?? []);
  const freeOn = (iso: string) => (periodsByDay.get(iso) ?? []).filter((period) => period.available);
  const date = pickedDate ?? days.slice(1).find((day) => freeOn(day.value).length > 0)?.value ?? days[1].value;
  const selectedDay = days.find((day) => day.value === date)!;
  const dayPeriods = periodsByDay.get(date) ?? [];
  const meetingError = meetingPoint.trim().length < 5 ? 'Informe um endereço ou ponto de referência.' : '';
  const timeError = time ? '' : 'Escolha um período.';

  async function submit() {
    setShowErrors(true);
    if (meetingError || timeError || !time) {
      haptic.error();
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const appointment = await requestLesson({
        teacherId: Number(params.teacherId),
        date,
        time,
        lesson: `Aula prática · ${focus}`,
        meetingPoint: meetingPoint.trim(),
        notes: notes.trim(),
      });
      haptic.success();
      router.replace({ pathname: '/lesson', params: { id: String(appointment.id) } });
    } catch (caught) {
      haptic.error();
      setError(errorMessage(caught));
      setSubmitting(false);
    }
  }

  return (
    <Screen
      header={<Header title="Agendar aula" />}
      footer={
        <BottomBar>
          <View style={styles.summary}>
            <View style={styles.flex}>
              <Text variant="bodyStrong" numberOfLines={1}>{selectedDay.weekday}, {selectedDay.day} {selectedDay.month}</Text>
              <Text variant="footnote" tone="muted">{time ?? 'Escolha um período'}</Text>
            </View>
            <View style={styles.price}>
              <Text variant="title2">{params.price || '—'}</Text>
              <Text variant="footnote" tone="muted">por aula</Text>
            </View>
          </View>
          <Button label="Enviar pedido" size="lg" icon="send-outline" loading={submitting} onPress={submit} fullWidth />
        </BottomBar>
      }>
      <View style={styles.teacher}>
        <Avatar initials={params.initials || '?'} seed={Number(params.teacherId)} size={56} />
        <View style={styles.flex}>
          <Text variant="title2" numberOfLines={1}>{params.teacherName}</Text>
          <Rating value={params.rating || null} count={Number(params.reviewCount ?? 0)} />
          <View style={styles.meta}>
            <Icon name="car-outline" size={16} color={colors.muted} />
            <Text variant="footnote" tone="muted" numberOfLines={1} style={styles.flex}>{params.vehicle || 'Veículo a confirmar'}</Text>
          </View>
          <View style={styles.meta}>
            <Icon name="map-marker-outline" size={16} color={colors.muted} />
            <Text variant="footnote" tone="muted" numberOfLines={1} style={styles.flex}>{params.area}</Text>
          </View>
        </View>
      </View>

      <Divider />

      <Section title="Qual dia?">
        <DateStrip
          days={days}
          value={date}
          isDisabled={(iso) => !!availability.data && freeOn(iso).length === 0}
          onChange={(iso) => {
            setDate(iso);
            if (time && !freeOn(iso).some((period) => period.period === time)) setTime(null);
          }}
        />
      </Section>

      <Section title="Qual período?" error={showErrors ? timeError : ''}>
        {availability.error ? (
          <Notice tone="danger" message={availability.error} actionLabel="Tentar de novo" onAction={availability.reload} />
        ) : !availability.data ? (
          <View style={styles.periods}><Skeleton width={130} height={44} rounded={22} /><Skeleton width={130} height={44} rounded={22} /><Skeleton width={130} height={44} rounded={22} /></View>
        ) : dayPeriods.length === 0 ? (
          <Text variant="callout" tone="muted">O instrutor não atende neste dia. Escolha outra data.</Text>
        ) : (
          <View style={styles.periods} accessibilityRole="radiogroup">
            {PERIODS.filter((option) => dayPeriods.some((period) => period.period === option.value)).map((option) => {
              const free = dayPeriods.find((period) => period.period === option.value)?.available ?? false;
              return <Chip key={option.value} label={free ? option.value : `${option.value} · ocupado`} icon={option.icon} disabled={!free} selected={time === option.value} onPress={() => setTime(option.value)} />;
            })}
          </View>
        )}
        <Text variant="footnote" tone="muted">
          {availability.data && !availability.data.configured ? 'Este instrutor ainda não publicou a agenda; ele confirma o horário ao aceitar.' : 'O instrutor confirma o horário ao aceitar o pedido.'}
        </Text>
      </Section>

      <Section title="O que você quer praticar?">
        <View style={styles.periods} accessibilityRole="radiogroup">
          {FOCUS.map((item) => <Chip key={item} label={item} selected={focus === item} onPress={() => setFocus(item)} />)}
        </View>
      </Section>

      <Section title="Onde encontrar o instrutor?">
        <View style={styles.fields}>
          <TextField
            label="Local de encontro"
            icon="map-marker-outline"
            placeholder="Rua, número ou ponto de referência"
            value={meetingPoint}
            onChangeText={setMeetingPoint}
            error={showErrors ? meetingError : ''}
            autoComplete="street-address"
            textContentType="fullStreetAddress"
            returnKeyType="next"
            maxLength={200}
          />
          <TextField
            label="Recado para o instrutor (opcional)"
            icon="message-text-outline"
            placeholder="Ex.: é minha primeira vez dirigindo"
            value={notes}
            onChangeText={setNotes}
            multiline
            maxLength={500}
          />
        </View>
      </Section>

      <Notice tone="info" message="Enviar o pedido não gera cobrança. Valor e forma de pagamento são combinados com o instrutor." style={styles.notice} />
      {!!error && <Notice tone="danger" title="Não foi possível enviar" message={error} style={styles.notice} />}
    </Screen>
  );
}

function Section({ title, error, children }: { title: string; error?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionTitle}>
        <Text variant="headline" accessibilityRole="header">{title}</Text>
        {!!error && <Text variant="footnote" tone="danger" accessibilityLiveRegion="polite">{error}</Text>}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  teacher: { flexDirection: 'row', gap: space.lg, alignItems: 'center', paddingTop: space.sm, paddingBottom: space.xl },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: 2 },
  section: { marginTop: space.xxl, gap: space.md },
  sectionTitle: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: space.sm },
  periods: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  fields: { gap: space.xs },
  notice: { marginTop: space.lg },
  summary: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.md },
  price: { alignItems: 'flex-end', paddingLeft: space.md, borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.lineStrong },
});
