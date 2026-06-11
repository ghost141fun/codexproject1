'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Check, Moon, Sun, Type, Layout, Sparkles, MessageSquare } from 'lucide-react';

import { 
  Theme, 
  AccentColor, 
  FontFamily,
  Density, 
  AppearanceConfig, 
  DEFAULTS, 
  ACCENT_COLORS, 
  FONT_FAMILIES 
} from '@/lib/appearance';

// ── Components ────────────────────────────────────────────────────────────

const Toggle: React.FC<{ checked: boolean; onChange: () => void; accent: string }> = ({ checked, onChange, accent }) => (
  <label className="as-toggle relative inline-block w-11 h-6 shrink-0 cursor-pointer">
    <input type="checkbox" className="opacity-0 w-0 h-0 absolute" checked={checked} onChange={onChange} />
    <span className="as-track absolute inset-0 rounded-full transition-all duration-200" style={{ background: checked ? accent : '#2a2c33', border: '1px solid rgba(255,255,255,0.05)' }} />
    <span className={`as-thumb absolute top-[3px] left-[3px] w-[18px] h-[18px] bg-white rounded-full transition-all duration-200 pointer-events-none shadow-sm ${checked ? 'translate-x-[20px]' : ''}`} style={{ background: checked ? '#fff' : '#6b7280' }} />
  </label>
);

