import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 p-6">
      <div className="max-w-7xl mx-auto glass rounded-full px-8 py-4 flex justify-between items-center shadow-2xl shadow-blue-500/10">
        
        <Link to="/" className="text-2xl font-black tracking-tighter">
          START <span className="text-blue-500">ONLINE</span>
        </Link>

        <ul className="hidden md:flex gap-10 text-xs font-bold uppercase tracking-[0.2em]">
          <li><Link to="/" className="hover:text-blue-500 transition-colors">الرئيسية</Link></li>
          <li><Link to="/shop" className="hover:text-blue-500 transition-colors">المتجر</Link></li>
          <li><Link to="/marketers" className="hover:text-blue-500 transition-colors">المسوقين</Link></li>
        </ul>

        <div className="flex gap-6 items-center">
          <Link to="/login" className="text-sm font-bold opacity-70 hover:opacity-100">دخول</Link>
          <Link to="/login" className="bg-white text-black px-6 py-2 rounded-full text-sm font-black hover:bg-blue-600 hover:text-white transition-all shadow-lg shadow-white/5">
            انضم إلينا
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
