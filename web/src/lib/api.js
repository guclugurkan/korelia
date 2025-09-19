// src/lib/api.js

// Base API (sans trailing slash)
const RAW = import.meta.env.VITE_API_URL || "http://localhost:4242";
export const API_BASE = String(RAW).replace(/\/+$/, "");

/** Construit une URL absolue à partir d'un path relatif */
export function apiUrl(pathOrUrl) {
  const s = String(pathOrUrl || "");
  if (/^https?:\/\//i.test(s)) return s; // déjà absolue
  return `${API_BASE}/${s.replace(/^\/+/, "")}`;
}

/** Lecture du cookie csrf_token dans le navigateur */
function readCsrfCookie() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

/** Va chercher /auth/csrf si besoin pour obtenir/renouveler le cookie, et renvoie le token */
export async function getCsrf() {
  // si déjà présent, on le renvoie
  let token = readCsrfCookie();
  if (token) return token;

  // sinon on appelle l'endpoint qui pose le cookie et renvoie { csrf }
  try {
    const res = await fetch(apiUrl("/auth/csrf"), { credentials: "include" });
    // on tente de lire le JSON, mais même si ça échoue, le cookie peut avoir été posé
    await res.json().catch(() => ({}));
  } catch {}
  // re-lecture après l'appel
  token = readCsrfCookie();
  return token || "";
}

/** Petit helper JSON-safe pour lire une erreur serveur */
async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/** GET (avec credentials) */
export async function apiGet(pathOrUrl, init = {}) {
  const res = await fetch(apiUrl(pathOrUrl), {
    credentials: "include",
    ...init,
    method: "GET",
    headers: { ...(init.headers || {}) },
  });
  if (!res.ok) {
    const err = await safeJson(res);
    throw new Error(err?.error || res.statusText || "Request failed");
  }
  return res.json();
}

/** Appels JSON pour méthodes en écriture: POST/PUT/PATCH/DELETE */
async function apiJson(method, pathOrUrl, body) {
  // Assure un token CSRF (double-submit cookie)
  const csrf = await getCsrf();
  const headers = {
    "Content-Type": "application/json",
    ...(csrf ? { "x-csrf-token": csrf } : {}),
  };

  const res = await fetch(apiUrl(pathOrUrl), {
    method,
    credentials: "include",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await safeJson(res);
    throw new Error(err?.error || res.statusText || "Request failed");
  }
  // Certaines routes peuvent répondre 204 No Content
  if (res.status === 204) return { ok: true };
  return res.json();
}

/** Exports pratiques */
export const apiPost = (pathOrUrl, body) => apiJson("POST", pathOrUrl, body);
export const apiPut = (pathOrUrl, body) => apiJson("PUT", pathOrUrl, body);
export const apiPatch = (pathOrUrl, body) => apiJson("PATCH", pathOrUrl, body);
export const apiDelete = (pathOrUrl, body) => apiJson("DELETE", pathOrUrl, body);

