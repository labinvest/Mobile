import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Header, Icon, Screen, Surface, Text, type IconName } from '@/components/ui';
import { colors, radius, space } from '@/theme/tokens';

const PROFILES: { route: '/register/student' | '/register/professional'; icon: IconName; title: string; text: string; points: string[]; dark?: boolean }[] = [
  {
    route: '/register/student',
    icon: 'school-outline',
    title: 'Quero tirar minha CNH',
    text: 'Conta de aluno',
    points: ['Encontre instrutores aprovados', 'Agende nos horários livres', 'Acompanhe sua evolução'],
  },
  {
    route: '/register/professional',
    icon: 'steering',
    title: 'Quero dar aulas',
    text: 'Conta de instrutor autônomo',
    points: ['Receba pedidos de alunos', 'Defina valor e horários', 'Perfil liberado após análise'],
    dark: true,
  },
];

export default function RegisterChoiceScreen() {
  return (
    <Screen header={<Header title="Criar conta" />}>
      <View style={styles.heading}>
        <Text variant="title1" accessibilityRole="header">Como você vai usar o Rota?</Text>
        <Text variant="callout" tone="muted">Cada perfil tem um cadastro e uma experiência própria.</Text>
      </View>
      <View style={styles.list}>
        {PROFILES.map((profile) => (
          <Surface key={profile.route} onPress={() => router.push(profile.route)} accessibilityLabel={`${profile.title}. ${profile.text}`} style={[styles.card, profile.dark && styles.cardDark]}>
            <View style={styles.cardTop}>
              <View style={[styles.icon, profile.dark && styles.iconDark]}><Icon name={profile.icon} size={26} color={profile.dark ? colors.accentInk : colors.brand} /></View>
              <Icon name="arrow-right" color={profile.dark ? colors.onAsphalt : colors.ink} />
            </View>
            <Text variant="caption" tone={profile.dark ? 'inverseMuted' : 'muted'}>{profile.text.toUpperCase()}</Text>
            <Text variant="title2" tone={profile.dark ? 'inverse' : 'default'}>{profile.title}</Text>
            <View style={styles.points}>
              {profile.points.map((point) => (
                <View key={point} style={styles.point}>
                  <Icon name="check" size={16} color={profile.dark ? colors.accent : colors.brand} />
                  <Text variant="footnote" tone={profile.dark ? 'inverseMuted' : 'secondary'}>{point}</Text>
                </View>
              ))}
            </View>
          </Surface>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: space.xs, paddingTop: space.sm, paddingBottom: space.xl },
  list: { gap: space.lg },
  card: { gap: space.xs, padding: space.xl },
  cardDark: { backgroundColor: colors.asphalt, borderColor: colors.asphalt },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: space.md },
  icon: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  iconDark: { backgroundColor: colors.accent },
  points: { gap: space.xs, marginTop: space.sm },
  point: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
