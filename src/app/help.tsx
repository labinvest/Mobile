import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { CnhJourney } from '@/components/student/learning-progress';
import { Button, Header, Icon, Screen, SectionHeader, Surface, Text } from '@/components/ui';
import { CNH_CONTENT_REVIEWED_AT, CNH_OFFICIAL_SOURCE } from '@/content/cnh-process';
import { useDriveApp } from '@/hooks/use-drive-app';
import { colors, space } from '@/theme/tokens';

const HOW_IT_WORKS = {
  student: ['Escolha um instrutor em Explorar e veja avaliações, carro e horários.', 'Peça a aula num período livre. O instrutor aceita ou recusa.', 'No dia, os dois confirmam presença no app e a aula começa.', 'Depois da aula, vocês avaliam um ao outro.'],
  teacher: ['Publique valor e horários da semana em Agenda > Horários e valor.', 'Responda os pedidos: ao aceitar, o horário fica reservado.', 'No dia, os dois confirmam presença e você inicia a aula.', 'Finalize ao terminar: a duração fica registrada para o aluno.'],
};

// Respostas descrevem só o que o app faz hoje.
const FAQ = [
  { q: 'Como pago a aula?', a: 'O Rota não processa pagamentos. O valor aparece no perfil do instrutor e a forma de pagamento é combinada diretamente com ele.' },
  { q: 'Posso cancelar ou remarcar pelo app?', a: 'Ainda não. Enquanto o pedido não for aceito, o instrutor pode recusá-lo. Depois de aceito, combine qualquer mudança diretamente com a outra pessoa.' },
  { q: 'Como os instrutores são aprovados?', a: 'A equipe Rota confere a CNH (categoria e validade), o tempo de experiência e o veículo, que precisa ter duplo comando. Só depois disso o perfil aparece nas buscas.' },
  { q: 'Por que confirmar presença?', a: 'A aula só pode começar quando aluno e instrutor confirmam, cada um no próprio celular. Isso registra que os dois estavam no encontro.' },
  { q: 'Como meus dados são protegidos?', a: 'Sua senha é guardada de forma criptografada e a sessão fica no armazenamento seguro do celular. O CPF serve apenas para identificar sua conta.' },
];

export default function HelpScreen() {
  const { role } = useDriveApp();
  const [open, setOpen] = useState<number | null>(0);
  const steps = HOW_IT_WORKS[role === 'teacher' ? 'teacher' : 'student'];

  return (
    <Screen header={<Header title="Central de ajuda" />}>
      <View style={styles.section}>
        <SectionHeader title="Como funciona" />
        <Surface style={styles.steps}>
          {steps.map((step, index) => (
            <View key={step} style={styles.step}>
              <View style={styles.number}><Text variant="caption" tone="brand">{index + 1}</Text></View>
              <Text variant="callout" tone="secondary" style={styles.flex}>{step}</Text>
            </View>
          ))}
        </Surface>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Etapas da habilitação" />
        <Surface>
          <CnhJourney practiceDone={false} />
          <Button label="Ver fonte oficial" variant="ghost" trailingIcon="open-in-new" onPress={() => Linking.openURL(CNH_OFFICIAL_SOURCE)} style={styles.source} />
          <Text variant="caption" tone="muted">Conteúdo revisado em {CNH_CONTENT_REVIEWED_AT.split('-').reverse().join('/')}.</Text>
        </Surface>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Perguntas frequentes" />
        <Surface padded={false} style={styles.faq}>
          {FAQ.map((item, index) => {
            const expanded = open === index;
            return (
              <View key={item.q} style={[styles.faqItem, index < FAQ.length - 1 && styles.divider]}>
                <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setOpen(expanded ? null : index)} style={styles.faqQuestion}>
                  <Text variant="bodyStrong" style={styles.flex}>{item.q}</Text>
                  <Icon name={expanded ? 'chevron-up' : 'chevron-down'} color={colors.muted} />
                </Pressable>
                {expanded && <Text variant="callout" tone="secondary" style={styles.answer}>{item.a}</Text>}
              </View>
            );
          })}
        </Surface>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  section: { marginTop: space.xl },
  steps: { gap: space.md },
  step: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  number: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  source: { alignSelf: 'flex-start', paddingHorizontal: 0, marginTop: space.sm },
  faq: { paddingHorizontal: space.lg },
  faqItem: { paddingVertical: space.xs },
  faqQuestion: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: space.md },
  answer: { paddingBottom: space.md },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.lineStrong },
});
