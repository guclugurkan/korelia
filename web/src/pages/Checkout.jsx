// src/pages/Checkout.jsx
import { useCart } from "../cart/CartContext";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../auth/AuthContext"; // <-- CSRF & user

const API = import.meta.env.VITE_API_URL || "http://localhost:4242";

export default function Checkout(){
  const { items, total_cents } = useCart();
  const { csrf, user } = useAuth(); // <-- récup token CSRF (et user si utile)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 👉 si panier vide
  if(items.length === 0){
    return (
      <main style={{padding:24}}>
        <h1>Paiement</h1>
        <p>Votre panier est vide.</p>
        <Link to="/catalogue">Retour au catalogue</Link>
      </main>
    );
  }

  // 👉 fonction qui appelle ton backend Stripe
  const pay = async () => {
    try {
      setLoading(true);
      setError("");

      // on envoie seulement {id, qty} au serveur
      const payload = {
        items: items.map(i => ({ id: i.id, qty: i.qty })),
        // Optionnel: si tu veux supporter les invités non connectés,
        // envoie un email de contact si tu l'as capté côté front :
        // customerEmail: guestEmail || undefined,
      };

      const resp = await fetch(`${API}/api/create-checkout-session`, {
        method: "POST",
        credentials:"include", // cookie JWT/CSRF
        headers: {
          "Content-Type":"application/json",
          "X-CSRF-Token": csrf,          // <-- IMPORTANT
        },
        body: JSON.stringify(payload)
      });

      const data = await resp.json().catch(()=> ({}));
      if(!resp.ok){
        // messages plus clairs (401/403 fréquents si CSRF manquant)
        const msg = data.error || (resp.status === 401 ? "Non authentifié" :
                                   resp.status === 403 ? "Action non autorisée" :
                                   "Erreur inconnue");
        throw new Error(msg);
      }

      // redirection vers Stripe
      window.location.href = data.url;

    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <main style={{width:"90%", margin:"0 auto"}}>
      <h1>Paiement</h1>

      <ul>
        {items.map(i=>(
          <li key={i.id}>
            {i.qty} × {i.name} — {((i.price_cents * i.qty)/100).toFixed(2)} €
          </li>
        ))}
      </ul>

      <h2>Total : {(total_cents/100).toFixed(2)} €</h2>

      {error && <p style={{color:"#c33"}}>{error}</p>}
      <p style={{marginTop:8, color:"#6b6b6b"}}>
        Livraison <b>gratuite</b> dès 50,00 € d’articles. Les options de livraison sont choisies sur la page de paiement sécurisée.
      </p>
      <button
        onClick={pay}
        disabled={loading || !csrf} // on bloque tant que le token CSRF n’est pas prêt
        title={!csrf ? "Initialisation en cours…" : undefined}
        style={{
          marginTop:16,
          padding:"12px 18px",
          borderRadius:999,
          border:0,
          background:"#111",
          color:"#fff",
          fontWeight:700,
          cursor: (loading || !csrf) ? "not-allowed" : "pointer",
          opacity: (loading || !csrf) ? 0.7 : 1
        }}
      >
        {loading ? "Redirection vers Stripe..." : "Payer en toute sécurité"}
      </button>
    </main>
  );
}
