import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Checkbox, Chip } from 'react-native-paper';

import { ActionButton, AppText, BackBar, FormField, Screen, StatusTag } from '@/components/drive-ui';
import { DriveColors } from '@/constants/drive-theme';
import { useDriveApp } from '@/hooks/use-drive-app';
import { errorMessage } from '@/lib/api';
import type { AuthSession, Category, Transmission } from '@/types/api';

const steps = ['Dados pessoais', 'Habilitação', 'Veículo'];

/** Leva o formulário para a etapa do campo que a API recusou. */
function stepForError(message: string) {
  const text = message.toLowerCase();
  if (/(nome|e-mail|celular|cpf|cidade|senha|conta)/.test(text)) return 0;
  if (/(cnh|experiência)/.test(text)) return 1;
  return 2;
}

export default function ProfessionalRegistrationScreen() {
  const { registerTeacher, startSession } = useDriveApp();
  const [step, setStep] = useState(0);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [entering, setEntering] = useState(false);
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [cnh, setCnh] = useState('');
  const [category, setCategory] = useState<Category>('B');
  const [cnhExpiry, setCnhExpiry] = useState('');
  const [experience, setExperience] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [year, setYear] = useState('');
  const [plate, setPlate] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [transmission, setTransmission] = useState<Transmission>('Manual');
  const [dualControl, setDualControl] = useState(false);
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState('');

  async function submitRegistration() {
    setSubmitting(true);
    try {
      setSession(await registerTeacher({
        name, email, phone, cpf, city, password,
        cnhNumber: cnh, cnhCategory: category, cnhExpiry, experience,
        vehicle: { model: vehicle, year, plate, transmission, dualControl },
        termsAccepted: terms,
      }));
    } catch (caught) {
      const message = errorMessage(caught);
      setError(message);
      setStep(stepForError(message));
    } finally {
      setSubmitting(false);
    }
  }

  // Ao entrar, as rotas protegidas do layout levam o instrutor para o app.
  async function enterApp() {
    if (!session) return;
    setEntering(true);
    await startSession(session);
  }

  function nextStep() {
    const hasPersonalData = name.trim() && cpf.replace(/\D/g, '').length === 11 && email.includes('@') && phone.replace(/\D/g, '').length >= 10 && city.trim() && password.length >= 6 && password === passwordConfirmation;
    const hasLicenseData = cnh.trim() && cnhExpiry.trim() && experience.trim();
    const hasVehicleData = vehicle.trim() && year.trim() && plate.trim() && dualControl && terms;

    if (step === 0 && !hasPersonalData) {
      setError('Preencha os dados de contato e use uma senha com pelo menos 6 caracteres.');
      return;
    }
    if (step === 1 && !hasLicenseData) {
      setError('Informe os dados da CNH e seu tempo de experiência.');
      return;
    }
    if (step === 2 && !hasVehicleData) {
      setError('Informe o veículo e confirme os requisitos para aulas práticas.');
      return;
    }

    setError('');
    if (step < 2) setStep((current) => current + 1);
    else submitRegistration();
  }

  if (session) {
    return (
      <Screen>
        <BackBar title="Cadastro profissional" />
        <View style={styles.successMark}><AppText style={styles.successCheck}>✓</AppText></View>
        <View style={styles.successHeading}>
          <StatusTag label="CADASTRO RECEBIDO" />
          <AppText style={styles.title}>Obrigado, {name.split(' ')[0]}.</AppText>
          <AppText style={styles.subtitle}>Seu perfil profissional está pronto para análise.</AppText>
        </View>
        <View style={styles.reviewPanel}>
          <AppText style={styles.reviewTitle}>Próximas etapas</AppText>
          <ReviewStep number="1" text="Conferência dos dados da CNH e categoria informada" />
          <ReviewStep number="2" text="Validação dos dados do veículo e dos requisitos de aula" />
          <ReviewStep number="3" text="Liberação do perfil profissional para os alunos" />
        </View>
        <AppText style={styles.note}>Enquanto o cadastro estiver em análise, seu perfil não aparece nas buscas dos alunos.</AppText>
        <View style={styles.successButton}><ActionButton label="Entrar no app" onPress={enterApp} loading={entering} /></View>
      </Screen>
    );
  }

  return (
    <Screen>
      <BackBar title="Cadastro profissional" />
      <View style={styles.heading}>
        <AppText style={styles.eyebrow}>INSTRUTOR AUTÔNOMO · ETAPA {step + 1} DE 3</AppText>
        <AppText style={styles.title}>{steps[step]}</AppText>
        <AppText style={styles.subtitle}>Seu perfil passa por uma análise antes de aparecer para os alunos.</AppText>
      </View>
      <View style={styles.stepTrack}>{steps.map((label, index) => <View key={label} style={[styles.stepSegment, index <= step && styles.stepSegmentActive]} />)}</View>
      <View style={styles.stepLabels}>{steps.map((label, index) => <AppText key={label} style={[styles.stepLabel, index === step && styles.stepLabelActive]}>{label}</AppText>)}</View>

      {step === 0 && (
        <View style={styles.form}>
          <FormField label="Nome completo" autoComplete="name" autoCapitalize="words" onChangeText={setName} placeholder="Nome como consta no documento" value={name} />
          <FormField label="CPF" keyboardType="numeric" onChangeText={setCpf} placeholder="000.000.000-00" value={cpf} />
          <FormField label="E-mail profissional" autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={setEmail} placeholder="voce@email.com" value={email} />
          <View style={styles.row}>
            <View style={styles.half}><FormField label="Celular" keyboardType="phone-pad" onChangeText={setPhone} placeholder="(11) 99999-9999" value={phone} /></View>
            <View style={styles.half}><FormField label="Cidade de atendimento" autoCapitalize="words" onChangeText={setCity} placeholder="Cidade" value={city} /></View>
          </View>
          <FormField label="Crie uma senha" autoComplete="new-password" onChangeText={setPassword} placeholder="Pelo menos 6 caracteres" secureTextEntry value={password} />
          <FormField label="Confirme sua senha" autoComplete="new-password" onChangeText={setPasswordConfirmation} placeholder="Digite a senha novamente" secureTextEntry value={passwordConfirmation} />
        </View>
      )}

      {step === 1 && (
        <View style={styles.form}>
          <FormField label="Número de registro da CNH" keyboardType="numeric" onChangeText={setCnh} placeholder="Registro da habilitação" value={cnh} />
          <AppText style={styles.fieldLabel}>Categoria habilitada</AppText>
          <View style={styles.options}>{(['A', 'B', 'AB'] as const).map((option) => <Choice key={option} label={option} selected={category === option} onPress={() => setCategory(option)} />)}</View>
          <FormField label="Validade da CNH" keyboardType="numbers-and-punctuation" onChangeText={setCnhExpiry} placeholder="DD/MM/AAAA" value={cnhExpiry} />
          <FormField label="Tempo de experiência como instrutor" keyboardType="numeric" onChangeText={setExperience} placeholder="Ex.: 5 anos" value={experience} />
          <View style={styles.documentNote}><StatusTag label="DOCUMENTOS" /><AppText style={styles.documentText}>O envio de arquivos da CNH e credenciais será habilitado na integração de documentos.</AppText></View>
        </View>
      )}

      {step === 2 && (
        <View style={styles.form}>
          <FormField label="Modelo do veículo" onChangeText={setVehicle} placeholder="Ex.: Hyundai HB20" value={vehicle} />
          <View style={styles.row}>
            <View style={styles.half}><FormField label="Ano" keyboardType="numeric" onChangeText={setYear} placeholder="2023" value={year} /></View>
            <View style={styles.half}><FormField label="Placa" autoCapitalize="characters" onChangeText={setPlate} placeholder="ABC1D23" value={plate} /></View>
          </View>
          <AppText style={styles.fieldLabel}>Câmbio</AppText>
          <View style={styles.options}>{(['Manual', 'Automático'] as const).map((option) => <Choice key={option} label={option} selected={transmission === option} onPress={() => setTransmission(option)} />)}</View>
          <CheckRow checked={dualControl} onPress={() => setDualControl((value) => !value)} title="Veículo equipado com duplo comando" detail="Obrigatório para aulas práticas de direção." />
          <CheckRow checked={terms} onPress={() => setTerms((value) => !value)} title="Confirmo que os dados estão corretos" detail="A documentação será validada antes da publicação do perfil." />
        </View>
      )}

      {!!error && <AppText style={styles.error}>{error}</AppText>}
      <View style={styles.navigation}>
        {step > 0 && <ActionButton label="Voltar etapa" onPress={() => { setError(''); setStep((current) => current - 1); }} variant="secondary" />}
        <View style={styles.nextButton}><ActionButton label={step === 2 ? 'Enviar para análise' : 'Continuar'} onPress={nextStep} loading={submitting} /></View>
      </View>
      <AppText style={styles.note}>Seus dados ficam salvos na sua conta e passam por análise antes de o perfil ser liberado.</AppText>
    </Screen>
  );
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Chip compact mode={selected ? 'flat' : 'outlined'} selected={selected} showSelectedCheck={false} onPress={onPress} style={[styles.option, selected && styles.optionSelected]} textStyle={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Chip>;
}

function CheckRow({ checked, onPress, title, detail }: { checked: boolean; onPress: () => void; title: string; detail: string }) {
  return (
    <View style={styles.checkRow}>
      <Checkbox status={checked ? 'checked' : 'unchecked'} color={DriveColors.green} uncheckedColor={DriveColors.muted} onPress={onPress} />
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={onPress} style={styles.checkCopy}>
        <AppText style={styles.checkTitle}>{title}</AppText><AppText style={styles.checkDetail}>{detail}</AppText>
      </Pressable>
    </View>
  );
}

function ReviewStep({ number, text }: { number: string; text: string }) {
  return <View style={styles.reviewStep}><View style={styles.reviewNumber}><AppText style={styles.reviewNumberText}>{number}</AppText></View><AppText style={styles.reviewStepText}>{text}</AppText></View>;
}

const styles = StyleSheet.create({
  heading: { marginTop: 24, marginBottom: 18, gap: 6 },
  eyebrow: { color: DriveColors.green, fontSize: 10, fontWeight: '700' },
  title: { color: DriveColors.ink, fontSize: 27, lineHeight: 33, fontWeight: '700' },
  subtitle: { color: DriveColors.muted, fontSize: 13, lineHeight: 19 },
  stepTrack: { flexDirection: 'row', gap: 5, marginBottom: 8 },
  stepSegment: { flex: 1, height: 4, borderRadius: 4, backgroundColor: DriveColors.line },
  stepSegmentActive: { backgroundColor: DriveColors.green },
  stepLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 21 },
  stepLabel: { color: DriveColors.muted, fontSize: 10 },
  stepLabelActive: { color: DriveColors.green, fontWeight: '700' },
  form: { gap: 14 },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  fieldLabel: { color: DriveColors.ink, fontSize: 13, fontWeight: '600' },
  options: { flexDirection: 'row', gap: 8, marginTop: -6 },
  option: { minHeight: 40, minWidth: 54, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: DriveColors.line, alignItems: 'center', justifyContent: 'center' },
  optionSelected: { borderColor: DriveColors.green, backgroundColor: '#E8EFE8' },
  optionText: { color: DriveColors.muted, fontSize: 12, fontWeight: '600' },
  optionTextSelected: { color: DriveColors.green },
  documentNote: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 12, backgroundColor: DriveColors.surfaceMuted, borderRadius: 8 },
  documentText: { flex: 1, color: DriveColors.muted, fontSize: 11, lineHeight: 16 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 5 },
  checkbox: { width: 21, height: 21, borderRadius: 5, borderWidth: 1, borderColor: DriveColors.line, alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: DriveColors.green, borderColor: DriveColors.green },
  checkboxMark: { color: DriveColors.white, fontSize: 13, fontWeight: '700' },
  checkCopy: { flex: 1, gap: 3 },
  checkTitle: { color: DriveColors.ink, fontSize: 12, fontWeight: '600' },
  checkDetail: { color: DriveColors.muted, fontSize: 11, lineHeight: 16 },
  error: { color: DriveColors.danger, fontSize: 12, lineHeight: 17, marginTop: 14 },
  navigation: { flexDirection: 'row', gap: 9, marginTop: 21 },
  nextButton: { flex: 1 },
  note: { color: DriveColors.muted, fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 15, marginBottom: 10 },
  successMark: { width: 54, height: 54, borderRadius: 27, backgroundColor: DriveColors.lime, alignItems: 'center', justifyContent: 'center', marginTop: 35 },
  successCheck: { color: DriveColors.ink, fontSize: 27, fontWeight: '700' },
  successHeading: { gap: 11, marginTop: 24, marginBottom: 24 },
  reviewPanel: { backgroundColor: DriveColors.surfaceMuted, borderRadius: 10, padding: 16, gap: 14 },
  reviewTitle: { color: DriveColors.ink, fontSize: 14, fontWeight: '700', marginBottom: 2 },
  reviewStep: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: DriveColors.white, alignItems: 'center', justifyContent: 'center' },
  reviewNumberText: { color: DriveColors.green, fontSize: 11, fontWeight: '700' },
  reviewStepText: { flex: 1, color: DriveColors.ink, fontSize: 12, lineHeight: 17 },
  successButton: { marginTop: 18 },
});