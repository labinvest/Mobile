import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/components/brand';
import { Button, Icon, Text, type IconName } from '@/components/ui';
import { colors, gutter, radius, space } from '@/theme/tokens';

const VALUES: { icon: IconName; title: string; text: string }[] = [
  { icon: 'account-search-outline', title: 'Instrutores perto de você', text: 'Compare avaliações, carro e valor antes de escolher.' },
  { icon: 'calendar-check-outline', title: 'Horários de verdade', text: 'Veja a agenda do instrutor e peça a aula em poucos toques.' },
  { icon: 'chart-donut', title: 'Sua evolução registrada', text: 'Cada aula concluída conta no seu progresso.' },
];

/** Primeira tela sem sessão: o que é o Rota e os dois caminhos (criar conta / entrar). */
export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <Brand inverse />

        <View style={styles.hero}>
          <View style={styles.road} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {[0, 1, 2, 3, 4].map((dash) => <View key={dash} style={styles.dash} />)}
          </View>
          <Text variant="display" tone="inverse" accessibilityRole="header">Aprenda a dirigir com quem ensina de verdade.</Text>
          <Text variant="body" tone="inverseMuted">O Rota conecta quem está tirando a CNH a instrutores autônomos aprovados pela nossa equipe.</Text>
        </View>

        <View style={styles.values}>
          {VALUES.map((value) => (
            <View key={value.title} style={styles.value}>
              <View style={styles.valueIcon}><Icon name={value.icon} size={22} color={colors.accent} /></View>
              <View style={styles.flex}>
                <Text variant="bodyStrong" tone="inverse">{value.title}</Text>
                <Text variant="footnote" tone="inverseMuted">{value.text}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <Button label="Criar conta" variant="accent" size="lg" trailingIcon="arrow-right" onPress={() => router.push('/register')} fullWidth />
          <Button label="Já tenho conta" variant="inverse" size="lg" onPress={() => router.push('/login')} fullWidth />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.asphalt },
  content: { flex: 1, paddingHorizontal: gutter, paddingTop: space.lg, paddingBottom: space.lg, gap: space.xxl },
  hero: { flex: 1, justifyContent: 'flex-end', gap: space.md },
  road: { flexDirection: 'row', gap: space.sm, marginBottom: space.sm },
  dash: { width: 28, height: 4, borderRadius: 2, backgroundColor: colors.accent },
  values: { gap: space.lg },
  value: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  valueIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.asphaltRaised, alignItems: 'center', justifyContent: 'center' },
  actions: { gap: space.md },
});
