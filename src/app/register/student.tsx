import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { ControlledChoice, ControlledField, PasswordField } from '@/components/forms/controlled-field';
import { BottomBar, Button, Header, Notice, Screen, SectionHeader, Text } from '@/components/ui';
import { useDriveApp } from '@/hooks/use-drive-app';
import { errorMessage } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { maskCpf, maskPhone } from '@/lib/masks';
import { studentSignupSchema, type StudentSignupForm } from '@/lib/validation';
import type { Category } from '@/types/api';
import { space } from '@/theme/tokens';

const CATEGORIES = [
  { value: 'B', label: 'B · carro' },
  { value: 'A', label: 'A · moto' },
  { value: 'AB', label: 'AB · carro e moto' },
];

export default function StudentSignupScreen() {
  const { registerStudent } = useDriveApp();
  const [error, setError] = useState('');
  const { control, handleSubmit, formState } = useForm<StudentSignupForm>({
    resolver: zodResolver(studentSignupSchema),
    defaultValues: { name: '', email: '', phone: '', cpf: '', city: '', category: 'B', password: '' },
  });

  // Com a conta criada, as rotas protegidas do layout levam o aluno para o app.
  const submit = handleSubmit(
    async (values) => {
      setError('');
      try {
        await registerStudent({ ...values, name: values.name.trim(), city: values.city.trim(), category: values.category as Category });
        haptic.success();
      } catch (caught) {
        haptic.error();
        setError(errorMessage(caught));
      }
    },
    () => haptic.error(),
  );

  return (
    <Screen
      header={<Header title="Conta de aluno" />}
      footer={<BottomBar><Button label="Criar minha conta" size="lg" loading={formState.isSubmitting} onPress={submit} fullWidth /></BottomBar>}>
      <View style={styles.heading}>
        <Text variant="title1" accessibilityRole="header">Vamos começar</Text>
        <Text variant="callout" tone="muted">Leva menos de um minuto. Você já sai pronto para buscar instrutores.</Text>
      </View>

      <SectionHeader title="Sobre você" />
      <ControlledField control={control} name="name" label="Nome completo" icon="account-outline" placeholder="Como no seu documento" autoComplete="name" autoCapitalize="words" textContentType="name" />
      <ControlledField control={control} name="cpf" label="CPF" icon="card-account-details-outline" placeholder="000.000.000-00" keyboardType="number-pad" mask={maskCpf} helper="Usado só para identificar sua conta." />
      <ControlledField control={control} name="city" label="Cidade" icon="map-marker-outline" placeholder="Onde você vai fazer as aulas" autoCapitalize="words" autoComplete="postal-address-locality" />
      <ControlledChoice control={control} name="category" label="Categoria que você quer tirar" options={CATEGORIES} />

      <SectionHeader title="Acesso" />
      <ControlledField control={control} name="email" label="E-mail" icon="email-outline" placeholder="voce@email.com" autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" />
      <ControlledField control={control} name="phone" label="Celular" icon="cellphone" placeholder="(11) 99999-9999" keyboardType="phone-pad" autoComplete="tel" mask={maskPhone} />
      <PasswordField control={control} name="password" label="Crie uma senha" placeholder="Pelo menos 6 caracteres" autoComplete="new-password" textContentType="newPassword" />

      {!!error && <Notice tone="danger" title="Não foi possível criar a conta" message={error} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: space.xs, paddingTop: space.sm, paddingBottom: space.xl },
});
