import { StyleSheet, View } from 'react-native';

import { Icon, ProgressRing, Surface, Text, type IconName } from '@/components/ui';
import { CNH_DISCLAIMER, CNH_STEPS } from '@/content/cnh-process';
import { colors, space } from '@/theme/tokens';

/** Anel com aulas concluídas x meta pessoal, e os números que explicam esse avanço. */
export function LearningProgress({ completed, goal, practiceTime, instructors, category }: { completed: number; goal: number; practiceTime: string; instructors: number; category: string }) {
  const progress = goal > 0 ? Math.min(1, completed / goal) : 0;
  const message = completed === 0 ? 'Sua primeira aula concluída aparece aqui.' : completed >= goal ? 'Meta de aulas alcançada. Converse com seu instrutor sobre a prova.' : `Faltam ${goal - completed} aula${goal - completed === 1 ? '' : 's'} para sua meta.`;

  return (
    <Surface style={styles.card}>
      <View style={styles.top}>
        <ProgressRing progress={progress} accessibilityLabel={`${completed} de ${goal} aulas concluídas`}>
          <Text variant="number">{completed}</Text>
          <Text variant="caption" tone="muted">de {goal}</Text>
        </ProgressRing>
        <View style={styles.stats}>
          <Stat icon="timer-outline" value={practiceTime} label="de prática ao volante" />
          <Stat icon="account-tie-outline" value={String(instructors)} label={instructors === 1 ? 'instrutor' : 'instrutores'} />
          <Stat icon="card-account-details-outline" value={`Cat. ${category}`} label="pretendida" />
        </View>
      </View>
      <Text variant="callout" tone="secondary">{message}</Text>
    </Surface>
  );
}

function Stat({ icon, value, label }: { icon: IconName; value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Icon name={icon} size={18} color={colors.brand} />
      <Text variant="bodyStrong">{value} <Text variant="footnote" tone="muted">{label}</Text></Text>
    </View>
  );
}

/** Etapas gerais da habilitação. Só "Aulas práticas" usa dados do app; as demais acontecem fora dele. */
export function CnhJourney({ practiceDone }: { practiceDone: boolean }) {
  return (
    <View>
      {CNH_STEPS.map((step, index) => {
        const current = step.id === 'practice';
        const last = index === CNH_STEPS.length - 1;
        return (
          <View key={step.id} style={styles.step} accessible accessibilityLabel={`${step.title}. ${step.description}${current ? (practiceDone ? ' Concluída no Rota.' : ' Você está nesta etapa no Rota.') : ''}`}>
            <View style={styles.rail}>
              <View style={[styles.dot, current && styles.dotCurrent, current && practiceDone && styles.dotDone]}>
                {current && <Icon name={practiceDone ? 'check' : 'steering'} size={14} color={practiceDone ? colors.onBrand : colors.accentInk} />}
              </View>
              {!last && <View style={styles.line} />}
            </View>
            <View style={[styles.stepCopy, !last && styles.stepGap]}>
              <Text variant={current ? 'bodyStrong' : 'body'} tone={current ? 'default' : 'secondary'}>{step.title}</Text>
              <Text variant="footnote" tone="muted">{step.description}</Text>
            </View>
          </View>
        );
      })}
      <Text variant="footnote" tone="muted" style={styles.disclaimer}>{CNH_DISCLAIMER}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.lg },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.xl },
  stats: { flex: 1, gap: space.md },
  stat: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  step: { flexDirection: 'row', gap: space.md },
  rail: { width: 24, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: colors.lineStrong, backgroundColor: colors.background, marginTop: 5 },
  dotCurrent: { width: 24, height: 24, borderRadius: 12, borderWidth: 0, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginTop: 0 },
  dotDone: { backgroundColor: colors.brand },
  line: { flex: 1, width: 2, backgroundColor: colors.line, marginVertical: space.xs },
  stepCopy: { flex: 1, gap: 2 },
  stepGap: { paddingBottom: space.lg },
  disclaimer: { marginTop: space.lg },
});
