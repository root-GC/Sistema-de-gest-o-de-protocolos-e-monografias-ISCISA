// src/services/apiClient.ts

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// 🆕 Evento customizado para loading global
const dispatchLoading = (active: boolean) => {
  window.dispatchEvent(new CustomEvent('global-loading', { detail: { active } }))
}

function getHeaders(): Record<string, string> {
  const token = localStorage.getItem('sgpmc_token');
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

interface ApiErrorPayload {
  message?: string;
  errors?: Record<string, string[]>;
}

interface HttpError extends Error {
  status?: number;
  data?: unknown;
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return typeof value === 'object' && value !== null && 'message' in value;
}

async function readError(response: Response, fallbackMessage: string): Promise<HttpError> {
  const error = await response.json().catch(() => ({ message: fallbackMessage })) as unknown;
  
  let message = fallbackMessage;
  if (isApiErrorPayload(error) && error.message) {
    message = error.message;
    
    if (error.errors) {
      const details = Object.values(error.errors).flat().join('; ');
      if (details) {
        message = `${message} (${details})`;
      }
    }
  }
  
  const err = new Error(message) as HttpError;
  err.status = response.status;
  err.data = error;

  return err;
}

function toApiUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE_URL}${url}`;
}

function withInlineQuery(url: string): string {
  if (url.includes('inline=')) return url;
  return `${url}${url.includes('?') ? '&' : '?'}inline=1`;
}

function filenameFromDisposition(value: string | null): string | null {
  if (!value) return null;

  const utfMatch = value.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) return decodeURIComponent(utfMatch[1].replace(/"/g, ''));

  const match = value.match(/filename="?([^"]+)"?/i);
  return match?.[1] || null;
}

// 🆕 Converte objeto em query string
function toQueryString(params: Record<string, any>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export interface ApiFile {
  blob: Blob;
  filename: string;
}

export interface ApiFileObjectUrl {
  objectUrl: string;
  filename: string;
  revoke: () => void;
}

export async function reqFile(url: string, fallbackFilename = 'documento'): Promise<ApiFile> {
  const response = await fetch(toApiUrl(url), {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw await readError(response, 'Erro ao obter ficheiro');
  }

  return {
    blob: await response.blob(),
    filename: filenameFromDisposition(response.headers.get('Content-Disposition')) || fallbackFilename,
  };
}

export async function createApiFileObjectUrl(
  url: string,
  fallbackFilename?: string,
  inline = false
): Promise<ApiFileObjectUrl> {
  const file = await reqFile(inline ? withInlineQuery(url) : url, fallbackFilename);
  const objectUrl = URL.createObjectURL(file.blob);

  return {
    objectUrl,
    filename: file.filename,
    revoke: () => URL.revokeObjectURL(objectUrl),
  };
}

export async function openApiFile(url: string, fallbackFilename?: string): Promise<void> {
  const popup = window.open('', '_blank');

  try {
    const file = await reqFile(withInlineQuery(url), fallbackFilename);
    const objectUrl = URL.createObjectURL(file.blob);

    if (popup) {
      popup.opener = null;
      popup.location.href = objectUrl;
    } else {
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
    }

    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  } catch (error) {
    if (popup && !popup.closed) popup.close();
    throw error;
  }
}

export async function downloadApiFile(url: string, fallbackFilename?: string): Promise<void> {
  const file = await reqFile(url, fallbackFilename);
  const objectUrl = URL.createObjectURL(file.blob);
  const link = document.createElement('a');

  link.href = objectUrl;
  link.download = file.filename || fallbackFilename || 'documento';
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

// ═══════════════════════════════════════════════
// 🆕 Requisição JSON com loading global (CORRIGIDA)
// ═══════════════════════════════════════════════
export async function req<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  dispatchLoading(true)
  
  try {
    const headers = getHeaders();
    let fetchUrl = `${API_BASE_URL}${url}`;
    let fetchBody: BodyInit | undefined;

    // 🆕 Para GET/HEAD, converte body em query string
    if (method === 'GET' || method === 'HEAD') {
      if (body && typeof body === 'object' && !(body instanceof FormData)) {
        fetchUrl += toQueryString(body as Record<string, any>);
      }
    } else {
      // Para POST, PUT, PATCH, DELETE — envia no body
      if (body instanceof FormData) {
        fetchBody = body;
      } else if (body) {
        headers['Content-Type'] = 'application/json';
        fetchBody = JSON.stringify(body);
      }
    }

    const response = await fetch(fetchUrl, {
      method,
      headers,
      body: fetchBody,
    });

    if (!response.ok) {
      throw await readError(response, 'Erro na requisição');
    }

    // Se a resposta for 204 No Content, retorna undefined
    if (response.status === 204) {
      return undefined as unknown as T;
    }

    return response.json() as Promise<T>;
  } finally {
    dispatchLoading(false)
  }
}

// 🆕 Requisição FormData com loading global
export async function reqFormData<T = unknown>(method: string, url: string, formData: FormData): Promise<T> {
  dispatchLoading(true)
  
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    
    const token = localStorage.getItem('sgpmc_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      method,
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw await readError(response, 'Erro na requisição');
    }

    return response.json() as Promise<T>;
  } finally {
    dispatchLoading(false)
  }
}
