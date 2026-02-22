import React from 'react';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';

const products = [
  { id: 1, name: "Premium Design Kit", price: "$49", image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80" },
  { id: 2, name: "Marketing SaaS Pro", price: "$99", image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80" },
  { id: 3, name: "E-commerce Solution", price: "$120", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80" },
];

const Products = () => {
  return (
    <div className="py-20 px-10">
      <h2 className="text-4xl font-bold mb-12 text-center tracking-tight">أحدث الإبداعات</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {products.map((product) => (
          <motion.div 
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group relative glass rounded-3xl overflow-hidden p-4"
          >
            {/* صورة المنتج */}
            <div className="relative h-64 rounded-2xl overflow-hidden mb-4">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-4 py-1 rounded-full text-sm font-bold">
                {product.price}
              </div>
            </div>

            {/* تفاصيل المنتج */}
            <h3 className="text-xl font-bold mb-4">{product.name}</h3>
            
            <div className="flex gap-2">
              <Button variant="primary">شراء الآن</Button>
              <Button variant="glass">تفاصيل</Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Products;
