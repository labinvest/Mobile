import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';

import { DrivePaperTheme } from '@/constants/drive-theme';
import { AppProvider, useDriveApp } from '@/hooks/use-drive-app';

// Mantém o splash até a sessão salva ser verificada.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <PaperProvider theme={DrivePaperTheme}>
      <AppProvider>
        <ThemeProvider value={DefaultTheme}>
          <StatusBar style="dark" />
          <SplashScreenController />
          <RootNavigator />
        </ThemeProvider>
      </AppProvider>
    </PaperProvider>
  );
}

function SplashScreenController() {
  const { ready } = useDriveApp();
  if (ready) SplashScreen.hide();
  return null;
}

/** Sem sessão: boas-vindas, login e cadastro. Com sessão: o app. O Expo Router redireciona quando isso muda. */
function RootNavigator() {
  const { authenticated } = useDriveApp();

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F5F7F4' } }}>
      <Stack.Protected guard={!authenticated}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack.Protected>
      <Stack.Protected guard={authenticated}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="booking" />
      </Stack.Protected>
    </Stack>
  );
}
