import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { api, errorMessage } from '@/lib/api';

/**
 * Busca um recurso da API sempre que a tela ganha foco.
 * Passe `null` como caminho para não buscar (ex.: perfil que não usa o recurso).
 */
export function useApiData<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    try {
      setData(await api<T>(path));
      setError('');
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [path]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return { data, setData, loading, error, reload };
}
