import React from 'react';
import Button from '../components/ui/Button';
import Products from './Products'; // عرض عينة من المنتجات في الرئيسية

const Home = () => {
  return (
    <>
      <header className="pt-48 pb-20 text-center px-6">
        <h1 className="text-6xl md:text-8xl font-black mb-8 tracking-tighter leading-tight">
          صمم مستقبلك <br />
          <span className="text-blue-600 italic">أونلاين</span>
        </h1>
        <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          أول منصة تتيح للمسوقين المبدعين عرض منتجاتهم الرقمية بأدوات تحكم احترافية وتجربة مستخدم مذهلة.
        </p>
        <div className="flex flex-wrap justify-center gap-6">
          <Button variant="primary">ابدأ التسوق</Button>
          <Button variant="glass">شاهد قصص النجاح</Button>
        </div>
      </header>

      {/* عرض قسم المنتجات كجزء من الصفحة الرئيسية */}
      <Products />
    </>
  );
};

export default Home;
