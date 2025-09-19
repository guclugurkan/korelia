import React from "react";
import "./About.css";

export default function About() {
  return (
    <main className="about-page">
      <header className="about-hero">
        <h1>À propos de Korelia</h1>
        <p>Notre mission : rendre la skincare coréenne accessible, claire et efficace pour tous les types de peaux.</p>
      </header>

      <section className="about-grid">
        <article className="about-card">
          <h2>Notre histoire</h2>
          <p>
            Korelia est née d’une passion pour la K-beauty et d’un constat : trop de choix, peu d’explications, des routines compliquées. 
            Nous avons décidé de sélectionner des marques fiables et des produits cohérents, puis d’expliquer les routines simplement.
          </p>
          <p>
            Aujourd’hui, nous aidons des centaines de clients à bâtir une routine adaptée à leur peau, avec des packs clairs (Standard / Complet) 
            et des conseils concrets.
          </p>
        </article>

        <article className="about-card">
          <h2>Nos engagements</h2>
          <ul className="bullet">
            <li>🧪 Sélection rigoureuse des formules et des textures.</li>
            <li>🔎 Transparence : description simple et utile (type de peau, usage).</li>
            <li>🛡️ Authenticité : produits d’origine, circuits officiels.</li>
            <li>🌱 Respect : priorité aux formules douces, non agressives.</li>
          </ul>
        </article>

        <article className="about-card">
          <h2>Pourquoi la K-beauty ?</h2>
          <p>
            Des routines progressives, une priorité à l’hydratation et à la barrière cutanée, 
            des textures sensorielles qui donnent envie d’être réguliers. Résultat : une peau plus stable, plus lumineuse.
          </p>
        </article>
      </section>

      <section className="about-cta">
        <a className="btn" href="/packs">Découvrir les packs</a>
        <a className="btn alt" href="/contact">Parler à un conseiller</a>
      </section>
    </main>
  );
}
