// src/pages/AboutPage.jsx
import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import "./About.css";

export default function AboutPage() {
  return (
    <main className="about-wrap">
      <SiteHeader />

      <section className="about-hero">
        <h1>À propos de Korelia</h1>
        <p>Notre passion pour la skincare coréenne, votre peau au centre de nos soins.</p>
      </section>

      <section className="about-content">
        <div className="about-text">
          <h2>Notre histoire</h2>
          <p>
            Nous sommes un jeune couple animé par une véritable passion pour la skincare coréenne.
            Fascinés par l’efficacité et la douceur des rituels de beauté asiatiques, nous avons
            décidé de créer <strong>Korelia</strong> afin de partager avec vous le meilleur de la cosmétique coréenne.
          </p>

          <h2>Notre vision</h2>
          <p>
            Notre objectif est simple : <em>commencer petit, mais avec de grandes ambitions</em>.
            Nous croyons qu’avec de la passion, de la transparence et une sélection rigoureuse,
            Korelia peut devenir, à terme, <strong>l’un des plus grands revendeurs de skincare coréenne en Europe</strong>.
          </p>

          <h2>Nos valeurs</h2>
          <ul>
            <li>✨ <strong>Authenticité</strong> : uniquement des produits originaux et de qualité.</li>
            <li>🤍 <strong>Passion</strong> : chaque produit est choisi parce qu’il nous inspire confiance.</li>
            <li>🚀 <strong>Ambition</strong> : grandir pas à pas, toujours en pensant à votre peau.</li>
          </ul>

          <p>
            Merci de nous accompagner dans cette aventure. Votre confiance est notre plus belle
            récompense, et nous avons hâte de faire découvrir à toute l’Europe les bienfaits
            de la K-beauty.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
