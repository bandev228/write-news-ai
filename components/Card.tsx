import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-slate-900/70 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-800 ${className}`}>
      {children}
    </div>
  );
};

export default Card;