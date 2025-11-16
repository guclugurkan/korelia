// src/pages/Brands.jsx
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import SiteHeader from "../components/SiteHeader";
import "./Brands.css";

const BRANDS = [
  { name: "ANUA",             slug: "anua",             img: "/img/brandsimg/anuaimg2.png" },
  { name: "Beauty of Joseon", slug: "beauty-of-joseon", img: "/img/brandsimg/bojimg.png" },
  { name: "Biodance",         slug: "biodance",         img: "/img/brandsimg/biodanceimg.png" },
  { name: "COSRX",            slug: "cosrx",            img: "/img/brandsimg/cosrximg.png" },
  { name: "Dr Althea",        slug: "dr-althea",        img: "/img/brandsimg/draltheaimg.png"},
  { name: "Haruharu Wonder",  slug: "haruharu-wonder",  img: "/img/brandsimg/haruharuimg.png" },
  { name: "I'm From",         slug: "im-from",          img: "/img/brandsimg/imfromimg.png" },
  { name: "iUNIK",            slug: "iunik",            img: "/img/brandsimg/iunikimg.png" },
  { name: "Laneige",          slug: "laneige",          img: "/img/brandsimg/laneigeimg.png" },
  { name: "Medicube",         slug: "medicube",         img: "/img/brandsimg/medicubeimg.png" },
  { name: "Mixsoon",          slug: "mixsoon",          img: "/img/brandsimg/mixsoonimg.png" },
  { name: "Round Lab",        slug: "round-lab",        img: "/img/brandsimg/roundlabimg.png"},
  { name: "SKIN1004",         slug: "skin1004",         img: "/img/brandsimg/skin1004img.png" },
  { name: "Some By Mi",       slug: "some-by-mi",       img: "/img/brandsimg/somebymiimg.png" },
  { name: "Torriden",         slug: "torriden",         img: "/img/brandsimg/torridenimg.png" },
];

export default function Brands() {
  return (
    <main className="brandsPage-wrap">
      <SiteHeader />

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
