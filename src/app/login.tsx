import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton, AppText, Brand, FormField, ScreenWidth } from '@/components/drive-ui';
import { DriveColors } from '@/constants/drive-theme';
import { Role, useDriveApp } from '@/hooks/use-drive-app';

const roles: { key: Role; label: string }[] = [
  { key: 'student', label: 'Aluno' },
  { key: 'teacher', label: 'Instrutor' },
  { key: 'admin', label: 'Admin' },
];

export default function LoginScreen() {
  const { authenticated, signIn } = useDriveApp();
  const [role, setRole] = useState<Role>('student');
  const [email, setEmail] = useState('aluno@rota.app');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');

  if (authenticated) return <Redirect href="/(tabs)" />;

  function enterApp() {
    if (!email.trim() || !password.trim()) {
      setError('Preencha e-mail e senha para continuar.');
      return;
    }
    signIn(role, undefined, email);
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.page}>
          <View style={styles.content}>
            <Brand />
            <View style={styles.intro}>
              <AppText style={styles.eyebrow}>SUA CNH, NO SEU RITMO</AppText>
              <AppText style={styles.title}>Aprender a dirigir começa com uma boa conexão.</AppText>
              <AppText style={styles.subtitle}>Encontre instrutores independentes, combine suas aulas e acompanhe cada etapa.</AppText>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <FormField
                  label="E-mail"
                  accessibilityLabel="E-mail"
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="voce@email.com"
                  style={styles.input}
                  value={email}
                />
              </View>
              <View style={styles.inputGroup}>
                <FormField
                  label="Senha"
                  accessibilityLabel="Senha"
                  onChangeText={setPassword}
                  placeholder="Sua senha"
                  secureTextEntry
                  style={styles.input}
                  value={password}
                />
              </View>
              {!!error && <AppText style={styles.error}>{error}</AppText>}
              <ActionButton label="Entrar" onPress={enterApp} />
              <AppText style={styles.demoNote}>Acesso demonstrativo. Use qualquer e-mail e senha.</AppText>
              <Pressable accessibilityRole="button" onPress={() => router.push('/register')} style={styles.registerLink}>
                <AppText style={styles.registerText}>Ainda não tem conta? <AppText style={styles.registerStrong}>Cadastre-se</AppText></AppText>
              </Pressable>
            </View>
            <AppText style={styles.footer}>Aulas particulares. Mais autonomia no caminho.</AppText>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: DriveColors.background },
  flex: { flex: 1 },
  page: { flex: 1, alignItems: 'center' },
  content: { width: '100%', maxWidth: ScreenWidth, flex: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
  intro: { marginTop: 54, marginBottom: 30, gap: 12 },
  eyebrow: { color: DriveColors.green, fontSize: 12, fontWeight: '700' },
  title: { color: DriveColors.ink, fontSize: 34, lineHeight: 39, fontWeight: '700', maxWidth: 430 },
  subtitle: { color: DriveColors.muted, fontSize: 16, lineHeight: 23, maxWidth: 420 },
  form: { gap: 14 },
  label: { color: DriveColors.ink, fontSize: 14, fontWeight: '600' },
  roleSwitch: { marginBottom: 2 },
  inputGroup: { gap: 7 },
  input: { backgroundColor: DriveColors.white },
  error: { color: DriveColors.danger, fontSize: 13 },
  demoNote: { color: DriveColors.muted, fontSize: 12, textAlign: 'center', marginTop: 2 },
  registerLink: { minHeight: 40, justifyContent: 'center', alignItems: 'center' },
  registerText: { color: DriveColors.muted, fontSize: 13 },
  registerStrong: { color: DriveColors.green, fontWeight: '700' },
  footer: { color: DriveColors.muted, fontSize: 12, marginTop: 'auto', paddingTop: 24 },
});