import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar, Badge, Button, IconTile, ListRow, Notice, Screen, SectionHeader, Skeleton, Surface, Text, type BadgeTone } from '@/components/ui';
import { useApiData } from '@/hooks/use-api-data';
import { useDriveApp } from '@/hooks/use-drive-app';
import { api, errorMessage } from '@/lib/api';
import { timeAgo } from '@/lib/dates';
import { haptic } from '@/lib/haptics';
import { openInstructor } from '@/lib/navigation';
import type { AdminVehicle, ApprovalStatus, Category, VehicleStatus } from '@/types/api';
import { colors, radius, space } from '@/theme/tokens';

const CATEGORY_LABEL: Record<Category, string> = { A: 'A · moto', B: 'B · carro', AB: 'AB · carro e moto' };
const APPROVAL: Record<ApprovalStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: 'Em análise', tone: 'warning' },
  approved: { label: 'Aprovado', tone: 'success' },
  rejected: { label: 'Recusado', tone: 'danger' },
};
const VEHICLE: Record<VehicleStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: 'Em análise', tone: 'warning' },
  active: { label: 'Ativo', tone: 'success' },
  rejected: { label: 'Recusado', tone: 'danger' },
};

/** Perfil e conta. O conteúdo do meio muda com o papel; ajuda e saída são comuns. */
export function ProfileScreen() {
  const { role, user, signOut } = useDriveApp();
  const student = user?.student;
  const teacher = user?.teacher;

  return (
    <Screen>
      <View style={styles.identity}>
        <Avatar initials={user?.initials ?? ''} seed={user?.id} size={72} />
        <View style={styles.flex}>
          <Text variant="title2" numberOfLines={2}>{user?.name}</Text>
          <Text variant="footnote" tone="muted" numberOfLines={1}>{user?.email}</Text>
          <View style={styles.badges}>
            {role === 'student' && <Badge label="Aluno" tone="brand" icon="school-outline" />}
            {role === 'teacher' && teacher && <Badge label={APPROVAL[teacher.approvalStatus].label} tone={APPROVAL[teacher.approvalStatus].tone} icon="steering" />}
            {role === 'admin' && <Badge label="Administração" tone="inverse" icon="shield-account-outline" />}
          </View>
        </View>
      </View>

      {student && (
        <View style={styles.section}>
          <SectionHeader title="Sua formação" />
          <Surface padded={false} style={styles.list}>
            <ListRow title={CATEGORY_LABEL[student.category]} subtitle="Categoria pretendida" leading={<IconTile icon="card-account-details-outline" />} />
            <ListRow title={`${student.completedLessons} de ${student.lessonsGoal} aulas`} subtitle="Meta pessoal de aulas práticas" leading={<IconTile icon="flag-checkered" />} />
            <ListRow title={user?.city ?? 'Não informada'} subtitle="Cidade" leading={<IconTile icon="map-marker-outline" />} divider={false} />
          </Surface>
        </View>
      )}

      {teacher && (
        <>
          <View style={styles.section}>
            <SectionHeader title="Sua atuação" />
            <Surface padded={false} style={styles.list}>
              <ListRow title={`Categoria ${teacher.cnhCategory}`} subtitle={teacher.cnhExpiry ? `CNH válida até ${teacher.cnhExpiry.split('-').reverse().join('/')}` : 'CNH'} leading={<IconTile icon="card-account-details-outline" />} />
              <ListRow title={teacher.experience} subtitle="Experiência como instrutor" leading={<IconTile icon="medal-outline" />} />
              <ListRow title={`${teacher.price} por aula`} subtitle={teacher.area} leading={<IconTile icon="cash" />} onPress={() => router.push('/teaching-profile')} />
              <ListRow
                title={teacher.vehicle?.label ?? 'Nenhum veículo'}
                subtitle={teacher.vehicle ? `${teacher.vehicle.plate ? `Placa ${teacher.vehicle.plate} · ` : ''}${teacher.vehicle.dualControl ? 'duplo comando' : 'sem duplo comando'}` : 'Cadastre um veículo para dar aulas'}
                leading={<IconTile icon="car-outline" />}
                trailing={teacher.vehicle ? <Badge label={VEHICLE[teacher.vehicle.status].label} tone={VEHICLE[teacher.vehicle.status].tone} /> : undefined}
                divider={teacher.approvalStatus === 'approved'}
              />
              {teacher.approvalStatus === 'approved' && user && (
                <ListRow title="Ver meu perfil público" subtitle="Como os alunos te encontram" leading={<IconTile icon="account-eye-outline" />} onPress={() => openInstructor(user)} divider={false} />
              )}
            </Surface>
          </View>
          {teacher.latestReview && (
            <View style={styles.section}>
              <SectionHeader title="Última avaliação" />
              <Surface style={styles.quote}>
                <Text variant="body" tone="secondary">“{teacher.latestReview.comment}”</Text>
                <Text variant="footnote" tone="muted">{teacher.latestReview.authorName.split(' ')[0]} · {teacher.latestReview.rating} ★ · {timeAgo(teacher.latestReview.submittedAt)}</Text>
              </Surface>
            </View>
          )}
        </>
      )}

      {role === 'admin' && <VehicleReview />}

      <View style={styles.section}>
        <Surface padded={false} style={styles.list}>
          {role !== 'admin' && <ListRow title="Notificações" leading={<IconTile icon="bell-outline" />} onPress={() => router.push('/notifications')} />}
          <ListRow title="Central de ajuda" subtitle="Processo da CNH e dúvidas sobre o app" leading={<IconTile icon="help-circle-outline" />} onPress={() => router.push('/help')} divider={false} />
        </Surface>
      </View>

      <Button label="Sair da conta" variant="danger" icon="logout" onPress={signOut} style={styles.signOut} />
      <Text variant="footnote" tone="muted" align="center" style={styles.version}>Rota · versão 1.0</Text>
    </Screen>
  );
}

