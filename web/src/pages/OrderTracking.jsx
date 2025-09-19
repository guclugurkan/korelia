import React, { useState } from "react";
import "./OrderTracking.css";

export default function OrderTracking() {
  const [order, setOrder] = useState("");
  const [email, setEmail] = useState("");
  const [mock, setMock] = useState(null);

  const submit = (e) => {
    e.preventDefault();
    // 🔧 Ici, branche ton API / provider (Shopify, Stripe, etc.)
    // Mock de démonstration :
    setMock({
      id: order || "#1234",
      status: "En préparation",
      steps: [
        { label: "Commande validée", done: true },
        { label: "Préparation", done: true },
        { label: "Expédiée", done: false },
        { label: "Livrée", done: false },
      ],
      eta: "2–4 jours ouvrés",
      lastUpdate: "il y a 3 h",
    });
  };

  return (
    <main className="track-page">
      <header className="track-hero">
        <h1>Suivi de commande</h1>
        <p>Entre ton numéro de commande et ton e-mail. Nous t’affichons l’état d’avancement.</p>
      </header>

      <section className="track-card">
        <form className="track-form" onSubmit={submit}>
          <div className="row">
            <label>Numéro de commande</label>
            <input value={order} onChange={e=>setOrder(e.target.value)} placeholder="#1234" required />
          </div>
          <div className="row">
            <label>E-mail</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="votre@mail.com" required />
          </div>
          <button className="btn" type="submit">Rechercher</button>
        </form>

        {mock && (
          <div className="result">
            <h2>Commande {mock.id}</h2>
            <p><strong>Statut :</strong> {mock.status} <span className="muted">({mock.lastUpdate})</span></p>
            <ul className="steps">
              {mock.steps.map((s,i)=>(
                <li key={i} className={s.done ? "done":""}>
                  <span className="dot" /> {s.label}
                </li>
              ))}
            </ul>
            <p className="muted">Estimation de livraison : {mock.eta}</p>
          </div>
        )}
      </section>
    </main>
  );
}
