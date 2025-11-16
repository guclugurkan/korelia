// src/components/HeaderDesktop.jsx
import "./HeaderDesktop.css";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useSearch } from "../search/SearchProvider";

export default function HeaderDesktop() {
  const nav = useNavigate();
  const { getSuggestions, slugify } = useSearch();

  const KNOWN_SKINS = [
    "grasse","mixte","sèche","sensible","normale",
    "acnéique","déshydratée","mature","terne",
    "pores-visibles","anti-âge","anti-taches",
    "abîmée","réactive","tous"
  ];

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [sug, setSug] = useState({ products: [], categories: [], brands: [] });
  const boxRef = useRef(null);

  useEffect(() => {
    if (!q.trim()) {
      setSug({ products: [], categories: [], brands: [] });
      setOpen(false);
      return;
    }
    const s = getSuggestions(q, 6);
    setSug(s);
    setOpen(!!(s.products.length || s.categories.length || s.brands.length));
  }, [q, getSuggestions]);

  useEffect(() => {
    function onClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function submitSearch() {
    if (!q.trim()) return;
    setOpen(false);
    nav(`/catalogue?q=${encodeURIComponent(q.trim())}`);
  }

  function goProduct(slug) {
    setOpen(false);
    nav(`/produit/${slug}`);
  }

  function goCategory(label) {
    setOpen(false);
    nav(`/catalogue?cat=${encodeURIComponent(slugify(label))}&catLabel=${encodeURIComponent(label)}`);
  }

  function goSkin(label) {
    setOpen(false);
    nav(`/catalogue?skin=${encodeURIComponent(slugify(label))}&skinLabel=${encodeURIComponent(label)}`);
  }

  function goBrand(brand) {
    setOpen(false);
    nav(`/catalogue?brand=${encodeURIComponent(brand)}`);
  }

  function goCatOrSkin(label) {
    const low = String(label).toLowerCase();
    const isSkin = KNOWN_SKINS.some(k => k.toLowerCase() === low);
    if (isSkin) return goSkin(label);
    return goCategory(label);
  }

  return (
    <header className="headerDesktop-wrap">
      {/* Barre du haut */}
      <div className="headerDesktop-top" ref={boxRef}>
        <div className="nomDuSitee">
          <Link to={"/"}><h1>KORELIA</h1></Link>
        </div>

        <form
          className="recherche"
          onSubmit={(e) => { e.preventDefault(); submitSearch(); }}
          autoComplete="off"
        >
          <label htmlFor="search-d" className="sr-only">Rechercher</label>
          <input
            id="search-d"
            type="search"
            name="search-input"
            placeholder="Recherche (produit, catégorie/peau, marque...)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-autocomplete="list"
            aria-label="Rechercher des produits"
            onFocus={() => { if (q.trim()) setOpen(true); }}
          />
          <button type="submit" className="rButton" aria-label="Rechercher">
            <img src="/img/searchLogo.svg" alt="" />
          </button>

          {open && (
            <div className="search-suggest">
              {sug.products.length > 0 && (
                <div className="group">
                  <div className="title">Produits</div>
                  {sug.products.map(p => (
                    <button key={p.id} type="button" className="item" onClick={() => goProduct(p.slug)}>
                      <span className="item-name">{p.name}</span>
                      {p.brand && <span className="item-meta"> — {p.brand}</span>}
                    </button>
                  ))}
                </div>
              )}

              {sug.categories.length > 0 && (
                <div className="group">
                  <div className="title">Catégories & types de peau</div>
                  {sug.categories.map(c => (
                    <button key={c} type="button" className="item" onClick={() => goCatOrSkin(c)}>
                      <span className="item-name">{c}</span>
                    </button>
                  ))}
                </div>
              )}

              {sug.brands.length > 0 && (
                <div className="group">
                  <div className="title">Marques</div>
                  {sug.brands.map(b => (
                    <button key={b} type="button" className="item" onClick={() => goBrand(b)}>
                      <span className="item-name">{b}</span>
                    </button>
                  ))}
                </div>
              )}

              {!(sug.products.length || sug.categories.length || sug.brands.length) && (
                <div className="empty">Aucun résultat</div>
              )}
            </div>
          )}
        </form>

        <div className="boutonDeNavigation">
          <Link to="/mon-compte" className="profil"><img src="/img/profilLogo2.svg" alt="Profil" /></Link>
          <Link to="/favoris" className="favori"><img src="/img/coeurLogo.svg" alt="Favoris" /></Link>
          <Link to="/panier" className="panier"><img src="/img/panierLogo.svg" alt="Panier" /></Link>
          <button className="langue"><img src="/img/langueLogo.svg" alt="Langue" /></button>
        </div>
      </div>

      {/* Barre du bas (ex-Header2) */}
      <nav className="headerDesktop-bottom" aria-label="Navigation secondaire">
        <ul>
          <li><Link to="/catalogue?cats=pack">Pack Routine</Link></li>
          <li><Link to="/composer-pack">Compose ton pack</Link></li>
          <li><Link to="/guide-skincare">Guide</Link></li>
          <li><Link to="/quiz">Quiz</Link></li>
          <li><Link to="/catalogue">Produits</Link></li>
          <li><Link to="/avantages">Nos avantages</Link></li>
          <li><Link to="/marques">Marques</Link></li>
        </ul>
      </nav>
    </header>
  );
}