/** Admin: veículos aguardando análise primeiro; aprovar libera o carro para as aulas. */
function VehicleReview() {
  const { data, setData, error, reload } = useApiData<{ vehicles: AdminVehicle[] }>('/admin/vehicles');
  const [busy, setBusy] = useState<number | null>(null);
  const [actionError, setActionError] = useState('');

  async function setStatus(vehicle: AdminVehicle, status: VehicleStatus) {
    setActionError('');
    setBusy(vehicle.id);
    try {
      const { vehicle: updated } = await api<{ vehicle: AdminVehicle }>(`/admin/vehicles/${vehicle.id}`, { method: 'PATCH', body: { status } });
      setData((current) => current && { vehicles: current.vehicles.map((item) => (item.id === updated.id ? updated : item)) });
      haptic.success();
    } catch (caught) {
      haptic.error();
      setActionError(errorMessage(caught));
    } finally {
      setBusy(null);
    }
  }

  return (
    <View style={styles.section}>
      <SectionHeader title="Veículos" />
      {!!actionError && <Notice tone="danger" message={actionError} style={styles.notice} />}
      {error ? (
        <Notice tone="danger" message={error} actionLabel="Tentar de novo" onAction={reload} />
      ) : !data ? (
        <Skeleton height={120} rounded={radius.lg} />
      ) : (
        <Surface padded={false} style={styles.list}>
          {data.vehicles.length === 0 && <Text variant="callout" tone="muted" style={styles.empty}>Nenhum veículo cadastrado.</Text>}
          {data.vehicles.map((vehicle, index) => (
            <View key={vehicle.id} style={[styles.vehicle, index < data.vehicles.length - 1 && styles.divider]}>
              <View style={styles.vehicleTop}>
                <IconTile icon="car-outline" />
                <View style={styles.flex}>
                  <Text variant="bodyStrong">{vehicle.label}</Text>
                  <Text variant="footnote" tone="muted">{vehicle.ownerName} · {vehicle.plate}{vehicle.dualControl ? ' · duplo comando' : ''}</Text>
                </View>
                <Badge label={VEHICLE[vehicle.status].label} tone={VEHICLE[vehicle.status].tone} />
              </View>
              {vehicle.status === 'pending' && (
                <View style={styles.actions}>
                  <Button label="Recusar" variant="danger" disabled={busy !== null} onPress={() => setStatus(vehicle, 'rejected')} style={styles.flex} />
                  <Button label="Ativar" icon="check" disabled={busy !== null} loading={busy === vehicle.id} onPress={() => setStatus(vehicle, 'active')} style={styles.flex} />
                </View>
              )}
            </View>
          ))}
        </Surface>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: space.lg, paddingTop: space.xl },
  badges: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
  section: { marginTop: space.xxl },
  list: { paddingHorizontal: space.lg },
  quote: { gap: space.sm },
  notice: { marginBottom: space.md },
  empty: { paddingVertical: space.lg },
  vehicle: { paddingVertical: space.md, gap: space.md },
  vehicleTop: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.lineStrong },
  actions: { flexDirection: 'row', gap: space.md },
  signOut: { marginTop: space.xxl },
  version: { marginTop: space.lg },
});
