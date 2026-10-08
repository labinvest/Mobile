import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ActionButton, AppText, FormField, Screen, SectionHeading, StatusTag, TopBar } from '@/components/drive-ui';
import { DriveColors } from '@/constants/drive-theme';
import { useDriveApp } from '@/hooks/use-drive-app';

const instructors = [
  { id: 'ana', name: 'Ana Paula Ribeiro', initials: 'AR', rating: '4,9', reviews: 86, area: 'Vila Mariana · 2,1 km', vehicle: 'HB20 2023 · Automático', price: 'R$ 85', tags: ['Paciente', 'Primeira habilitação'] },
  { id: 'marcos', name: 'Marcos Vieira', initials: 'MV', rating: '4,8', reviews: 54, area: 'Saúde · 3,4 km', vehicle: 'Onix 2022 · Manual', price: 'R$ 75', tags: ['Aulas noturnas', 'Categoria B'] },
  { id: 'roberta', name: 'Roberta Nunes', initials: 'RN', rating: '5,0', reviews: 41, area: 'Ipiranga · 4,0 km', vehicle: 'Argo 2024 · Manual', price: 'R$ 90', tags: ['Aprovada no exame', 'Categoria AB'] },
];

export default function TeachersScreen() {
  const { role, appointments } = useDriveApp();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Todos');
  const [approved, setApproved] = useState<string[]>([]);
  const filtered = instructors.filter((person) => `${person.name} ${person.area} ${person.vehicle}`.toLowerCase().includes(query.toLowerCase()));

  if (role === 'teacher') return <StudentRoster />;

  return (
    <Screen>
      <TopBar roleLabel={role === 'admin' ? 'Gestão de pessoas' : 'Encontre seu instrutor'} />
      <View style={styles.heading}>
        <AppText style={styles.title}>{role === 'admin' ? 'Instrutores' : 'Quem vai te ensinar?'}</AppText>
        <AppText style={styles.subtitle}>{role === 'admin' ? 'Revise os cadastros e documentos da plataforma.' : 'Profissionais independentes perto de você.'}</AppText>
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
      <SectionHeading title={role === 'admin' ? 'Cadastros recentes' : 'Bem avaliados na sua região'} aside={`${filtered.length} perfis`} />
      {filtered.filter((person) => filter === 'Todos' || person.vehicle.toLowerCase().includes(filter.toLowerCase())).map((person) => {
        const existingAppointment = appointments.find((appointment) => appointment.teacherId === person.id && ['requested', 'scheduled', 'in-progress'].includes(appointment.status));
        const alreadyApproved = approved.includes(person.id);
        const submittedRatings = appointments.flatMap((appointment) => appointment.teacherId === person.id && appointment.reviews?.student ? [appointment.reviews.student.rating] : []);
        const displayedRating = submittedRatings.length ? (submittedRatings.reduce((sum, rating) => sum + rating, 0) / submittedRatings.length).toFixed(1).replace('.', ',') : person.rating;
        const displayedReviewCount = person.reviews + submittedRatings.length;
        return (
          <View key={person.id} style={styles.teacherRow}>
            <View style={styles.identityRow}>
              <View style={styles.avatar}><AppText style={styles.avatarText}>{person.initials}</AppText></View>
              <View style={styles.identity}>
                <AppText style={styles.name}>{person.name}</AppText>
                <AppText style={styles.area}>{person.area}</AppText>
              </View>
              <View style={styles.rating}><AppText style={styles.star}>★</AppText><AppText style={styles.ratingText}>{displayedRating}</AppText><AppText style={styles.reviews}>({displayedReviewCount})</AppText></View>
            </View>
            <View style={styles.details}>
              <AppText style={styles.detail}>{person.vehicle}</AppText>
              <View style={styles.tags}>{person.tags.map((tag) => <StatusTag key={tag} label={tag} />)}</View>
            </View>
            <View style={styles.footer}>
              <AppText style={styles.price}>{person.price}<AppText style={styles.priceUnit}> / aula</AppText></AppText>
              {role === 'admin' ? (
                <Pressable onPress={() => setApproved((previous) => alreadyApproved ? previous.filter((id) => id !== person.id) : [...previous, person.id])} style={[styles.approveButton, alreadyApproved && styles.approvedButton]}>
                  <AppText style={[styles.approveText, alreadyApproved && styles.approvedText]}>{alreadyApproved ? 'Aprovado' : 'Revisar cadastro'}</AppText>
                </Pressable>
              ) : (
                <ActionButton
                  label={existingAppointment?.status === 'requested' ? 'Aguardando resposta' : existingAppointment ? 'Aula agendada' : 'Ver horários'}
                  onPress={() => router.push({ pathname: '/booking', params: { teacherId: person.id, teacherName: person.name, vehicle: person.vehicle, area: person.area, price: person.price } })}
                  disabled={Boolean(existingAppointment)}
                  compact
                />
              )}
            </View>
          </View>
        );
      })}
      {filtered.length === 0 && <AppText style={styles.empty}>Nenhum perfil encontrado para essa busca.</AppText>}
      {role === 'student' && <AppText style={styles.disclaimer}>Valores e horários são demonstrativos. Combine os detalhes diretamente com o instrutor.</AppText>}
    </Screen>
  );
}

function StudentRoster() {
  const { appointments } = useDriveApp();
  const learners = [
    ['JM', 'Julia Martins', '12 aulas · Prova prática', '60%'],
    ['RC', 'Rafael Costa', '6 aulas · Fundamentos', '30%'],
    ['LA', 'Lara Alves', '18 aulas · Revisão final', '90%'],
    ['FN', 'Felipe Nunes', '3 aulas · Primeiros passos', '15%'],
  ];

  return (
    <Screen>
      <TopBar roleLabel="Sua turma" />
      <View style={styles.heading}><AppText style={styles.title}>Meus alunos</AppText><AppText style={styles.subtitle}>Acompanhe o avanço de cada pessoa.</AppText></View>
      <FormField label="Buscar aluno" accessibilityLabel="Buscar aluno" placeholder="Nome do aluno" style={styles.search} />
      <SectionHeading title="Em andamento" aside="8 alunos" />
      {learners.map(([initials, name, detail, progress]) => {
        const ratings = appointments.flatMap((appointment) => appointment.studentName === name && appointment.reviews?.teacher ? [appointment.reviews.teacher.rating] : []);
        const average = ratings.length ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1).replace('.', ',') : undefined;
        return (
          <View key={name} style={styles.rosterRow}>
            <View style={styles.avatar}><AppText style={styles.avatarText}>{initials}</AppText></View>
            <View style={styles.identity}><AppText style={styles.name}>{name}</AppText><AppText style={styles.area}>{detail}</AppText>{!!average && <AppText style={styles.studentRating}>★ {average}/5 · {ratings.length} avaliação{ratings.length === 1 ? '' : 'ões'}</AppText>}</View>
            <AppText style={styles.progress}>{progress}</AppText>
          </View>
        );
      })}
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
});