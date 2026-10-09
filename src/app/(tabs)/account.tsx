import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ProgressBar } from 'react-native-paper';

import { ActionButton, AppText, Screen, SectionHeading, StatusTag, TopBar } from '@/components/drive-ui';
import { DriveColors } from '@/constants/drive-theme';
import { useApiData } from '@/hooks/use-api-data';
import { useDriveApp } from '@/hooks/use-drive-app';
import { api, errorMessage } from '@/lib/api';
import { timeAgo } from '@/lib/dates';
import type { AdminOverview, AdminVehicle, ApprovalStatus, Category } from '@/types/api';

const categoryLabels: Record<Category, string> = { A: 'Moto', B: 'Carro', AB: 'Moto e carro' };
const approvalTags: Record<ApprovalStatus, string> = { approved: 'VERIFICADO', pending: 'EM ANÁLISE', rejected: 'RECUSADO' };

export default function AccountScreen() {
  const { role, user, appointments, accountName, accountEmail, signOut } = useDriveApp();

  if (role === 'admin') return <AdminManagement />;

  const teacher = user?.teacher;
  const student = user?.student;
  const isTeacher = role === 'teacher';
  const initials = user?.initials ?? accountName.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const completed = student?.completedLessons ?? 0;
  const goal = student?.lessonsGoal ?? 20;
  const progress = Math.min(1, completed / goal);
  // Instrutor atual do aluno: o da aula mais recente que não foi recusada.
  const currentTeacherLesson = [...appointments].filter((appointment) => appointment.status !== 'declined').sort((a, b) => b.lessonDate.localeCompare(a.lessonDate))[0];

  return (
    <Screen>
      <TopBar roleLabel={isTeacher ? 'Perfil profissional' : 'Sua conta'} />
      <View style={styles.profileHeader}>
        <View style={styles.profileAvatar}><AppText style={styles.profileInitials}>{initials}</AppText></View>
        <View style={styles.profileCopy}><AppText style={styles.profileName}>{accountName}</AppText><AppText style={styles.profileEmail}>{accountEmail}</AppText></View>
        <StatusTag label={isTeacher ? approvalTags[teacher?.approvalStatus ?? 'pending'] : 'ALUNO'} />
      </View>

      {isTeacher && teacher ? (
        <>
          <SectionHeading title="Dados profissionais" />
          <InfoRow label="Categoria da CNH" value={`${teacher.cnhCategory}${teacher.cnhExpiry ? ` · Validade ${teacher.cnhExpiry.slice(0, 4)}` : ''}`} />
          <InfoRow label="Experiência" value={`${teacher.experience} como instrutor`} />
          <InfoRow label="Região de atendimento" value={teacher.area} />
          <InfoRow label="Valor por aula" value={teacher.price} />
          {teacher.vehicle ? (
            <View style={styles.vehiclePanel}>
              <View style={styles.vehiclePanelTop}><AppText style={styles.vehiclePanelTitle}>Veículo cadastrado</AppText><StatusTag label={teacher.vehicle.status === 'active' ? 'ATIVO' : teacher.vehicle.status === 'pending' ? 'EM ANÁLISE' : 'RECUSADO'} /></View>
              <AppText style={styles.vehicleModel}>{teacher.vehicle.model} · {teacher.vehicle.year}</AppText>
              <AppText style={styles.vehicleSpecs}>{teacher.vehicle.transmission}{teacher.vehicle.plate ? ` · Placa final ${teacher.vehicle.plate.slice(-2)}` : ''}</AppText>
              {teacher.vehicle.dualControl && <AppText style={styles.vehicleSpecs}>Duplo comando</AppText>}
            </View>
          ) : <View style={styles.vehiclePanel}><AppText style={styles.vehicleSpecs}>Nenhum veículo cadastrado.</AppText></View>}
          <SectionHeading title="Avaliações" aside={teacher.rating ? `${teacher.rating} de 5 · ${teacher.reviewCount}` : 'Sem avaliações'} />
          {teacher.latestReview ? (
            <View style={styles.ratingPanel}><AppText style={styles.ratingQuote}>“{teacher.latestReview.comment}”</AppText><AppText style={styles.ratingBy}>{teacher.latestReview.authorName} · {timeAgo(teacher.latestReview.submittedAt)}</AppText></View>
          ) : <AppText style={styles.vehicleOwner}>Os comentários dos alunos aparecem aqui depois das primeiras aulas.</AppText>}
        </>
      ) : (
        <>
          <SectionHeading title="Seu processo de habilitação" />
          <InfoRow label="Categoria desejada" value={`${student?.category ?? 'B'} · ${categoryLabels[student?.category ?? 'B']}`} />
          <InfoRow label="Autoescola" value="Etapa prática particular" />
          <InfoRow label="Aulas concluídas" value={`${completed} de ${goal} aulas`} />
          <InfoRow label="Cidade" value={user?.city ?? 'Não informada'} />
          <View style={styles.progressPanel}><View style={styles.progressPanelTop}><AppText style={styles.progressPanelTitle}>Progresso geral</AppText><AppText style={styles.progressPanelPercent}>{Math.round(progress * 100)}%</AppText></View><ProgressBar progress={progress} color={DriveColors.green} style={styles.progressTrack} /><AppText style={styles.progressHint}>{completed >= goal ? 'Próxima etapa: prova prática' : `Faltam ${goal - completed} aulas para completar a etapa prática`}</AppText></View>
          <SectionHeading title="Seu instrutor" />
          {currentTeacherLesson ? (
            <View style={styles.teacherCard}><View style={styles.avatar}><AppText style={styles.avatarText}>{initialsOf(currentTeacherLesson.teacherName)}</AppText></View><View style={styles.vehicleCopy}><AppText style={styles.vehicleName}>{currentTeacherLesson.teacherName}</AppText><AppText style={styles.vehicleOwner}>{currentTeacherLesson.vehicle}</AppText></View><StatusTag label="ATUAL" /></View>
          ) : <AppText style={styles.vehicleOwner}>Peça sua primeira aula para começar.</AppText>}
        </>
      )}

      <View style={styles.logout}><ActionButton label="Sair da conta" variant="secondary" onPress={signOut} /></View>
      <AppText style={styles.version}>Rota · versão 1.0</AppText>
    </Screen>
  );
}

