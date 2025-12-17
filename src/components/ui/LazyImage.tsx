'use client';

import { useEffect, useRef, useState } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  threshold?: number;
  rootMargin?: string;
}

/**
 * LazyImage - صورة محسّنة مع lazy loading
 */
export function LazyImage({
  src,
  alt,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3C/svg%3E',
  threshold = 0.01,
  rootMargin = '50px',
  className = '',
  ...props
}: LazyImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <img
      ref={imgRef}
      src={isInView ? src : placeholder}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={handleLoad}
      className={`material-transition ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      {...props}
    />
  );
}

