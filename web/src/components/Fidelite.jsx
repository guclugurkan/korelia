import './Fidelite.css'
import { Link } from 'react-router-dom'

export default function Fidelite () {
    return (
      <div className='fidelite'>
        <div className="bs-header">
        </div>
      <div className='fidelitegroup'>
        <div className='fidelite1'>
          <Link to='avantages'>
          <img src="./img/fideliteimg2.png" alt="" />
          </Link>
          
        </div>

        <div className='fidelite2'>
          <Link to='avantages'>
          <img src="./img/fideliteimg10.png" alt="" />
          </Link>
          
        </div>
      </div>
        
      </div>
        

        
    )
}