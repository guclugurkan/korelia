// src/lib/csrf.js
const API = import.meta.env.VITE_API_URL || "http://localhost:4242";

function getCookie(name){
  return document.cookie
    .split("; ")
    .map(v => v.split("="))
    .reduce((acc, [k, val]) => (acc[k] = val, acc), {})[name];
}

export async function ensureCsrf(){
  let token = getCookie("csrf_token");
  if (!token) {
    const r = await fetch(`${API}/auth/csrf`, { credentials: "include" });
    const d = await r.json().catch(()=> ({}));
    token = d.csrf;
  }
  return token;
}

export async function fetchWithCsrf(url, options = {}){
  const token = await ensureCsrf();
  const headers = { ...(options.headers || {}), "x-csrf-token": token };
  return fetch(url, { ...options, headers, credentials: "include" });
}
