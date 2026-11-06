import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Button, Icon, Notice, Surface, Text, TextField } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import type { LessonReview } from '@/types/api';
import { colors, space } from '@/theme/tokens';

const LABELS = ['', 'Ruim', 'Regular', 'Boa', 'Muito boa', 'Excelente'];

/** Avaliação mútua depois da aula: o formulário de quem ainda não avaliou e a nota da outra parte. */
export function LessonReviewSection({ targetName, mine, theirs, onSubmit }: {
  targetName: string;
  mine?: LessonReview;
  theirs?: LessonReview;
  onSubmit: (rating: number, comment: string) => Promise<unknown>;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function send() {
    setError('');
    setSending(true);
    try {
      await onSubmit(rating, comment.trim());
      haptic.success();
    } catch (caught) {
      haptic.error();
      setError(errorMessage(caught));
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={styles.wrap}>
      {mine ? (
        <ReviewQuote title="Sua avaliação" review={mine} />
      ) : (
        <Surface style={styles.form}>
          <Text variant="headline">Como foi a aula com {targetName.split(' ')[0]}?</Text>
          <View style={styles.stars} accessibilityRole="radiogroup" accessibilityLabel="Nota de 1 a 5">
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable
                key={value}
                accessibilityRole="radio"
                accessibilityLabel={`${value} estrela${value === 1 ? '' : 's'}, ${LABELS[value]}`}
                accessibilityState={{ checked: rating === value }}
                hitSlop={4}
                onPress={() => {
                  haptic.selection();
                  setRating(value);
                }}
                style={styles.star}>
                <Icon name={value <= rating ? 'star' : 'star-outline'} size={36} color={value <= rating ? colors.star : colors.lineStrong} />
              </Pressable>
            ))}
          </View>
          <Text variant="callout" tone={rating ? 'default' : 'muted'} align="center">{rating ? LABELS[rating] : 'Toque para dar a nota'}</Text>
          <TextField label="Comentário (opcional)" placeholder="O que foi bom? O que pode melhorar?" value={comment} onChangeText={setComment} multiline maxLength={500} />
          {!!error && <Notice tone="danger" message={error} />}
          <Button label="Enviar avaliação" onPress={send} disabled={rating === 0} loading={sending} fullWidth />
        </Surface>
      )}
      {theirs ? (
        <ReviewQuote title={`${theirs.authorName.split(' ')[0]} avaliou você`} review={theirs} />
      ) : (
        <Text variant="footnote" tone="muted">A avaliação de {targetName.split(' ')[0]} aparece aqui quando for enviada.</Text>
      )}
    </View>
  );
}

function ReviewQuote({ title, review }: { title: string; review: LessonReview }) {
  return (
    <View style={styles.quote}>
      <Avatar initials={review.authorName.split(' ').slice(0, 2).map((part) => part[0]).join('')} seed={review.authorName} size={36} />
      <View style={styles.flex}>
        <View style={styles.quoteTop}>
          <Text variant="bodyStrong" style={styles.flex}>{title}</Text>
          <View style={styles.inline} accessibilityLabel={`${review.rating} de 5`}>
            {[1, 2, 3, 4, 5].map((value) => <Icon key={value} name={value <= review.rating ? 'star' : 'star-outline'} size={14} color={colors.star} />)}
          </View>
        </View>
        {!!review.comment && <Text variant="callout" tone="secondary">“{review.comment}”</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  inline: { flexDirection: 'row', gap: 1 },
  wrap: { gap: space.lg },
  form: { gap: space.md },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: space.xs },
  star: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  quote: { flexDirection: 'row', gap: space.md },
  quoteTop: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
