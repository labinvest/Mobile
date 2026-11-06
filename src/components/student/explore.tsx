import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { InstructorRow, InstructorRowSkeleton } from '@/components/instructor/instructor-row';
import { Chip, EmptyState, Notice, Screen, Text, TextField } from '@/components/ui';
import { useApiData } from '@/hooks/use-api-data';
import { useDriveApp } from '@/hooks/use-drive-app';
import { isOpen, statusMeta } from '@/lib/lessons';
import { openInstructor } from '@/lib/navigation';
import type { Teacher, Transmission } from '@/types/api';
import { colors, gutter, space } from '@/theme/tokens';

type Sort = 'rating' | 'price';

const ratingOf = (teacher: Teacher) => Number((teacher.rating ?? '0').replace(',', '.'));
const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Explorar do aluno: busca, filtros e lista de instrutores aprovados. */
export function ExploreScreen() {
  const { user, appointments } = useDriveApp();
  const { data, loading, error, reload } = useApiData<{ teachers: Teacher[] }>('/teachers');
  const [query, setQuery] = useState('');
  const [transmission, setTransmission] = useState<Transmission | null>(null);
  const [myCategory, setMyCategory] = useState(false);
  const [sort, setSort] = useState<Sort>('rating');
  const [refreshing, setRefreshing] = useState(false);

  const wanted = user?.student?.category ?? 'B';
  const terms = normalize(query.trim());
  const results = (data?.teachers ?? [])
    .filter((teacher) => !terms || normalize(`${teacher.name} ${teacher.area} ${teacher.vehicle?.label ?? ''}`).includes(terms))
    .filter((teacher) => !transmission || teacher.vehicle?.transmission === transmission)
    // Categoria AB atende quem quer A, B ou AB; A e B só a própria.
    .filter((teacher) => !myCategory || teacher.cnhCategory === 'AB' || teacher.cnhCategory === wanted)
    .sort((a, b) => (sort === 'price' ? a.priceCents - b.priceCents : ratingOf(b) - ratingOf(a) || b.reviewCount - a.reviewCount));
  const openWith = new Map(appointments.filter(isOpen).map((appointment) => [appointment.teacherId, statusMeta[appointment.status]]));
  const filtering = !!terms || !!transmission || myCategory;

  async function refresh() {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }

  function clearFilters() {
    setQuery('');
    setTransmission(null);
    setMyCategory(false);
  }

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <View style={styles.header}>
        <Text variant="title1" accessibilityRole="header">Explorar</Text>
        <Text variant="callout" tone="muted">Instrutores autônomos aprovados pela equipe Rota.</Text>
      </View>

      <TextField
        label="Buscar"
        icon="magnify"
        placeholder="Nome, bairro ou carro"
        value={query}
        onChangeText={setQuery}
        returnKeyType="search"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.filters} keyboardShouldPersistTaps="handled">
        <Chip label="Melhor avaliados" icon="star-outline" selected={sort === 'rating'} onPress={() => setSort('rating')} />
        <Chip label="Menor preço" icon="cash" selected={sort === 'price'} onPress={() => setSort('price')} />
        <View style={styles.separator} />
        <Chip label="Manual" selected={transmission === 'Manual'} onPress={() => setTransmission(transmission === 'Manual' ? null : 'Manual')} />
        <Chip label="Automático" selected={transmission === 'Automático'} onPress={() => setTransmission(transmission === 'Automático' ? null : 'Automático')} />
        <Chip label={`Atende categoria ${wanted}`} icon="card-account-details-outline" selected={myCategory} onPress={() => setMyCategory(!myCategory)} />
      </ScrollView>

      {!!data && (
        <Text variant="footnote" tone="muted" style={styles.count} accessibilityLiveRegion="polite">
          {results.length} instrutor{results.length === 1 ? '' : 'es'}{filtering ? ' com esses filtros' : ''}
        </Text>
      )}

      {error ? (
        <Notice tone="danger" title="Não foi possível carregar" message={error} actionLabel="Tentar de novo" onAction={reload} />
      ) : loading && !data ? (
        <><InstructorRowSkeleton /><InstructorRowSkeleton /><InstructorRowSkeleton /></>
      ) : results.length === 0 ? (
        <EmptyState
          icon="account-search-outline"
          title={filtering ? 'Nenhum instrutor com esses filtros' : 'Nenhum instrutor disponível'}
          message={filtering ? 'Tente remover algum filtro ou buscar outro bairro.' : 'Novos instrutores passam pela análise da equipe e aparecem aqui.'}
          actionLabel={filtering ? 'Limpar filtros' : undefined}
          onAction={clearFilters}
        />
      ) : (
        results.map((teacher) => <InstructorRow key={teacher.id} teacher={teacher} status={openWith.get(teacher.id)} onPress={() => openInstructor(teacher)} />)
      )}

      <Text variant="footnote" tone="muted" style={styles.footer}>Cada instrutor define o próprio valor. O pagamento é combinado diretamente com ele.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: space.lg, paddingBottom: space.lg, gap: space.xs },
  bleed: { marginHorizontal: -gutter, flexGrow: 0 },
  filters: { paddingHorizontal: gutter, gap: space.sm, alignItems: 'center' },
  separator: { width: StyleSheet.hairlineWidth, height: 24, backgroundColor: colors.lineStrong, marginHorizontal: space.xs },
  count: { marginTop: space.lg },
  footer: { marginTop: space.xl },
});
