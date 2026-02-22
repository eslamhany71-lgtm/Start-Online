import React from 'react';
import Navbar from './components/layout/Navbar';
import Products from './pages/Products';

function App() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      {/* Hero Section */}
      <header className="pt-40 pb-20 text-center">
        <h1 className="text-7xl font-black mb-6 animate-pulse bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          START ONLINE
        </h1>
        <p className="text-gray-400 text-xl max-w-xl mx-auto">سوقك الرقمي المتكامل للبيع والشراء باحترافية.</p>
      </header>

      {/* المنتجات */}
      <Products />
    </div>
  );
}

export default App;
