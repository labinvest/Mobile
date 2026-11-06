import { StyleSheet, View } from 'react-native';

import { Avatar, Badge, Button, Icon, Text } from '@/components/ui';
import { lessonFocus, statusMeta } from '@/lib/lessons';
import type { Appointment } from '@/types/api';
import { colors, radius, space } from '@/theme/tokens';

/** Destaque da Home: a próxima aula (ou o convite para marcar a primeira). */
export function NextLessonCard({ lesson, onOpen, onFindInstructor }: { lesson?: Appointment; onOpen: (lesson: Appointment) => void; onFindInstructor: () => void }) {
  if (!lesson) {
    return (
      <View style={styles.card}>
        <View style={styles.emptyIcon}><Icon name="steering" size={28} color={colors.accentInk} /></View>
        <Text variant="title2" tone="inverse">Sua próxima aula começa aqui</Text>
        <Text variant="callout" tone="inverseMuted">Compare instrutores da sua região, veja avaliações e peça um horário.</Text>
        <Button label="Encontrar instrutor" variant="accent" trailingIcon="arrow-right" onPress={onFindInstructor} style={styles.cta} />
      </View>
    );
  }

  const meta = statusMeta[lesson.status];
  const needsMyConfirmation = lesson.status === 'scheduled' && !lesson.studentConfirmed;
  const headline = lesson.status === 'requested' ? `Aguardando ${lesson.teacherName.split(' ')[0]} responder` : lesson.status === 'in-progress' ? 'Aula em andamento' : 'Próxima aula';
  const action = lesson.status === 'in-progress' ? 'Abrir aula' : needsMyConfirmation ? 'Confirmar presença' : 'Ver detalhes';

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text variant="overline" tone="inverseMuted" style={styles.flex}>{headline}</Text>
        <Badge label={meta.label} tone={lesson.status === 'requested' ? 'warning' : lesson.status === 'in-progress' ? 'accent' : 'inverse'} />
      </View>

      <View>
        <Text variant="display" tone="inverse">{lesson.date}</Text>
        <Text variant="title2" style={styles.time}>{lesson.time}</Text>
      </View>

      <View style={styles.teacher}>
        <Avatar initials={lesson.teacherName.split(' ').slice(0, 2).map((part) => part[0]).join('')} seed={lesson.teacherId} size={40} />
        <View style={styles.flex}>
          <Text variant="bodyStrong" tone="inverse" numberOfLines={1}>{lesson.teacherName}</Text>
          <Text variant="footnote" tone="inverseMuted" numberOfLines={1}>{lessonFocus(lesson.lesson)} · {lesson.vehicle}</Text>
        </View>
      </View>

      <View style={styles.meeting}>
        <Icon name="map-marker-outline" size={18} color={colors.onAsphaltMuted} />
        <Text variant="footnote" tone="inverseMuted" numberOfLines={2} style={styles.flex}>{lesson.meetingPoint || 'Local de encontro a combinar'}</Text>
      </View>

      <Button label={action} variant={needsMyConfirmation || lesson.status === 'in-progress' ? 'accent' : 'inverse'} trailingIcon="arrow-right" onPress={() => onOpen(lesson)} style={styles.cta} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  card: { backgroundColor: colors.asphalt, borderRadius: radius.xl, padding: space.xl, gap: space.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  time: { color: colors.accent, marginTop: space.xxs },
  teacher: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  meeting: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  emptyIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  cta: { marginTop: space.xs },
});
