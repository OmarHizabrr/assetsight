import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function useDarkMode() {
  const [theme, setTheme] = useState<Theme>('light');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // جلب الوضع المحفوظ
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      // استخدام تفضيلات النظام
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme('system');
      setIsDark(prefersDark);
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
  }, []);

  const applyTheme = (newTheme: Theme) => {
    if (newTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      setIsDark(newTheme === 'dark');
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  };

  const toggleTheme = () => {
    const newTheme: Theme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  const setSpecificTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  return {
    theme,
    isDark,
    isDarkMode: isDark, // Alias for consistency
    toggleTheme,
    setTheme: setSpecificTheme,
  };
}

