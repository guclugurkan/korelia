import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:4242";

export default function VerifyEmail(){
  const [status, setStatus] = useState("loading"); // "loading" | "ok" | "error"
  const [msg, setMsg] = useState("");

  useEffect(()=>{
    (async ()=>{
      const token = new URLSearchParams(window.location.search).get("token");
      if (!token) {
        setStatus("error"); setMsg("Token manquant.");
        return;
      }
      try{
        const r = await fetch(`${API}/auth/verify-email?json=1&token=${encodeURIComponent(token)}`, {
          credentials: "include",
          headers: { "Accept": "application/json" }
        });
        const data = await r.json().catch(()=> ({}));
        if (!r.ok || data.ok !== true) {
          throw new Error(data.error || "Lien invalide ou expiré");
        }
        setStatus("ok"); setMsg("Email vérifié. Merci !");
      }catch(e){
        setStatus("error"); setMsg(e.message);
      }
    })();
  },[]);

  return (
    <main style={{maxWidth:480, margin:"24px auto", width:"90%"}}>
      <h1>Vérification de l'email</h1>
      {status === "loading" && <p>Vérification en cours…</p>}
      {status === "ok" && (
        <p>
          ✅ {msg}<br/>
          Vous pouvez maintenant revenir sur la <a href="/">boutique</a> ou vous rendre sur <a href="/mon-compte">Mon compte</a>.
        </p>
      )}
      {status === "error" && (
        <p style={{color:"#c33"}}>❌ {msg}</p>
      )}
    </main>
  );
}
