// src/pages/Brands.jsx
import { Link } from "react-router-dom";
import HeaderAll from "../components/HeaderAll";
import Footer from "../components/Footer";
import "./Brands.css";

const BRANDS = [
  { name: "ANUA",             slug: "anua",             img: "/img/brands/anua.jpg" },
  { name: "Beauty of Joseon", slug: "beauty-of-joseon", img: "/img/brands/beauty-of-joseon.jpg" },
  { name: "Biodance",         slug: "biodance",         img: "/img/brands/biodance.jpg" },
  { name: "COSRX",            slug: "cosrx",            img: "/img/brands/cosrx.jpg" },
  { name: "Dr Althea",        slug: "dr-althea",        img: "/img/brands/dr-althea.jpg" },
  { name: "Haruharu Wonder",  slug: "haruharu-wonder",  img: "/img/brands/haruharu-wonder.jpg" },
  { name: "I'm From",         slug: "im-from",          img: "/img/brands/im-from.jpg" },
  { name: "iUNIK",            slug: "iunik",            img: "/img/brands/iunik.jpg" },
  { name: "Laneige",          slug: "laneige",          img: "/img/brands/laneige.jpg" },
  { name: "Medicube",         slug: "medicube",         img: "/img/brands/medicube.jpg" },
  { name: "Mixsoon",          slug: "mixsoon",          img: "/img/brands/mixsoon.jpg" },
  { name: "Round Lab",        slug: "round-lab",        img: "/img/brands/round-lab.jpg" },
  { name: "SKIN1004",         slug: "skin1004",         img: "/img/brands/skin1004.jpg" },
  { name: "Some By Mi",       slug: "some-by-mi",       img: "/img/brands/some-by-mi.jpg" },
  { name: "Torriden",         slug: "torriden",         img: "/img/brands/torriden.jpg" },
];

export default function Brands() {
  return (
    <main className="brandsPage-wrap">
      <HeaderAll />

      <section className="brandsPage-hero">
        <h1>Toutes nos marques</h1>
        <p>Explore les marques phares de la skincare coréenne disponibles sur la boutique.</p>
      </section>

      <section className="brandsPage-grid" role="list">
        {BRANDS.map((b) => (
          <article key={b.slug} className="brandsPage-card" role="listitem">
            <Link
              to={`/catalogue?q=${encodeURIComponent(b.name)}`}
              className="brandsPage-link"
              aria-label={`Voir les produits ${b.name}`}
            >
              <div
                className="brandsPage-bg"
                style={{ backgroundImage: `url('${b.img}')` }}
                aria-hidden="true"
              />
              <div className="brandsPage-overlay" />
              <div className="brandsPage-name">{b.name}</div>
            </Link>
          </article>
        ))}
      </section>

      <Footer />
    </main>
  );
}
