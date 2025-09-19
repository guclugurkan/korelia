import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function AdminHome() {
  const { user } = useAuth();
  const nav = useNavigate();

  return (
    <main style={{ maxWidth: 960, margin: "24px auto", padding: "0 16px" }}>
      <h1>Admin — Accueil</h1>

      <section style={card}>
        <h2 style={{ marginTop: 0 }}>Bienvenue {user?.name || user?.email}</h2>
        <p style={{ color: "#555" }}>
          Vous êtes connecté en tant qu’<b>administrateur</b>. Utilisez les sections ci-dessous.
        </p>
      </section>

      <section style={{ ...card, marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>Sections</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          <FeatureCard
            title="Commandes"
            desc="Consulte, filtre, exporte et mets à jour le statut."
            action={() => nav("/admin/orders")}
            linkTo="/admin/orders"
          />
          <FeatureCard
            title="Stock"
            desc="Ajuste rapidement les quantités disponibles."
            action={() => nav("/admin/stock")}
            linkTo="/admin/stock"
          />
           <FeatureCard
            title="Dashboard"
            desc="Statistiques des ventes"
            action={() => nav("/admin/dashboard")}
            linkTo="/admin/dashboard"
          />
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ title, desc, action, linkTo }) {
  return (
    <div style={feature}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
        <p style={{ margin: "6px 0 12px", color: "#555" }}>{desc}</p>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={action} style={btn}>Ouvrir</button>
        
      </div>
    </div>
  );
}

const card = { border: "1px solid #eee", borderRadius: 12, padding: 16, background: "#fff" };
const feature = { border: "1px solid #f0f0f0", borderRadius: 12, padding: 16, background: "#fafafa" };
const btn = { padding: "10px 14px", background: "#111827", color: "white", border: "none", borderRadius: 8, cursor: "pointer" };
const btnLink = { padding: "10px 14px", background: "#4b5563", color: "white", borderRadius: 8, textDecoration: "none" };
