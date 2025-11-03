import { useEffect, useRef } from "react";
import "./Panneau.css";
import { Link } from "react-router-dom";

export default function Panneau() {
  const petalsContainerRef = useRef(null);

  useEffect(() => {
    const container = petalsContainerRef.current;
    if (!container) return;

    const maxPetals = 60; // garde-fou
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    // Si l’utilisateur préfère moins d’animations, on ne génère pas de pétales
    if (prefersReduced) {
      container.dataset.reduced = "true";
      return;
    }

    const isAttached = () => container && container.isConnected;

    const createPetal = () => {
      if (!isAttached()) return;
      if (container.childElementCount > maxPetals) return;

      const el = document.createElement("span");
      el.className = "petal";

      const size = Math.round(Math.random() * 26 + 14);
      const left = Math.random() * 100;
      const dur = (Math.random() * 6 + 6).toFixed(2);
      const rot = Math.round(Math.random() * 360);
      const driftX = Math.round(Math.random() * 120 - 60) + "px";

      el.style.setProperty("--size", size + "px");
      el.style.setProperty("--left", left + "%");
      el.style.setProperty("--dur", dur + "s");
      el.style.setProperty("--rot", rot + "deg");
      el.style.setProperty("--driftX", driftX);

      container.appendChild(el);

      const removal = setTimeout(() => {
        el.remove();
      }, parseFloat(dur) * 1000);

      // si jamais le conteneur sort du DOM avant la fin
      if (!isAttached()) {
        clearTimeout(removal);
        el.remove();
      }
    };

    // nuage initial
    const starters = [];
    for (let i = 0; i < 15; i++) {
      starters.push(setTimeout(createPetal, i * 200));
    }

    // génération continue (pause si onglet caché)
    let interval = setInterval(() => {
      if (document.visibilityState === "visible") createPetal();
    }, 400);

    const onVis = () => {
      if (document.visibilityState === "hidden") {
        clearInterval(interval);
      } else {
        clearInterval(interval);
        interval = setInterval(() => {
          if (document.visibilityState === "visible") createPetal();
        }, 400);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      starters.forEach(clearTimeout);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <section className="panneau" aria-label="Mise en avant Korelia">
      <div
        className="bg-deco"
        style={{ backgroundImage: "url('/img/panneauimg3.png')" }}
        aria-hidden="true"
      />
      <div className="overlay" aria-hidden="true" />
      <div className="petals" ref={petalsContainerRef} aria-hidden="true" />

      <div className="content">
        <Link to="/catalogue" className="btn">Voir nos produits</Link>
        <Link to="/catalogue?cat=pack&catLabel=pack" className="btn">Voir nos packs</Link>
      </div>
    </section>
  );
}
