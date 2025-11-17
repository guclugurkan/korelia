// src/components/Header2.jsx
import "./Header2.css";
import { Link } from "react-router-dom";

export default function Header2() {
  return (
    <nav className="header2" aria-label="Navigation secondaire">
      <ul>
        <li>
          {/* Filtre uniquement les packs dans le catalogue */}
          <Link to="/catalogue?cats=pack">Pack Routine</Link>
        </li>

        <li>
          <Link to="/composer-pack">Compose ton pack</Link>
        </li>

        <li>
          {/* Mets la bonne route quand ta page sera prête (guide/diagnostic) */}
          <Link to="/guide-skincare">Guide</Link>
        </li>

        <li>
            <Link to="/quiz">Quiz</Link>
        </li>

        <li>
          <Link to="/catalogue">Produits</Link>
        </li>

        <li>
          <Link to="/avantages">Nos avantages</Link>
        </li>

        <li>
          <Link to="/marques">Marques</Link>
        </li>
      </ul>
    </nav>
  );
}
