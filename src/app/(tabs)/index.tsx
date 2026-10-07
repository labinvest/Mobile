import { Link, router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Card, ProgressBar } from 'react-native-paper';

import { ActionButton, AppText, Screen, SectionHeading, StatusTag, TopBar } from '@/components/drive-ui';
import { DriveColors } from '@/constants/drive-theme';
import { Role, useDriveApp } from '@/hooks/use-drive-app';

const roleLabels: Record<Role, string> = { student: 'Aluno', teacher: 'Instrutor', admin: 'Administrador' };

export default function HomeScreen() {
  const { role, appointments, accountName } = useDriveApp();
  if (role === 'teacher') return <TeacherDashboard accountName={accountName} />;
  if (role === 'admin') return <AdminDashboard />;

  const nextLesson = appointments[0];

  return (
    <Screen>
      <TopBar roleLabel={roleLabels.student} />
      <View style={styles.greeting}>
        <AppText style={styles.eyebrow}>QUARTA-FEIRA, 7 DE OUTUBRO</AppText>
        <AppText style={styles.title}>Oi, {accountName.split(' ')[0]}.</AppText>
        <AppText style={styles.subtitle}>Um passo de cada vez. Você está indo bem.</AppText>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <StatusTag label="PRÓXIMA AULA" dark />
          <AppText style={styles.heroDate}>{nextLesson?.date ?? 'Escolha um horário'}</AppText>
        </View>
        <AppText style={styles.heroTime}>{nextLesson?.time ?? 'Sua agenda está livre'}</AppText>
        <AppText style={styles.heroTeacher}>{nextLesson ? `com ${nextLesson.teacherName}` : 'Encontre um instrutor para começar'}</AppText>
        <View style={styles.heroBottom}>
          <AppText style={styles.heroVehicle}>{nextLesson?.vehicle ?? 'Aula prática'}</AppText>
          <Link href="/(tabs)/schedule" asChild>
            <Pressable accessibilityRole="button" style={styles.arrowButton}><AppText style={styles.arrow}>›</AppText></Pressable>
          </Link>
        </View>
      </View>

      <View style={styles.progressSection}>
        <SectionHeading title="Seu progresso" aside="Ver detalhes" />
        <View style={styles.progressRow}>
          <View>
            <AppText style={styles.progressNumber}>12 <AppText style={styles.progressTotal}>/ 20 aulas</AppText></AppText>
            <AppText style={styles.progressCaption}>Etapa prática em andamento</AppText>
          </View>
          <AppText style={styles.progressPercent}>60%</AppText>
        </View>
        <ProgressBar progress={0.6} color={DriveColors.green} style={styles.progressTrack} />
        <View style={styles.milestones}>
          <Milestone label="Legislação" value="Concluída" complete />
          <Milestone label="Prática" value="Em andamento" />
          <Milestone label="Prova" value="Pendente" />
        </View>
      </View>

      <View style={styles.shortcuts}>
        <SectionHeading title="Continue sua jornada" />
        <Card mode="outlined" onPress={() => router.navigate('/(tabs)/teachers')} style={styles.findCard}>
          <Card.Content style={styles.findRow}>
            <View style={styles.findIcon}><AppText style={styles.findIconText}>＋</AppText></View>
            <View style={styles.findCopy}>
              <AppText style={styles.findTitle}>Encontrar instrutor</AppText>
              <AppText style={styles.findSubtitle}>Avaliações, veículos e horários</AppText>
            </View>
            <AppText style={styles.findArrow}>›</AppText>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.tip}>
        <AppText style={styles.tipLabel}>DICA DA SEMANA</AppText>
        <AppText style={styles.tipText}>Pratique olhar os retrovisores a cada mudança de direção.</AppText>
      </View>
    </Screen>
  );
}

function Milestone({ label, value, complete }: { label: string; value: string; complete?: boolean }) {
  return (
    <View style={styles.milestone}>
      <View style={[styles.milestoneDot, complete && styles.milestoneComplete]} />
      <AppText style={styles.milestoneLabel}>{label}</AppText>
      <AppText style={styles.milestoneValue}>{value}</AppText>
    </View>
  );
}

