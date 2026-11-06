import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { WeeklySchedule } from '@/components/instructor/weekly-schedule';
import { Avatar, Badge, BottomBar, Button, EmptyState, Header, Icon, Notice, Screen, SectionHeader, Skeleton, Surface, Text, type IconName } from '@/components/ui';
import { useApiData } from '@/hooks/use-api-data';
import { useDriveApp } from '@/hooks/use-drive-app';
import { timeAgo } from '@/lib/dates';
import { isOpen, statusMeta } from '@/lib/lessons';
import { openBooking, openLesson } from '@/lib/navigation';
import type { TeacherProfile } from '@/types/api';
import { colors, radius, space } from '@/theme/tokens';

export default function InstructorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appointments } = useDriveApp();
  const { data, error, reload } = useApiData<TeacherProfile>(`/teachers/${id}`);

  if (error) {
    return (
      <Screen header={<Header title="Instrutor" />}>
        <Notice tone="danger" title="Não foi possível abrir o perfil" message={error} actionLabel="Tentar de novo" onAction={reload} />
      </Screen>
    );
  }
  if (!data) return <ProfileSkeleton />;

  const { teacher, weeklySlots, completedLessons, reviews } = data;
  const openLessonWith = appointments.find((appointment) => appointment.teacherId === teacher.id && isOpen(appointment));

  return (
    <Screen
      header={<Header title="" />}
      footer={
        <BottomBar>
          <View style={styles.footer}>
            <View>
              <Text variant="title2">{teacher.price}</Text>
              <Text variant="footnote" tone="muted">por aula</Text>
            </View>
            {openLessonWith ? (
              <Button label={statusMeta[openLessonWith.status].label} variant="secondary" trailingIcon="arrow-right" onPress={() => openLesson(openLessonWith)} style={styles.flex} />
            ) : (
              <Button label="Ver horários" icon="calendar-blank-outline" onPress={() => openBooking(teacher)} style={styles.flex} />
            )}
          </View>
        </BottomBar>
      }>
      <View style={styles.identity}>
        <Avatar initials={teacher.initials} seed={teacher.id} size={88} />
        <Text variant="title1" align="center" accessibilityRole="header">{teacher.name}</Text>
        <View style={styles.inline}>
          <Icon name="map-marker-outline" size={16} color={colors.muted} />
          <Text variant="callout" tone="muted">{teacher.area}</Text>
        </View>
        <View style={styles.badges}>
          <Badge label={`Categoria ${teacher.cnhCategory}`} tone="brand" icon="card-account-details-outline" />
          <Badge label="Aprovado pela equipe Rota" tone="success" icon="shield-check-outline" />
        </View>
      </View>

      <View style={styles.stats}>
        <Stat icon="star" iconColor={colors.star} value={teacher.rating ?? 'Novo'} label={teacher.reviewCount ? `${teacher.reviewCount} avaliações` : 'sem avaliações'} />
        <View style={styles.statDivider} />
        <Stat icon="steering" value={String(completedLessons)} label={completedLessons === 1 ? 'aula dada' : 'aulas dadas'} />
        <View style={styles.statDivider} />
        <Stat icon="medal-outline" value={teacher.experience} label="de experiência" />
      </View>

      {teacher.tags.length > 0 && (
        <View style={styles.tags}>{teacher.tags.map((tag) => <Badge key={tag} label={tag} />)}</View>
      )}

      <View style={styles.section}>
        <SectionHeader title="Veículo da aula" />
        <Surface style={styles.vehicle}>
          <View style={styles.vehicleIcon}><Icon name="car-side" size={26} color={colors.brand} /></View>
          <View style={styles.flex}>
            <Text variant="bodyStrong">{teacher.vehicle?.label ?? 'Veículo a confirmar'}</Text>
            {teacher.vehicle?.dualControl && <Text variant="footnote" tone="muted">Com duplo comando (freio do instrutor)</Text>}
          </View>
        </Surface>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Horários de atendimento" />
        <Surface><WeeklySchedule slots={weeklySlots} /></Surface>
      </View>

      <View style={styles.section}>
        <SectionHeader title="O que os alunos dizem" />
        {reviews.length === 0 ? (
          <Surface><EmptyState compact icon="star-outline" title="Ainda sem avaliações" message="As avaliações aparecem depois das primeiras aulas concluídas." /></Surface>
        ) : (
          reviews.map((review) => (
            <View key={review.id} style={styles.review}>
              <View style={styles.reviewTop}>
                <Avatar initials={review.authorInitials} seed={review.authorName} size={36} />
                <View style={styles.flex}>
                  <Text variant="bodyStrong">{review.authorName.split(' ')[0]}</Text>
                  <Text variant="footnote" tone="muted">{timeAgo(review.submittedAt)}</Text>
                </View>
                <Stars value={review.rating} />
              </View>
              {!!review.comment && <Text variant="callout" tone="secondary">{review.comment}</Text>}
            </View>
          ))
        )}
      </View>
    </Screen>
  );
}

function Stat({ icon, iconColor = colors.brand, value, label }: { icon: IconName; iconColor?: string; value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <View style={styles.inline}><Icon name={icon} size={18} color={iconColor} /><Text variant="headline">{value}</Text></View>
      <Text variant="footnote" tone="muted" align="center">{label}</Text>
    </View>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <View style={styles.inline} accessibilityLabel={`${value} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((star) => <Icon key={star} name={star <= value ? 'star' : 'star-outline'} size={14} color={colors.star} />)}
    </View>
  );
}

function ProfileSkeleton() {
  return (
    <Screen header={<Header title="" />}>
      <View style={styles.identity}>
        <Skeleton width={88} height={88} rounded={44} />
        <Skeleton width="60%" height={26} />
        <Skeleton width="40%" />
      </View>
      <Skeleton height={72} rounded={radius.lg} />
      <Skeleton height={140} rounded={radius.lg} style={{ marginTop: space.xxl }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  identity: { alignItems: 'center', gap: space.sm, paddingBottom: space.xl },
  badges: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.sm, marginTop: space.xs },
  stats: { flexDirection: 'row', alignItems: 'center', paddingVertical: space.lg, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.lineStrong },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: colors.lineStrong },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.lg },
  section: { marginTop: space.xxxl },
  vehicle: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  vehicleIcon: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  review: { gap: space.sm, paddingVertical: space.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.lineStrong },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  footer: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
});
