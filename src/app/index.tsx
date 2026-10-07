import { Redirect, router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton, AppText, Brand, ScreenWidth } from '@/components/drive-ui';
import { DriveColors } from '@/constants/drive-theme';
import { useDriveApp } from '@/hooks/use-drive-app';

export default function IndexRoute() {
  const { authenticated } = useDriveApp();
  if (authenticated) return <Redirect href="/(tabs)" />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.header}><Brand /><AppText style={styles.headerLabel}>AULAS DE DIREÇÃO</AppText></View>
        <View style={styles.hero}>
          <AppText style={styles.eyebrow}>APRENDER. PRATICAR. CONQUISTAR.</AppText>
          <AppText style={styles.title}>Sua CNH começa com uma boa aula.</AppText>
          <AppText style={styles.subtitle}>Conecte-se a instrutores independentes e avance no seu tempo.</AppText>
          <View style={styles.routeCard}>
            <View style={styles.routeHeader}><AppText style={styles.routeLabel}>SEU PRÓXIMO DESTINO</AppText><AppText style={styles.routeNumber}>01 / 03</AppText></View>
            <View style={styles.routeLine}>
              <View style={styles.routeDot} /><View style={styles.routeDash} /><View style={styles.routeDash} /><View style={styles.routeDash} /><View style={styles.routeDestination} />
            </View>
            <View style={styles.routeFooter}><AppText style={styles.routeStart}>Primeira aula</AppText><AppText style={styles.routeEnd}>Sua habilitação</AppText></View>
          </View>
        </View>
        <View style={styles.actions}>
          <ActionButton label="Começar agora" onPress={() => router.push('/login')} />
          <Pressable accessibilityRole="button" onPress={() => router.push('/login')} style={styles.loginLink}>
            <AppText style={styles.loginLinkText}>Já tem conta? <AppText style={styles.loginLinkStrong}>Entrar</AppText></AppText>
          </Pressable>
        </View>
        <AppText style={styles.footer}>Instrutores autônomos. Mais liberdade no seu caminho.</AppText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: DriveColors.ink },
  content: { flex: 1, width: '100%', maxWidth: ScreenWidth, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 18, paddingBottom: 16 },
  header: { minHeight: 42, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLabel: { color: '#D6E1D8', fontSize: 10, fontWeight: '700' },
  hero: { flex: 1, justifyContent: 'center', paddingVertical: 34 },
  eyebrow: { color: DriveColors.lime, fontSize: 11, fontWeight: '700', marginBottom: 16 },
  title: { maxWidth: 470, color: DriveColors.white, fontSize: 42, lineHeight: 47, fontWeight: '700' },
  subtitle: { maxWidth: 400, color: '#D6E1D8', fontSize: 16, lineHeight: 23, marginTop: 14 },
  routeCard: { marginTop: 34, padding: 16, backgroundColor: '#2C3A31', borderRadius: 10 },
  routeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  routeLabel: { color: '#D6E1D8', fontSize: 10, fontWeight: '700' },
  routeNumber: { color: DriveColors.lime, fontSize: 11, fontWeight: '700' },
  routeLine: { height: 36, flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: DriveColors.lime },
  routeDash: { width: 30, height: 2, backgroundColor: '#758579' },
  routeDestination: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: DriveColors.lime },
  routeFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  routeStart: { color: DriveColors.white, fontSize: 12, fontWeight: '600' },
  routeEnd: { color: '#D6E1D8', fontSize: 12 },
  actions: { gap: 12 },
  loginLink: { alignSelf: 'center', minHeight: 40, justifyContent: 'center' },
  loginLinkText: { color: '#D6E1D8', fontSize: 13 },
  loginLinkStrong: { color: DriveColors.lime, fontWeight: '700' },
  footer: { textAlign: 'center', color: '#A7B6AB', fontSize: 11, marginTop: 'auto', paddingTop: 18 },
});