function TeacherDashboard({ accountName }: { accountName: string }) {
  return (
    <Screen>
      <TopBar roleLabel={roleLabels.teacher} />
      <View style={styles.greeting}>
        <AppText style={styles.eyebrow}>QUARTA-FEIRA, 7 DE OUTUBRO</AppText>
        <AppText style={styles.title}>Bom dia, {accountName.split(' ')[0]}.</AppText>
        <AppText style={styles.subtitle}>Sua agenda de hoje está pronta.</AppText>
      </View>
      <View style={styles.teacherHero}>
        <AppText style={styles.teacherHeroLabel}>AULAS DE HOJE</AppText>
        <AppText style={styles.teacherHeroNumber}>4 <AppText style={styles.teacherHeroSuffix}>aulas</AppText></AppText>
        <AppText style={styles.teacherHeroInfo}>Próxima às 10h30 · Julia Martins</AppText>
        <ActionButton label="Abrir agenda" variant="light" onPress={() => router.navigate('/(tabs)/schedule')} />
      </View>
      <View style={styles.progressSection}>
        <SectionHeading title="Seus alunos" aside="Ver todos" />
        <PersonRow initials="JM" name="Julia Martins" detail="12 aulas · Categoria B" status="Em prática" />
        <PersonRow initials="RC" name="Rafael Costa" detail="6 aulas · Categoria B" status="Iniciante" />
        <PersonRow initials="LA" name="Lara Alves" detail="18 aulas · Categoria AB" status="Prova em breve" />
      </View>
      <View style={styles.vehicleStrip}>
        <AppText style={styles.vehicleIcon}>▣</AppText>
        <View style={styles.findCopy}><AppText style={styles.findTitle}>Seu veículo</AppText><AppText style={styles.findSubtitle}>Chevrolet Onix · 2022 · Manual</AppText></View>
        <StatusTag label="ATIVO" />
      </View>
    </Screen>
  );
}

function AdminDashboard() {
  return (
    <Screen>
      <TopBar roleLabel={roleLabels.admin} />
      <View style={styles.greeting}>
        <AppText style={styles.eyebrow}>PAINEL DE CONTROLE</AppText>
        <AppText style={styles.title}>Visão geral</AppText>
        <AppText style={styles.subtitle}>Acompanhe a operação da plataforma.</AppText>
      </View>
      <View style={styles.metrics}>
        <Metric value="248" label="Alunos ativos" />
        <Metric value="32" label="Instrutores" />
        <Metric value="86" label="Aulas no mês" />
      </View>
      <View style={styles.progressSection}>
        <SectionHeading title="Pendências" aside="3 novas" />
        <ReviewRow initials="CF" title="Cadastro de instrutor" detail="Carlos Ferreira · Categoria B" />
        <ReviewRow initials="ON" title="Veículo para aprovação" detail="Honda City · 2023 · Placa final 42" />
        <ReviewRow initials="MA" title="Verificação de documento" detail="Marina Andrade · CNH enviada" />
      </View>
      <Link href="/(tabs)/account" asChild>
        <Pressable style={styles.adminLink} accessibilityRole="button">
          <AppText style={styles.adminLinkTitle}>Gerenciar usuários e veículos</AppText>
          <AppText style={styles.findArrow}>›</AppText>
        </Pressable>
      </Link>
    </Screen>
  );
}

