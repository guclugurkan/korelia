// src/blog/Blog.jsx  (liste des articles)
import { Link } from "react-router-dom";
import { posts } from "./blogdata.js";

import "./Blog.css";

export default function Blog() {
  return (
    <section className="blog">
      <div className="bs-header">
        <h1 className="bs-title">Korelia Blog</h1>
      </div>

      <div className="blog-grid">
        {posts.map((p) => (
          <article key={p.slug} className="card">
            <Link to={`/blog/${p.slug}`} className="media" aria-label={p.title}>
              <img src={p.cover} alt={p.title} loading="lazy" />
            </Link>
            <div className="body">
              <div className="meta">
                <span className="cat">{p.category}</span>
                <span className="dot">•</span>
                <time>{new Date(p.date).toLocaleDateString()}</time>
              </div>
              <h2 className="title">
                <Link to={`/blog/${p.slug}`}>{p.title}</Link>
              </h2>
              <p className="excerpt">{p.excerpt}</p>
              <Link className="readmore" to={`/blog/${p.slug}`}>Lire plus →</Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
