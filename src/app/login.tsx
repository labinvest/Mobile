import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { Brand } from '@/components/brand';
import { ControlledField, PasswordField } from '@/components/forms/controlled-field';
import { Button, Header, Notice, Screen, Text } from '@/components/ui';
import { useDriveApp } from '@/hooks/use-drive-app';
import { errorMessage } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { loginSchema, type LoginForm } from '@/lib/validation';
import { space } from '@/theme/tokens';

export default function LoginScreen() {
  const { signIn } = useDriveApp();
  const [error, setError] = useState('');
  const { control, handleSubmit, formState } = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  // Depois do login, as rotas protegidas do layout levam o usuário para o app.
  const submit = handleSubmit(
    async (values) => {
      setError('');
      try {
        await signIn(values.email, values.password);
        haptic.success();
      } catch (caught) {
        haptic.error();
        setError(errorMessage(caught));
      }
    },
    () => haptic.error(),
  );

  return (
    <Screen header={<Header />}>
      <View style={styles.heading}>
        <Brand />
        <Text variant="title1" accessibilityRole="header" style={styles.title}>Bom te ver de novo</Text>
        <Text variant="callout" tone="muted">Entre para acompanhar suas aulas.</Text>
      </View>

      <View style={styles.form}>
        <ControlledField
          control={control}
          name="email"
          label="E-mail"
          icon="email-outline"
          placeholder="voce@email.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
        />
        <PasswordField control={control} name="password" label="Senha" placeholder="Sua senha" autoComplete="current-password" textContentType="password" returnKeyType="go" onSubmitEditing={() => submit()} />
        {!!error && <Notice tone="danger" message={error} />}
        <Button label="Entrar" size="lg" loading={formState.isSubmitting} onPress={submit} fullWidth />
      </View>

      <View style={styles.footer}>
        <Text variant="callout" tone="muted">Ainda não tem conta?</Text>
        <Button label="Criar conta" variant="ghost" onPress={() => router.replace('/register')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: space.xs, paddingTop: space.lg, paddingBottom: space.xxl },
  title: { marginTop: space.xl },
  form: { gap: space.xs },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: space.xl },
});
