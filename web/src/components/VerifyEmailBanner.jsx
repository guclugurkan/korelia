import { useState } from "react";
import { useAuth } from "../auth/AuthContext";

export default function VerifyEmailBanner(){
  const { user, resendVerification } = useAuth();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  if (!user || user.email_verified) return null;

  async function send(){
    try{
      setErr(""); setMsg(""); setBusy(true);
      const res = await resendVerification();
      if (res?.alreadyVerified) {
        setMsg("Ton email est déjà vérifié ✅");
      } else {
        setMsg("Email de vérification renvoyé. Vérifie ta boîte mail ✉️");
      }
    }catch(e){
      setErr(e.message || "Échec de l’envoi");
    }finally{
      setBusy(false);
    }
  }

  return (
    <div style={{
      background:"#fff7e6", border:"1px solid #ffe2b4", color:"#7a4b00",
      padding:"12px 14px", borderRadius:8, margin:"12px 0", display:"flex", gap:12, alignItems:"center"
    }}>
      <span>Ton email n’est pas vérifié. Tu peux renvoyer le lien :</span>
      <button disabled={busy} onClick={send}>
        {busy ? "Envoi..." : "Renvoyer l’email de vérification"}
      </button>
      {msg && <span style={{marginLeft:8, color:"#0a7"}}>{msg}</span>}
      {err && <span style={{marginLeft:8, color:"#c33"}}>{err}</span>}
    </div>
  );
}
