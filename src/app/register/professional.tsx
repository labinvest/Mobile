import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, type FieldPath } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { ControlledCheckbox, ControlledChoice, ControlledField, PasswordField } from '@/components/forms/controlled-field';
import { BottomBar, Button, Header, Icon, Notice, Screen, Surface, Text } from '@/components/ui';
import { useDriveApp } from '@/hooks/use-drive-app';
import { errorMessage } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { maskCpf, maskDate, maskPhone } from '@/lib/masks';
import { teacherSignupSchema, type TeacherSignupForm } from '@/lib/validation';
import type { AuthSession, Category, Transmission } from '@/types/api';
import { colors, radius, space } from '@/theme/tokens';

const STEPS: { title: string; hint: string; fields: FieldPath<TeacherSignupForm>[] }[] = [
  { title: 'Seus dados', hint: 'Usados para contato e para a análise do cadastro.', fields: ['name', 'cpf', 'email', 'phone', 'city', 'password', 'passwordConfirmation'] },
  { title: 'Habilitação', hint: 'Conferimos estes dados antes de liberar seu perfil.', fields: ['cnhNumber', 'cnhCategory', 'cnhExpiry', 'experience'] },
  { title: 'Veículo de aula', hint: 'O carro que os alunos vão usar nas aulas.', fields: ['vehicleModel', 'vehicleYear', 'plate', 'transmission', 'dualControl', 'termsAccepted'] },
];

const CATEGORIES = [{ value: 'B', label: 'B' }, { value: 'A', label: 'A' }, { value: 'AB', label: 'AB' }];
const TRANSMISSIONS = [{ value: 'Manual', label: 'Manual' }, { value: 'Automático', label: 'Automático' }];

/** Leva o formulário para a etapa do campo que a API recusou. */
function stepForError(message: string) {
  const text = message.toLowerCase();
  if (/(nome|e-mail|celular|cpf|cidade|senha|conta)/.test(text)) return 0;
  if (/(cnh|experiência)/.test(text)) return 1;
  return 2;
}

