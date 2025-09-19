// src/lib/api.js
const RAW = import.meta.env.VITE_API_URL || 'http://localhost:4242';

// base normalisée sans trailing slash
const API_BASE = String(RAW).replace(/\/+$/, '');

export function apiUrl(pathOrUrl) {
  const s = String(pathOrUrl || '');
  // Si c'est déjà une URL absolue (http/https), on ne préfixe pas
  if (/^https?:\/\//i.test(s)) return s;
  // Sinon on joint proprement
  return `${API_BASE}/${s.replace(/^\/+/, '')}`;
}

// GET avec credentials
export async function apiGet(pathOrUrl, init = {}) {
  const res = await fetch(apiUrl(pathOrUrl), {
    credentials: 'include',
    ...init,
    method: 'GET',
    headers: { ...(init.headers || {}) },
  });
  if (!res.ok) {
    const err = await safeJson(res);
    throw new Error(err?.error || res.statusText || 'Request failed');
  }
  return res.json();
}

// POST/PATCH/PUT/DELETE avec JSON + CSRF si fourni
export async function apiJson(method, pathOrUrl, body, { csrf } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (csrf) headers['X-CSRF-Token'] = csrf;
  const res = await fetch(apiUrl(pathOrUrl), {
    method,
    credentials: 'include',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await safeJson(res);
    throw new Error(err?.error || res.statusText || 'Request failed');
  }
  return res.json();
}

async function safeJson(res) {
  try { return await res.json(); } catch { return null; }
}
