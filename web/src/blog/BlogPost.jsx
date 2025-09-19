// src/blog/BlogPost.jsx  (page article)
import { useParams, Link } from "react-router-dom";
import { posts } from "/src/blog/blogdata.js";
import "./Blog.css";

// mini parser markdown ultra simple (titres, gras, listes, citation)
function mdLite(md = "") {
  return md
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^\> (.*)$/gm, "<blockquote>$1</blockquote>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^- (.*)$/gm, "<li>$1</li>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/^1\) (.*)$/gm, "<ol><li>$1</li></ol>");
}

export default function BlogPost() {
  const { slug } = useParams();
  const post = posts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <section className="blog">
        <p>Article introuvable.</p>
        <Link to="/blog" className="readmore">← Retour au blog</Link>
      </section>
    );
  }

  return (
    <article className="post">
      <header className="post-hero">
        <img src={post.cover} alt={post.title} />
        <div className="overlay">
          <h1>{post.title}</h1>
          <div className="meta">
            <span className="cat">{post.category}</span>
            <span className="dot">•</span>
            <time>{new Date(post.date).toLocaleDateString()}</time>
          </div>
        </div>
      </header>

      <div className="post-content">
        <p dangerouslySetInnerHTML={{ __html: mdLite(post.content) }} />
      </div>

      <footer className="post-footer">
        <Link to="/blog" className="pack-btn">← Tous les articles</Link>
        <Link to="/packs" className="pack-btn">Découvrir nos Pack Routines</Link>
      </footer>
    </article>
  );
}
