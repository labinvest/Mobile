import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ProgressBar, SegmentedButtons } from 'react-native-paper';

import { ActionButton, AppText, Screen, SectionHeading, StatusTag, TopBar } from '@/components/drive-ui';
import { DriveColors } from '@/constants/drive-theme';
import { Role, useDriveApp } from '@/hooks/use-drive-app';

const roles: { key: Role; label: string }[] = [
  { key: 'student', label: 'Aluno' },
  { key: 'teacher', label: 'Instrutor' },
  { key: 'admin', label: 'Admin' },
];

export default function AccountScreen() {
  const { role, accountName, accountEmail, setRole, signOut } = useDriveApp();
  const [approvedVehicles, setApprovedVehicles] = useState<string[]>([]);

  function changeRole(nextRole: Role) {
    setRole(nextRole);
    router.replace('/(tabs)');
  }

  if (role === 'admin') {
    return (
      <Screen>
        <TopBar roleLabel="Administração" />
        <View style={styles.heading}><AppText style={styles.title}>Gestão da plataforma</AppText><AppText style={styles.subtitle}>Usuários, veículos e cadastros.</AppText></View>
        <View style={styles.adminSummary}><AppText style={styles.adminNumber}>280</AppText><View style={styles.adminSummaryCopy}><AppText style={styles.sectionLabel}>USUÁRIOS CADASTRADOS</AppText><AppText style={styles.adminHint}>248 alunos · 32 instrutores</AppText></View><StatusTag label="+12%" /></View>
        <SectionHeading title="Veículos" aside="18 cadastrados" />
        {[
          ['HB20', 'Ana Paula Ribeiro · 2023 · Automático'],
          ['Onix', 'Marcos Vieira · 2022 · Manual'],
          ['City', 'Carlos Ferreira · 2023 · Manual'],
        ].map(([model, owner], index) => {
          const id = `${model}-${index}`;
          const isApproved = approvedVehicles.includes(id);
          return (
            <View key={id} style={styles.vehicleRow}>
              <View style={styles.vehicleMark}><AppText style={styles.vehicleMarkText}>▣</AppText></View>
              <View style={styles.vehicleCopy}><AppText style={styles.vehicleName}>{model}</AppText><AppText style={styles.vehicleOwner}>{owner}</AppText></View>
              <Pressable accessibilityRole="button" onPress={() => setApprovedVehicles((previous) => isApproved ? previous.filter((item) => item !== id) : [...previous, id])} style={[styles.reviewControl, isApproved && styles.reviewControlDone]}><AppText style={[styles.reviewText, isApproved && styles.reviewTextDone]}>{isApproved ? 'Ativo' : index === 2 ? 'Revisar' : 'Ver'}</AppText></Pressable>
            </View>
          );
        })}
        <View style={styles.sectionGap}><SectionHeading title="Acessos rápidos" /></View>
        <AdminSetting title="Alunos" detail="248 perfis ativos" value="›" />
        <AdminSetting title="Instrutores" detail="3 cadastros aguardando aprovação" value="›" />
        <AdminSetting title="Pagamentos" detail="Acompanhar repasses das aulas" value="›" />
        <View style={styles.roleBlock}><SectionHeading title="Visualizar como" /><RolePicker current={role} onSelect={changeRole} /></View>
        <View style={styles.logout}><ActionButton label="Sair da conta" variant="secondary" onPress={() => { signOut(); router.replace('/login'); }} /></View>
      </Screen>
    );
  }

  const isTeacher = role === 'teacher';
  const displayName = accountName;
  const initials = accountName.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase();

  return (
    <Screen>
      <TopBar roleLabel={isTeacher ? 'Perfil profissional' : 'Sua conta'} />
      <View style={styles.profileHeader}>
        <View style={styles.profileAvatar}><AppText style={styles.profileInitials}>{initials}</AppText></View>
        <View style={styles.profileCopy}><AppText style={styles.profileName}>{displayName}</AppText><AppText style={styles.profileEmail}>{accountEmail}</AppText></View>
        <StatusTag label={isTeacher ? 'VERIFICADO' : 'ALUNA'} />
      </View>

      {isTeacher ? (
        <>
          <SectionHeading title="Dados profissionais" />
          <InfoRow label="Categoria da CNH" value="AB · Validade 2029" />
          <InfoRow label="Experiência" value="8 anos como instrutor" />
          <InfoRow label="Região de atendimento" value="Zona Sul · São Paulo" />
          <View style={styles.vehiclePanel}>
            <View style={styles.vehiclePanelTop}><AppText style={styles.vehiclePanelTitle}>Veículo cadastrado</AppText><StatusTag label="ATIVO" /></View>
            <AppText style={styles.vehicleModel}>Chevrolet Onix · 2022</AppText>
            <AppText style={styles.vehicleSpecs}>Manual · 1.0 · Placa final 37</AppText>
            <AppText style={styles.vehicleSpecs}>Duplo comando · Seguro vigente</AppText>
          </View>
          <SectionHeading title="Avaliações" aside="4,8 de 5" />
          <View style={styles.ratingPanel}><AppText style={styles.ratingQuote}>“Muito paciente e explica cada etapa com clareza.”</AppText><AppText style={styles.ratingBy}>Julia M. · há 2 semanas</AppText></View>
        </>
      ) : (
        <>
          <SectionHeading title="Seu processo de habilitação" />
          <InfoRow label="Categoria desejada" value="B · Carro" />
          <InfoRow label="Autoescola" value="Etapa prática particular" />
          <InfoRow label="Aulas concluídas" value="12 de 20 aulas" />
          <InfoRow label="Preferência" value="Câmbio automático" />
          <View style={styles.progressPanel}><View style={styles.progressPanelTop}><AppText style={styles.progressPanelTitle}>Progresso geral</AppText><AppText style={styles.progressPanelPercent}>60%</AppText></View><ProgressBar progress={0.6} color={DriveColors.green} style={styles.progressTrack} /><AppText style={styles.progressHint}>Próxima etapa: simulado de prova prática</AppText></View>
          <SectionHeading title="Seu instrutor" />
          <View style={styles.teacherCard}><View style={styles.avatar}><AppText style={styles.avatarText}>AR</AppText></View><View style={styles.vehicleCopy}><AppText style={styles.vehicleName}>Ana Paula Ribeiro</AppText><AppText style={styles.vehicleOwner}>4,9 · HB20 automático</AppText></View><StatusTag label="FAVORITA" /></View>
        </>
      )}

      <View style={styles.roleBlock}><SectionHeading title="Visualizar como" /><RolePicker current={role} onSelect={changeRole} /></View>
      <View style={styles.logout}><ActionButton label="Sair da conta" variant="secondary" onPress={() => { signOut(); router.replace('/login'); }} /></View>
      <AppText style={styles.version}>Rota · versão demonstrativa 1.0</AppText>
    </Screen>
  );
}

