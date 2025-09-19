// src/lib/adminApi.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4242';

export function getAdminKey() {
  return localStorage.getItem('korelia_admin_key') || '';
}
export function setAdminKey(k) {
  if (k) localStorage.setItem('korelia_admin_key', k);
  else localStorage.removeItem('korelia_admin_key');
}

export async function fetchOrders({ signal } = {}) {
  const key = getAdminKey();
  if (!key) throw new Error('Clé admin manquante');
  const res = await fetch(`${API_URL}/admin/orders`, {
    headers: { 'x-admin-key': key },
    signal
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Erreur ${res.status}`);
  }
  return res.json();
}

export async function downloadOrdersCsv({ from, to } = {}) {
  const key = getAdminKey();
  if (!key) throw new Error('Clé admin manquante');
  const qs = new URLSearchParams();
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);

  const url = `${API_URL}/admin/orders.csv${qs.toString() ? `?${qs}` : ''}`;
  const res = await fetch(url, {
    headers: { 'x-admin-key': key }
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Erreur ${res.status}`);
  }
  const blob = await res.blob();
  const a = document.createElement('a');
  const dlUrl = URL.createObjectURL(blob);
  a.href = dlUrl;
  const ts = new Date().toISOString().slice(0,10).replace(/-/g,'');
  a.download = `orders-${ts}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(dlUrl);
}
