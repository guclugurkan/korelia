import { Link } from "react-router-dom"; // ✅ ajoute Link
import "./Marques.css";

const brands6 = [
  { id: 1, name: "Anua",         img1: "/img/anua/marquesimg2.png",  img2: "/img/anua/marquesimg3.png" },
  { id: 2, name: "Beauty of Joseon", img1: "/img/marquesimg4.png",       img2: "/img/marquesimg5.png" },
  { id: 3, name: "COSRX",        img1: "/img/marquesimg15.png",      img2: "/img/marquesimg16.png" },
  { id: 4, name: "Skin1004",     img1: "/img/skin1004/product5/img4.png",  img2: "./img/skin1004/product5/img2.png" },
  { id: 5, name: "Medicube",     img1: "/img/marquesimg9.png",       img2: "/img/marquesimg10.png" },
  { id: 6, name: "Torriden",     img1: "/img/marquesimg18.png",      img2: "/img/marquesimg17.png" },
];

// ordre: 1,2,3, (4578) => "big", 6, 9
const areas = ["one","two","three","big","six","nine"];

export default function Marques() {
  return (
    <section className="marques marques--six" aria-label="Nos marques (6)">
      <div className="bs-header">
        <h1 className="bs-titlee">Marques en tendance</h1>
      </div>

      <div className="marques-grid-six">
        {brands6.map((b, i) => (
          <article key={b.id} className={`brand-card area-${areas[i]}`}>
            {/* Remplacement de <a> par <Link> */}
            <Link
              className="brand-tile"
              to={`/catalogue?q=${encodeURIComponent(b.name)}`}
              aria-label={`Découvrir ${b.name}`}
            >
              <img className="brand-img primary"   src={b.img1} alt={b.name} loading="lazy" />
              <img className="brand-img secondary" src={b.img2} alt="" aria-hidden="true" loading="lazy" />
            </Link>

            <div className="brand-name">{b.name}</div>
          </article>
        ))}
      </div>
    </section>
  );
}
