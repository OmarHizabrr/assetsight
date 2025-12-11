'use client';

import { useEffect, useState } from 'react';

interface MaterialIconProps {
  name: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  fallback?: React.ReactNode;
}

// Material Icons SVG Map
const iconMap: Record<string, React.ReactNode> = {
  // Navigation
  menu: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
    </svg>
  ),
  home: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>
  ),
  
  // Business
  business: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
    </svg>
  ),
  meeting_room: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M14 6v15H3v-2h2V3h9v1h5v15h2v2h-4V6h-3zm-4 5v2h2v-2h-2z"/>
    </svg>
  ),
  
  // Actions
  add: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
    </svg>
  ),
  edit: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
    </svg>
  ),
  delete: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
    </svg>
  ),
  
  // User
  person: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
  ),
  people: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
    </svg>
  ),
  
  // Categories
  category: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  ),
  folder: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
    </svg>
  ),
  label: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z"/>
    </svg>
  ),
  
  // Status
  assessment: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
    </svg>
  ),
  
  // Inventory
  inventory: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 2H4c-1 0-2 .9-2 2v3.01c0 .72.43 1.34 1 1.69V20c0 1.1 1.1 2 2 2h14c.9 0 2-.9 2-2V8.7c.57-.35 1-.97 1-1.69V4c0-1.1-1-2-2-2zm-5 12H9v-2h6v2zm3-4H6V6h12v4z"/>
    </svg>
  ),
  checklist: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5.12 10.88l-3.17 3.17c-.39.39-1.02.39-1.41 0l-1.41-1.41c-.39-.39-.39-1.02 0-1.41l.71-.71c.39-.39 1.02-.39 1.41 0l.88.88 2.47-2.47c.39-.39 1.02-.39 1.41 0l.71.71c.39.39.39 1.02 0 1.41z"/>
    </svg>
  ),
  
  // Dashboard
  dashboard: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
    </svg>
  ),
  bar_chart: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z"/>
    </svg>
  ),
};

const sizeMap = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
  '5xl': 'text-5xl',
};

export function MaterialIcon({ name, className = '', size = 'md', fallback }: MaterialIconProps) {
  const [iconsLoaded, setIconsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    // Check if Material Icons font is loaded
    const checkIconsLoaded = () => {
      try {
        // Method 1: Check if font is loaded using FontFace API
        if ('fonts' in document) {
          const isLoaded = document.fonts.check('16px Material Icons');
          if (isLoaded) {
            setIconsLoaded(true);
            return;
          }
        }

        // Method 2: Try to measure a test element with Material Icons font
        const testEl = document.createElement('span');
        testEl.className = 'material-icons';
        testEl.style.position = 'absolute';
        testEl.style.visibility = 'hidden';
        testEl.style.fontSize = '16px';
        testEl.style.fontFamily = 'Material Icons';
        testEl.textContent = 'check';
        document.body.appendChild(testEl);
        
        // Force reflow
        testEl.offsetWidth;
        
        const computed = window.getComputedStyle(testEl);
        const fontFamily = computed.fontFamily;
        
        // Check if Material Icons font is actually being used
        if (fontFamily.includes('Material Icons') || fontFamily.includes('MaterialIcons')) {
          const width1 = testEl.offsetWidth;
          testEl.textContent = 'check_circle';
          const width2 = testEl.offsetWidth;
          
          // If widths are different or reasonable, font is likely loaded
          if (width1 > 0 && width2 > 0 && (width1 !== width2 || width1 > 10)) {
            setIconsLoaded(true);
          } else {
            // Try one more time after a short delay
            setTimeout(() => {
              if (testEl.offsetWidth > 10) {
                setIconsLoaded(true);
              } else {
                setLoadError(true);
              }
            }, 500);
          }
        } else {
          setLoadError(true);
        }
        
        document.body.removeChild(testEl);
      } catch (error) {
        console.warn('Material Icons check failed:', error);
        setLoadError(true);
      }
    };

    // Check immediately
    checkIconsLoaded();

    // Also listen for font load event
    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        checkIconsLoaded();
      });
    }

    // Fallback timeout - if not loaded after 1.5 seconds, use SVG
    const timeout = setTimeout(() => {
      if (!iconsLoaded && !loadError) {
        setLoadError(true);
      }
    }, 1500);

    return () => clearTimeout(timeout);
  }, []);

  // If we have a custom fallback, use it
  if (fallback) {
    return <span className={className}>{fallback}</span>;
  }

  // If Material Icons are loaded and available, use them
  if (iconsLoaded && !loadError) {
    // Use Material Icons font if available
    const materialIconClass = `material-icons ${sizeMap[size]} ${className}`;
    return <span className={materialIconClass}>{name}</span>;
  }

  // Fallback to SVG
  const svgIcon = iconMap[name];
  if (svgIcon) {
    const sizeClass = sizeMap[size] || 'text-base';
    return (
      <span className={`inline-flex items-center justify-center ${sizeClass} ${className}`}>
        {svgIcon}
      </span>
    );
  }

  // If icon not found, return a placeholder
  return (
    <span className={`inline-flex items-center justify-center ${sizeMap[size]} ${className}`}>
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
    </span>
  );
}

