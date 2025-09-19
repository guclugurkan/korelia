import { createContext, useContext, useEffect, useState } from "react";
const API = import.meta.env.VITE_API_URL || "http://localhost:4242";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }){
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [csrf, setCsrf] = useState("");

  // utilitaire qui ajoute le header CSRF pour les méthodes non-GET
  async function apiFetch(path, { method="GET", headers={}, body } = {}){
    const isWrite = !["GET","HEAD","OPTIONS"].includes(method.toUpperCase());
    const resp = await fetch(`${API}${path}`, {
      method,
      credentials: "include",
      headers: {
        ...(isWrite ? { "x-csrf-token": csrf } : {}),
        ...headers,
      },
      body
    });
    return resp;
  }

  // 1) Récupérer CSRF puis 2) tenter /me
  useEffect(()=>{
    (async ()=>{
      try{
        // 1) récupérer un token utilisable
        const r1 = await fetch(`${API}/auth/csrf`, { credentials:"include" });
        const d1 = await r1.json().catch(()=> ({}));
        if (d1?.csrf) setCsrf(d1.csrf);
      }catch(e){ /* noop */ }

      try{
        // 2) tenter /me (si cookie JWT présent)
        const r = await apiFetch(`/me`, { method:"GET" });
        if(r.ok){ setUser(await r.json()); }
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // === AUTH ===
  async function register({ name, email, password }) {
    const r = await apiFetch(`/auth/register`, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ name, email, password })
    });
    const data = await r.json().catch(()=> ({}));
    if (!r.ok) throw new Error(data.error || "Inscription échouée");
    setUser(data);
    return data;
  }
  async function login({ email, password }){
    const r = await apiFetch(`/auth/login`, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await r.json().catch(()=> ({}));
    if(!r.ok) throw new Error(data.error||'Erreur connexion');
    setUser(data);
    return data;
  }
  async function logout(){
    await apiFetch(`/auth/logout`, { method:"POST" });
    setUser(null);
  }

  // === ADRESSE ===
  async function getAddress(){
    const r = await apiFetch(`/me/address`, { method:"GET" });
    if(!r.ok) return null;
    return r.json();
  }
  async function saveAddress(addr){
    const r = await apiFetch(`/me/address`, {
      method:"PUT",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(addr)
    });
    const data = await r.json().catch(()=> ({}));
    if(!r.ok) throw new Error(data.error||'Erreur adresse');
    return data;
  }

  // === PROFIL ===
  async function changePassword({ current_password, new_password }) {
    const r = await apiFetch(`/me/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current_password, new_password })
    });
    const data = await r.json().catch(()=> ({}));
    if (!r.ok) throw new Error(data.error || "Impossible de changer le mot de passe");
    return data;
  }
  async function updateProfileName(name) {
    const r = await apiFetch(`/me`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    const data = await r.json().catch(()=> ({}));
    if (!r.ok) throw new Error(data.error || "Impossible de mettre à jour");
    setUser(data); // rafraîchir le user local directement
    return data;
  }

  // === EMAIL ===
  async function forgotPassword(email) {
    const r = await apiFetch(`/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    await r.json().catch(()=> ({}));
    return { ok: true };
  }
  async function resetPassword(token, new_password) {
    const r = await apiFetch(`/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, new_password })
    });
    const data = await r.json().catch(()=> ({}));
    if (!r.ok) throw new Error(data.error || "Échec de la réinitialisation");
    return data;
  }
  async function resendVerification(){
    const r = await apiFetch(`/auth/resend-verification`, { method:"POST" });
    const data = await r.json().catch(()=> ({}));
    if (!r.ok) throw new Error(data.error || "Impossible d’envoyer l’email");
    return data;
  }

  // === REWARDS ===
  async function fetchMyRewards() {
    const r = await apiFetch(`/me/rewards`, { method:"GET", headers: { "Accept":"application/json" }});
    const data = await r.json().catch(()=> ({}));
    if (!r.ok) throw new Error(data.error || "Impossible de charger les points");
    return data;
  }
  async function fetchRewardsCatalog() {
    const r = await apiFetch(`/rewards/catalog`, { method:"GET" });
    const data = await r.json().catch(()=> ({}));
    if (!r.ok) throw new Error(data.error || "Catalog indisponible");
    return data;
  }
  async function redeemReward(tierKey) {
    const r = await apiFetch(`/rewards/redeem`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier: tierKey }),
    });
    const data = await r.json().catch(()=> ({}));
    if (!r.ok) throw new Error(data.error || "Échec de la réclamation");
    return data;
  }
  async function addReviewPoints({ productId, rating=5, content="" }) {
    const r = await apiFetch(`/reviews/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, rating, content })
    });
    const data = await r.json().catch(()=> ({}));
    if (!r.ok) throw new Error(data.error || "Impossible d'ajouter l'avis");
    return data;
  }

  return (
    <AuthCtx.Provider value={{
      user, loading,
      register, login, logout,
      getAddress, saveAddress,
      changePassword, updateProfileName,
      forgotPassword, resetPassword, resendVerification,
      fetchMyRewards, fetchRewardsCatalog, redeemReward, addReviewPoints
    }}>
      {children}
    </AuthCtx.Provider>
  );
}
