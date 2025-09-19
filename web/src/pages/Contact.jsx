import React from "react";
import "./Contact.css";

export default function Contact() {
  return (
    <main className="contact-page">
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
            <li><strong>E-mail :</strong> <a href="mailto:contact@korelia.be">contact@korelia.be</a></li>
            <li><strong>WhatsApp :</strong> <a href="https://wa.me/32400000000" target="_blank" rel="noreferrer">+32 400 00 00 00</a></li>
            <li><strong>Instagram :</strong> <a href="https://instagram.com" target="_blank" rel="noreferrer">@korelia</a></li>
          </ul>
        </article>

        <article className="contact-card">
          <h2>Formulaire</h2>
          <form className="contact-form" onSubmit={(e)=>e.preventDefault()}>
            <div className="row">
              <label>Nom</label>
              <input type="text" placeholder="Votre nom" required />
            </div>
            <div className="row">
              <label>E-mail</label>
              <input type="email" placeholder="Votre e-mail" required />
            </div>
            <div className="row">
              <label>Objet</label>
              <input type="text" placeholder="Ex. Conseil routine, commande #1234…" />
            </div>
            <div className="row">
              <label>Message</label>
              <textarea rows="5" placeholder="Votre message…"></textarea>
            </div>
            <button className="btn" type="submit">Envoyer</button>
          </form>
          <p className="small">En envoyant, vous acceptez notre <a href="/confidentialite">politique de confidentialité</a>.</p>
        </article>

        <article className="contact-card">
          <h2>Horaires</h2>
          <ul className="hours">
            <li>Lun–Ven : 9:00 – 18:00</li>
            <li>Sam : 10:00 – 14:00</li>
            <li>Dim : fermé</li>
          </ul>
          <h3 className="mt16">Besoin d’un conseil routine ?</h3>
          <p>Décris ta peau + objectifs, on te propose une routine personnalisée.</p>
        </article>
      </section>
    </main>
  );
}
