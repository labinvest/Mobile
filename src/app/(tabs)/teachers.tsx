import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ActionButton, AppText, FormField, Screen, SectionHeading, StatusTag, TopBar } from '@/components/drive-ui';
import { DriveColors } from '@/constants/drive-theme';
import { useApiData } from '@/hooks/use-api-data';
import { useDriveApp } from '@/hooks/use-drive-app';
import { api, errorMessage } from '@/lib/api';
import type { ApprovalStatus, Teacher, TeacherStudent } from '@/types/api';

const approvalLabels: Record<ApprovalStatus, string> = { pending: 'Em análise', approved: 'Aprovado', rejected: 'Recusado' };

export default function TeachersScreen() {
  const { role, appointments } = useDriveApp();
  const isAdmin = role === 'admin';
  const { data, setData, loading, error, reload } = useApiData<{ teachers: Teacher[] }>(role === 'teacher' ? null : isAdmin ? '/admin/teachers' : '/teachers');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Todos');
  const [actionError, setActionError] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const instructors = data?.teachers ?? [];
  const filtered = instructors.filter((person) => `${person.name} ${person.area} ${person.vehicle?.label ?? ''}`.toLowerCase().includes(query.toLowerCase()));
  const visible = filtered.filter((person) => filter === 'Todos' || person.vehicle?.transmission === filter);

  if (role === 'teacher') return <StudentRoster />;

  /** Admin: aprova o cadastro (e o veículo pendente) ou devolve para análise. */
  async function toggleApproval(person: Teacher) {
    setActionError('');
    setUpdatingId(person.id);
    try {
      const { teacher } = await api<{ teacher: Teacher }>(`/admin/teachers/${person.id}`, {
        method: 'PATCH',
        body: { approvalStatus: person.approvalStatus === 'approved' ? 'pending' : 'approved' },
      });
      setData((current) => current && { teachers: current.teachers.map((item) => (item.id === teacher.id ? teacher : item)) });
    } catch (caught) {
      setActionError(errorMessage(caught));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <Screen>
      <TopBar roleLabel={isAdmin ? 'Gestão de pessoas' : 'Encontre seu instrutor'} />
      <View style={styles.heading}>
        <AppText style={styles.title}>{isAdmin ? 'Instrutores' : 'Quem vai te ensinar?'}</AppText>
        <AppText style={styles.subtitle}>{isAdmin ? 'Revise os cadastros e documentos da plataforma.' : 'Profissionais independentes perto de você.'}</AppText>
      </View>
      <FormField
        label="Buscar instrutores"
        accessibilityLabel="Buscar por nome, região ou veículo"
        onChangeText={setQuery}
        placeholder="Nome, bairro ou veículo"
        style={styles.search}
        value={query}
      />
      {role === 'student' && (
        <View style={styles.filters}>
          {['Todos', 'Automático', 'Manual'].map((item) => (
            <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterSelected]}>
              <AppText style={[styles.filterText, filter === item && styles.filterTextSelected]}>{item}</AppText>
            </Pressable>
          ))}
        </View>
      )}
      <SectionHeading title={isAdmin ? 'Cadastros recentes' : 'Bem avaliados na sua região'} aside={`${visible.length} perfis`} />
      {!!actionError && <AppText style={styles.error}>{actionError}</AppText>}
      {visible.map((person) => {
        const existingAppointment = appointments.find((appointment) => appointment.teacherId === person.id && ['requested', 'scheduled', 'in-progress'].includes(appointment.status));
        const approved = person.approvalStatus === 'approved';
        return (
          <View key={person.id} style={styles.teacherRow}>
            <View style={styles.identityRow}>
              <View style={styles.avatar}><AppText style={styles.avatarText}>{person.initials}</AppText></View>
              <View style={styles.identity}>
                <AppText style={styles.name}>{person.name}</AppText>
                <AppText style={styles.area}>{isAdmin ? `${person.area} · ${approvalLabels[person.approvalStatus]}` : person.area}</AppText>
              </View>
              <View style={styles.rating}><AppText style={styles.star}>★</AppText><AppText style={styles.ratingText}>{person.rating ?? 'Novo'}</AppText><AppText style={styles.reviews}>({person.reviewCount})</AppText></View>
            </View>
            <View style={styles.details}>
              <AppText style={styles.detail}>{person.vehicle?.label ?? 'Veículo não informado'}</AppText>
              <View style={styles.tags}>{person.tags.map((tag) => <StatusTag key={tag} label={tag} />)}</View>
            </View>
            <View style={styles.footer}>
              <AppText style={styles.price}>{person.price}<AppText style={styles.priceUnit}> / aula</AppText></AppText>
              {isAdmin ? (
                <Pressable disabled={updatingId === person.id} onPress={() => toggleApproval(person)} style={[styles.approveButton, approved && styles.approvedButton]}>
                  <AppText style={[styles.approveText, approved && styles.approvedText]}>{updatingId === person.id ? 'Salvando…' : approved ? 'Aprovado' : 'Aprovar cadastro'}</AppText>
                </Pressable>
              ) : (
                <ActionButton
                  label={existingAppointment?.status === 'requested' ? 'Aguardando resposta' : existingAppointment ? 'Aula agendada' : 'Ver horários'}
                  onPress={() => router.push({ pathname: '/booking', params: { teacherId: String(person.id), teacherName: person.name, vehicle: person.vehicle?.label, area: person.area, price: person.price } })}
                  disabled={Boolean(existingAppointment)}
                  compact
                />
              )}
            </View>
          </View>
        );
      })}
      {loading && !data && <AppText style={styles.empty}>Carregando instrutores…</AppText>}
      {!!error && <View style={styles.errorBlock}><AppText style={styles.error}>{error}</AppText><ActionButton label="Tentar novamente" variant="secondary" onPress={reload} /></View>}
      {!!data && visible.length === 0 && <AppText style={styles.empty}>Nenhum perfil encontrado para essa busca.</AppText>}
      {role === 'student' && <AppText style={styles.disclaimer}>Cada instrutor define o valor da aula. Combine os detalhes diretamente com ele.</AppText>}
    </Screen>
  );
}

