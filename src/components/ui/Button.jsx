import React from 'react';

const Button = ({ children, variant = "primary" }) => {
  const base = "px-8 py-3 rounded-full font-bold transition-all duration-300 transform hover:scale-105 active:scale-95";
  const themes = {
    primary: "bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700",
    glass: "glass text-white hover:bg-white/10"
  };

  return (
    <button className={`${base} ${themes[variant]}`}>
      {children}
    </button>
  );
};
export default Button;
