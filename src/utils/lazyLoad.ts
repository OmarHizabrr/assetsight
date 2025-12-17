/**
 * Lazy Loading Utilities
 * أدوات للتحميل الكسول وتحسين الأداء
 */

import { ComponentType, lazy } from 'react';

/**
 * Lazy load a component with custom loading fallback
 */
export function lazyLoadComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  return lazy(importFunc);
}

/**
 * Preload a component before it's needed
 */
export function preloadComponent(importFunc: () => Promise<any>) {
  importFunc();
}

/**
 * Lazy load multiple components
 */
export function lazyLoadComponents<T extends Record<string, ComponentType<any>>>(
  components: Record<keyof T, () => Promise<{ default: ComponentType<any> }>>
): Record<keyof T, ComponentType<any>> {
  const result = {} as Record<keyof T, ComponentType<any>>;
  
  for (const key in components) {
    result[key] = lazy(components[key]);
  }
  
  return result;
}

/**
 * Image lazy loading with intersection observer
 */
export class LazyImage {
  private observer: IntersectionObserver | null = null;
  
  constructor() {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              const src = img.dataset.src;
              const srcset = img.dataset.srcset;
              
              if (src) {
                img.src = src;
              }
              
              if (srcset) {
                img.srcset = srcset;
              }
              
              img.classList.remove('lazy');
              img.classList.add('loaded');
              
              this.observer?.unobserve(img);
            }
          });
        },
        {
          rootMargin: '50px 0px',
          threshold: 0.01,
        }
      );
    }
  }
  
  observe(element: HTMLElement) {
    this.observer?.observe(element);
  }
  
  disconnect() {
    this.observer?.disconnect();
  }
}

/**
 * Debounce function for performance
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Request Idle Callback wrapper
 */
export function runWhenIdle(callback: () => void) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback);
  } else {
    setTimeout(callback, 1);
  }
}

/**
 * Preload resources
 */
export function preloadResource(href: string, as: string) {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
}

/**
 * Prefetch resources for next navigation
 */
export function prefetchResource(href: string) {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
}

