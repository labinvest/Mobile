import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { DriveColors } from '@/constants/drive-theme';
import { useDriveApp } from '@/hooks/use-drive-app';

const tabSymbols = {
  home: { ios: 'house.fill', android: 'home', web: 'home' },
  people: { ios: 'person.2', android: 'group', web: 'groups' },
  schedule: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
  profile: { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' },
} as const;

export default function MainTabs() {
  const { role } = useDriveApp();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: DriveColors.green,
        tabBarInactiveTintColor: DriveColors.muted,
        tabBarStyle: { backgroundColor: DriveColors.white, borderTopColor: DriveColors.line, height: 64, paddingTop: 6, paddingBottom: 7 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: ({ color, size }) => <SymbolView name={tabSymbols.home} tintColor={color} size={size} /> }} />
      <Tabs.Screen name="teachers" options={{ title: role === 'teacher' ? 'Alunos' : role === 'admin' ? 'Pessoas' : 'Instrutores', tabBarIcon: ({ color, size }) => <SymbolView name={tabSymbols.people} tintColor={color} size={size} /> }} />
      <Tabs.Screen name="schedule" options={{ title: 'Agenda', tabBarIcon: ({ color, size }) => <SymbolView name={tabSymbols.schedule} tintColor={color} size={size} /> }} />
      <Tabs.Screen name="account" options={{ title: role === 'admin' ? 'Gestão' : 'Perfil', tabBarIcon: ({ color, size }) => <SymbolView name={tabSymbols.profile} tintColor={color} size={size} /> }} />
    </Tabs>
  );
}