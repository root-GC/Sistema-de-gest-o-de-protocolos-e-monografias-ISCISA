// src/services/apiClient.ts

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Headers padrão para JSON
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

// Requisição JSON padrão
export async function req(method: string, url: string, body?: any): Promise<any> {
  const headers = {
    ...getHeaders(),
    'Content-Type': 'application/json',
  };

  const response = await fetch(`${API_BASE_URL}${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
    const err = new Error(error.message || 'Erro na requisição') as any;
    err.status = response.status;
    err.data = error;
    throw err;
  }

  return response.json();
}

// Requisição FormData (para upload de arquivos)
export async function reqFormData(method: string, url: string, formData: FormData): Promise<any> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  
  const token = localStorage.getItem('sgpmc_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Não define Content-Type - o browser define automaticamente com boundary para FormData

  const response = await fetch(`${API_BASE_URL}${url}`, {
    method,
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
    const err = new Error(error.message || 'Erro na requisição') as any;
    err.status = response.status;
    err.data = error;
    throw err;
  }

  return response.json();
}