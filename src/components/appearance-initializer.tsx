'use client';

import { useEffect } from 'react';
import { ACCENT_COLORS, FONT_FAMILIES, DEFAULTS, AppearanceConfig } from '@/lib/appearance';

export function AppearanceInitializer() {
  useEffect(() => {
    const applyConfig = (config: AppearanceConfig) => {
      const root = document.documentElement;

      // 1. Apply Theme
      if (config.theme === 'light') {
        root.classList.add('light-mode');
        root.classList.remove('dark');
      } else {
        root.classList.remove('light-mode');
        root.classList.add('dark');
      }

      // 2. Apply Accent Colors
      const hsl = ACCENT_COLORS[config.accent]?.hsl || ACCENT_COLORS.purple.hsl;
      root.style.setProperty('--primary', hsl);
      root.style.setProperty('--ring', hsl);
      root.style.setProperty('--accent', hsl);

      // 3. Apply Typography
      if (config.fontSize) {
        root.style.fontSize = `${config.fontSize}px`;
      }
      if (config.fontFamily && FONT_FAMILIES[config.fontFamily]) {
        const fontFamily = FONT_FAMILIES[config.fontFamily];
        root.style.fontFamily = fontFamily;
        document.body.style.fontFamily = fontFamily;
      }

      // 4. Apply Density
      if (config.density === 'compact') {
        root.style.setProperty('--spacing-scale', '0.8');
        root.classList.add('compact-density');
      } else {
        root.style.setProperty('--spacing-scale', '1');
        root.classList.remove('compact-density');
      }

      // 5. Global Toggle Classes
      if (config.animations === false) root.classList.add('disable-animations');
      else root.classList.remove('disable-animations');

      if (config.glassmorphism === false) root.classList.add('disable-glass');
      else root.classList.remove('disable-glass');
    };

    // Initial Load
    const saved = localStorage.getItem('codex-teams-appearance');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        applyConfig(config);
      } catch (e) {
        applyConfig(DEFAULTS);
      }
    } else {
      applyConfig(DEFAULTS);
    }

    // Listen for changes from other tabs?
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'codex-teams-appearance' && e.newValue) {
        try {
          applyConfig(JSON.parse(e.newValue));
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return null; // This component doesn't render anything
}
