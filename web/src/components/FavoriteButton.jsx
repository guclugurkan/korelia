// src/components/FavoriteButton.jsx
import { useFavorites } from "../favorites/FavoritesContext";

export default function FavoriteButton({ product, id, size = 22 }) {
  const { has, toggle } = useFavorites();
  const pid = id ?? product?.id;

  const active = has(pid);

  return (
    <button
      onClick={(e) => { e.preventDefault(); toggle(product ?? pid); }}
      aria-label={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      title={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      style={{
        width: size, height: size, borderRadius: "50%", border: "1px solid #e5e7eb",
        background: active ? "#fee2e2" : "#fff", color: active ? "#b91c1c" : "#111",
        fontWeight: 700, cursor: "pointer"
      }}
    >
      ♥
    </button>
  );
}