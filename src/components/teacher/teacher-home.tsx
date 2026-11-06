import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { NotificationBell } from '@/components/notification-bell';
import { Avatar, Badge, Button, Icon, IconTile, ListRow, Notice, ProgressBar, Screen, SectionHeader, Surface, Text, type IconName } from '@/components/ui';
import { useApiData } from '@/hooks/use-api-data';
import { useDriveApp } from '@/hooks/use-drive-app';
import { formatLongDate, todayIso } from '@/lib/dates';
import { firstName, formatCents, greeting, initialsOf, isOpen, lessonFocus, monthTotals, statusMeta } from '@/lib/lessons';
import { openInstructor, openLesson } from '@/lib/navigation';
import type { TeacherStudent } from '@/types/api';
import { colors, radius, space } from '@/theme/tokens';

/** Painel do instrutor: o que precisa de ação agora, a próxima aula e como vai o mês. */
export function TeacherHome() {
  const { user, appointments, refreshAppointments, refreshAccount } = useDriveApp();
  const students = useApiData<{ students: TeacherStudent[] }>('/teachers/me/students');
  const [refreshing, setRefreshing] = useState(false);
  const teacher = user?.teacher;

  const mine = appointments.filter((appointment) => appointment.teacherId === user?.id);
  const requests = mine.filter((appointment) => appointment.status === 'requested');
  const today = todayIso();
  // Próxima aula confirmada (ou em andamento), da mais próxima para a mais distante.
  const next = mine
    .filter((appointment) => (appointment.status === 'scheduled' || appointment.status === 'in-progress') && appointment.lessonDate >= today)
    .sort((a, b) => (a.status === 'in-progress' ? -1 : 0) - (b.status === 'in-progress' ? -1 : 0) || a.lessonDate.localeCompare(b.lessonDate) || a.time.localeCompare(b.time))[0];
  const month = monthTotals(mine);
  const upcomingCount = mine.filter(isOpen).filter((appointment) => appointment.status !== 'requested').length;

  async function refresh() {
    setRefreshing(true);
    await Promise.allSettled([refreshAppointments(), refreshAccount(), students.reload()]);
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

      {teacher?.approvalStatus === 'pending' && <Notice tone="warning" title="Cadastro em análise" message="Seu perfil aparece para os alunos assim que a equipe aprovar seus dados e o veículo. Enquanto isso, deixe valor e horários prontos." actionLabel="Definir horários" onAction={() => router.push('/teaching-profile')} style={styles.notice} />}
      {teacher?.approvalStatus === 'rejected' && <Notice tone="danger" title="Cadastro não aprovado" message="Revise seus dados com a equipe Rota para voltar a aparecer nas buscas." style={styles.notice} />}

      {requests.length > 0 && (
        <Surface onPress={() => router.navigate('/(tabs)/schedule')} accessibilityLabel={`${requests.length} pedidos aguardando resposta`} style={styles.requests}>
          <View style={styles.requestsIcon}><Text variant="title2" style={{ color: colors.accentInk }}>{requests.length}</Text></View>
          <View style={styles.flex}>
            <Text variant="bodyStrong">Pedido{requests.length === 1 ? '' : 's'} aguardando resposta</Text>
            <Text variant="footnote" tone="muted">Mais antigo: {requests[requests.length - 1].studentName.split(' ')[0]} · {requests[requests.length - 1].date}</Text>
          </View>
          <Icon name="chevron-right" color={colors.muted} />
        </Surface>
      )}

      <View style={styles.hero}>
        {next ? (
          <>
            <View style={styles.heroTop}>
              <Text variant="overline" tone="inverseMuted" style={styles.flex}>{next.status === 'in-progress' ? 'Aula em andamento' : next.lessonDate === today ? 'Próxima aula · hoje' : 'Próxima aula'}</Text>
              <Badge label={statusMeta[next.status].label} tone={next.status === 'in-progress' ? 'accent' : 'inverse'} />
            </View>
            <View>
              <Text variant="display" tone="inverse">{next.date}</Text>
              <Text variant="title2" style={styles.time}>{next.time}</Text>
            </View>
            <View style={styles.person}>
              <Avatar initials={initialsOf(next.studentName)} seed={next.studentId} size={40} />
              <View style={styles.flex}>
                <Text variant="bodyStrong" tone="inverse">{next.studentName}</Text>
                <Text variant="footnote" tone="inverseMuted" numberOfLines={1}>{lessonFocus(next.lesson)} · {next.meetingPoint || 'local a combinar'}</Text>
              </View>
            </View>
            <Button label={next.status === 'in-progress' ? 'Abrir aula' : next.teacherConfirmed ? 'Ver detalhes' : 'Confirmar presença'} variant={next.status === 'in-progress' || !next.teacherConfirmed ? 'accent' : 'inverse'} trailingIcon="arrow-right" onPress={() => openLesson(next)} />
          </>
        ) : (
          <>
            <View style={styles.emptyIcon}><Icon name="calendar-blank-outline" size={26} color={colors.accentInk} /></View>
            <Text variant="title2" tone="inverse">Nenhuma aula confirmada</Text>
            <Text variant="callout" tone="inverseMuted">{teacher?.weeklySlots.length ? 'Seus horários estão publicados. Os pedidos chegam aqui.' : 'Publique seus horários para os alunos saberem quando você atende.'}</Text>
            <Button label={teacher?.weeklySlots.length ? 'Ajustar horários' : 'Publicar horários'} variant="accent" trailingIcon="arrow-right" onPress={() => router.push('/teaching-profile')} />
          </>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Este mês" />
        <Surface style={styles.stats}>
          <Stat icon="cash-multiple" value={formatCents(month.cents)} label="em aulas concluídas" />
          <View style={styles.statDivider} />
          <Stat icon="steering" value={String(month.lessons)} label={month.lessons === 1 ? 'aula dada' : 'aulas dadas'} />
          <View style={styles.statDivider} />
          <Stat icon="star" iconColor={colors.star} value={teacher?.rating ?? '–'} label={teacher?.reviewCount ? `${teacher.reviewCount} avaliações` : 'sem notas'} />
        </Surface>
        <Text variant="footnote" tone="muted" style={styles.caption}>Valores combinados com os alunos; o pagamento acontece fora do app. {upcomingCount > 0 ? `${upcomingCount} aula${upcomingCount === 1 ? '' : 's'} confirmada${upcomingCount === 1 ? '' : 's'} pela frente.` : ''}</Text>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Seus alunos" actionLabel={(students.data?.students.length ?? 0) > 3 ? 'Ver todos' : undefined} onAction={() => router.navigate('/(tabs)/teachers')} />
        {students.error ? (
          <Notice tone="danger" message={students.error} actionLabel="Tentar de novo" onAction={students.reload} />
        ) : !students.data?.students.length ? (
          <Text variant="callout" tone="muted">{students.data ? 'Seus alunos aparecem aqui depois do primeiro pedido.' : 'Carregando…'}</Text>
        ) : (
          <Surface padded={false} style={styles.list}>
            {students.data.students.slice(0, 3).map((student, index, list) => (
              <View key={student.id} style={[styles.studentRow, index < list.length - 1 && styles.rowDivider]}>
                <Avatar initials={student.initials} seed={student.id} size={40} />
                <View style={styles.flex}>
                  <Text variant="bodyStrong" numberOfLines={1}>{student.name}</Text>
                  <ProgressBar value={student.progress / 100} label={`${student.name}: ${student.progress}% da meta`} />
                  <Text variant="footnote" tone="muted">{student.lessonsWithMe} aula{student.lessonsWithMe === 1 ? '' : 's'} com você · {student.progress}% da meta</Text>
                </View>
              </View>
            ))}
          </Surface>
        )}
      </View>

      <View style={styles.section}>
        <Surface padded={false} style={styles.list}>
          <ListRow title="Horários e valor" subtitle={teacher ? `${teacher.weeklySlots.length} períodos por semana · ${teacher.price}` : undefined} leading={<IconTile icon="calendar-clock" />} onPress={() => router.push('/teaching-profile')} divider={teacher?.approvalStatus === 'approved'} />
          {teacher?.approvalStatus === 'approved' && user && (
            <ListRow title="Meu perfil público" subtitle="Como os alunos veem você" leading={<IconTile icon="account-eye-outline" />} onPress={() => openInstructor(user)} divider={false} />
          )}
        </Surface>
      </View>
    </Screen>
  );
}

function Stat({ icon, iconColor = colors.brand, value, label }: { icon: IconName; iconColor?: string; value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Icon name={icon} size={20} color={iconColor} />
      <Text variant="headline" numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text variant="footnote" tone="muted" align="center">{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingTop: space.lg, paddingBottom: space.xl },
  notice: { marginBottom: space.lg },
  requests: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.lg },
  requestsIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  hero: { backgroundColor: colors.asphalt, borderRadius: radius.xl, padding: space.xl, gap: space.lg },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  time: { color: colors.accent, marginTop: space.xxs },
  person: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  emptyIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  section: { marginTop: space.xxxl },
  stats: { flexDirection: 'row', alignItems: 'stretch' },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.lineStrong },
  caption: { marginTop: space.sm },
  list: { paddingHorizontal: space.lg },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.lineStrong },
});
