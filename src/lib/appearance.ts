export type Theme = 'light' | 'dark';
export type AccentColor = 'purple' | 'blue' | 'emerald' | 'rose' | 'orange';
export type Density = 'cozy' | 'compact';
export type FontFamily = 'inter' | 'roboto' | 'system';

export interface AppearanceConfig {
  theme: Theme;
  accent: AccentColor;
  density: Density;
  fontFamily: FontFamily;
  fontSize: number;
  animations: boolean;
  glassmorphism: boolean;
}

export const DEFAULTS: AppearanceConfig = {
  theme: 'dark',
  accent: 'purple',
  density: 'cozy',
  fontFamily: 'inter',
  fontSize: 14,
  animations: true,
  glassmorphism: true,
};

export const ACCENT_COLORS: Record<AccentColor, { hex: string; bg: string; hsl: string }> = {
  purple:  { hex: '#7c3aed', bg: 'rgba(124,58,237,0.15)', hsl: '262 83% 58%' },
  blue:    { hex: '#3b82f6', bg: 'rgba(59,130,246,0.15)', hsl: '217 91% 60%' },
  emerald: { hex: '#10b981', bg: 'rgba(16,185,129,0.15)', hsl: '160 84% 39%' },
  rose:    { hex: '#f43f5e', bg: 'rgba(244,63,94,0.15)', hsl: '343 88% 60%' },
  orange:  { hex: '#f97316', bg: 'rgba(249,115,22,0.15)', hsl: '25 95% 53%' },
};

export const FONT_FAMILIES = {
  inter: "'Inter', sans-serif",
  roboto: "'Roboto', sans-serif",
  system: "system-ui, -apple-system, sans-serif",
};
