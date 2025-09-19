// src/main.jsx
import './index.css'
import App from './App.jsx'
import ReactDOM from "react-dom/client";
import { CartProvider } from './cart/CartContext.jsx'
import { AuthProvider } from './auth/AuthContext.jsx';
import { FavoritesProvider } from './favorites/FavoritesContext.jsx'; // <- import nommé OK

ReactDOM.createRoot(document.getElementById('root')).render(
  <FavoritesProvider>
    <AuthProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </AuthProvider>
  </FavoritesProvider>
);
