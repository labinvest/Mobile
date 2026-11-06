import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/ui';
import { useDriveApp } from '@/hooks/use-drive-app';
import type { Role } from '@/types/api';
import { colors } from '@/theme/tokens';

type TabKey = 'index' | 'teachers' | 'schedule' | 'account';

/** Cada perfil tem a própria linguagem nas abas; os arquivos de rota são compartilhados. */
const tabsByRole: Record<Role, Record<TabKey, { title: string; icon: IconName; activeIcon: IconName }>> = {
  student: {
    index: { title: 'Início', icon: 'home-variant-outline', activeIcon: 'home-variant' },
    teachers: { title: 'Explorar', icon: 'compass-outline', activeIcon: 'compass' },
    schedule: { title: 'Minhas aulas', icon: 'calendar-blank-outline', activeIcon: 'calendar-blank' },
    account: { title: 'Perfil', icon: 'account-circle-outline', activeIcon: 'account-circle' },
  },
  teacher: {
    index: { title: 'Painel', icon: 'view-dashboard-outline', activeIcon: 'view-dashboard' },
    teachers: { title: 'Alunos', icon: 'account-group-outline', activeIcon: 'account-group' },
    schedule: { title: 'Agenda', icon: 'calendar-blank-outline', activeIcon: 'calendar-blank' },
    account: { title: 'Perfil', icon: 'account-circle-outline', activeIcon: 'account-circle' },
  },
  admin: {
    index: { title: 'Painel', icon: 'view-dashboard-outline', activeIcon: 'view-dashboard' },
    teachers: { title: 'Instrutores', icon: 'card-account-details-outline', activeIcon: 'card-account-details' },
    schedule: { title: 'Aulas', icon: 'calendar-blank-outline', activeIcon: 'calendar-blank' },
    account: { title: 'Gestão', icon: 'shield-account-outline', activeIcon: 'shield-account' },
  },
};

export default function MainTabs() {
  const { role } = useDriveApp();
  const tabs = tabsByRole[role];
  const insets = useSafeAreaInsets();

  const screen = (name: TabKey) => (
    <Tabs.Screen
      name={name}
      options={{
        title: tabs[name].title,
        tabBarAccessibilityLabel: tabs[name].title,
        tabBarIcon: ({ focused, color }) => <Icon name={focused ? tabs[name].activeIcon : tabs[name].icon} color={color} size={24} />,
      }}
    />
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        // Altura própria + inset do sistema (barra de gestos do Android / indicador do iPhone).
        tabBarStyle: [styles.bar, { height: 64 + insets.bottom, paddingBottom: Math.max(insets.bottom, 4) }],
        tabBarLabelStyle: styles.label,
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: colors.background },
      }}>
      {screen('index')}
      {screen('teachers')}
      {screen('schedule')}
      {screen('account')}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: colors.surface, borderTopColor: colors.line, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 4 },
  label: { fontSize: 11, fontWeight: '600' },
});
