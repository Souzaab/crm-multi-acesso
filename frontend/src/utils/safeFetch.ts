/**
 * Utilitário safeFetch para encapsular chamadas HTTP com tratamento de erros
 * Retorna null quando a API não está disponível ou falha
 */

export interface SafeFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

export interface SafeFetchResult<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

/**
 * Função safeFetch que trata falhas de rede e retorna null em caso de erro
 */
export async function safeFetch<T>(
  url: string,
  options: SafeFetchOptions = {}
): Promise<T | null> {
  const {
    method = 'GET',
    headers = { 'Content-Type': 'application/json' },
    body,
    timeout = 5000
  } = options;

  try {
    // Criar AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method,
      headers,
      body,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Se a resposta não for ok, retorna null
    if (!response.ok) {
      console.warn(`SafeFetch: API call failed with status ${response.status} for ${url}`);
      return null;
    }

    // Tenta parsear como JSON
    const data = await response.json();
    return data as T;

  } catch (error) {
    // Em caso de erro de rede, timeout ou parsing, retorna null
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.warn(`SafeFetch: Request timeout for ${url}`);
      } else {
        console.warn(`SafeFetch: Network error for ${url}:`, error.message);
      }
    }
    return null;
  }
}

/**
 * Hook personalizado para usar safeFetch com estado de loading
 */
export function useSafeFetch<T>(
  url: string,
  options: SafeFetchOptions = {}
): SafeFetchResult<T> {
  const [result, setResult] = useState<SafeFetchResult<T>>({
    data: null,
    error: null,
    isLoading: true
  });

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setResult(prev => ({ ...prev, isLoading: true, error: null }));
      
      const data = await safeFetch<T>(url, options);
      
      if (isMounted) {
        if (data === null) {
          setResult({
            data: null,
            error: 'Falha ao carregar dados da API',
            isLoading: false
          });
        } else {
          setResult({
            data,
            error: null,
            isLoading: false
          });
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [url, JSON.stringify(options)]);

  return result;
}

// Importações necessárias para o hook
import { useState, useEffect } from 'react';