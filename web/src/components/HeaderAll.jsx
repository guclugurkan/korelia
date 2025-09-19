
import "./HeaderAll.css";
import { Link } from "react-router-dom";


export default function HeaderAll({
    onHandleSubmit,
    onRecherche,
    onSetRecherche  
}) {

    return (
       

                 <div className="headerAll">
                    <div className='header'>
                        <div className='nomDuSite'>
                           <Link to={"/"}><h1>KORELIA</h1></Link> 
                        </div>
                        
                        <form className='recherche' onSubmit={(e) => { e.preventDefault(); onHandleSubmit()}}>
                            <label htmlFor="search" className='sr-only'>Rechercher</label>
                            <input 
                            id='search'
                            type='search'
                            placeholder='Recherche'
                            value={onRecherche}
                            onChange={(e) => onSetRecherche(e.target.value)}
                            aria-label='Rechercher des produits'
                              />
                            <button type='submit' className='rButton' aria-label='Rechercher'>
                                <img src="/img/searchLogo.svg" alt="" />
                            </button>
                        </form>
                        <div className='boutonDeNavigation'>
                            <Link to="/mon-compte" className='profil'><img src="/img/profilLogo2.svg" alt="Profil" /></Link>
                            <Link to="/favoris" className='favori'><img src="/img/coeurLogo.svg" alt="" /></Link>
                            <Link to="/panier" className='panier'><img src="/img/panierLogo.svg" alt="Panier" /></Link>
                            <button className='langue'><img src="/img/langueLogo.svg" alt="" /></button>
                        </div>
                    </div>

                     <div className='header2'>
                        <ul>
                            <li>Pack Routine</li>
                            <li>Compose ton pack</li>
                            <li>Conseils & Diagnostics</li>
                            <li>Produits</li>
                            <li>Nos avantages</li>
                            <li>Marques</li>
                        </ul>
                    </div> 
                </div>
    )

}