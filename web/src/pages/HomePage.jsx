import React, { useState, useRef, useEffect } from 'react';
import './HomePage.css';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Header2 from '../components/Header2';
import Panneau from '../components/Panneau';
import Avantages from '../components/Avantages';
import BestSellers from '../components/BestSellers';
import Avantages2 from '../components/Avantages2';
import Marques from '../components/Marques';
import Fidelite from '../components/Fidelite';
import Types from '../components/Types';
import Routine from '../components/Routine';
import Blog from '../blog/Blog';
import Footer from '../components/Footer';
import PackHomePage from '../components/PackHomePage';
import MobileHeader from '../components/MobileHeader';
import { Helmet } from 'react-helmet-async';


const HomePage = () => {
    //state
        const [recherche, setRecherche] = useState('');
        const [produits, setProduits] = useState(['']);


    //comportements
        const handleSubmit = () => {
            console.log('submit');
        }

       
        
        
    //affichage
    
    const header = <Header 
                    onHandleSubmit= {handleSubmit}
                    onRecherche = { recherche}
                    onSetRecherche = {setRecherche} />
    
    const header2 = <Header2 />
    
    const avantages = <Avantages />

    const avantages2 = <Avantages2 />

    const panneau = <Panneau />

    const marques = <Marques />
    
    const bestSellers = <BestSellers/>
    const fidelite = <Fidelite />

    const types = <Types />

    const routine = <Routine/>
     

    const blog = <Blog/>
    
    const footer1 = <Footer />

    return <div className='homepage'>


                <Helmet>
                    <title>Korelia — Skincare coréenne  en Belgique</title>
                    <meta name="description" content="Catalogue de skincare coréenne : sérums, SPF, nettoyants… Livraison BE/FR/LU." />
                    <link rel="canonical" href="https://korelia.be/" />
                    <script type="application/ld+json">
                        {JSON.stringify({
                        "@context":"https://schema.org",
                        "@type":"Organization",
                        "name":"Korelia",
                        "url":"https://korelia.be",
                        "logo":"https://korelia.be/img/logokorelia1.png",
                        "contactPoint":[{ "@type":"ContactPoint", "contactType":"customer support", "email":"koreliacontact@gmail.com", "areaServed":"BE" }]
                        })}
                    </script>
                    {/* Open Graph / réseaux */}
                    <meta property="og:type" content="website" />
                    <meta property="og:title" content="Korelia — Skincare coréenne" />
                    <meta property="og:url" content="https://korelia.be/" />
                    <meta property="og:image" content="https://korelia.be/img/og-cover.jpg" />
                    <meta name="twitter:card" content="summary_large_image" />
                    </Helmet>
                <header>
                    {header}
                    {header2}
                    {<MobileHeader/>}
                </header>

                <main>
                    {panneau}
                    {avantages}
                    {avantages2}
                    {bestSellers}
                    {marques}
                    {<PackHomePage/>}
                    {fidelite}
                    {types}
                    {routine}
                    {blog}
                    

                </main>

                <footer>
                    {footer1}
                </footer>
            </div>


}


export default HomePage;

