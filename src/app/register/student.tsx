import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';

import { ActionButton, AppText, BackBar, FormField, Screen } from '@/components/drive-ui';
import { DriveColors } from '@/constants/drive-theme';
import { useDriveApp } from '@/hooks/use-drive-app';

export default function StudentRegistrationScreen() {
  const { signIn } = useDriveApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState('B');
  const [error, setError] = useState('');

  function createAccount() {
    if (!name.trim() || !email.includes('@') || phone.replace(/\D/g, '').length < 10 || cpf.replace(/\D/g, '').length !== 11 || !city.trim() || password.length < 6) {
      setError('Confira os dados obrigatórios, o e-mail, o telefone, o CPF e a senha com pelo menos 6 caracteres.');
      return;
    }
    signIn('student', name, email);
    router.replace('/(tabs)');
  }

  return (
    <Screen>
      <BackBar title="Cadastro de aluno" />
      <View style={styles.heading}>
        <AppText style={styles.eyebrow}>PASSO 1 DE 1 · ALUNO</AppText>
        <AppText style={styles.title}>Vamos começar pelo básico.</AppText>
        <AppText style={styles.subtitle}>Seu perfil ajuda a encontrar aulas que combinam com você.</AppText>
      </View>
      <View style={styles.form}>
        <FormField label="Nome completo" autoComplete="name" autoCapitalize="words" onChangeText={setName} placeholder="Como podemos te chamar?" value={name} />
        <FormField label="E-mail" autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={setEmail} placeholder="voce@email.com" value={email} />
        <View style={styles.row}>
          <View style={styles.half}><FormField label="Celular" keyboardType="phone-pad" onChangeText={setPhone} placeholder="(11) 99999-9999" value={phone} /></View>
          <View style={styles.half}><FormField label="CPF" keyboardType="numeric" onChangeText={setCpf} placeholder="000.000.000-00" value={cpf} /></View>
        </View>
        <FormField label="Cidade" autoCapitalize="words" onChangeText={setCity} placeholder="Sua cidade" value={city} />
        <AppText style={styles.categoryLabel}>Categoria desejada</AppText>
        <SegmentedButtons
          value={category}
          onValueChange={setCategory}
          buttons={['A', 'B', 'AB'].map((option) => ({ value: option, label: option }))}
        />
        <FormField label="Crie uma senha" autoComplete="new-password" onChangeText={setPassword} placeholder="Pelo menos 6 caracteres" secureTextEntry value={password} />
        {!!error && <AppText style={styles.error}>{error}</AppText>}
        <ActionButton label="Criar conta de aluno" onPress={createAccount} />
        <AppText style={styles.note}>Ao continuar, você poderá completar preferências e agendar sua primeira aula.</AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { marginTop: 24, marginBottom: 21, gap: 6 },
  eyebrow: { color: DriveColors.green, fontSize: 11, fontWeight: '700' },
  title: { color: DriveColors.ink, fontSize: 27, lineHeight: 33, fontWeight: '700' },
  subtitle: { color: DriveColors.muted, fontSize: 14, lineHeight: 20 },
  form: { gap: 14 },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  categoryLabel: { color: DriveColors.ink, fontSize: 13, fontWeight: '600' },
  error: { color: DriveColors.danger, fontSize: 12, lineHeight: 17 },
  note: { textAlign: 'center', color: DriveColors.muted, fontSize: 11, lineHeight: 16 },
});