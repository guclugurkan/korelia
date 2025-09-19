// src/components/Types.jsx
import React, { useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import "./Types.css";

export default function Types() {
  const types = useMemo(
    () => [
      { key: "nettoyant", label: "Nettoyant",     img: "/img/typesimg2.png" },
      { key: "gommage",   label: "Gommage",       img: "/img/typesimg6.png" },
      { key: "toner",     label: "Toner",         img: "/img/typesimg4.png" },
      { key: "essence",   label: "Essence",       img: "/img/typesimg5.png" },
      { key: "serum",     label: "Sérum",         img: "/img/typesimg1.png" },
      { key: "creme",     label: "Crème",         img: "/img/typesimg1.png" },
      { key: "mask",      label: "Masque tissu",  img: "/img/typesimg1.png" },
      { key: "spf",       label: "Crème solaire", img: "/img/typesimg1.png" },
      { key: "ampoule",   label: "Ampoule",       img: "/img/typesimg1.png" },
    ],
    []
  );

  const scrollerRef = useRef(null);

  const scrollByItems = (dir) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const firstCard = scroller.querySelector(".type-card");
    const gap = 16; // doit matcher --types-gap
    const cardWidth =
      (firstCard?.getBoundingClientRect().width || scroller.clientWidth / 5) + gap;
    const delta = cardWidth * 5 * (dir === "next" ? 1 : -1);
    scroller.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <section className="types">
      <div className="bs-header">
        <h1 className="bs-title">Catégorie</h1>
      </div>

      <div className="types-shell">
        <div className="fade fade-left" aria-hidden="true" />
        <div className="fade fade-right" aria-hidden="true" />

        <div ref={scrollerRef} className="types-scroller" role="list">
          {types.map((t) => (
            <article key={t.key} className="type-card" role="listitem">
              <Link
                to={`/catalogue?q=${encodeURIComponent(t.label)}`}  // ⬅️ comme Brands.jsx
                className="type-link"
                aria-label={`Voir ${t.label}`}
              >
                <div
                  className="type-bg"
                  style={{ backgroundImage: `url('${t.img}')` }}
                  aria-hidden="true"
                />
                <div className="type-overlay" />
                <div className="type-name">{t.label}</div>
              </Link>
            </article>
          ))}
        </div>

        <div className="nav nav-left">
          <button
            className="nav-btn"
            aria-label="Précédent"
            onClick={() => scrollByItems("prev")}
            dangerouslySetInnerHTML={{ __html: `
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round"/>
              </svg>` }}
          />
        </div>
        <div className="nav nav-right">
          <button
            className="nav-btn"
            aria-label="Suivant"
            onClick={() => scrollByItems("next")}
            dangerouslySetInnerHTML={{ __html: `
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round"/>
              </svg>` }}
          />
        </div>
      </div>
    </section>
  );
}
