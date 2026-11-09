import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, Icon, Text } from '@/components/ui';
import { lessonFocus, statusMeta } from '@/lib/lessons';
import type { Appointment } from '@/types/api';
import { colors, radius, space } from '@/theme/tokens';

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Aula numa lista: bloco de data à esquerda, quem/que/onde no meio, status embaixo. */
export function LessonCard({ lesson, perspective, onPress }: { lesson: Appointment; perspective: 'student' | 'teacher' | 'admin'; onPress: () => void }) {
  const [, month, day] = lesson.lessonDate.split('-').map(Number);
  const meta = statusMeta[lesson.status];
  const person = perspective === 'student' ? lesson.teacherName : perspective === 'teacher' ? lesson.studentName : `${lesson.studentName.split(' ')[0]} com ${lesson.teacherName.split(' ')[0]}`;
  const muted = lesson.status === 'declined' || lesson.status === 'cancelled';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${lesson.date}, ${lesson.time}. ${person}. ${meta.label}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, muted && styles.muted]}>
      <View style={[styles.date, lesson.status === 'in-progress' && styles.dateLive]}>
        <Text variant="title2" style={styles.dateDay}>{day}</Text>
        <Text variant="caption" tone="muted">{MONTHS[month - 1]}</Text>
      </View>
      <View style={styles.body}>
        <Text variant="bodyStrong" numberOfLines={1}>{person}</Text>
        <Text variant="footnote" tone="muted" numberOfLines={1}>{lesson.date.split(',')[0]} · {lesson.time} · {lessonFocus(lesson.lesson)}</Text>
        <View style={styles.footer}>
          <Badge label={meta.label} tone={meta.tone} />
          {lesson.status === 'scheduled' && perspective !== 'admin' && !(perspective === 'student' ? lesson.studentConfirmed : lesson.teacherConfirmed) && (
            <Text variant="caption" tone="warning">Confirme presença</Text>
          )}
        </View>
      </View>
      <Icon name="chevron-right" color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line },
  pressed: { backgroundColor: '#FAFBF8' },
  muted: { opacity: 0.7 },
  date: { width: 56, height: 64, borderRadius: radius.md, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  dateLive: { backgroundColor: colors.accent },
  dateDay: { lineHeight: 24 },
  body: { flex: 1, minWidth: 0, gap: 3 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 2 },
});
