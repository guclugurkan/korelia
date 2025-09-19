
import {BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProfilPage from './pages/ProfilPage';
import FavoriPage from './pages/FavoriPage';
import PanierPage from './pages/PanierPage';
import Blog from './blog/Blog';
import BlogPost from './blog/BlogPost';
import Catalogue from './pages/Catalogue';
import Product from './pages/Product';
import Checkout from './pages/Checkout';
import Merci from './pages/Merci';
import AdminOrders from './pages/AdminOrders';
import AdminStock from './pages/AdminStock';
import Register from './pages/Register';
import Login from './pages/Login';
import Account from './pages/Account';


import RequireAuth from "./auth/RequireAuth";

import Admin from './pages/Admin';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminRoute from './auth/AdminRoute.jsx';

import VerifyEmail from './pages/VerifyEmail.jsx';

import AdminDashboard from './pages/AdminDashboard.jsx';

import OrdersPage from './pages/OrdersPage.jsx';
import SearchProvider from './search/SearchProvider.jsx';

import Pack from './pages/Pack.jsx';

import ComposePack from './pages/ComposePack.jsx';

import SkincareGuide from './pages/SkincareGuide.jsx';
import QuizSkinType from './pages/QuizSkinType.jsx';
import Avantages from './pages/Avantages.jsx';

import Brands from './pages/Brands.jsx';

import Contact from './pages/Contact.jsx';
import About from './pages/About.jsx';
import OrderTracking from './pages/OrderTracking.jsx';
import Sitemap from './pages/Sitemap.jsx';


function App () {
  return (
    

    
    <SearchProvider>
    <Router>
      <Routes>
        <Route path="/" element= {<HomePage/>} />
        <Route path="/ProfilPage" element = {<ProfilPage/>} />
        <Route path='/favoris' element = {<FavoriPage/>} />
        <Route path='/panier' element = {<PanierPage/>} />
        <Route path='/blog' element={<Blog/>} />
        <Route path='/blog/:slug' element={<BlogPost/>} />


        <Route path='/catalogue' element= {<Catalogue/>} />
        <Route path='/produit/:slug' element={<Product/>} />
        <Route path='/checkout' element={<Checkout/>} />
        <Route path='/merci' element={<Merci/>} />
        

        <Route path='/inscription' element={<Register/>}/>
        <Route path='/connexion' element={<Login/>} />
        <Route path='/mon-compte' element={<RequireAuth><Account/></RequireAuth>} />
        
        <Route path='/forgot-password' element={<ForgotPassword/>} />
        <Route path='/reset-password' element={<ResetPassword/>} />

        <Route path='/admin' element={<AdminRoute><Admin/></AdminRoute>} />
        <Route path='/admin/orders' element={<AdminRoute><AdminOrders/></AdminRoute>} />
        <Route path='/admin/stock' element={<AdminRoute><AdminStock/></AdminRoute>} />
        <Route path='/verify-email' element={<VerifyEmail/>} />
        <Route path='/admin/dashboard' element={<AdminDashboard/>} />
        <Route path='/mes-commandes' element={<OrdersPage/>}/>
        <Route path='/pack/:slug' element={<Pack/>} />
        <Route path='/composer-pack' element={<ComposePack/>} />
        <Route path='/guide-skincare' element={<SkincareGuide/>} />
        <Route path='/quiz' element={<QuizSkinType/>} />
        <Route path='/avantages' element={<Avantages/>} />
        <Route path='/marques' element={<Brands/>} />

        <Route path='/contact' element={<Contact/>} /> 
        <Route path='/about' element={<About/>} />
        <Route path='suivi-commande' element={<OrderTracking/>} />
        <Route path='sitemap' element={<Sitemap/>} />
      </Routes>
    </Router>
    </SearchProvider>
   
  )
}


export default App;