export default function TeacherSignupScreen() {
  const { registerTeacher, startSession } = useDriveApp();
  const [step, setStep] = useState(0);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [error, setError] = useState('');
  const [entering, setEntering] = useState(false);
  const { control, trigger, handleSubmit, formState, getValues } = useForm<TeacherSignupForm>({
    resolver: zodResolver(teacherSignupSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '', cpf: '', email: '', phone: '', city: '', password: '', passwordConfirmation: '',
      cnhNumber: '', cnhCategory: 'B', cnhExpiry: '', experience: '',
      vehicleModel: '', vehicleYear: '', plate: '', transmission: 'Manual', dualControl: false, termsAccepted: false,
    },
  });

  const submit = handleSubmit(async (values) => {
    setError('');
    try {
      setSession(await registerTeacher({
        name: values.name.trim(), email: values.email, phone: values.phone, cpf: values.cpf, city: values.city.trim(), password: values.password,
        cnhNumber: values.cnhNumber, cnhCategory: values.cnhCategory as Category, cnhExpiry: values.cnhExpiry, experience: values.experience.trim(),
        vehicle: { model: values.vehicleModel.trim(), year: values.vehicleYear, plate: values.plate, transmission: values.transmission as Transmission, dualControl: values.dualControl },
        termsAccepted: values.termsAccepted,
      }));
      haptic.success();
    } catch (caught) {
      haptic.error();
      const message = errorMessage(caught);
      setError(message);
      setStep(stepForError(message));
    }
  });

  async function next() {
    if (!(await trigger(STEPS[step].fields))) {
      haptic.error();
      return;
    }
    setError('');
    if (step < STEPS.length - 1) setStep(step + 1);
    else submit();
  }

  function back() {
    setError('');
    setStep(step - 1);
  }

  if (session) {
    return (
      <Screen
        footer={<BottomBar><Button label="Entrar no app" size="lg" loading={entering} onPress={() => { setEntering(true); startSession(session); }} fullWidth /></BottomBar>}>
        <View style={styles.success}>
          <View style={styles.successIcon}><Icon name="check" size={36} color={colors.onBrand} /></View>
          <Text variant="title1" align="center">Cadastro enviado, {getValues('name').split(' ')[0]}!</Text>
          <Text variant="callout" tone="muted" align="center">Seu perfil fica oculto para os alunos até a equipe Rota aprovar os dados e o veículo.</Text>
        </View>
        <Surface style={styles.next}>
          <Text variant="headline">Enquanto isso</Text>
          {['Defina seu valor e os horários da semana em Agenda', 'O andamento da análise aparece na sua Agenda', 'Depois disso, os pedidos chegam direto no app'].map((item, index) => (
            <View key={item} style={styles.nextRow}>
              <View style={styles.nextNumber}><Text variant="caption" tone="brand">{index + 1}</Text></View>
              <Text variant="callout" tone="secondary" style={styles.flex}>{item}</Text>
            </View>
          ))}
        </Surface>
      </Screen>
    );
  }

  const current = STEPS[step];
  return (
    <Screen
      header={<Header title="Conta de instrutor" onBack={step > 0 ? back : undefined} />}
      footer={
        <BottomBar>
          <Button label={step === STEPS.length - 1 ? 'Enviar para análise' : 'Continuar'} size="lg" trailingIcon={step === STEPS.length - 1 ? 'send-outline' : 'arrow-right'} loading={formState.isSubmitting} onPress={next} fullWidth />
        </BottomBar>
      }>
      <View style={styles.progress} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: STEPS.length, now: step + 1 }} accessibilityLabel={`Etapa ${step + 1} de ${STEPS.length}`}>
        {STEPS.map((item, index) => <View key={item.title} style={[styles.segment, index <= step && styles.segmentOn]} />)}
      </View>
      <View style={styles.heading}>
        <Text variant="overline" tone="brand">Etapa {step + 1} de {STEPS.length}</Text>
        <Text variant="title1" accessibilityRole="header">{current.title}</Text>
        <Text variant="callout" tone="muted">{current.hint}</Text>
      </View>

      {step === 0 && (
        <>
          <ControlledField control={control} name="name" label="Nome completo" icon="account-outline" placeholder="Como na sua CNH" autoComplete="name" autoCapitalize="words" />
          <ControlledField control={control} name="cpf" label="CPF" icon="card-account-details-outline" placeholder="000.000.000-00" keyboardType="number-pad" mask={maskCpf} />
          <ControlledField control={control} name="email" label="E-mail" icon="email-outline" placeholder="voce@email.com" autoCapitalize="none" autoComplete="email" keyboardType="email-address" />
          <ControlledField control={control} name="phone" label="Celular" icon="cellphone" placeholder="(11) 99999-9999" keyboardType="phone-pad" mask={maskPhone} />
          <ControlledField control={control} name="city" label="Cidade onde atende" icon="map-marker-outline" placeholder="Ex.: São Paulo" autoCapitalize="words" />
          <PasswordField control={control} name="password" label="Crie uma senha" placeholder="Pelo menos 6 caracteres" autoComplete="new-password" />
          <PasswordField control={control} name="passwordConfirmation" label="Repita a senha" placeholder="Digite a senha de novo" autoComplete="new-password" />
        </>
      )}

      {step === 1 && (
        <>
          <ControlledField control={control} name="cnhNumber" label="Número de registro da CNH" icon="card-account-details-outline" placeholder="Só os números" keyboardType="number-pad" maxLength={11} />
          <ControlledChoice control={control} name="cnhCategory" label="Categoria em que você ensina" options={CATEGORIES} />
          <ControlledField control={control} name="cnhExpiry" label="Validade da CNH" icon="calendar-outline" placeholder="DD/MM/AAAA" keyboardType="number-pad" mask={maskDate} />
          <ControlledField control={control} name="experience" label="Tempo como instrutor" icon="medal-outline" placeholder="Ex.: 5 anos" helper="Só o número também vale: 5 vira “5 anos”." />
          <Notice tone="info" message="O envio de fotos da CNH e de credenciais ainda não está disponível no app. A equipe pode pedir os documentos durante a análise." />
        </>
      )}

      {step === 2 && (
        <>
          <ControlledField control={control} name="vehicleModel" label="Modelo" icon="car-outline" placeholder="Ex.: Hyundai HB20" />
          <View style={styles.row}>
            <View style={styles.flex}><ControlledField control={control} name="vehicleYear" label="Ano" placeholder="2023" keyboardType="number-pad" maxLength={4} /></View>
            <View style={styles.flex}><ControlledField control={control} name="plate" label="Placa" placeholder="ABC1D23" autoCapitalize="characters" maxLength={8} /></View>
          </View>
          <ControlledChoice control={control} name="transmission" label="Câmbio" options={TRANSMISSIONS} />
          <ControlledCheckbox control={control} name="dualControl" title="O carro tem duplo comando" detail="Pedal de freio do lado do instrutor, obrigatório nas aulas práticas." />
          <ControlledCheckbox control={control} name="termsAccepted" title="Confirmo que os dados são verdadeiros" detail="Dados incorretos podem impedir a aprovação do perfil." />
        </>
      )}

      {!!error && <Notice tone="danger" title="Revise o cadastro" message={error} style={styles.error} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  row: { flexDirection: 'row', gap: space.md },
  progress: { flexDirection: 'row', gap: space.xs, marginTop: space.sm },
  segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.line },
  segmentOn: { backgroundColor: colors.brand },
  heading: { gap: space.xs, paddingTop: space.lg, paddingBottom: space.xl },
  error: { marginTop: space.md },
  success: { alignItems: 'center', gap: space.md, paddingTop: space.xxxl, paddingBottom: space.xxl },
  successIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  next: { gap: space.md },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  nextNumber: { width: 28, height: 28, borderRadius: radius.pill, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
});
