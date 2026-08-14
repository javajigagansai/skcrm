import React from 'react';

export const GoldenSKLogo = ({ className = "h-10 w-10" }) => {
  return (
    <img 
      src="/logo.png" 
      alt="SK SMART INVESTMENTS - Insurance and Investments Specialist" 
      className={`${className} object-contain select-none`}
    />
  );
};
