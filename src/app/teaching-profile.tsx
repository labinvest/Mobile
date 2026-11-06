import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BottomBar, Button, Header, Notice, Screen, SectionHeader, Surface, Text, TextField } from '@/components/ui';
import { useDriveApp } from '@/hooks/use-drive-app';
import { api, errorMessage } from '@/lib/api';
import { PERIODS, WEEK_ORDER, WEEKDAYS_SHORT } from '@/lib/availability';
import { haptic } from '@/lib/haptics';
import { parsePriceToCents } from '@/lib/masks';
import type { Period, WeeklySlot } from '@/types/api';
import { colors, radius, space } from '@/theme/tokens';

const key = (weekday: number, period: Period) => `${weekday}|${period}`;
const WEEKDAYS_WORK = [1, 2, 3, 4, 5];

/** O instrutor define valor, região e os períodos em que atende em cada dia da semana. */
export default function TeachingProfileScreen() {
  const { user, refreshAccount } = useDriveApp();
  const teacher = user?.teacher;
  const [price, setPrice] = useState(teacher ? String(teacher.priceCents / 100).replace('.', ',') : '');
  const [area, setArea] = useState(teacher?.area ?? '');
  const [slots, setSlots] = useState(() => new Set((teacher?.weeklySlots ?? []).map((slot) => key(slot.weekday, slot.period))));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  const cents = parsePriceToCents(price);
  const priceError = cents === null || cents < 1000 || cents > 100000 ? 'Informe um valor entre R$ 10 e R$ 1.000.' : '';
  const areaError = area.trim().length < 2 ? 'Informe os bairros ou a região que você atende.' : '';

  function toggle(weekday: number, period: Period) {
    haptic.selection();
    setSlots((current) => {
      const next = new Set(current);
      const id = key(weekday, period);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  /** Atalho comum: repete os períodos de segunda nos outros dias úteis. */
  function copyMondayToWeekdays() {
    haptic.tap();
    setSlots((current) => {
      const monday = PERIODS.filter((period) => current.has(key(1, period.value))).map((period) => period.value);
      const next = new Set([...current].filter((id) => !WEEKDAYS_WORK.includes(Number(id.split('|')[0]))));
      WEEKDAYS_WORK.forEach((weekday) => monday.forEach((period) => next.add(key(weekday, period))));
      return next;
    });
  }

  async function save() {
    setShowErrors(true);
    if (priceError || areaError || cents === null) {
      haptic.error();
      return;
    }
    setError('');
    setSaving(true);
    try {
      const weeklySlots: WeeklySlot[] = [...slots].map((id) => {
        const [weekday, period] = id.split('|');
        return { weekday: Number(weekday), period: period as Period };
      });
      await api('/teachers/me', { method: 'PATCH', body: { priceCents: cents, area: area.trim(), weeklySlots } });
      await refreshAccount();
      haptic.success();
      router.back();
    } catch (caught) {
      haptic.error();
      setError(errorMessage(caught));
      setSaving(false);
    }
  }

  if (!teacher) {
    return <Screen header={<Header title="Atendimento" />}><Notice tone="info" message="Esta área é só para instrutores." style={styles.top} /></Screen>;
  }

  return (
    <Screen
      header={<Header title="Atendimento" />}
      footer={<BottomBar><Button label="Salvar alterações" size="lg" icon="content-save-outline" loading={saving} onPress={save} fullWidth /></BottomBar>}>
      <Text variant="callout" tone="muted" style={styles.top}>Os alunos só conseguem pedir aulas nos períodos marcados aqui. Horários já reservados ficam bloqueados automaticamente.</Text>

      <View style={styles.section}>
        <SectionHeader title="Valor e região" />
        <View style={styles.fields}>
          <TextField label="Valor por aula (R$)" icon="cash" keyboardType="decimal-pad" placeholder="85" value={price} onChangeText={setPrice} error={showErrors ? priceError : ''} helper="Valor que aparece no seu perfil e nos pedidos." />
          <TextField label="Região de atendimento" icon="map-marker-radius-outline" placeholder="Ex.: Vila Mariana e Saúde" value={area} onChangeText={setArea} error={showErrors ? areaError : ''} maxLength={120} />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Horários da semana" actionLabel="Repetir segunda" onAction={copyMondayToWeekdays} />
        <Surface padded={false} style={styles.grid}>
          {WEEK_ORDER.map((weekday, index) => (
            <View key={weekday} style={[styles.dayRow, index > 0 && styles.divider]}>
              <Text variant="bodyStrong" style={styles.dayLabel}>{WEEKDAYS_SHORT[weekday]}</Text>
              <View style={styles.periods}>
                {PERIODS.map((period) => {
                  const on = slots.has(key(weekday, period.value));
                  return (
                    <Pressable
                      key={period.value}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                      accessibilityLabel={`${WEEKDAYS_SHORT[weekday]}, ${period.value}`}
                      onPress={() => toggle(weekday, period.value)}
                      style={[styles.slot, on && styles.slotOn]}>
                      <Text variant="caption" style={{ color: on ? colors.onBrand : colors.muted }}>{period.value.slice(0, 3)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </Surface>
        <Text variant="footnote" tone="muted" style={styles.legend}>Cada bloco é um período de 2 horas: 08h, 10h, 13h, 15h e 18h. Sem nenhum marcado, os alunos podem pedir qualquer período e você confirma ao aceitar.</Text>
      </View>

      {!!error && <Notice tone="danger" message={error} style={styles.top} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { marginTop: space.sm },
  section: { marginTop: space.xxl },
  fields: { gap: space.xs },
  grid: { paddingHorizontal: space.md },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.sm },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  dayLabel: { width: 40 },
  periods: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', gap: space.xs },
  slot: { flex: 1, minHeight: 44, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  slotOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  legend: { marginTop: space.sm },
});
