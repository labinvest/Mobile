import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';

import { DrivePaperTheme } from '@/constants/drive-theme';
import { AppProvider } from '@/hooks/use-drive-app';

export default function RootLayout() {
  return (
    <PaperProvider theme={DrivePaperTheme}>
      <AppProvider>
        <ThemeProvider value={DefaultTheme}>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F5F7F4' } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="booking" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </ThemeProvider>
      </AppProvider>
    </PaperProvider>
  );
}
