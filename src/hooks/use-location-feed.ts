import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

const KEEP_AWAKE_TAG = 'rota-lesson';
const INTERVAL_MS = 3000;
/** ~2h30 de aula a 1 ponto a cada 3 s; passou disso, descarta os mais antigos. */
const MAX_QUEUED = 3000;

type Feed = {
  /** Lê a localização do celular (aula em andamento). */
  active: boolean;
  /** O carro está gravando esta aula e conectado: pode entregar. Fora disso os pontos esperam na fila. */
  ready: boolean;
  /** Não guarda o ponto (o celular do aluno só ajuda quando a localização do instrutor para de chegar). */
  skip?: boolean;
  send: (command: string) => Promise<void>;
};

/**
 * Enquanto `active`, lê a posição do celular a cada ~3 s e a entrega ao ESP32 ("PT lat,lon,km/h,horaMs").
 * Sem conexão, os pontos ficam numa fila e seguem em ordem quando o carro volta; a API ordena pela hora.
 * shortcut: fila só na memória (some se o app fechar) e só com o app aberto; para mais, localização em segundo plano (expo-task-manager) e armazenamento local.
 * Devolve `denied` se o usuário negou a permissão e `flush`, que espera a fila esvaziar (use antes do STOP).
 */
export function useLocationFeed({ active, ready, skip = false, send }: Feed) {
  const [denied, setDenied] = useState(false);
  const queue = useRef<string[]>([]);
  const draining = useRef<Promise<void> | null>(null);
  const live = useRef({ ready, send });
  const skipRef = useRef(skip);
  useEffect(() => {
    live.current = { ready, send };
    skipRef.current = skip;
  });

  const flush = useCallback(() => {
    draining.current ??= (async () => {
      try {
        while (live.current.ready && queue.current.length > 0) {
          await live.current.send(queue.current[0]);
          queue.current.shift();
        }
      } catch {
        // A conexão caiu: o que sobrou espera na fila.
      }
    })().finally(() => { draining.current = null; });
    return draining.current;
  }, []);

  useEffect(() => {
    if (ready) flush();
  }, [ready, flush]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let subscription: Location.LocationSubscription | undefined;

    (async () => {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      setDenied(!granted);
      if (!granted) return;
      activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => undefined);
      const watcher = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, timeInterval: INTERVAL_MS, distanceInterval: 0 },
        ({ coords, timestamp }) => {
          if (skipRef.current) return;
          const kmh = Math.max(0, (coords.speed ?? 0) * 3.6);
          queue.current.push(`PT ${coords.latitude.toFixed(6)},${coords.longitude.toFixed(6)},${kmh.toFixed(1)},${Math.round(timestamp)}`);
          if (queue.current.length > MAX_QUEUED) queue.current.shift();
          flush();
        },
      );
      if (cancelled) watcher.remove();
      else subscription = watcher;
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => undefined);
    };
  }, [active, flush]);

  return { denied, flush };
}
