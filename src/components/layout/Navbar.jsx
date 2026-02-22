import React from 'react';

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 p-6">
      <div className="max-w-7xl mx-auto glass rounded-full px-8 py-4 flex justify-between items-center">
        
        {/* Logo */}
        <div className="text-2xl font-black tracking-tighter">
          S<span className="text-blue-500 text-3xl">.</span>O
        </div>

        {/* Tabs - القائمة التفاعلية */}
        <ul className="hidden md:flex gap-8 text-sm font-medium uppercase tracking-widest">
          <li className="hover:text-blue-500 cursor-pointer transition-colors border-b-2 border-blue-500">الرئيسية</li>
          <li className="hover:text-blue-500 cursor-pointer transition-colors border-b-2 border-transparent">المتجر</li>
          <li className="hover:text-blue-500 cursor-pointer transition-colors border-b-2 border-transparent">المسوقين</li>
          <li className="hover:text-blue-500 cursor-pointer transition-colors border-b-2 border-transparent">عن المنصة</li>
        </ul>

        {/* Auth Buttons - أزرار الدخول */}
        <div className="flex gap-4 items-center">
          <button className="text-sm font-bold hover:text-blue-400">تسجيل دخول</button>
          <button className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-blue-500 hover:text-white transition-all">
            ابدأ الآن
          </button>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
