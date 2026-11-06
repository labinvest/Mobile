import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar, Badge, Button, EmptyState, Icon, Notice, Screen, SegmentedControl, Skeleton, Surface, Text, type BadgeTone, type IconName } from '@/components/ui';
import { useApiData } from '@/hooks/use-api-data';
import { api, errorMessage } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import type { ApprovalStatus, Teacher } from '@/types/api';
import { colors, radius, space } from '@/theme/tokens';

const statusMeta: Record<ApprovalStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: 'Em análise', tone: 'warning' },
  approved: { label: 'Aprovado', tone: 'success' },
  rejected: { label: 'Recusado', tone: 'danger' },
};

/** Admin: analisa cadastros de instrutores. Aprovar também ativa o veículo pendente. */
export function AdminTeachers() {
  const { data, setData, error, reload } = useApiData<{ teachers: Teacher[] }>('/admin/teachers');
  const [tab, setTab] = useState<ApprovalStatus>('pending');
  const [busy, setBusy] = useState<{ id: number; status: ApprovalStatus } | null>(null);
  const [actionError, setActionError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const all = data?.teachers ?? [];
  const list = all.filter((teacher) => teacher.approvalStatus === tab);
  const count = (status: ApprovalStatus) => all.filter((teacher) => teacher.approvalStatus === status).length;

  async function setStatus(teacher: Teacher, approvalStatus: ApprovalStatus) {
    setActionError('');
    setBusy({ id: teacher.id, status: approvalStatus });
    try {
      const { teacher: updated } = await api<{ teacher: Teacher }>(`/admin/teachers/${teacher.id}`, { method: 'PATCH', body: { approvalStatus } });
      setData((current) => current && { teachers: current.teachers.map((item) => (item.id === updated.id ? updated : item)) });
      haptic.success();
    } catch (caught) {
      haptic.error();
      setActionError(errorMessage(caught));
    } finally {
      setBusy(null);
    }
  }

  async function refresh() {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <View style={styles.header}>
        <Text variant="title1" accessibilityRole="header">Instrutores</Text>
        <Text variant="callout" tone="muted">Confira CNH, veículo e contato antes de liberar o perfil para os alunos.</Text>
      </View>

      <SegmentedControl
        value={tab}
        onChange={setTab}
        options={[{ value: 'pending', label: 'Análise', count: count('pending') }, { value: 'approved', label: 'Aprovados', count: count('approved') }, { value: 'rejected', label: 'Recusados', count: count('rejected') }]}
      />

      {!!actionError && <Notice tone="danger" message={actionError} style={styles.notice} />}

      <View style={styles.list}>
        {error ? (
          <Notice tone="danger" message={error} actionLabel="Tentar de novo" onAction={reload} />
        ) : !data ? (
          [0, 1].map((key) => <Skeleton key={key} height={180} rounded={radius.lg} />)
        ) : list.length === 0 ? (
          <EmptyState icon={tab === 'pending' ? 'check-all' : 'account-search-outline'} title={tab === 'pending' ? 'Nenhum cadastro para analisar' : 'Nenhum instrutor aqui'} />
        ) : (
          list.map((teacher) => (
            <Surface key={teacher.id} style={styles.card}>
              <View style={styles.top}>
                <Avatar initials={teacher.initials} seed={teacher.id} size={48} />
                <View style={styles.flex}>
                  <Text variant="headline" numberOfLines={1}>{teacher.name}</Text>
                  <Text variant="footnote" tone="muted" numberOfLines={1}>{teacher.email}{teacher.phone ? ` · ${teacher.phone}` : ''}</Text>
                </View>
                <Badge label={statusMeta[teacher.approvalStatus].label} tone={statusMeta[teacher.approvalStatus].tone} />
              </View>
              <View style={styles.facts}>
                <Fact icon="card-account-details-outline" text={`CNH categoria ${teacher.cnhCategory}${teacher.cnhExpiry ? ` · validade ${teacher.cnhExpiry.split('-').reverse().join('/')}` : ''}`} />
                <Fact icon="medal-outline" text={`${teacher.experience} de experiência · ${teacher.area}`} />
                <Fact icon="car-outline" text={teacher.vehicle ? `${teacher.vehicle.label}${teacher.vehicle.plate ? ` · ${teacher.vehicle.plate}` : ''}${teacher.vehicle.dualControl ? ' · duplo comando' : ''}` : 'Sem veículo cadastrado'} />
              </View>
              <View style={styles.actions}>
                {teacher.approvalStatus !== 'rejected' && (
                  <Button label={teacher.approvalStatus === 'approved' ? 'Suspender' : 'Recusar'} variant="danger" disabled={!!busy} loading={busy?.id === teacher.id && busy.status === 'rejected'} onPress={() => setStatus(teacher, 'rejected')} style={styles.flex} />
                )}
                {teacher.approvalStatus !== 'approved' && (
                  <Button label="Aprovar" icon="check" disabled={!!busy} loading={busy?.id === teacher.id && busy.status === 'approved'} onPress={() => setStatus(teacher, 'approved')} style={styles.flex} />
                )}
              </View>
            </Surface>
          ))
        )}
      </View>
    </Screen>
  );
}

function Fact({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.fact}>
      <Icon name={icon} size={16} color={colors.muted} />
      <Text variant="footnote" tone="secondary" style={styles.flex}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  header: { paddingTop: space.lg, paddingBottom: space.lg, gap: space.xs },
  notice: { marginTop: space.lg },
  list: { marginTop: space.lg, gap: space.md },
  card: { gap: space.md },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  facts: { gap: space.xs, padding: space.md, borderRadius: radius.md, backgroundColor: colors.background },
  fact: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  actions: { flexDirection: 'row', gap: space.md },
});