export default function AppearanceSettings() {
  const [config, setConfig] = useState<AppearanceConfig>(DEFAULTS);
  const [toast, setToast] = useState<{msg: string, visible: boolean}>({ msg: '', visible: false });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, visible: true });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500);
  }, []);

  useEffect(() => {
    // Load from LocalStorage
    const saved = localStorage.getItem('codex-teams-appearance');
    if (saved) {
      try { setConfig(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const update = <K extends keyof AppearanceConfig>(key: K, val: AppearanceConfig[K]) => {
    setConfig(prev => {
      const next = { ...prev, [key]: val };
      localStorage.setItem('codex-teams-appearance', JSON.stringify(next));
      return next;
    });
    showToast('Appearance updated');
  };

  useEffect(() => {
    const root = document.documentElement;

    // Apply Typography
    document.body.style.fontFamily = FONT_FAMILIES[config.fontFamily];
    root.style.fontSize = `${config.fontSize}px`; // Base scale

    // Apply Accent Colors
    const hsl = ACCENT_COLORS[config.accent].hsl;
    root.style.setProperty('--primary', hsl);
    root.style.setProperty('--ring', hsl);
    root.style.setProperty('--accent', hsl);

    // Apply Density (Padding & Spacing scaling css variables if applicable)
    if (config.density === 'compact') {
      root.style.setProperty('--spacing-scale', '0.8');
      root.classList.add('compact-density');
    } else {
      root.style.setProperty('--spacing-scale', '1');
      root.classList.remove('compact-density');
    }

    // Toggle Global Sub-classes
    if (!config.animations) root.classList.add('disable-animations');
    else root.classList.remove('disable-animations');

    if (!config.glassmorphism) root.classList.add('disable-glass');
    else root.classList.remove('disable-glass');

    if (config.theme === 'light') {
      root.classList.add('light-mode');
      root.classList.remove('dark');
    } else {
      root.classList.remove('light-mode');
      root.classList.add('dark');
    }

  }, [config]);

  const isDark = config.theme === 'dark';
  const cAccent = ACCENT_COLORS[config.accent];

  return (
    <div className="max-w-[680px] mx-auto px-8 py-8" style={{ fontFamily: FONT_FAMILIES[config.fontFamily] }}>
      <div className="mb-8">
        <h2 className="text-[20px] font-bold tracking-tight text-[#e8eaf0] mb-1">Appearance</h2>
        <p className="font-mono text-[11.5px] text-[#6b7280]">Customize how Codex Teams looks and feels on your device.</p>
      </div>

      <div className="flex gap-8 items-start">
        {/* Left Side: Settings */}
        <div className="flex-1 space-y-8">
          
          {/* Theme */}
          <section>
            <div className="as-section-label font-mono text-[10px] font-bold tracking-widest uppercase text-[#6b7280] mb-3">Theme</div>
            <div className="grid grid-cols-2 gap-3">
              {(['light', 'dark'] as Theme[]).map(t => {
                const active = config.theme === t;
                return (
                  <button key={t} onClick={() => update('theme', t)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl border transition-all"
                    style={{
                      background: active ? cAccent.bg : '#18191d',
                      borderColor: active ? cAccent.hex : '#2a2c33',
                    }}
                  >
                    {t === 'light' ? <Sun size={18} color={active ? cAccent.hex : '#9ca3af'} /> :
                     <Moon size={18} color={active ? cAccent.hex : '#9ca3af'} />}
                    <span className="text-[12px] font-semibold capitalize" style={{ color: active ? (isDark ? '#e8eaf0' : '#1e293b') : '#9ca3af' }}>{t}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Color Accent */}
          <section>
            <div className="as-section-label font-mono text-[10px] font-bold tracking-widest uppercase text-[#6b7280] mb-3">Accent Color</div>
            <div className="flex bg-[#18191d] p-3 rounded-xl border border-[#2a2c33] gap-3 flex-wrap">
              {(Object.keys(ACCENT_COLORS) as AccentColor[]).map(c => {
                const active = config.accent === c;
                const hex = ACCENT_COLORS[c].hex;
                return (
                  <button key={c} onClick={() => update('accent', c)}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 relative"
                    style={{ background: hex }}
                  >
                    {active && <Check size={16} color="#fff" className="absolute" />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Typography */}
          <section>
            <div className="as-section-label font-mono text-[10px] font-bold tracking-widest uppercase text-[#6b7280] mb-3 flex items-center gap-2"><Type size={12}/> Typography</div>
            <div className="bg-[#18191d] p-4 rounded-xl border border-[#2a2c33] space-y-5">
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[13.5px] font-semibold text-[#e8eaf0]">Font Family</div>
                  <div className="text-[12px] text-[#9ca3af]">Select the primary font</div>
                </div>
                <select 
                  value={config.fontFamily} onChange={(e) => update('fontFamily', e.target.value as FontFamily)}
                  className="bg-[#111214] border border-[#2a2c33] text-[#e8eaf0] rounded-lg px-3 py-1.5 text-[13px] outline-none cursor-pointer"
                  style={{ '&:focus': { borderColor: cAccent.hex } } as any}
                >
                  <option value="inter">Inter</option>
                  <option value="roboto">Roboto</option>
                  <option value="system">System Default</option>
                </select>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-[120px] shrink-0">
                  <div className="text-[13.5px] font-semibold text-[#e8eaf0]">Font Size</div>
                  <div className="text-[12px] text-[#9ca3af]">Scale the UI</div>
                </div>
                <div className="flex-1 flex items-center gap-3">
                  <span className="text-[11px] text-[#9ca3af]">A</span>
                  <input type="range" min="12" max="18" step="1" value={config.fontSize} onChange={(e) => update('fontSize', parseInt(e.target.value))}
                    className="flex-1 h-1.5 rounded-full appearance-none bg-[#2a2c33] outline-none cursor-pointer"
                    style={{ accentColor: cAccent.hex }} />
                  <span className="text-[15px] font-bold text-[#9ca3af]">A</span>
                  <span className="font-mono text-[11px] w-5 text-right text-[#e8eaf0]">{config.fontSize}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Layout & Effects */}
          <section>
            <div className="as-section-label font-mono text-[10px] font-bold tracking-widest uppercase text-[#6b7280] mb-3 flex items-center gap-2"><Layout size={12}/> Interactions & Layout</div>
            <div className="bg-[#18191d] p-1 rounded-xl border border-[#2a2c33]">
              
              <div className="flex items-center justify-between p-3 border-b border-[#2a2c33]">
                <div>
                  <div className="text-[13.5px] font-semibold text-[#e8eaf0]">Message Density</div>
                  <div className="text-[12px] text-[#9ca3af]">How messages are spaced</div>
                </div>
                <div className="flex bg-[#111214] p-1 rounded-lg border border-[#2a2c33]">
                  <button onClick={() => update('density', 'cozy')} className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${config.density === 'cozy' ? 'text-white' : 'text-[#6b7280]'}`} style={config.density === 'cozy' ? {background: cAccent.hex} : {}}>Cozy</button>
                  <button onClick={() => update('density', 'compact')} className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${config.density === 'compact' ? 'text-white' : 'text-[#6b7280]'}`} style={config.density === 'compact' ? {background: cAccent.hex} : {}}>Compact</button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border-b border-[#2a2c33]">
                <div>
                  <div className="text-[13.5px] font-semibold text-[#e8eaf0] flex items-center gap-1.5"><Sparkles size={14}/> Animations</div>
                  <div className="text-[12px] text-[#9ca3af]">UI motion and transitions</div>
                </div>
                <Toggle checked={config.animations} onChange={() => update('animations', !config.animations)} accent={cAccent.hex} />
              </div>

              <div className="flex items-center justify-between p-3">
                <div>
                  <div className="text-[13.5px] font-semibold text-[#e8eaf0]">Glassmorphism</div>
                  <div className="text-[12px] text-[#9ca3af]">Translucent backgrounds & blur</div>
                </div>
                <Toggle checked={config.glassmorphism} onChange={() => update('glassmorphism', !config.glassmorphism)} accent={cAccent.hex} />
              </div>
            </div>
          </section>
        </div>

        {/* Right Side: Preview pane */}
        <div className="w-[300px] shrink-0 sticky top-8">
          <div className="as-section-label font-mono text-[10px] font-bold tracking-widest uppercase text-[#6b7280] mb-3">Live Preview</div>
          
          <div className={`overflow-hidden border rounded-2xl transition-all shadow-xl ${config.animations ? 'duration-300 transform hover:-translate-y-1 hover:shadow-2xl' : ''}`}
            style={{ 
              background: isDark ? '#111214' : '#f8fafc',
              borderColor: isDark ? '#2a2c33' : '#e2e8f0',
              backdropFilter: config.glassmorphism ? 'blur(12px)' : 'none',
              backgroundColor: isDark ? (config.glassmorphism ? 'rgba(17,18,20,0.8)' : '#111214') : (config.glassmorphism ? 'rgba(248,250,252,0.8)' : '#f8fafc')
            }}>
            
            {/* Nav Mock */}
            <div className="h-12 border-b flex items-center px-4 gap-3" style={{ borderColor: isDark ? '#2a2c33' : '#e2e8f0' }}>
              <div className="w-3 h-3 rounded-full bg-red-500 opacity-80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-80" />
              <div className="w-3 h-3 rounded-full bg-green-500 opacity-80" />
              <div className="ml-auto flex items-center gap-2">
                <div className="w-16 h-3 rounded-full" style={{ background: isDark ? '#2a2c33' : '#e2e8f0' }} />
              </div>
            </div>

            {/* Chat Mock */}
            <div className="p-4 flex flex-col" style={{ fontSize: `${config.fontSize}px`, gap: config.density === 'compact' ? '8px' : '16px' }}>
              
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white" style={{ background: cAccent.hex,  }}>S</div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-bold" style={{ color: isDark ? '#e8eaf0' : '#1e293b' }}>Sanchayan</span>
                    <span className="text-[0.8em]" style={{ color: isDark ? '#6b7280' : '#94a3b8' }}>10:42 AM</span>
                  </div>
                  <div style={{ color: isDark ? '#d1d5db' : '#334155', lineHeight: 1.5 }}>
                    Just pushed the new Appearance settings. How does it look?
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full shrink-0 bg-[#475569] flex items-center justify-center text-white">A</div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-bold" style={{ color: isDark ? '#e8eaf0' : '#1e293b' }}>Alex</span>
                    <span className="text-[0.8em]" style={{ color: isDark ? '#6b7280' : '#94a3b8' }}>10:45 AM</span>
                  </div>
                  <div style={{ color: isDark ? '#d1d5db' : '#334155', lineHeight: 1.5 }}>
                    Looks amazing! Getting really crisp with that <span className="font-mono text-[0.9em] px-1 rounded bg-[rgba(124,58,237,0.15)] text-[#c084fc]" style={{ color: cAccent.hex, background: cAccent.bg }}>accent color</span> tweak.
                  </div>
                </div>
              </div>

            </div>

            {/* Input Mock */}
            <div className="p-3">
              <div className="h-10 rounded-lg flex items-center px-4" 
                   style={{ background: isDark ? '#1e2026' : '#fff', border: `1px solid ${isDark ? '#2a2c33' : '#e2e8f0'}` }}>
                <div className="w-full h-3 rounded-full opacity-30" style={{ background: isDark ? '#6b7280' : '#94a3b8' }} />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Toast */}
      <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 transition-all duration-300 z-[101] pointer-events-none border border-border/5
        ${toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
        style={{ 
          background: 'var(--popover)', 
          borderLeft: `4px solid ${cAccent.hex}`,
          backdropFilter: 'blur(12px)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
        }}>
        <Check size={16} color={cAccent.hex} />
        <span className="text-[13.5px] font-medium" style={{ color: 'var(--popover-foreground)' }}>{toast.msg}</span>
      </div>

    </div>
  );
}
