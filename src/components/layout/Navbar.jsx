import React from 'react';

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 p-6">
      <div className="max-w-7xl mx-auto glass rounded-full px-8 py-4 flex justify-between items-center shadow-2xl">
        <div className="text-xl font-black tracking-tighter">
          START <span className="text-blue-500 underline">ONLINE</span>
        </div>
        <ul className="hidden md:flex items-center gap-8 list-none">
          <li className="text-xs font-bold hover:text-blue-500 cursor-pointer transition-all">الرئيسية</li>
          <li className="text-xs font-bold hover:text-blue-500 cursor-pointer transition-all">المتجر</li>
          <li className="text-xs font-bold hover:text-blue-500 cursor-pointer transition-all">المسوقين</li>
        </ul>
        <div className="flex items-center gap-4">
          <button className="text-xs font-bold opacity-70">دخول</button>
          <button className="bg-white text-black px-6 py-2 rounded-full text-xs font-black hover:bg-blue-600 hover:text-white transition-all">
            ابدأ الآن
          </button>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;
