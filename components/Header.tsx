import React from 'react';
import { LogoIcon } from './Icons';

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-10 flex h-16 flex-shrink-0 items-center gap-x-4 border-b border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm px-4 sm:gap-x-6 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
            <LogoIcon className="w-8 h-8 text-indigo-500" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              AI Article Rewriter
            </h1>
        </div>
    </header>
  );
};

export default Header;