function RolePicker({ current, onSelect }: { current: Role; onSelect: (role: Role) => void }) {
  return <SegmentedButtons value={current} onValueChange={(value) => onSelect(value as Role)} buttons={roles.map((role) => ({ value: role.key, label: role.label }))} />;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.infoRow}><AppText style={styles.infoLabel}>{label}</AppText><AppText style={styles.infoValue}>{value}</AppText></View>;
}

function AdminSetting({ title, detail, value }: { title: string; detail: string; value: string }) {
  return <View style={styles.settingRow}><View style={styles.settingCopy}><AppText style={styles.vehicleName}>{title}</AppText><AppText style={styles.vehicleOwner}>{detail}</AppText></View><AppText style={styles.settingArrow}>{value}</AppText></View>;
}

const styles = StyleSheet.create({
  heading: { marginTop: 26, marginBottom: 20, gap: 5 },
  title: { color: DriveColors.ink, fontSize: 27, lineHeight: 33, fontWeight: '700' },
  subtitle: { color: DriveColors.muted, fontSize: 14 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 19, borderBottomWidth: 1, borderColor: DriveColors.line, marginBottom: 20 },
  profileAvatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: DriveColors.lime, alignItems: 'center', justifyContent: 'center' },
  profileInitials: { color: DriveColors.ink, fontSize: 16, fontWeight: '700' },
  profileCopy: { flex: 1, gap: 3 },
  profileName: { color: DriveColors.ink, fontSize: 17, fontWeight: '700' },
  profileEmail: { color: DriveColors.muted, fontSize: 12 },
  infoRow: { minHeight: 53, justifyContent: 'center', borderBottomWidth: 1, borderColor: DriveColors.line, gap: 4 },
  infoLabel: { color: DriveColors.muted, fontSize: 11 },
  infoValue: { color: DriveColors.ink, fontSize: 14, fontWeight: '600' },
  vehiclePanel: { backgroundColor: DriveColors.surfaceMuted, padding: 15, borderRadius: 9, marginTop: 20, marginBottom: 22, gap: 7 },
  vehiclePanelTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  vehiclePanelTitle: { color: DriveColors.ink, fontSize: 13, fontWeight: '600' },
  vehicleModel: { color: DriveColors.ink, fontSize: 16, fontWeight: '700' },
  vehicleSpecs: { color: DriveColors.muted, fontSize: 12 },
  ratingPanel: { borderLeftWidth: 2, borderLeftColor: DriveColors.green, paddingLeft: 13, paddingVertical: 5, marginTop: 3 },
  ratingQuote: { color: DriveColors.ink, fontSize: 13, lineHeight: 19 },
  ratingBy: { color: DriveColors.muted, fontSize: 11, marginTop: 7 },
  progressPanel: { marginTop: 18, marginBottom: 23, padding: 14, backgroundColor: DriveColors.surfaceMuted, borderRadius: 9 },
  progressPanelTop: { flexDirection: 'row', justifyContent: 'space-between' },
  progressPanelTitle: { color: DriveColors.ink, fontSize: 13, fontWeight: '600' },
  progressPanelPercent: { color: DriveColors.green, fontSize: 13, fontWeight: '700' },
  progressTrack: { height: 7, borderRadius: 7, marginTop: 12 },
  progressHint: { color: DriveColors.muted, fontSize: 11, marginTop: 9 },
  teacherCard: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 14, borderBottomWidth: 1, borderColor: DriveColors.line },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E7EEE8', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: DriveColors.green, fontSize: 12, fontWeight: '700' },
  vehicleCopy: { flex: 1, gap: 4 },
  vehicleName: { color: DriveColors.ink, fontSize: 14, fontWeight: '600' },
  vehicleOwner: { color: DriveColors.muted, fontSize: 12 },
  roleBlock: { marginTop: 25 },
  rolePicker: { flexDirection: 'row', backgroundColor: DriveColors.surfaceMuted, padding: 4, borderRadius: 9, gap: 4 },
  roleOption: { flex: 1, minHeight: 39, justifyContent: 'center', alignItems: 'center', borderRadius: 6 },
  roleOptionSelected: { backgroundColor: DriveColors.white },
  roleText: { color: DriveColors.muted, fontSize: 12, fontWeight: '600' },
  roleTextSelected: { color: DriveColors.ink },
  logout: { marginTop: 18 },
  version: { textAlign: 'center', color: DriveColors.muted, fontSize: 11, marginTop: 20 },
  adminSummary: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: DriveColors.surfaceMuted, padding: 15, borderRadius: 9, marginBottom: 22 },
  adminNumber: { color: DriveColors.green, fontSize: 30, fontWeight: '700' },
  adminSummaryCopy: { flex: 1, gap: 4 },
  sectionLabel: { color: DriveColors.ink, fontSize: 10, fontWeight: '700' },
  adminHint: { color: DriveColors.muted, fontSize: 11 },
  vehicleRow: { minHeight: 67, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderColor: DriveColors.line },
  vehicleMark: { width: 36, height: 36, borderRadius: 8, backgroundColor: DriveColors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  vehicleMarkText: { color: DriveColors.green, fontSize: 15 },
  reviewControl: { minWidth: 60, minHeight: 32, paddingHorizontal: 8, borderRadius: 6, backgroundColor: DriveColors.lime, alignItems: 'center', justifyContent: 'center' },
  reviewControlDone: { backgroundColor: DriveColors.surfaceMuted },
  reviewText: { color: DriveColors.ink, fontSize: 11, fontWeight: '700' },
  reviewTextDone: { color: DriveColors.green },
  sectionGap: { marginTop: 15 },
  settingRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: DriveColors.line },
  settingCopy: { flex: 1, gap: 4 },
  settingArrow: { color: DriveColors.muted, fontSize: 22 },
});