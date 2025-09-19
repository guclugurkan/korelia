import { useEffect, useRef } from "react";
import './Panneau.css';
import { Link } from "react-router-dom";

export default function Panneau (
    {

    }
) {
    //state
     const petalsContainerRef = useRef(null);


    //comportement
     useEffect(() => {
                 const container = petalsContainerRef.current;
     
                 const createPetal = () => {
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
             
                   setTimeout(() => {
                     el.remove();
                   }, dur * 1000);
                 };
                  // 🌸 Générer un "nuage" initial
                 for (let i = 0; i < 15; i++) {
                     setTimeout(createPetal, i * 200);
                 }
             
                 const interval = setInterval(() => {
                   createPetal();
                 }, 400); // toutes les 0.4s
             
                 return () => clearInterval(interval);
               }, []);

    //affichage
    return (        <div className='panneau'>
                           <div
                                   className="bg-deco"
                                   style={{ backgroundImage: "url('/img/panneauimg3.png')" }}
                            ></div>
                            <div className="overlay"></div>
                            <div className="petals" ref={petalsContainerRef}></div>
                           
                            <div className="content">
                              <Link to='/catalogue' className='btn'>Voir nos produits</Link>
                              <Link to="/catalogue?cat=pack&catLabel=pack" className="btn">Voir nos packs</Link>    
                            </div>
                                
                    </div>)
}