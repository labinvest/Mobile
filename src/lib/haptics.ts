import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Na web não há motor de vibração: as chamadas viram no-op.
const enabled = Platform.OS === 'ios' || Platform.OS === 'android';

export const haptic = {
  /** Toque em seleção (chip, dia, horário). */
  selection: () => { if (enabled) Haptics.selectionAsync().catch(() => undefined); },
  /** Ação principal pressionada. */
  tap: () => { if (enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined); },
  success: () => { if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined); },
  error: () => { if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined); },
};
