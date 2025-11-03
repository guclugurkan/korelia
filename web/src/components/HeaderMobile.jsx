// src/components/HeaderMobile.jsx
import "./HeaderMobile.css";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useSearch } from "../search/SearchProvider";

export default function HeaderMobile() {
  const nav = useNavigate();
  const { getSuggestions, slugify } = useSearch();

  const KNOWN_SKINS = [
    "grasse","mixte","sèche","sensible","normale",
    "acnéique","déshydratée","mature","terne",
    "pores-visibles","anti-âge","anti-taches",
    "abîmée","réactive","tous"
  ];

  // état menu burger
  const [menuOpen, setMenuOpen] = useState(false);

  // état recherche pleine page
  const [searchOpen, setSearchOpen] = useState(false);

  // état recherche
  const [q, setQ] = useState("");
  const [openSug, setOpenSug] = useState(false);
  const [sug, setSug] = useState({ products: [], categories: [], brands: [] });

  const sugRef = useRef(null);

  useEffect(() => {
    if (!q.trim()) {
      setSug({ products: [], categories: [], brands: [] });
      setOpenSug(false);
      return;
    }
    const s = getSuggestions(q, 6);
    setSug(s);
    setOpenSug(!!(s.products.length || s.categories.length || s.brands.length));
  }, [q, getSuggestions]);

  useEffect(() => {
    function onClick(e) {
      if (sugRef.current && !sugRef.current.contains(e.target)) {
        setOpenSug(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function submitSearch() {
    if (!q.trim()) return;
    closeSearch();
    nav(`/catalogue?q=${encodeURIComponent(q.trim())}`);
  }

  function goProduct(slug) {
    closeSearch();
    nav(`/produit/${slug}`);
  }

  function goCategory(label) {
    closeSearch();
    nav(`/catalogue?cat=${encodeURIComponent(slugify(label))}&catLabel=${encodeURIComponent(label)}`);
  }

  function goSkin(label) {
    closeSearch();
    nav(`/catalogue?skin=${encodeURIComponent(slugify(label))}&skinLabel=${encodeURIComponent(label)}`);
  }

  function goBrand(brand) {
    closeSearch();
    nav(`/catalogue?brand=${encodeURIComponent(brand)}`);
  }

  function goCatOrSkin(label) {
    const low = String(label).toLowerCase();
    const isSkin = KNOWN_SKINS.some(k => k.toLowerCase() === low);
    if (isSkin) return goSkin(label);
    return goCategory(label);
  }

  function closeMenu(){
    setMenuOpen(false);
  }

  function closeSearch(){
    setSearchOpen(false);
    setOpenSug(false);
    setQ("");
  }

  return (
    <>
      {/* BARRE HAUTE MOBILE */}
      <div className="hm-header">
        {/* Burger */}
        <button
          className="hm-burger"
          aria-label="Ouvrir le menu"
          onClick={() => setMenuOpen(true)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Logo */}
        <Link to="/" className="hm-logo">KORELIA</Link>

        {/* Actions droite */}
        <div className="hm-actions">
          <button
            className="hm-searchBtn"
            aria-label="Rechercher"
            onClick={() => setSearchOpen(true)}
          >
            <img src="/img/searchLogo.svg" alt="" />
          </button>

          <Link to="/mon-compte" className="hm-ico">
            <img src="/img/profilLogo2.svg" alt="Profil" />
          </Link>
          <Link to="/favoris" className="hm-ico">
            <img src="/img/coeurLogo.svg" alt="Favoris" />
          </Link>
          <Link to="/panier" className="hm-ico">
            <img src="/img/panierLogo.svg" alt="Panier" />
          </Link>
        </div>
      </div>

      {/* MENU SLIDE (burger) */}
      {menuOpen && (
        <div className="hm-overlay" onClick={closeMenu} aria-hidden="true"></div>
      )}

      <aside
        className={`hm-drawer ${menuOpen ? "is-open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <button className="hm-close" onClick={closeMenu} aria-label="Fermer le menu">×</button>
        <nav className="hm-nav" aria-label="Navigation principale">
          <Link to="/catalogue?cat=pack&catLabel=pack" onClick={closeMenu}>Pack Routine</Link>
          <Link to="/composer-pack" onClick={closeMenu}>Compose ton pack</Link>
          <Link to="/guide-skincare" onClick={closeMenu}>Guide</Link>
          <Link to="/quiz" onClick={closeMenu}>Quiz</Link>
          <Link to="/catalogue" onClick={closeMenu}>Produits</Link>
          <Link to="/avantages" onClick={closeMenu}>Nos avantages</Link>
          <Link to="/marques" onClick={closeMenu}>Marques</Link>
        </nav>
      </aside>

      {/* RECHERCHE FULLSCREEN */}
      {searchOpen && (
        <div className="hm-search-fullscreen">
          <div className="hm-search-bar" ref={sugRef}>
            <form
              className="hm-search-form"
              onSubmit={(e)=>{e.preventDefault(); submitSearch();}}
            >
              <input
                className="hm-search-input"
                type="search"
                placeholder="Recherche (produit, catégorie/peau, marque...)"
                value={q}
                onChange={(e)=>setQ(e.target.value)}
                autoFocus
              />
              <button type="submit" className="hm-search-submit">
                Rechercher
              </button>
              <button
                type="button"
                className="hm-search-cancel"
                onClick={closeSearch}
                aria-label="Fermer la recherche"
              >
                Annuler
              </button>
            </form>

            {openSug && (
              <div className="hm-suggest">
                {sug.products.length > 0 && (
                  <div className="hm-group">
                    <div className="hm-title">Produits</div>
                    {sug.products.map(p => (
                      <button key={p.id} type="button" className="hm-item" onClick={() => goProduct(p.slug)}>
                        <span className="hm-item-name">{p.name}</span>
                        {p.brand && <span className="hm-item-meta"> — {p.brand}</span>}
                      </button>
                    ))}
                  </div>
                )}

                {sug.categories.length > 0 && (
                  <div className="hm-group">
                    <div className="hm-title">Catégories & types de peau</div>
                    {sug.categories.map(c => (
                      <button key={c} type="button" className="hm-item" onClick={() => goCatOrSkin(c)}>
                        <span className="hm-item-name">{c}</span>
                      </button>
                    ))}
                  </div>
                )}

                {sug.brands.length > 0 && (
                  <div className="hm-group">
                    <div className="hm-title">Marques</div>
                    {sug.brands.map(b => (
                      <button key={b} type="button" className="hm-item" onClick={() => goBrand(b)}>
                        <span className="hm-item-name">{b}</span>
                      </button>
                    ))}
                  </div>
                )}

                {!(sug.products.length || sug.categories.length || sug.brands.length) && (
                  <div className="hm-empty">Aucun résultat</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
