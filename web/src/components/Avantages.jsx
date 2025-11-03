import { useState } from 'react';
import './Avantages.css';
import { Link } from 'react-router-dom';

export default function Avantages () {
    const [tab, setTab] = useState("quiz");
    
  return (
    <div className='avantages'>
      
        <Link to="/catalogue?cat=pack&catLabel=pack" className='avantages1'></Link>
      


      <div className="cta-skin" role='region' aria-labelledby='cta-title'>
            <div className='cta-tabs' role='tablist' aria-label='Navigation skincare'>
                <button
                role='tab'
                aria-selected={tab === "quiz"}
                aria-controls='panel-quiz'
                id='tab-quiz'
                className={`cta-tab ${tab === "quiz" ? "is-active" : ""}`}
                onClick={() => setTab('quiz')}
                >
                    Quizz
                </button>

                <button 
                role='tab'
                aria-selected={tab === "guide"}
                aria-controls='panel-guide'
                id='tab-guide'
                className={`cta-tab ${tab === "guide" ? "is-active" : ""}`}
                onClick={() => setTab('guide')}>
                    Guide
                </button>
            </div>


            <div className='cta-panels'>
                {tab === "quiz" && (
                    <p
                        id='panel-quiz'
                        role='tabpanel'
                        aria-labelledby='tab-quiz'
                        className={`cta-cardd ${tab === "quiz" ? "is-quiz" : "is-guide"}`}
                        href='/#'
                    >
                        <Link to='/quiz' className="cta-btn btn-left">
                            Commencer le quizz
                        </Link>
                        
                    </p>
                )}
                {tab === "guide" && (               // 47) Rendu conditionnel : si 'tab' est "guide", on affiche ce panneau.
                    <a
                        id="panel-guide"                // 48) Identifiant du panneau "guide".
                        role="tabpanel"                 // 49) role="tabpanel".
                        aria-labelledby="tab-guide"     // 50) Lie ce panneau à l’onglet "guide".
                        className={`cta-cardd ${tab === "guide" ? "is-guide" : "is-quiz"}`}            // 51) Styles de carte.
                        href="/skincare-coreen"         // 52) Cible : page du guide skincare coréenne.
                    > 
                    <Link to='/guide-skincare' className='cta-btn btn-right'>
                    Lire le guide
                    </Link>    
                                    
                        
                    </a>                              
                )}
            </div>


      </div>
    </div>
  );
}
