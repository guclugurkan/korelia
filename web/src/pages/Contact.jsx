// src/pages/Contact.jsx
import React, { useState } from "react";
import "./Contact.css";
import Footer from "../components/Footer";
import { apiJson } from "../lib/api.js";
import SiteHeader from "../components/SiteHeader.jsx";
import { Helmet } from 'react-helmet-async';

const API = import.meta.env.VITE_API_URL || "http://localhost:4242";

function getCsrfFromCookie() {
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [okMsg, setOkMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");

  async function ensureCsrf() {
    try {
      // si déjà set par ailleurs, pas grave, l’endpoint renvoie le même cookie
      await fetch(`${API}/auth/csrf`, { credentials: "include" });
    } catch {}
    return getCsrfFromCookie();
  }

  async function onSubmit(e) {
    e.preventDefault();
    setOkMsg("");
    setErrMsg("");

    const name = form.name.trim();
    const email = form.email.trim();
    const message = form.message.trim();
    const subject = form.subject.trim();

    if (!name || !email || !message) {
      setErrMsg("Merci de remplir nom, e-mail et message.");
      return;
    }

    setBusy(true);
    try {
      const csrf = await ensureCsrf();
      await apiJson("POST", "/contact", { name, email, subject, message }, { csrf });
      setOkMsg("Merci ! Votre message a bien été envoyé. Nous revenons vers vous sous 24–48h ouvrées.");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (e) {
      setErrMsg(e.message || "Envoi impossible pour le moment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="contact-page">



      <Helmet>
        <title>Contact — Korelia</title>
        <meta
          name="description"
          content="Besoin d’aide ? Contactez Korelia : questions sur une commande, conseils produits, retours et SAV."
        />
        <link rel="canonical" href="https://korelia.be/contact" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Contact — Korelia" />
        <meta property="og:description" content="Nous répondons rapidement à vos questions et demandes." />
        <meta property="og:url" content="https://korelia.be/contact" />
        <meta property="og:image" content="https://korelia.be/img/og-cover.jpg" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />

        {/* (Optionnel) JSON-LD ContactPage */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            "name": "Contact — Korelia",
            "url": "https://korelia.be/contact",
            "about": "Support client Korelia",
            "mainEntity": {
              "@type": "Organization",
              "name": "Korelia",
              "url": "https://korelia.be",
              "contactPoint": [{
                "@type": "ContactPoint",
                "contactType": "customer support",
                "email": "koreliacontact@gmail.com",
                "areaServed": "BE"
              }]
            }
          })}
        </script>
      </Helmet>

      <SiteHeader/>
      <header className="contact-hero">
        <h1>Contact</h1>
        <p>Une question sur un produit, une routine ou une commande ? On te répond avec plaisir.</p>
      </header>

      <section className="contact-grid">
        <article className="contact-card">
          <h2>Écris-nous</h2>
          <p>
            Tu peux nous joindre par e-mail ou WhatsApp. Nous répondons sous 24–48h ouvrées.
          </p>
          <ul className="contact-list">
            <li><strong>E-mail :</strong> <a href="mailto:koreliacontact@gmail.com">koreliacontact@gmail.com</a></li>
            <li><strong>WhatsApp :</strong> <a href="https://wa.me/32400000000" target="_blank" rel="noreferrer">+32 400 00 00 00</a></li>
            <li><strong>Instagram :</strong> <a href="https://instagram.com/korelia.be/" target="_blank" rel="noreferrer">@korelia.be</a></li>
          </ul>
        </article>

        <article className="contact-card">
          <h2>Formulaire</h2>

          <form className="contact-form" onSubmit={onSubmit}>
            <div className="row">
              <label>Nom</label>
              <input
                type="text"
                placeholder="Votre nom"
                value={form.name}
                onChange={(e)=> setForm(f => ({...f, name:e.target.value}))}
                required
              />
            </div>
            <div className="row">
              <label>E-mail</label>
              <input
                type="email"
                placeholder="Votre e-mail"
                value={form.email}
                onChange={(e)=> setForm(f => ({...f, email:e.target.value}))}
                required
              />
            </div>
            <div className="row">
              <label>Objet</label>
              <input
                type="text"
                placeholder="Ex. Conseil routine, commande #1234…"
                value={form.subject}
                onChange={(e)=> setForm(f => ({...f, subject:e.target.value}))}
              />
            </div>
            <div className="row">
              <label>Message</label>
              <textarea
                rows="5"
                placeholder="Votre message…"
                value={form.message}
                onChange={(e)=> setForm(f => ({...f, message:e.target.value}))}
                required
              />
            </div>

            <button className="btn" type="submit" disabled={busy}>
              {busy ? "Envoi…" : "Envoyer"}
            </button>

            {okMsg && <p className="ok">{okMsg}</p>}
            {errMsg && <p className="err">{errMsg}</p>}
          </form>

          <p className="small">
            En envoyant, vous acceptez notre <a href="/confidentialite">politique de confidentialité</a>.
          </p>
        </article>
      </section>

      <Footer/>
    </main>
  );
}