function AdminManagement() {
  const { signOut } = useDriveApp();
  const { data: overview } = useApiData<AdminOverview>('/admin/overview');
  const { data, setData } = useApiData<{ vehicles: AdminVehicle[] }>('/admin/vehicles');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const vehicles = data?.vehicles ?? [];
  const pendingTotal = (overview?.pendingTeachers ?? 0) + (overview?.pendingVehicles ?? 0);

  /** Ativa um veículo em análise ou devolve um ativo para análise. */
  async function toggleVehicle(vehicle: AdminVehicle) {
    setError('');
    setUpdatingId(vehicle.id);
    try {
      const { vehicle: updated } = await api<{ vehicle: AdminVehicle }>(`/admin/vehicles/${vehicle.id}`, {
        method: 'PATCH',
        body: { status: vehicle.status === 'active' ? 'pending' : 'active' },
      });
      setData((current) => current && { vehicles: current.vehicles.map((item) => (item.id === updated.id ? updated : item)) });
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <Screen>
      <TopBar roleLabel="Administração" />
      <View style={styles.heading}><AppText style={styles.title}>Gestão da plataforma</AppText><AppText style={styles.subtitle}>Usuários, veículos e cadastros.</AppText></View>
      <View style={styles.adminSummary}>
        <AppText style={styles.adminNumber}>{overview ? overview.students + overview.teachers : '–'}</AppText>
        <View style={styles.adminSummaryCopy}><AppText style={styles.sectionLabel}>USUÁRIOS CADASTRADOS</AppText><AppText style={styles.adminHint}>{overview ? `${overview.students} alunos · ${overview.teachers} instrutores` : 'Carregando…'}</AppText></View>
        <StatusTag label={pendingTotal > 0 ? `${pendingTotal} PENDENTE${pendingTotal === 1 ? '' : 'S'}` : 'EM DIA'} />
      </View>
      <SectionHeading title="Veículos" aside={`${vehicles.length} cadastrado${vehicles.length === 1 ? '' : 's'}`} />
      {!!error && <AppText style={styles.error}>{error}</AppText>}
      {vehicles.map((vehicle) => {
        const isActive = vehicle.status === 'active';
        return (
          <View key={vehicle.id} style={styles.vehicleRow}>
            <View style={styles.vehicleMark}><AppText style={styles.vehicleMarkText}>▣</AppText></View>
            <View style={styles.vehicleCopy}><AppText style={styles.vehicleName}>{vehicle.model}</AppText><AppText style={styles.vehicleOwner}>{vehicle.ownerName} · {vehicle.year} · {vehicle.transmission} · final {vehicle.plate.slice(-2)}</AppText></View>
            <Pressable accessibilityRole="button" disabled={updatingId === vehicle.id} onPress={() => toggleVehicle(vehicle)} style={[styles.reviewControl, isActive && styles.reviewControlDone]}>
              <AppText style={[styles.reviewText, isActive && styles.reviewTextDone]}>{updatingId === vehicle.id ? '…' : isActive ? 'Ativo' : 'Aprovar'}</AppText>
            </Pressable>
          </View>
        );
      })}
      <View style={styles.sectionGap}><SectionHeading title="Acessos rápidos" /></View>
      <AdminSetting title="Alunos" detail={overview ? `${overview.students} perfis cadastrados` : 'Carregando…'} />
      <AdminSetting title="Instrutores" detail={overview ? `${overview.pendingTeachers} cadastro${overview.pendingTeachers === 1 ? '' : 's'} aguardando aprovação` : 'Carregando…'} onPress={() => router.navigate('/(tabs)/teachers')} />
      <AdminSetting title="Pagamentos" detail="Acompanhar repasses das aulas" />
      <View style={styles.logout}><ActionButton label="Sair da conta" variant="secondary" onPress={signOut} /></View>
    </Screen>
  );
}

function initialsOf(name: string) {
  return name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.infoRow}><AppText style={styles.infoLabel}>{label}</AppText><AppText style={styles.infoValue}>{value}</AppText></View>;
}

function AdminSetting({ title, detail, onPress }: { title: string; detail: string; onPress?: () => void }) {
  return <Pressable accessibilityRole={onPress ? 'button' : undefined} disabled={!onPress} onPress={onPress} style={styles.settingRow}><View style={styles.settingCopy}><AppText style={styles.vehicleName}>{title}</AppText><AppText style={styles.vehicleOwner}>{detail}</AppText></View><AppText style={styles.settingArrow}>›</AppText></Pressable>;
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
  logout: { marginTop: 25 },
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
  error: { color: DriveColors.danger, fontSize: 12, lineHeight: 17, marginBottom: 8 },
});