function StudentRoster() {
  const { data, loading, error, reload } = useApiData<{ students: TeacherStudent[] }>('/teachers/me/students');
  const [query, setQuery] = useState('');
  const learners = (data?.students ?? []).filter((student) => student.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <Screen>
      <TopBar roleLabel="Sua turma" />
      <View style={styles.heading}><AppText style={styles.title}>Meus alunos</AppText><AppText style={styles.subtitle}>Acompanhe o avanço de cada pessoa.</AppText></View>
      <FormField label="Buscar aluno" accessibilityLabel="Buscar aluno" placeholder="Nome do aluno" style={styles.search} value={query} onChangeText={setQuery} />
      <SectionHeading title="Em andamento" aside={`${learners.length} aluno${learners.length === 1 ? '' : 's'}`} />
      {learners.map((student) => (
        <View key={student.id} style={styles.rosterRow}>
          <View style={styles.avatar}><AppText style={styles.avatarText}>{student.initials}</AppText></View>
          <View style={styles.identity}>
            <AppText style={styles.name}>{student.name}</AppText>
            <AppText style={styles.area}>{student.completedLessons} aula{student.completedLessons === 1 ? '' : 's'} · {student.lastLesson ?? `Categoria ${student.category}`}</AppText>
            {!!student.rating && <AppText style={styles.studentRating}>★ {student.rating}/5 · {student.reviewCount} avaliação{student.reviewCount === 1 ? '' : 'ões'}</AppText>}
          </View>
          <AppText style={styles.progress}>{student.progress}%</AppText>
        </View>
      ))}
      {loading && !data && <AppText style={styles.empty}>Carregando alunos…</AppText>}
      {!!error && <View style={styles.errorBlock}><AppText style={styles.error}>{error}</AppText><ActionButton label="Tentar novamente" variant="secondary" onPress={reload} /></View>}
      {!!data && learners.length === 0 && <AppText style={styles.empty}>{query ? 'Nenhum aluno encontrado.' : 'Seus alunos aparecem aqui depois do primeiro pedido de aula.'}</AppText>}
      <View style={styles.rosterLink}><ActionButton label="Ver agenda dos alunos" variant="secondary" onPress={() => router.navigate('/(tabs)/schedule')} /></View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { marginTop: 26, marginBottom: 18, gap: 5 },
  title: { color: DriveColors.ink, fontSize: 28, lineHeight: 34, fontWeight: '700' },
  subtitle: { color: DriveColors.muted, fontSize: 14, lineHeight: 20 },
  search: { minHeight: 48, backgroundColor: DriveColors.white, borderColor: DriveColors.line, borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, color: DriveColors.ink, fontSize: 14, marginBottom: 16 },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 22 },
  filter: { borderWidth: 1, borderColor: DriveColors.line, borderRadius: 18, paddingVertical: 7, paddingHorizontal: 13 },
  filterSelected: { backgroundColor: DriveColors.ink, borderColor: DriveColors.ink },
  filterText: { color: DriveColors.muted, fontSize: 12, fontWeight: '600' },
  filterTextSelected: { color: DriveColors.white },
  teacherRow: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: DriveColors.line },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#E7EEE8', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: DriveColors.green, fontSize: 13, fontWeight: '700' },
  identity: { flex: 1, gap: 3 },
  name: { color: DriveColors.ink, fontSize: 14, fontWeight: '600' },
  area: { color: DriveColors.muted, fontSize: 12 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  star: { color: '#D99A27', fontSize: 13 },
  ratingText: { color: DriveColors.ink, fontSize: 12, fontWeight: '700' },
  reviews: { color: DriveColors.muted, fontSize: 11 },
  details: { paddingLeft: 52, paddingTop: 8, gap: 9 },
  detail: { color: DriveColors.ink, fontSize: 12 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 52, paddingTop: 11 },
  price: { color: DriveColors.ink, fontSize: 16, fontWeight: '700' },
  priceUnit: { color: DriveColors.muted, fontSize: 11, fontWeight: '400' },
  approveButton: { minHeight: 36, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 7, backgroundColor: DriveColors.lime },
  approvedButton: { backgroundColor: DriveColors.surfaceMuted },
  approveText: { color: DriveColors.ink, fontSize: 12, fontWeight: '700' },
  approvedText: { color: DriveColors.green },
  empty: { color: DriveColors.muted, fontSize: 14, paddingVertical: 28, textAlign: 'center' },
  disclaimer: { color: DriveColors.muted, fontSize: 11, lineHeight: 16, marginTop: 18 },
  rosterRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: DriveColors.line },
  progress: { color: DriveColors.green, fontSize: 13, fontWeight: '700' },
  studentRating: { color: '#9A6900', fontSize: 10, marginTop: 3 },
  rosterLink: { marginTop: 18 },
  error: { color: DriveColors.danger, fontSize: 12, lineHeight: 17, marginBottom: 10 },
  errorBlock: { paddingVertical: 12 },
});
