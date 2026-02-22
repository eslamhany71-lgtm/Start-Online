import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Auth from './pages/Auth';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        
        {/* هنا بنحدد كل رابط هيودي فين */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/login" element={<Auth />} />
        </Routes>

        {/* Footer بسيط */}
        <footer className="py-10 text-center text-gray-600 border-t border-white/5 mt-20">
          © 2026 Start Online - جميع الحقوق محفوظة
        </footer>
      </div>
    </Router>
  );
}

export default App;
