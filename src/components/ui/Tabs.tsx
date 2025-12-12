'use client';

import { HTMLAttributes } from 'react';

interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function Tabs({ tabs, activeTab, onTabChange, className = '', ...props }: TabsProps) {
  return (
    <div className={`border-b border-slate-200/60 ${className}`} {...props}>
      <nav className="-mb-px flex space-x-8 space-x-reverse">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`py-4 px-4 border-b-2 font-semibold text-sm material-transition relative rounded-t-lg ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-700 bg-primary-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-700 rounded-t-full"></span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}

