import { createContext, useContext, useEffect, useState, useRef } from "react";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:4242").replace(/\/+$/, "");

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [csrf, setCsrf] = useState("");
  const initDone = useRef(false);

  // Construit une URL correcte à partir d'un path type "/me"
  const url = (path) => `${API_BASE}/${String(path).replace(/^\/+/, "")}`;

  // Récupère (ou rafraîchit) le token CSRF
  async function fetchCsrf() {
    try {
      const r = await fetch(url("/auth/csrf"), { credentials: "include" });
      const d = await r.json().catch(() => ({}));
      if (d?.csrf) setCsrf(d.csrf);
      return d?.csrf || "";
    } catch {
      return "";
    }
  }

  // Wrapper fetch qui :
  // - joint toujours credentials
  // - injecte X-CSRF-Token sur méthodes non-GET
  // - retry 1x si 403 CSRF
  async function apiFetch(path, { method = "GET", headers = {}, body } = {}) {
    const isWrite = !["GET", "HEAD", "OPTIONS"].includes(String(method).toUpperCase());
    const doFetch = async () =>
      fetch(url(path), {
        method,
        credentials: "include",
        headers: {
          ...(isWrite && csrf ? { "x-csrf-token": csrf } : {}),
          ...headers,
        },
        body,
      });

    let resp = await doFetch();

    // Si 403, on tente un refresh CSRF puis on ré-essaie une fois
    if (resp.status === 403 && isWrite) {
      const fresh = await fetchCsrf();
      if (fresh) {
        resp = await fetch(url(path), {
          method,
          credentials: "include",
          headers: {
            "x-csrf-token": fresh,
            ...headers,
          },
          body,
        });
      }
    }
    return resp;
  }

  // Au démarrage : 1) CSRF 2) /me
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    (async () => {
      try {
        await fetchCsrf(); // place le cookie + state csrf
      } finally {
        try {
          const r = await apiFetch("/me", { method: "GET" }); // GET => pas de CSRF requis
          if (r.ok) {
            const me = await r.json();
            setUser(me);
          }
        } catch {
          /* noop */
        } finally {
          setLoading(false);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // === AUTH ===
  async function register({ name, email, password }) {
    const r = await apiFetch("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || "Inscription échouée");
    setUser(data);
    return data;
  }

  async function login({ email, password }) {
    const r = await apiFetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || "Erreur connexion");
    setUser(data);
    return data;
  }

  async function logout() {
    await apiFetch("/auth/logout", { method: "POST" });
    setUser(null);
  }

  // === ADRESSE ===
  async function getAddress() {
    const r = await apiFetch("/me/address", { method: "GET", headers: { Accept: "application/json" } });
    if (!r.ok) return null;
    return r.json();
  }
  async function saveAddress(addr) {
    const r = await apiFetch("/me/address", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(addr),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || "Erreur adresse");
    return data;
  }

  // === PROFIL ===
  async function changePassword({ current_password, new_password }) {
    const r = await apiFetch("/me/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ current_password, new_password }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || "Impossible de changer le mot de passe");
    return data;
  }

  async function updateProfileName(name) {
    const r = await apiFetch("/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || "Impossible de mettre à jour");
    setUser(data); // rafraîchir le user local directement
    return data;
  }

  // === EMAIL / RESET ===
  async function forgotPassword(email) {
    await apiFetch("/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email }),
    });
    return { ok: true };
  }

  async function resetPassword(token, new_password) {
    const r = await apiFetch("/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ token, new_password }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || "Échec de la réinitialisation");
    return data;
  }

  async function resendVerification() {
    const r = await apiFetch("/auth/resend-verification", { method: "POST", headers: { Accept: "application/json" } });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || "Impossible d’envoyer l’email");
    return data;
  }

  // === REWARDS ===
  async function fetchMyRewards() {
    const r = await apiFetch("/me/rewards", { method: "GET", headers: { Accept: "application/json" } });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || "Impossible de charger les points");
    return data;
  }

  async function fetchRewardsCatalog() {
    const r = await apiFetch("/rewards/catalog", { method: "GET", headers: { Accept: "application/json" } });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || "Catalog indisponible");
    return data;
  }

  async function redeemReward(tierKey) {
    const r = await apiFetch("/rewards/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ tier: tierKey }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || "Échec de la réclamation");
    return data;
  }

  async function addReviewPoints({ productId, rating = 5, content = "" }) {
    const r = await apiFetch("/reviews/add", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ productId, rating, content }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || "Impossible d'ajouter l'avis");
    return data;
  }

  return (
    <AuthCtx.Provider
      value={{
        user,
        loading,
        register,
        login,
        logout,
        getAddress,
        saveAddress,
        changePassword,
        updateProfileName,
        forgotPassword,
        resetPassword,
        resendVerification,
        fetchMyRewards,
        fetchRewardsCatalog,
        redeemReward,
        addReviewPoints,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}
