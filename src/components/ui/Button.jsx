import React from 'react';
import { motion } from 'framer-motion';

const Button = ({ children, variant = "primary", onClick }) => {
  // الستايلات المختلفة للأزرار
  const styles = {
    // زرار متوهج (Primary)
    primary: "relative bg-blue-600 text-white px-8 py-3 rounded-full font-bold overflow-hidden group",
    // زرار زجاجي (Secondary)
    glass: "relative backdrop-blur-md bg-white/10 border border-white/20 text-white px-8 py-3 rounded-full font-bold overflow-hidden group"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={styles[variant]}
    >
      {/* تأثير الضوء اللي بيتحرك جوه الزرار لما تلمسه */}
      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] transition-transform"></span>
      
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
      
      {/* الظل المتوهج خلف الزرار */}
      {variant === "primary" && (
        <div className="absolute inset-0 rounded-full bg-blue-500 blur-lg opacity-0 group-hover:opacity-50 transition-opacity -z-10"></div>
      )}
    </motion.button>
  );
};

export default Button;
