import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Endereço da API. Ordem de prioridade:
 * 1. EXPO_PUBLIC_API_URL (arquivo .env do app), para apontar para um servidor publicado;
 * 2. na web, o mesmo host da página na porta 3333;
 * 3. no celular/emulador, o IP da máquina que roda o Expo (o mesmo do QR code) na porta 3333.
 */
function resolveApiUrl() {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/+$/, '');
  if (Platform.OS === 'web' && typeof window !== 'undefined') return `${window.location.protocol}//${window.location.hostname}:3333`;
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${host ?? 'localhost'}:3333`;
}

export const API_URL = resolveApiUrl();

export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setApiToken(token: string | null) {
  authToken = token;
}

/** Chamado quando a API recusa o token (sessão expirada). */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export async function api<T>(path: string, options: { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown } = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Não foi possível conectar ao servidor. Verifique sua conexão e se a API está rodando.');
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && authToken) onUnauthorized?.();
    throw new ApiError(response.status, data?.error ?? 'Algo deu errado. Tente novamente.');
  }
  return data as T;
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Algo deu errado. Tente novamente.';
}
