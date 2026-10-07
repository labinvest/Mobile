import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, BackBar, Screen } from '@/components/drive-ui';
import { DriveColors } from '@/constants/drive-theme';

export default function RegisterChoiceScreen() {
  return (
    <Screen>
      <BackBar title="Criar conta" />
      <View style={styles.heading}>
        <AppText style={styles.eyebrow}>BEM-VINDO À ROTA</AppText>
        <AppText style={styles.title}>Como você quer fazer parte?</AppText>
        <AppText style={styles.subtitle}>Escolha seu perfil para começar um cadastro feito para você.</AppText>
      </View>
      <Pressable accessibilityRole="button" onPress={() => router.push('/register/student')} style={styles.choice}>
        <View style={styles.choiceTop}><View style={styles.icon}><AppText style={styles.iconText}>A</AppText></View><View style={styles.roleTag}><AppText style={styles.roleTagText}>ALUNO</AppText></View></View>
        <AppText style={styles.choiceTitle}>Quero tirar minha CNH</AppText>
        <AppText style={styles.choiceText}>Encontre instrutores, agende aulas e acompanhe sua evolução.</AppText>
        <AppText style={styles.arrow}>Continuar  ›</AppText>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.push('/register/professional')} style={[styles.choice, styles.proChoice]}>
        <View style={styles.choiceTop}><View style={[styles.icon, styles.proIcon]}><AppText style={styles.proIconText}>P</AppText></View><View style={[styles.roleTag, styles.roleTagDark]}><AppText style={[styles.roleTagText, styles.roleTagTextDark]}>INSTRUTOR</AppText></View></View>
        <AppText style={styles.choiceTitle}>Quero ensinar a dirigir</AppText>
        <AppText style={styles.choiceText}>Cadastre seu perfil profissional, habilitação e veículo de aula.</AppText>
        <AppText style={[styles.arrow, styles.proArrow]}>Cadastro profissional  ›</AppText>
      </Pressable>
      <AppText style={styles.note}>O cadastro profissional inclui uma etapa de análise dos dados e do veículo.</AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { marginTop: 28, marginBottom: 24, gap: 7 },
  eyebrow: { color: DriveColors.green, fontSize: 11, fontWeight: '700' },
  title: { color: DriveColors.ink, fontSize: 29, lineHeight: 35, fontWeight: '700' },
  subtitle: { color: DriveColors.muted, fontSize: 14, lineHeight: 20 },
  choice: { backgroundColor: DriveColors.white, borderWidth: 1, borderColor: DriveColors.line, borderRadius: 10, padding: 17, marginBottom: 12 },
  proChoice: { backgroundColor: DriveColors.ink, borderColor: DriveColors.ink },
  choiceTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  icon: { width: 36, height: 36, borderRadius: 10, backgroundColor: DriveColors.lime, alignItems: 'center', justifyContent: 'center' },
  iconText: { color: DriveColors.ink, fontSize: 15, fontWeight: '700' },
  proIcon: { backgroundColor: '#3D4B42' },
  proIconText: { color: DriveColors.lime, fontSize: 15, fontWeight: '700' },
  roleTag: { backgroundColor: '#E8EFE8', paddingVertical: 5, paddingHorizontal: 8, borderRadius: 7 },
  roleTagDark: { backgroundColor: '#3D4B42' },
  roleTagText: { color: DriveColors.green, fontSize: 9, fontWeight: '700' },
  roleTagTextDark: { color: DriveColors.white },
  choiceTitle: { color: DriveColors.ink, fontSize: 18, fontWeight: '700' },
  choiceText: { color: DriveColors.muted, fontSize: 13, lineHeight: 19, marginTop: 5 },
  arrow: { color: DriveColors.green, fontSize: 13, fontWeight: '700', marginTop: 17 },
  proArrow: { color: DriveColors.lime },
  note: { color: DriveColors.muted, fontSize: 12, lineHeight: 17, marginTop: 7 },
});