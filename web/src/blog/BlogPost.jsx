// src/blog/BlogPost.jsx
import { Link, useParams } from "react-router-dom";
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

/** Mini markdown → HTML (titres, gras/italique, listes, citations, sauts de ligne) */
function mdToHtml(src = "") {
  let s = String(src);

  // titres ###
  s = s.replace(/^### (.*)$/gm, "<h3>$1</h3>");
  s = s.replace(/^## (.*)$/gm, "<h2>$1</h2>");
  s = s.replace(/^# (.*)$/gm, "<h1>$1</h1>");

  // gras / italique
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // listes à puces (lignes commençant par - ou *)
  s = s.replace(/^(?:-|\*) (.*(?:\n(?:-|\*) .*)*)/gm, (m) => {
    const items = m.split("\n").map((line) => line.replace(/^(?:-|\*) /, "").trim());
    return "<ul>" + items.map((it) => `<li>${it}</li>`).join("") + "</ul>";
  });

  // citations
  s = s.replace(/^> (.*)$/gm, '<blockquote><p>$1</p></blockquote>');

  // paragraphes / sauts de ligne
  // double saut = nouveau paragraphe
  s = s.replace(/\n{2,}/g, "</p><p>");
  s = `<p>${s}</p>`.replace(/<p>\s*<\/p>/g, "");

  return s;
}

export default function BlogPost() {
  const { slug } = useParams();
  const post = posts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <main>
        <Header />
        <section className="post-content" style={{ textAlign: "center", marginTop: 32 }}>
          <h1>Article introuvable</h1>
          <p>Le contenu demandé n’existe pas ou a été déplacé.</p>
          <Link className="pack-btn" to="/blog">← Retour au blog</Link>
        </section>
        <Footer />
      </main>
    );
  }

  const cover = publicAsset(post.cover);

  return (
    <main>
      <Header />

      {/* Héros de l’article */}
      <section className="post-hero" role="img" aria-label={post.title}>
        <img src={cover} alt="" />
        <div className="overlay">
          <div className="meta">
            <span className="cat">{post.category}</span>
            <span className="dot">•</span>
            <time>{new Date(post.date).toLocaleDateString("fr-BE")}</time>
          </div>
          <h1>{post.title}</h1>
        </div>
      </section>

      {/* Corps de l’article */}
      <article
        className="post-content"
        dangerouslySetInnerHTML={{ __html: mdToHtml(post.content) }}
      />

      {/* Footer navigation */}
      <div className="post-footer">
        <Link to="/blog" className="pack-btn">← Tous les articles</Link>
        <Link to="/" className="pack-btn">Accueil</Link>
      </div>

      <Footer />
    </main>
  );
}
