import React from 'react';
import { LogoIcon } from './Icons';

interface SidebarProps {
  children: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ children }) => {
  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-20 lg:flex lg:w-96 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center gap-3">
           <LogoIcon className="w-8 h-8 text-indigo-500" />
            <div className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              AI Rewriter
            </div>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              {children}
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;