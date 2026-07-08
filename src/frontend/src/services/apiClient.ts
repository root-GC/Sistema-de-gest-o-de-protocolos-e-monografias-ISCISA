const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

function token() {
  return localStorage.getItem('sgpmc_token');
}

export async function req(method: string, path: string, body: unknown = null) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token()) headers['Authorization'] = `Bearer ${token()}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      data?.message ??
      (Object.values(data?.errors ?? {}) as string[][])?.[0]?.[0] ??
      'Erro desconhecido';
    throw new Error(msg);
  }

  return data;
}