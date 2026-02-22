import React from 'react';
import Navbar from './components/layout/Navbar';

function App() {
  return (
    <div className="min-h-screen">
      {/* القائمة العلوية الاحترافية */}
      <Navbar />
      
      {/* واجهة الترحيب (Hero Section) */}
      <main className="container mx-auto px-6 pt-32 text-center">
        <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter animate-fade-in">
          START <span className="text-blue-600">ONLINE</span>
        </h1>
        <p className="mt-6 text-gray-400 text-xl max-w-2xl mx-auto">
          المنصة المستقبلية لإطلاق مشاريعك الرقمية. ابدأ رحلتك الآن مع آلاف المسوقين.
        </p>
        
        <div className="mt-10 flex justify-center gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-bold transition-all">
            استكشف المنتجات
          </button>
          <button className="glass text-white px-8 py-4 rounded-full font-bold hover:bg-white/10 transition-all">
            كن مسوقاً معنا
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
