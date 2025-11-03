// src/blog/Blog.jsx
import { Link, useLocation } from "react-router-dom";
import { posts } from "./blogdata.js";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./Blog.css";

/** Respecte BASE_URL pour /public en prod */
function publicAsset(p) {
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  const base = import.meta.env.BASE_URL || "/";
  const rel = String(p).replace(/^(\.\/|\.\.\/)+/, "").replace(/^\/+/, "");
  return (base.endsWith("/") ? base : base + "/") + rel;
}

export default function Blog() {
  const location = useLocation();
  const isFullPage = location.pathname === "/blog";     // /blog = page complète
  const limit = isFullPage ? posts.length : 6;          // aperçu: 6 articles

  const visible = posts.slice(0, limit);

  return (
    <main>
      {isFullPage && <Header />}

      <section className="blog">
        <div className="bs-header" style={{ display: "grid", placeItems: "center", gap: 10 }}>
          <h1 className="bs-title">Korelia Blog</h1>

          {/* Sur la page complète: bouton retour accueil */}
          {isFullPage && (
            <div style={{ marginTop: 6 }}>
              <Link className="pack-btn" to="/">← Retour à l’accueil</Link>
            </div>
          )}
        </div>

        <div className="blog-grid">
          {visible.map((p) => {
            const cover = publicAsset(p.cover);
            return (
              <article key={p.slug} className="card">
                <Link to={`/blog/${p.slug}`} className="media" aria-label={p.title}>
                  <img src={cover} alt={p.title} loading="lazy" />
                </Link>
                <div className="body">
                  <div className="meta">
                    <span className="cat">{p.category}</span>
                    <span className="dot">•</span>
                    <time>{new Date(p.date).toLocaleDateString("fr-BE")}</time>
                  </div>
                  <h2 className="title">
                    <Link to={`/blog/${p.slug}`}>{p.title}</Link>
                  </h2>
                  <p className="excerpt">{p.excerpt}</p>
                  <Link className="readmore" to={`/blog/${p.slug}`}>Lire plus →</Link>
                </div>
              </article>
            );
          })}
        </div>

        {/* Sur la Home (preview): bouton pour aller voir tous les articles */}
        {!isFullPage && (
          <div style={{ display: "grid", placeItems: "center", marginTop: 16 }}>
            <Link to="/blog" className="pack-btn">Voir tous les articles →</Link>
          </div>
        )}
      </section>

      {isFullPage && <Footer />}
    </main>
  );
}
