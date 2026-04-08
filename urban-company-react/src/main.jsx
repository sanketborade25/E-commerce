import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/global.css'
import { Toaster } from 'react-hot-toast';
import { CartProvider } from "./context/CartContext";
import { NotificationProvider } from "./context/NotificationContext";

ReactDOM.createRoot(document.getElementById('root')).render(
  <NotificationProvider>
    <CartProvider>
      <App />
      <Toaster />
    </CartProvider>
  </NotificationProvider>
);
