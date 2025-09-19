import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <p style={{padding:24}}>Chargement…</p>;
  if (!user) return <Navigate to="/connexion" replace />;
  if ((user.role || 'user') !== 'admin') return <Navigate to="/" replace />;

  return children;
}
