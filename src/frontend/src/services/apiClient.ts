const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

function token() {
  return localStorage.getItem('sgpmc_token');
}

export async function req(method: string, path: string, body: unknown = null) {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token()) headers['Authorization'] = `Bearer ${token()}`;

  const isFormData = body instanceof FormData;
  if (!isFormData && body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : null,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      data?.message ??
      (Object.values(data?.errors ?? {}) as (unknown[] | undefined)[])?.[0]?.[0] ??
      'Erro desconhecido';
    const err = new Error(msg) as Error & { status?: number; data?: unknown };
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}