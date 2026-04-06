'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Eye, MessageSquare, Search, Check } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────
export interface PrivacyConfig {
  showActivity: boolean;
  showCustomStatus: boolean;
  typingIndicators: boolean;
  allowSearchByEmail: boolean;
  allowSearchByPhone: boolean;
}

export const DEFAULTS: PrivacyConfig = {
  showActivity: true,
  showCustomStatus: true,
  typingIndicators: true,
  allowSearchByEmail: false,
  allowSearchByPhone: false,
};

// ── Components ────────────────────────────────────────────────────────────

const Toggle: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
  <label className="relative inline-block w-11 h-6 shrink-0 cursor-pointer">
    <input type="checkbox" className="opacity-0 w-0 h-0 absolute" checked={checked} onChange={onChange} />
    <span className="absolute inset-0 rounded-full transition-all duration-200" style={{ background: checked ? '#7c3aed' : '#2a2c33', border: '1px solid rgba(255,255,255,0.05)' }} />
    <span className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] bg-white rounded-full transition-all duration-200 pointer-events-none shadow-sm ${checked ? 'translate-x-[20px]' : ''}`} style={{ background: checked ? '#fff' : '#6b7280' }} />
  </label>
);

export default function PrivacySettings() {
  const [config, setConfig] = useState<PrivacyConfig>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('devtalk-privacy');
      if (saved) {
        try { return { ...DEFAULTS, ...JSON.parse(saved) }; } catch (e) {}
      }
    }
    return DEFAULTS;
  });
  const [toast, setToast] = useState<{msg: string, visible: boolean}>({ msg: '', visible: false });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, visible: true });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500);
  }, []);

  const update = <K extends keyof PrivacyConfig>(key: K, val: PrivacyConfig[K]) => {
    setConfig(prev => {
      const next = { ...prev, [key]: val };
      localStorage.setItem('devtalk-privacy', JSON.stringify(next));
      return next;
    });
    showToast('Privacy settings updated');
  };

  return (
    <div className="max-w-[680px] mx-auto py-4 font-['Inter',system-ui,sans-serif] relative">
      <div className="mb-8">
        <h2 className="text-[20px] font-bold tracking-tight text-[#e8eaf0] mb-1">Privacy & Safety</h2>
        <p className="font-mono text-[11.5px] text-[#6b7280]">Control who can interact with you and manage your data.</p>
      </div>

      <div className="space-y-8 pb-12">

        {/* ── Activity Status ── */}
        <section>
          <div className="font-mono text-[10px] font-bold tracking-widest uppercase text-[#6b7280] mb-3 flex items-center gap-2"><Eye size={12}/> Activity Status</div>
          <div className="bg-[#18191d] rounded-xl border border-[#2a2c33] overflow-hidden">
            
            <div className="flex items-center justify-between p-4 border-b border-[#2a2c33]">
              <div>
                <div className="text-[13.5px] font-semibold text-[#e8eaf0]">Display current activity as a status message</div>
                <div className="text-[12px] text-[#9ca3af] mt-1 max-w-[400px] leading-snug">DevTalk will automatically update your status to show the application or game you are currently running.</div>
              </div>
              <Toggle checked={config.showActivity} onChange={() => update('showActivity', !config.showActivity)} />
            </div>

            <div className="flex items-center justify-between p-4">
              <div>
                <div className="text-[13.5px] font-semibold text-[#e8eaf0]">Share custom status across workspaces</div>
                <div className="text-[12px] text-[#9ca3af] mt-1 max-w-[400px] leading-snug">Allow your custom status message to be visible to anyone in your shared workspaces.</div>
              </div>
              <Toggle checked={config.showCustomStatus} onChange={() => update('showCustomStatus', !config.showCustomStatus)} />
            </div>

          </div>
        </section>

        {/* ── Messaging Settings ── */}
        <section>
          <div className="font-mono text-[10px] font-bold tracking-widest uppercase text-[#6b7280] mb-3 flex items-center gap-2"><MessageSquare size={12}/> Messaging</div>
          <div className="bg-[#18191d] rounded-xl border border-[#2a2c33] overflow-hidden">
            
            <div className="flex items-center justify-between p-4">
              <div>
                <div className="text-[13.5px] font-semibold text-[#e8eaf0]">Typing Indicators</div>
                <div className="text-[12px] text-[#9ca3af] mt-1 max-w-[400px] leading-snug">Show others when you are typing a message. Disabling this also hides other people's typing status from you.</div>
              </div>
              <Toggle checked={config.typingIndicators} onChange={() => update('typingIndicators', !config.typingIndicators)} />
            </div>

          </div>
        </section>

        {/* ── Discoverability ── */}
        <section>
          <div className="font-mono text-[10px] font-bold tracking-widest uppercase text-[#6b7280] mb-3 flex items-center gap-2"><Search size={12}/> Discoverability</div>
          <div className="bg-[#18191d] rounded-xl border border-[#2a2c33] overflow-hidden">
            
            <div className="flex items-center justify-between p-4 border-b border-[#2a2c33]">
              <div>
                <div className="text-[13.5px] font-semibold text-[#e8eaf0]">Allow search by Email</div>
                <div className="text-[12px] text-[#9ca3af] mt-1">Let people find and add you on DevTalk using your email address.</div>
              </div>
              <Toggle checked={config.allowSearchByEmail} onChange={() => update('allowSearchByEmail', !config.allowSearchByEmail)} />
            </div>

            <div className="flex items-center justify-between p-4">
              <div>
                <div className="text-[13.5px] font-semibold text-[#e8eaf0]">Allow search by Phone Number</div>
                <div className="text-[12px] text-[#9ca3af] mt-1">Let people find and add you using your phone number if linked.</div>
              </div>
              <Toggle checked={config.allowSearchByPhone} onChange={() => update('allowSearchByPhone', !config.allowSearchByPhone)} />
            </div>

          </div>
        </section>

      </div>

      {/* Toast */}
      <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 transition-all duration-300 z-50 pointer-events-none
        ${toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
        style={{ background: '#1c1d21', borderLeft: `4px solid #7c3aed` }}>
        <Check size={16} color="#7c3aed" />
        <span className="text-[13.5px] font-medium text-[#e8eaf0]">{toast.msg}</span>
      </div>

    </div>
  );
}
