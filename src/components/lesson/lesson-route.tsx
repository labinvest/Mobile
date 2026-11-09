import { useEffect, useState } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { Icon, Notice, SectionHeader, Skeleton, Surface, Text, type IconName } from '@/components/ui';
import { useApiData } from '@/hooks/use-api-data';
import { fitRoute, TILE_SIZE } from '@/lib/map-view';
import type { LessonRoute } from '@/types/api';
import { colors, radius, space } from '@/theme/tokens';

const MAP_HEIGHT = 260;
const LIVE_REFRESH_MS = 5000;
// No celular, identifica o app para o servidor de mapas; o navegador já envia o próprio.
const TILE_HEADERS = Platform.OS === 'web' ? undefined : { 'User-Agent': 'RotaApp/1.0' };

const formatDistance = (meters: number) => (meters < 1000 ? `${meters} m` : `${(meters / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`);

/** Trajeto registrado pelo GPS do veículo. Durante a aula, atualiza sozinho. */
export function LessonRouteSection({ lessonId, live }: { lessonId: number; live: boolean }) {
  const { data, error, reload } = useApiData<LessonRoute>(`/appointments/${lessonId}/route`);

  useEffect(() => {
    if (!live) return;
    const timer = setInterval(reload, LIVE_REFRESH_MS);
    return () => clearInterval(timer);
  }, [live, reload]);

  // Aula concluída sem GPS: não há o que mostrar.
  if (!live && data?.points.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionHeader title="Trajeto da aula" />
      {!data ? (
        error ? <Notice tone="danger" message={error} actionLabel="Tentar de novo" onAction={reload} /> : <Skeleton height={MAP_HEIGHT} rounded={radius.lg} />
      ) : data.points.length === 0 ? (
        <Notice tone="info" title="Aguardando o GPS do veículo" message="O trajeto aparece aqui assim que os primeiros pontos chegarem." />
      ) : (
        <Surface padded={false} style={styles.card}>
          <RouteMap route={data} live={live} />
          <View style={styles.stats}>
            <Stat icon="map-marker-distance" value={formatDistance(data.distanceMeters)} label="percorridos" />
            {data.maxSpeedKmh !== null && <Stat icon="speedometer" value={`${data.maxSpeedKmh} km/h`} label="velocidade máxima" />}
          </View>
        </Surface>
      )}
    </View>
  );
}

function RouteMap({ route, live }: { route: LessonRoute; live: boolean }) {
  const [width, setWidth] = useState(0);
  const map = width > 0 ? fitRoute(route.points, width, MAP_HEIGHT) : null;
  const first = map?.line[0];
  const last = map?.line[map.line.length - 1];

  return (
    <View
      style={styles.map}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Mapa do trajeto da aula, ${formatDistance(route.distanceMeters)} percorridos`}>
      {map?.tiles.map((tile) => (
        <Image key={tile.key} source={{ uri: tile.url, headers: TILE_HEADERS }} style={[styles.tile, { left: tile.left, top: tile.top }]} />
      ))}
      {map && first && last && (
        <Svg width={width} height={MAP_HEIGHT} style={StyleSheet.absoluteFill}>
          <Polyline points={map.line.map((point) => `${point.x},${point.y}`).join(' ')} fill="none" stroke={colors.surface} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" />
          <Polyline points={map.line.map((point) => `${point.x},${point.y}`).join(' ')} fill="none" stroke={colors.brand} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
          <Circle cx={first.x} cy={first.y} r={7} fill={colors.success} stroke={colors.surface} strokeWidth={2.5} />
          <Circle cx={last.x} cy={last.y} r={7} fill={live ? colors.accent : colors.danger} stroke={colors.surface} strokeWidth={2.5} />
        </Svg>
      )}
      <View style={styles.legend}>
        <View style={[styles.dot, { backgroundColor: colors.success }]} /><Text variant="caption">Início</Text>
        <View style={[styles.dot, { backgroundColor: live ? colors.accent : colors.danger }]} /><Text variant="caption">{live ? 'Agora' : 'Fim'}</Text>
      </View>
      <View style={styles.attribution}><Text style={styles.attributionText}>© OpenStreetMap</Text></View>
    </View>
  );
}

function Stat({ icon, value, label }: { icon: IconName; value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Icon name={icon} size={22} color={colors.brand} />
      <View>
        <Text variant="headline">{value}</Text>
        <Text variant="footnote" tone="muted">{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: space.xxl },
  card: { overflow: 'hidden' },
  map: { height: MAP_HEIGHT, overflow: 'hidden', backgroundColor: colors.surfaceAlt },
  tile: { position: 'absolute', width: TILE_SIZE, height: TILE_SIZE },
  legend: { position: 'absolute', top: space.sm, left: space.sm, flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingHorizontal: space.sm, paddingVertical: space.xxs, borderRadius: radius.pill, backgroundColor: colors.surface },
  dot: { width: 10, height: 10, borderRadius: 5 },
  attribution: { position: 'absolute', right: 0, bottom: 0, paddingHorizontal: space.xs, backgroundColor: colors.surface },
  attributionText: { fontSize: 10, color: colors.inkSecondary },
  stats: { flexDirection: 'row', gap: space.xl, padding: space.lg },
  stat: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
