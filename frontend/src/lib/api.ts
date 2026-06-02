const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');

async function getToken(): Promise<string> {
  try {
    const { createClient } = await import('@/lib/supabase/client');
    const { data: { session } } = await createClient().auth.getSession();
    return session?.access_token || '';
  } catch {
    return '';
  }
}

async function request<T>(
  path: string,
  options: { method?: string; headers?: Record<string, string>; body?: unknown } = {}
): Promise<T> {
  const token = await getToken();
  const url = `${API_BASE}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...(options.body instanceof FormData
      ? { body: options.body, headers: { Authorization: `Bearer ${token}` } }
      : { body: options.body ? JSON.stringify(options.body) : undefined }),
  });

  const contentType = res.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  if (!res.ok) {
    const detail = isJson
      ? (await res.json()).detail
      : await res.text();
    throw new Error(detail || `Request failed: ${res.status}`);
  }

  return isJson ? (await res.json()) as T : (await res.text()) as unknown as T;
}

export const api = {
  async get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const qs = params
      ? '?' + new URLSearchParams(
          Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))
        ).toString()
      : '';
    return request<T>(path + qs, { method: 'GET' });
  },

  async post<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, { method: 'POST', body });
  },

  async patch<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, { method: 'PATCH', body });
  },

  async delete(path: string): Promise<void> {
    return request<void>(path, { method: 'DELETE' });
  },
};
