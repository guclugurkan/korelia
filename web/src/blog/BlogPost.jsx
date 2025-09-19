// web/src/blog/Blog.jsx
import { Link } from "react-router-dom";
import { posts } from "./blogdata.js";
import "./Blog.css";

export default function Blog() {
  return (
    <section className="blog-list">
      {posts.map((p) => (
        <article key={p.slug} className="card">
          <Link to={`/blog/${p.slug}`} className="card-media">
            <img src={p.cover} alt={p.title} />
          </Link>

          <div className="card-body">
            <div className="meta">
              <span className="cat">{p.category}</span>
              <span className="dot">•</span>
              <time>{new Date(p.date).toLocaleDateString()}</time>
            </div>

            <h2 className="card-title">
              <Link to={`/blog/${p.slug}`}>{p.title}</Link>
            </h2>

            <p className="card-excerpt">{p.excerpt}</p>

            <Link to={`/blog/${p.slug}`} className="readmore">
              Lire l’article →
            </Link>
          </div>
        </article>
      ))}
    </section>
  );
}
