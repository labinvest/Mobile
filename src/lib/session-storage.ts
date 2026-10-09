import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// No celular o token fica no armazenamento seguro do sistema; na web (sem SecureStore), no localStorage.
const TOKEN_KEY = 'rota.session-token';

export async function loadToken() {
  if (Platform.OS !== 'web') return SecureStore.getItemAsync(TOKEN_KEY);
  try {
    return globalThis.localStorage?.getItem(TOKEN_KEY) ?? null;
  } catch {
    return null;
  }
}

export async function saveToken(token: string) {
  if (Platform.OS !== 'web') return SecureStore.setItemAsync(TOKEN_KEY, token);
  try {
    globalThis.localStorage?.setItem(TOKEN_KEY, token);
  } catch {
    // Armazenamento indisponível (ex.: navegação privada): a sessão vale só enquanto a página estiver aberta.
  }
}

export async function clearToken() {
  if (Platform.OS !== 'web') return SecureStore.deleteItemAsync(TOKEN_KEY);
  try {
    globalThis.localStorage?.removeItem(TOKEN_KEY);
  } catch {
    // Nada a limpar.
  }
}
