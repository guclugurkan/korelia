// src/auth/RequireAuth.jsx
import { useLocation, Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <main style={{ padding: 24 }}>Chargement…</main>;
  }
  if (!user) {
    // Redirige vers /connexion et mémorise la page demandée
    return <Navigate to="/connexion" replace state={{ from: location }} />;
  }
  return children;
}
