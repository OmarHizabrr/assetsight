'use client';

import { HTMLAttributes } from 'react';

interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function Tabs({ tabs, activeTab, onTabChange, className = '', ...props }: TabsProps) {
  return (
    <div className={`border-b border-secondary-200 ${className}`} {...props}>
      <nav className="-mb-px flex space-x-8 space-x-reverse">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

