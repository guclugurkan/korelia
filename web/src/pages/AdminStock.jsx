import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4242";
const euro = (cents) => (Number(cents || 0) / 100).toFixed(2) + " €";

export default function AdminStock() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");

  const load = async () => {
    try {
      setErr("");
      const r = await fetch(`${API_BASE}/admin/products`, { credentials:"include" });
      if (!r.ok) throw new Error("API admin produits indisponible");
      const data = await r.json();
      setRows(data);
    } catch (e) {
      setErr(e.message);
    }
  };

  useEffect(() => { load(); }, []);

  const update = async (id, op, value) => {
    try {
      setBusy(id);
      const r = await fetch(`${API_BASE}/admin/products/${id}/stock`, {
        method: "PUT",
        credentials:"include",
        headers: { 
          "Content-Type": "application/json",
          "x-csrf-token": csrf

         },
        body: JSON.stringify({ op, value }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Erreur mise à jour");
      setRows((rows) => rows.map((x) => (x.id === id ? { ...x, stock: data.stock } : x)));
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy("");
    }
  };

  return (
    <main style={{ width: "90%", margin: "0 auto", padding: "24px 0" }}>
      <h1>Admin — Stock</h1>
      {err && <p style={{ color: "#c33" }}>{err}</p>}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>
              <th style={{ padding: "10px 8px" }}>Produit</th>
              <th style={{ padding: "10px 8px" }}>Marque</th>
              <th style={{ padding: "10px 8px" }}>Prix</th>
              <th style={{ padding: "10px 8px" }}>Stock</th>
              <th style={{ padding: "10px 8px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} style={{ borderBottom: "1px solid #f3f3f3" }}>
                <td style={{ padding: "10px 8px", display: "flex", alignItems: "center", gap: 10 }}>
                  {p.image && (
                    <img src={p.image} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6 }} />
                  )}
                  <div>
                    <div style={{ fontWeight: 700 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "#777" }}>{p.slug}</div>
                  </div>
                </td>
                <td style={{ padding: "10px 8px" }}>{p.brand}</td>
                <td style={{ padding: "10px 8px", fontWeight: 700 }}>{euro(p.price_cents)}</td>
                <td style={{ padding: "10px 8px", fontWeight: 700 }}>{p.stock}</td>
                <td style={{ padding: "10px 8px" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <button disabled={busy === p.id} onClick={() => update(p.id, "inc", -1)}>-1</button>
                    <button disabled={busy === p.id} onClick={() => update(p.id, "inc", +1)}>+1</button>
                    <input
                      type="number"
                      min={0}
                      defaultValue={p.stock}
                      style={{ width: 80, padding: "6px 8px" }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const val = parseInt(e.currentTarget.value, 10);
                          if (Number.isFinite(val)) update(p.id, "set", val);
                        }
                      }}
                    />
                    <button
                      disabled={busy === p.id}
                      onClick={(ev) => {
                        const input = ev.currentTarget.parentElement.querySelector('input[type="number"]');
                        const val = parseInt(input?.value, 10);
                        if (Number.isFinite(val)) update(p.id, "set", val);
                      }}
                    >
                      Définir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: "16px 8px", color: "#777" }}>
                  Aucun produit.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
