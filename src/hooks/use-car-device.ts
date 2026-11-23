import { useCallback, useEffect, useRef, useState } from 'react';

import { api, errorMessage } from '@/lib/api';
import { type CarConnection, type CarStatus, connectToCar, type Role } from '@/lib/rota-device';

export type PresenceProof = { challenge: string; response: string };

const RETRY_MS = 4000;

/**
 * Conexão BLE com o dispositivo do carro. `status` é null enquanto desconectado.
 * Depois da primeira conexão, se o sinal cair (alguém se afastou), tenta voltar sozinho a cada poucos segundos.
 */
export function useCarDevice(role: Role | null) {
  const connection = useRef<CarConnection | null>(null);
  const [status, setStatus] = useState<CarStatus | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const keepConnected = useRef(false);
  const busy = useRef(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const connectRef = useRef<() => Promise<void>>(async () => undefined);

  const scheduleRetry = useCallback(() => {
    if (!keepConnected.current) return;
    clearTimeout(retryTimer.current);
    retryTimer.current = setTimeout(() => connectRef.current(), RETRY_MS);
  }, []);

  const connect = useCallback(async () => {
    if (!role || busy.current) return;
    busy.current = true;
    clearTimeout(retryTimer.current);
    setError('');
    setConnecting(true);
    try {
      await connection.current?.close();
      connection.current = await connectToCar(role, setStatus, () => {
        connection.current = null;
        setStatus(null);
        if (!busy.current) scheduleRetry();
      });
      keepConnected.current = true;
    } catch (caught) {
      setError(errorMessage(caught));
      scheduleRetry();
    } finally {
      busy.current = false;
      setConnecting(false);
    }
  }, [role, scheduleRetry]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const send = useCallback(async (command: string) => {
    if (!connection.current) throw new Error('Conecte-se ao dispositivo do carro primeiro.');
    await connection.current.send(command);
  }, []);

  /** Pede um desafio à API e faz o carro respondê-lo. Sem conexão devolve undefined (a API decide se isso basta). */
  const prove = useCallback(async (lessonId: number): Promise<PresenceProof | undefined> => {
    if (!connection.current) return undefined;
    const { challenge, plate } = await api<{ challenge: string; plate: string }>(`/appointments/${lessonId}/presence-challenge`, { method: 'POST' });
    await connection.current.send(`PLATE ${plate}`);
    return { challenge, response: await connection.current.respond(challenge) };
  }, []);

  useEffect(() => () => {
    keepConnected.current = false;
    clearTimeout(retryTimer.current);
    connection.current?.close();
  }, []);

  return { status, connected: status !== null, connecting, error, connect, send, prove };
}
