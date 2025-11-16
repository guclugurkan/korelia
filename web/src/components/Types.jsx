// src/components/Types.jsx
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import "./Types.css";

export default function Types() {
  const types = useMemo(
    () => [
      { key: "nettoyant", label: "Nettoyant", img: "/img/types/nettoyant/img1.png" },
      { key: "huile-nettoyante", label: "Huile Nettoyante", img: "/img/types/huile-nettoyante/img1.png" },
      { key: "gommage", label: "Gommage", img: "/img/types/gommage/img1.png" },
      { key: "toner", label: "Toner", img: "/img/types/toner/img1.png" },
      { key: "essence", label: "Essence", img: "/img/types/essence/img1.png" },
      { key: "serum-ampoule", label: "Sérum & Ampoule", img: "/img/types/serum-ampoule/img1.png" },
      { key: "creme", label: "Crème", img: "/img/types/creme/img1.png" },
      { key: "mask", label: "Masque", img: "/img/types/mask/img1.png" },
      { key: "spf", label: "Crème solaire", img: "/img/types/spf/img1.png" },
      { key: "contour-des-yeux", label: "Contour des Yeux", img: "/img/types/contour-des-yeux/img1.png" },
    ],
    []
  );

  return (
    <section className="types">
      <div className="bs-header">
        <h1 className="bs-title">Catégorie</h1>
      </div>

      <div className="types-shell">
        {/* Dégradés latéraux */}
        <div className="fade fade-left" aria-hidden="true" />
        <div className="fade fade-right" aria-hidden="true" />

        {/* Carrousel défilable */}
        <div className="types-scroller" role="list">
          {types.map((t) => (
            <article key={t.key} className="type-card" role="listitem">
              <Link
                to={`/catalogue?cats=${encodeURIComponent(t.label)}`}
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
      </div>
    </section>
  );
}
