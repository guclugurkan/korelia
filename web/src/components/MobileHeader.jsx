import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./MobileHeader.css";
import { useSearch } from "../search/SearchProvider";

export default function MobileHeader() {
  const nav = useNavigate();
  const { getSuggestions, slugify } = useSearch();

  // état menu burger
  const [menuOpen, setMenuOpen] = useState(false);

  // état recherche
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [openSug, setOpenSug] = useState(false);
  const [sug, setSug] = useState({ products: [], categories: [], brands: [] });

  const boxRef = useRef(null);

  // suggestions recherche (même logique que Header.jsx)
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
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOpenSug(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // navigation
  function submitSearch() {
    if (!q.trim()) return;
    setOpenSug(false);
    setSearchOpen(false);
    nav(`/catalogue?q=${encodeURIComponent(q.trim())}`);
  }
  function goProduct(slug) {
    setOpenSug(false);
    setSearchOpen(false);
    nav(`/produit/${slug}`);
  }
  function goCategory(label) {
    setOpenSug(false);
    setSearchOpen(false);
    nav(
      `/catalogue?cat=${encodeURIComponent(slugify(label))}&catLabel=${encodeURIComponent(
        label
      )}`
    );
  }
  function goSkin(label) {
    setOpenSug(false);
    setSearchOpen(false);
    nav(
      `/catalogue?skin=${encodeURIComponent(
        slugify(label)
      )}&skinLabel=${encodeURIComponent(label)}`
    );
  }
  function goBrand(brand) {
    setOpenSug(false);
    setSearchOpen(false);
    nav(`/catalogue?brand=${encodeURIComponent(brand)}`);
  }

  // types de peau pour savoir si c'est une catégorie ou une peau
  const KNOWN_SKINS = [
    "grasse","mixte","sèche","sensible","normale",
    "acnéique","déshydratée","mature","terne",
    "pores-visibles","anti-âge","anti-taches",
    "abîmée","réactive","tous"
  ];
  function goCatOrSkin(label) {
    const low = String(label).toLowerCase();
    const isSkin = KNOWN_SKINS.some(k => k.toLowerCase() === low);
    if (isSkin) return goSkin(label);
    return goCategory(label);
  }

  // fermer tout (menu/recherche) quand on change de route via menu
  function closeAll() {
    setMenuOpen(false);
    setSearchOpen(false);
    setOpenSug(false);
  }

  return (
    <header className="mh-wrapper" aria-label="Navigation principale mobile">
      {/* barre du haut */}
      <div className="mh-bar">
        {/* bouton burger */}
        <button
          className="mh-burger"
          aria-label="Ouvrir le menu"
          aria-expanded={menuOpen}
          onClick={() => {
            setMenuOpen(!menuOpen);
            // si on ouvre le menu, on ferme la recherche
            if (!menuOpen) setSearchOpen(false);
          }}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* logo / titre */}
        <Link to="/" className="mh-logo">KORELIA</Link>

        {/* bloc actions droite */}
        <div className="mh-actions">
          {/* bouton loupe */}
          <button
            className="mh-icon"
            aria-label="Rechercher"
            onClick={() => {
              const next = !searchOpen;
              setSearchOpen(next);
              if (next) {
                setMenuOpen(false);
              } else {
                setOpenSug(false);
              }
            }}
          >
            <img src="/img/searchLogo.svg" alt="" />
          </button>

          {/* profil */}
          <Link to="/mon-compte" className="mh-icon" aria-label="Mon compte">
            <img src="/img/profilLogo2.svg" alt="" />
          </Link>

          {/* favoris */}
          <Link to="/favoris" className="mh-icon" aria-label="Favoris">
            <img src="/img/coeurLogo.svg" alt="" />
          </Link>

          {/* panier */}
          <Link to="/panier" className="mh-icon" aria-label="Panier">
            <img src="/img/panierLogo.svg" alt="" />
          </Link>
        </div>
      </div>

      {/* panneau menu latéral (liens Header2) */}
      <aside
        className={`mh-drawer ${menuOpen ? "open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <nav className="mh-menu" aria-label="Liens principaux">
          <Link to="/catalogue?cat=pack&catLabel=pack" onClick={closeAll}>Pack Routine</Link>
          <Link to="/composer-pack" onClick={closeAll}>Compose ton pack</Link>
          <Link to="/guide-skincare" onClick={closeAll}>Guide</Link>
          <Link to="/quiz" onClick={closeAll}>Quiz</Link>
          <Link to="/catalogue" onClick={closeAll}>Produits</Link>
          <Link to="/avantages" onClick={closeAll}>Nos avantages</Link>
          <Link to="/marques" onClick={closeAll}>Marques</Link>
        </nav>
      </aside>

      {/* overlay fond quand menu ouvert */}
      <div
        className={`mh-backdrop ${menuOpen ? "show" : ""}`}
        onClick={() => setMenuOpen(false)}
      ></div>

      {/* zone recherche déroulante */}
      <div
        className={`mh-search ${searchOpen ? "open" : ""}`}
        ref={boxRef}
      >
        <form
          className="mh-search-bar"
          onSubmit={(e) => {
            e.preventDefault();
            submitSearch();
          }}
        >
          <input
            type="search"
            placeholder="Recherche (produit, peau, marque...)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => { if (q.trim()) setOpenSug(true); }}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
          />
          <button className="mh-search-submit" type="submit">
            <img src="/img/searchLogo.svg" alt="" />
          </button>
          <button
            type="button"
            className="mh-search-close"
            aria-label="Fermer la recherche"
            onClick={() => {
              setSearchOpen(false);
              setOpenSug(false);
            }}
          >
            ✕
          </button>
        </form>

        {openSug && (
          <div className="mh-suggest">
            {sug.products.length > 0 && (
              <div className="group">
                <div className="title">Produits</div>
                {sug.products.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    className="item"
                    onClick={() => goProduct(p.slug)}
                  >
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
                  <button
                    key={c}
                    type="button"
                    className="item"
                    onClick={() => goCatOrSkin(c)}
                  >
                    <span className="item-name">{c}</span>
                  </button>
                ))}
              </div>
            )}

            {sug.brands.length > 0 && (
              <div className="group">
                <div className="title">Marques</div>
                {sug.brands.map(b => (
                  <button
                    key={b}
                    type="button"
                    className="item"
                    onClick={() => goBrand(b)}
                  >
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
      </div>
    </header>
  );
}
