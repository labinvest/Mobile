import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { AppProvider, useDriveApp } from '@/hooks/use-drive-app';
import { colors } from '@/theme/tokens';

// Mantém o splash até a sessão salva ser verificada.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <AppProvider>
      <ThemeProvider value={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.background, primary: colors.brand } }}>
        <StatusBar style="dark" />
        <SplashScreenController />
        <RootNavigator />
      </ThemeProvider>
    </AppProvider>
  );
}

function SplashScreenController() {
  const { ready } = useDriveApp();
  if (ready) SplashScreen.hide();
  return null;
}

/** Sem sessão: boas-vindas, login e cadastro. Com sessão: o app. O Expo Router redireciona quando isso muda. */
function RootNavigator() {
  const { authenticated, ready } = useDriveApp();

  // Antes de verificar a sessão salva, as rotas protegidas achariam que não há login e mandariam
  // um link direto (ex.: /instructor/4) para a tela de boas-vindas. O splash cobre esse intervalo.
  if (!ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: 'slide_from_right' }}>
      <Stack.Protected guard={!authenticated}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack.Protected>
      <Stack.Protected guard={authenticated}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="booking" />
        <Stack.Screen name="lesson" />
        <Stack.Screen name="instructor/[id]" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="teaching-profile" />
        <Stack.Screen name="help" />
      </Stack.Protected>
    </Stack>
  );
}