function PersonRow({ initials, name, detail, status }: { initials: string; name: string; detail: string; status: string }) {
  return (
    <View style={styles.personRow}>
      <View style={styles.avatar}><AppText style={styles.avatarText}>{initials}</AppText></View>
      <View style={styles.personCopy}><AppText style={styles.personName}>{name}</AppText><AppText style={styles.personDetail}>{detail}</AppText></View>
      <AppText style={styles.personStatus}>{status}</AppText>
    </View>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return <View style={styles.metric}><AppText style={styles.metricValue}>{value}</AppText><AppText style={styles.metricLabel}>{label}</AppText></View>;
}

function ReviewRow({ initials, title, detail }: { initials: string; title: string; detail: string }) {
  return <View style={styles.reviewRow}><View style={styles.reviewAvatar}><AppText style={styles.reviewInitials}>{initials}</AppText></View><View style={styles.personCopy}><AppText style={styles.personName}>{title}</AppText><AppText style={styles.personDetail}>{detail}</AppText></View><AppText style={styles.findArrow}>›</AppText></View>;
}

const styles = StyleSheet.create({
  greeting: { marginTop: 28, marginBottom: 22, gap: 5 },
  eyebrow: { color: DriveColors.green, fontSize: 11, fontWeight: '700' },
  title: { color: DriveColors.ink, fontSize: 30, lineHeight: 36, fontWeight: '700' },
  subtitle: { color: DriveColors.muted, fontSize: 15, lineHeight: 21 },
  hero: { backgroundColor: DriveColors.ink, borderRadius: 12, padding: 20, marginBottom: 28 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroDate: { color: '#D7DFD7', fontSize: 12, fontWeight: '500' },
  heroTime: { color: DriveColors.white, fontSize: 28, fontWeight: '700', marginTop: 18 },
  heroTeacher: { color: '#D7DFD7', fontSize: 14, marginTop: 3 },
  heroBottom: { borderTopWidth: 1, borderTopColor: '#46544C', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, paddingTop: 14 },
  heroVehicle: { color: DriveColors.white, fontSize: 13 },
  arrowButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#3D4B42' },
  arrow: { color: DriveColors.white, fontSize: 25, lineHeight: 28 },
  progressSection: { marginBottom: 26 },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  progressNumber: { color: DriveColors.ink, fontSize: 25, fontWeight: '700' },
  progressTotal: { color: DriveColors.muted, fontSize: 14, fontWeight: '500' },
  progressCaption: { color: DriveColors.muted, fontSize: 12, marginTop: 2 },
  progressPercent: { color: DriveColors.green, fontSize: 16, fontWeight: '700' },
  progressTrack: { height: 8, borderRadius: 8, marginTop: 14 },
  milestones: { marginTop: 12, gap: 9 },
  milestone: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  milestoneDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#C9D0C8' },
  milestoneComplete: { backgroundColor: DriveColors.green },
  milestoneLabel: { color: DriveColors.ink, fontSize: 13, width: 92 },
  milestoneValue: { color: DriveColors.muted, fontSize: 12 },
  shortcuts: { marginBottom: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: DriveColors.line },
  findCard: { minHeight: 82, borderColor: DriveColors.line, borderRadius: 10, backgroundColor: DriveColors.white },
  findRow: { minHeight: 80, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  findIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: DriveColors.lime },
  findIconText: { color: DriveColors.ink, fontSize: 26, lineHeight: 28 },
  findCopy: { flex: 1, minWidth: 0, gap: 3 },
  findTitle: { color: DriveColors.ink, fontSize: 14, fontWeight: '600' },
  findSubtitle: { color: DriveColors.muted, fontSize: 12, lineHeight: 17 },
  findArrow: { color: DriveColors.muted, fontSize: 24 },
  tip: { paddingVertical: 15, borderTopWidth: 1, borderTopColor: DriveColors.line },
  tipLabel: { color: DriveColors.green, fontSize: 10, fontWeight: '700' },
  tipText: { color: DriveColors.ink, fontSize: 14, lineHeight: 20, marginTop: 6 },
  teacherHero: { backgroundColor: DriveColors.green, borderRadius: 12, padding: 20, marginBottom: 25 },
  teacherHeroLabel: { color: '#D8E9DE', fontSize: 11, fontWeight: '700' },
  teacherHeroNumber: { color: DriveColors.white, fontSize: 36, fontWeight: '700', marginTop: 8 },
  teacherHeroSuffix: { color: '#D8E9DE', fontSize: 16, fontWeight: '500' },
  teacherHeroInfo: { color: DriveColors.white, fontSize: 13, marginTop: 3, marginBottom: 17 },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: DriveColors.line },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E7EEE8' },
  avatarText: { color: DriveColors.green, fontSize: 12, fontWeight: '700' },
  personCopy: { flex: 1, gap: 3 },
  personName: { color: DriveColors.ink, fontSize: 14, fontWeight: '600' },
  personDetail: { color: DriveColors.muted, fontSize: 12 },
  personStatus: { color: DriveColors.green, fontSize: 11, fontWeight: '600' },
  vehicleStrip: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: DriveColors.line, paddingTop: 16 },
  vehicleIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: DriveColors.surfaceMuted, textAlign: 'center', textAlignVertical: 'center', color: DriveColors.ink, fontSize: 17, overflow: 'hidden' },
  metrics: { flexDirection: 'row', gap: 9, marginBottom: 25 },
  metric: { flex: 1, backgroundColor: DriveColors.surfaceMuted, padding: 13, borderRadius: 9, minHeight: 78, justifyContent: 'center' },
  metricValue: { color: DriveColors.ink, fontSize: 22, fontWeight: '700' },
  metricLabel: { color: DriveColors.muted, fontSize: 11, marginTop: 4 },
  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: DriveColors.line },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: DriveColors.lime, alignItems: 'center', justifyContent: 'center' },
  reviewInitials: { color: DriveColors.ink, fontSize: 11, fontWeight: '700' },
  adminLink: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: DriveColors.line },
  adminLinkTitle: { color: DriveColors.green, fontSize: 14, fontWeight: '600' },
});