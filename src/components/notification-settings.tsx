'use client';

import React, { useState, useRef, useCallback, useEffect, KeyboardEvent } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SoundOption =
  | "chime"
  | "bell"
  | "pop"
  | "ding"
  | "triple"
  | "soft"
  | "alert"
  | "marimba"
  | "xylophone"
  | "none";

type DigestFrequency = "immediate" | "daily" | "weekly";
type SnoozePreset = 15 | 30 | 60 | 120;
type ToastColor = "green" | "red" | "blue";

interface ToastState {
  title: string;
  body: string;
  color: ToastColor;
  visible: boolean;
}

export interface NotificationSettings {
  directMessages: boolean;
  mentions: boolean;
  workspaceInvites: boolean;
  reactions: boolean;
  systemAnnouncements: boolean;
  soundEnabled: boolean;
  volume: number;
  soundType: SoundOption;
  dndEnabled: boolean;
  dndFrom: string;
  dndTo: string;
  urgentDuringDnd: boolean;
  keywordAlertsEnabled: boolean;
  keywords: string[];
  digestEnabled: boolean;
  digestFrequency: DigestFrequency;
}

// ─── Tone Definitions ─────────────────────────────────────────────────────────

type OscType = OscillatorType;

interface ToneNote {
  freq: number;
  start: number;
  duration: number;
  gainPeak: number;
  type?: OscType;
}

interface ToneDef {
  label: string;
  emoji: string;
  desc: string;
  notes: ToneNote[];
}

export const TONES: Record<SoundOption, ToneDef> = {
  chime: {
    label: "Chime",
    emoji: "🔔",
    desc: "Bright & airy",
    notes: [
      { freq: 1046.5, start: 0,    duration: 0.6, gainPeak: 0.22, type: "sine" },
      { freq: 1318.5, start: 0.12, duration: 0.5, gainPeak: 0.18, type: "sine" },
      { freq: 1568,   start: 0.24, duration: 0.7, gainPeak: 0.20, type: "sine" },
      { freq: 2093,   start: 0.36, duration: 0.8, gainPeak: 0.16, type: "sine" },
    ],
  },
  bell: {
    label: "Bell",
    emoji: "🛎️",
    desc: "Rich & resonant",
    notes: [
      { freq: 523.25, start: 0,    duration: 1.2, gainPeak: 0.25, type: "sine" },
      { freq: 659.25, start: 0,    duration: 0.9, gainPeak: 0.12, type: "sine" },
      { freq: 783.99, start: 0.05, duration: 1.0, gainPeak: 0.10, type: "sine" },
      { freq: 1046.5, start: 0.1,  duration: 0.8, gainPeak: 0.08, type: "sine" },
    ],
  },
  pop: {
    label: "Pop",
    emoji: "💬",
    desc: "Short & snappy",
    notes: [
      { freq: 880,  start: 0,    duration: 0.08, gainPeak: 0.30, type: "sine" },
      { freq: 1320, start: 0.06, duration: 0.10, gainPeak: 0.20, type: "sine" },
    ],
  },
  ding: {
    label: "Ding",
    emoji: "✨",
    desc: "Clean single tone",
    notes: [
      { freq: 1318.5, start: 0, duration: 0.9, gainPeak: 0.28, type: "sine" },
      { freq: 2637,   start: 0, duration: 0.4, gainPeak: 0.08, type: "sine" },
    ],
  },
  triple: {
    label: "Triple",
    emoji: "🎵",
    desc: "Three quick pings",
    notes: [
      { freq: 880,  start: 0,    duration: 0.18, gainPeak: 0.22, type: "sine" },
      { freq: 1100, start: 0.20, duration: 0.18, gainPeak: 0.22, type: "sine" },
      { freq: 1320, start: 0.40, duration: 0.25, gainPeak: 0.25, type: "sine" },
    ],
  },
  soft: {
    label: "Soft",
    emoji: "🌙",
    desc: "Gentle & mellow",
    notes: [
      { freq: 392,    start: 0,    duration: 0.8, gainPeak: 0.14, type: "sine" },
      { freq: 523.25, start: 0.15, duration: 0.7, gainPeak: 0.12, type: "sine" },
      { freq: 659.25, start: 0.30, duration: 0.9, gainPeak: 0.10, type: "sine" },
    ],
  },
  alert: {
    label: "Alert",
    emoji: "🚨",
    desc: "Urgent & attention-grabbing",
    notes: [
      { freq: 987.77, start: 0,    duration: 0.15, gainPeak: 0.30, type: "square" },
      { freq: 1318.5, start: 0.18, duration: 0.15, gainPeak: 0.28, type: "square" },
      { freq: 987.77, start: 0.36, duration: 0.15, gainPeak: 0.26, type: "square" },
      { freq: 1318.5, start: 0.54, duration: 0.20, gainPeak: 0.30, type: "square" },
    ],
  },
  marimba: {
    label: "Marimba",
    emoji: "🎶",
    desc: "Warm wooden tap",
    notes: [
      { freq: 784,     start: 0,    duration: 0.25, gainPeak: 0.28, type: "sine" },
      { freq: 987.77,  start: 0.14, duration: 0.25, gainPeak: 0.24, type: "sine" },
      { freq: 1174.66, start: 0.28, duration: 0.30, gainPeak: 0.22, type: "sine" },
      { freq: 1568,    start: 0.42, duration: 0.35, gainPeak: 0.18, type: "sine" },
    ],
  },
  xylophone: {
    label: "Xylophone",
    emoji: "🎼",
    desc: "Playful & bright",
    notes: [
      { freq: 1046.5, start: 0,    duration: 0.20, gainPeak: 0.26, type: "triangle" },
      { freq: 1318.5, start: 0.13, duration: 0.20, gainPeak: 0.24, type: "triangle" },
      { freq: 1568,   start: 0.26, duration: 0.20, gainPeak: 0.22, type: "triangle" },
      { freq: 2093,   start: 0.39, duration: 0.25, gainPeak: 0.20, type: "triangle" },
      { freq: 2637,   start: 0.52, duration: 0.30, gainPeak: 0.18, type: "triangle" },
    ],
  },
  none: {
    label: "Silent",
    emoji: "🔕",
    desc: "No sound",
    notes: [],
  },
};

const TONE_KEYS = Object.keys(TONES) as SoundOption[];

// ─── Constants ────────────────────────────────────────────────────────────────

export const DEFAULTS: NotificationSettings = {
  directMessages: true,
  mentions: true,
  workspaceInvites: true,
  reactions: false,
  systemAnnouncements: true,
  soundEnabled: true,
  volume: 70,
  soundType: "chime",
  dndEnabled: false,
  dndFrom: "22:00",
  dndTo: "08:00",
  urgentDuringDnd: true,
  keywordAlertsEnabled: true,
  keywords: ["urgent", "meeting", "deadline"],
  digestEnabled: false,
  digestFrequency: "immediate",
};

const SNOOZE_PRESETS: { value: SnoozePreset; label: string }[] = [
  { value: 15,  label: "15 min" },
  { value: 30,  label: "30 min" },
  { value: 60,  label: "1 hour" },
  { value: 120, label: "2 hours" },
];

const DIGEST_OPTIONS: { value: DigestFrequency; label: string; icon: string }[] = [
  { value: "immediate", label: "Immediate", icon: "⚡" },
  { value: "daily",     label: "Daily",     icon: "☀️" },
  { value: "weekly",    label: "Weekly",    icon: "📅" },
];

const TOAST_COLORS: Record<ToastColor, string> = {
  green: "#23a559",
  red:   "#da3c3c",
  blue:  "#7c3aed",
};

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
  .ns-wrap { font-family: 'Inter', system-ui, sans-serif; color: #e8e8f0; font-size: 14px; max-width: 680px; margin: auto; padding: 32px; background: #111214; }
  .ns-title { font-size: 20px; font-weight: 700; color: #e8eaf0; margin-bottom: 2px; }
  .ns-sub   { font-size: 11.5px; color: #6b7280; font-family: monospace; margin-bottom: 28px; }
  .ns-divider { height: 1px; background: #2a2c33; margin: 24px 0; }
  .ns-section-label {
    font-size: 10px; font-weight: 700; letter-spacing: .08em; font-family: monospace;
    text-transform: uppercase; color: #6b7280; margin: 20px 0 10px;
  }
  .ns-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 16px; background: #18191d; border-radius: 12px;
    margin-bottom: 8px; gap: 12px;
    border: 1px solid #2a2c33; transition: border-color .15s;
  }
  .ns-row:hover { border-color: #3a3d45; }
  .ns-row-col { flex-direction: column; align-items: flex-start; }
  .ns-row-info { flex: 1; }
  .ns-row-title { font-size: 13.5px; font-weight: 600; color: #e8eaf0; }
  .ns-row-desc  { font-size: 12px; color: #9ca3af; margin-top: 2px; line-height: 1.4; }

  /* Toggle */
  .ns-toggle { position: relative; width: 44px; height: 24px; flex-shrink: 0; cursor: pointer; display: inline-block; }
  .ns-toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
  .ns-track  { position: absolute; inset: 0; border-radius: 12px; background: #2a2c33; transition: background .2s; border: 1px solid rgba(255,255,255,0.05); }
  .ns-thumb  { position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: #6b7280; transition: all .2s; pointer-events: none; }
  .ns-toggle input:checked ~ .ns-track { background: #7c3aed; border-color: #7c3aed; }
  .ns-toggle input:checked ~ .ns-thumb { left: 23px; background: #fff; }

  /* Snooze */
  .ns-snooze-bar { background: #18191d; border: 1px solid #2a2c33; border-radius: 12px; padding: 14px 16px; display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
  .ns-snooze-icon { width: 36px; height: 36px; border-radius: 10px; background: rgba(124,58,237,0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ns-snooze-timer { font-size: 24px; font-weight: 700; color: #a855f7; font-variant-numeric: tabular-nums; margin-left: auto; font-family: monospace; }
  .ns-snooze-sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
  .ns-quick-btns { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; align-items: center; }
  .ns-qbtn { background: #111214; border: 1px solid #2a2c33; color: #9ca3af; border-radius: 8px; padding: 6px 14px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all .15s; }
  .ns-qbtn:hover, .ns-qbtn.selected { background: rgba(124,58,237,0.15); color: #c084fc; border-color: #8b5cf6; }
  .ns-snooze-btn { background: #111214; border: 1px solid #2a2c33; color: #9ca3af; font-weight: 600; border-radius: 8px; padding: 8px 14px; font-size: 12.5px; cursor: pointer; transition: all .15s; margin-left: auto; }
  .ns-snooze-btn:hover { background: #1c1d21; color: #e8eaf0; }
  .ns-snooze-btn.active { background: rgba(239,68,68,0.1); color: #ef4444; border-color: rgba(239,68,68,0.3); }

  /* Volume */
  .ns-vol-row { display: flex; align-items: center; gap: 12px; max-width: 260px; flex: 1; }
  input[type=range] { -webkit-appearance: none; height: 4px; border-radius: 2px; background: #2a2c33; outline: none; flex: 1; accent-color: #7c3aed; }
  input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #a855f7; cursor: pointer; }

  /* Tone Grid */
  .ns-tone-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(130px, 1fr)); gap:8px; margin-top:10px; width:100%; }
  .ns-tone-card {
    background:#18191d; border:1px solid #2a2c33;
    border-radius:12px; padding:12px 14px; cursor:pointer;
    transition:all .18s; display:flex; flex-direction:column; gap:4px; position:relative;
  }
  .ns-tone-card:hover { border-color:#3a3d45; background:#1c1d21; }
  .ns-tone-card.selected { border-color:#7c3aed; background:rgba(124,58,237,0.1); }
  .ns-tone-card.playing { border-color:#10b981 !important; background:rgba(16,185,129,0.05) !important; }
  
  .ns-tone-top { display:flex; align-items:center; justify-content:space-between; gap:4px; }
  .ns-tone-emoji { font-size:18px; line-height:1; flex-shrink:0; }
  .ns-tone-check {
    width:16px; height:16px; border-radius:50%; background:#7c3aed;
    display:flex; align-items:center; justify-content:center;
    opacity:0; transition:opacity .15s; flex-shrink:0;
  }
  .ns-tone-card.selected .ns-tone-check { opacity:1; }
  .ns-tone-play-btn {
    width:24px; height:24px; border-radius:50%; flex-shrink:0;
    background:rgba(124,58,237,0.15); border:1px solid rgba(124,58,237,0.25);
    color:#c084fc; display:flex; align-items:center; justify-content:center;
    cursor:pointer; transition:all .15s;
  }
  .ns-tone-play-btn:hover { background:rgba(124,58,237,0.3); }
  .ns-tone-card.playing .ns-tone-play-btn { background:rgba(16,185,129,0.15); border-color:rgba(16,185,129,0.25); color:#10b981; }
  .ns-tone-label { font-size:13.5px; font-weight:600; color:#e8eaf0; margin-top:2px; }
  .ns-tone-desc  { font-size:11px; color:#6b7280; font-family: monospace; }

  /* Animated wave bars */
  .ns-wave { display:flex; align-items:center; gap:2px; height:12px; }
  .ns-wave span { width:3px; border-radius:2px; background:#10b981; animation: nsWave 0.55s ease-in-out infinite alternate; }
  .ns-wave span:nth-child(1) { animation-delay: 0s; }
  .ns-wave span:nth-child(2) { animation-delay: 0.1s; }
  .ns-wave span:nth-child(3) { animation-delay: 0.2s; }
  .ns-wave span:nth-child(4) { animation-delay: 0.15s; }
  @keyframes nsWave { from { height: 3px; } to { height: 12px; } }

  select { background: #111214; border: 1px solid #2a2c33; color: #e8eaf0; border-radius: 8px; padding: 8px 12px; font-size: 13px; font-weight: 500; cursor: pointer; outline: none; transition: border-color .15s; appearance: none; }
  select:focus { border-color: #7c3aed; }

  /* DND */
  .ns-dnd-card { background: #18191d; border: 1px solid #2a2c33; border-radius: 12px; padding: 14px 16px; margin-bottom: 8px; }
  .ns-time-row { display: flex; align-items: center; gap: 10px; margin-top: 12px; font-size: 13px; font-weight: 500; color: #9ca3af; }
  input[type=time] { background: #111214; border: 1px solid #2a2c33; color: #e8eaf0; border-radius: 8px; padding: 6px 10px; font-size: 13px; font-family: monospace; outline: none; transition: border-color .15s; }
  input[type=time]:focus { border-color: #7c3aed; }

  /* Keywords */
  .ns-kw-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
  .ns-ktag { display: flex; align-items: center; gap: 6px; background: rgba(124,58,237,0.15); border: 1px solid rgba(124,58,237,0.3); border-radius: 20px; padding: 4px 12px; font-size: 12.5px; font-weight: 500; color: #c084fc; }
  .ns-ktag-x { width: 16px; height: 16px; border-radius: 50%; background: rgba(124,58,237,0.3); display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 11px; border: none; color: #e8eaf0; transition: background .15s; line-height: 1; }
  .ns-ktag-x:hover { background: rgba(239,68,68,0.6); color: #fff; }
  .ns-kw-input { background: #111214; border: 1px solid #2a2c33; color: #e8eaf0; border-radius: 8px; padding: 8px 12px; font-size: 13px; outline: none; transition: border-color .15s; width: 180px; }
  .ns-kw-input:focus { border-color: #7c3aed; }
  .ns-add-btn { background: rgba(124,58,237,0.15); border: 1px solid rgba(124,58,237,0.3); color: #c084fc; border-radius: 8px; padding: 8px 14px; font-size: 12.5px; font-weight: 600; cursor: pointer; transition: all .15s; }
  .ns-add-btn:hover { background: rgba(124,58,237,0.25); }

  /* Digest */
  .ns-digest-opts { display: flex; gap: 8px; margin-top: 10px; width: 100%; }
  .ns-doption { flex: 1; padding: 12px; background: #111214; border: 1px solid #2a2c33; border-radius: 10px; text-align: center; cursor: pointer; transition: all .15s; font-size: 13px; font-weight: 500; color: #9ca3af; }
  .ns-doption:hover { border-color: #3a3d45; color: #e8eaf0; }
  .ns-doption.selected { border-color: #7c3aed; color: #c084fc; background: rgba(124,58,237,0.15); }
  .ns-doption-icon { font-size: 18px; margin-bottom: 6px; }

  /* Save bar */
  .ns-save-bar { position: sticky; bottom: 0; background: inherit; border-top: 1px solid #2a2c33; padding: 16px 0 0; margin-top: 32px; display: flex; gap: 10px; justify-content: flex-end; }
  .ns-btn-save  { background: #7c3aed; border: none; color: #fff; border-radius: 8px; padding: 10px 24px; font-size: 13.5px; font-weight: 600; cursor: pointer; transition: all .15s; }
  .ns-btn-save:hover  { background: #a855f7; }
  .ns-btn-save:active { transform: scale(0.98); }
  .ns-btn-reset { background: transparent; border: 1px solid #2a2c33; color: #9ca3af; border-radius: 8px; padding: 10px 18px; font-size: 13.5px; font-weight: 600; cursor: pointer; transition: all .15s; }
  .ns-btn-reset:hover { background: #1c1d21; color: #e8eaf0; }

  /* Toast */
  .ns-toast { position: fixed; bottom: 24px; right: 24px; background: #18191d; border: 1px solid #2a2c33; border-left: 4px solid #7c3aed; border-radius: 12px; padding: 14px 20px; font-size: 13.5px; color: #e8eaf0; transform: translateY(80px); opacity: 0; transition: all .3s cubic-bezier(0.16, 1, 0.3, 1); pointer-events: none; z-index: 9999; max-width: 320px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
  .ns-toast.show { transform: translateY(0); opacity: 1; }
  .ns-toast-title { font-weight: 700; font-size: 14px; margin-bottom: 2px; }
  .ns-toast-body  { color: #9ca3af; font-size: 12.5px; line-height: 1.4; }
`;

// ─── Audio Engine ─────────────────────────────────────────────────────────────

export function playTone(soundType: SoundOption, volume: number): number {
  if (typeof window === 'undefined' || soundType === "none") return 0;
  const ctx = new (window.AudioContext ||
    (window as any).webkitAudioContext)();
  const tone = TONES[soundType];
  const vol = volume / 100;
  let maxEnd = 0;

  tone.notes.forEach(({ freq, start, duration, gainPeak, type = "sine" }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    const t0 = ctx.currentTime + start;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(gainPeak * vol, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
    maxEnd = Math.max(maxEnd, start + duration);
  });

  return maxEnd * 1000 + 300; // ms until tone finishes
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const Toggle: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
  <label className="ns-toggle">
    <input type="checkbox" checked={checked} onChange={onChange} />
    <div className="ns-track" />
    <div className="ns-thumb" />
  </label>
);

const BellIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2" width={18} height={18}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const WaveAnim: React.FC = () => (
  <div className="ns-wave">
    {[10, 6, 12, 8].map((_, i) => (
      <span key={i} />
    ))}
  </div>
);

// ─── Tone Picker ──────────────────────────────────────────────────────────────

interface TonePickerProps {
  selected: SoundOption;
  volume: number;
  onSelect: (tone: SoundOption) => void;
}

const TonePicker: React.FC<TonePickerProps> = ({ selected, volume, onSelect }) => {
  const [playingTone, setPlayingTone] = useState<SoundOption | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerPlay = (key: SoundOption) => {
    if (key === "none") return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setPlayingTone(key);
    const dur = playTone(key, volume);
    timerRef.current = setTimeout(() => setPlayingTone(null), dur);
  };

  const handlePlayBtn = (e: React.MouseEvent, key: SoundOption) => {
    e.stopPropagation();
    triggerPlay(key);
  };

  const handleCardClick = (key: SoundOption) => {
    onSelect(key);
    triggerPlay(key);
  };

  return (
    <div className="ns-tone-grid">
      {TONE_KEYS.map((key) => {
        const tone = TONES[key];
        const isSelected = selected === key;
        const isPlaying = playingTone === key;

        return (
          <div
            key={key}
            className={[
              "ns-tone-card",
              isSelected ? "selected" : "",
              isPlaying ? "playing" : "",
            ].join(" ").trim()}
            onClick={() => handleCardClick(key)}
          >
            <div className="ns-tone-top">
              <span className="ns-tone-emoji">{tone.emoji}</span>
              <div className="ns-tone-check">
                <svg viewBox="0 0 12 12" fill="none" width={10} height={10}>
                  <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {key !== "none" ? (
                <button
                  className="ns-tone-play-btn"
                  onClick={(e) => handlePlayBtn(e, key)}
                  title={`Preview ${tone.label}`}
                >
                  {isPlaying ? <WaveAnim /> : (
                    <svg viewBox="0 0 12 12" fill="currentColor" width={9} height={9}>
                      <polygon points="3,2 10,6 3,10" />
                    </svg>
                  )}
                </button>
              ) : (
                <div style={{ width: 24 }} />
              )}
            </div>
            <div className="ns-tone-label">{tone.label}</div>
            <div className="ns-tone-desc">{tone.desc}</div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('codex-teams-notifications');
      if (saved) {
        try { return { ...DEFAULTS, ...JSON.parse(saved) }; } catch (e) {}
      }
    }
    return DEFAULTS;
  });
  const [toast, setToast] = useState<ToastState>({ title: "", body: "", color: "blue", visible: false });
  const [snoozeActive, setSnoozeActive] = useState(false);
  const [snoozeEnd, setSnoozeEnd] = useState<number | null>(null);
  const [snoozeRemaining, setSnoozeRemaining] = useState("");
  const [snoozePreset, setSnoozePreset] = useState<SnoozePreset | null>(null);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const snoozeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const kwInputRef = useRef<HTMLInputElement>(null);

  // Toast
  const showToast = useCallback((title: string, body: string, color: ToastColor = "blue") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ title, body, color, visible: true });
    toastTimerRef.current = setTimeout(
      () => setToast((t) => ({ ...t, visible: false })),
      3000
    );
  }, []);

  // Settings helpers
  const update = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem('codex-teams-notifications', JSON.stringify(next));
      return next;
    });
  };

  const toggle = (key: keyof NotificationSettings, label: string) => {
    setSettings((prev) => {
      const nextVal = !prev[key] as NotificationSettings[typeof key];
      const nextSettings = { ...prev, [key]: nextVal };
      localStorage.setItem('codex-teams-notifications', JSON.stringify(nextSettings));
      showToast(label, nextVal ? "Enabled." : "Disabled.", nextVal ? "green" : "red");
      return nextSettings;
    });
  };

  // Snooze
  const tickSnooze = useCallback(() => {
    setSnoozeEnd((end) => {
      if (!end) return end;
      const ms = end - Date.now();
      if (ms <= 0) {
        setSnoozeActive(false);
        setSnoozeRemaining("");
        setSnoozePreset(null);
        showToast("Snooze ended", "Notifications are active again.", "green");
        return null;
      }
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setSnoozeRemaining(
        `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
      return end;
    });
  }, [showToast]);

  useEffect(() => {
    if (snoozeActive) {
      snoozeIntervalRef.current = setInterval(tickSnooze, 1000);
    } else {
      if (snoozeIntervalRef.current) clearInterval(snoozeIntervalRef.current);
    }
    return () => {
      if (snoozeIntervalRef.current) clearInterval(snoozeIntervalRef.current);
    };
  }, [snoozeActive, tickSnooze]);

  const startSnooze = (mins: SnoozePreset) => {
    setSnoozeEnd(Date.now() + mins * 60000);
    setSnoozeActive(true);
    setSnoozePreset(mins);
    showToast(
      "Snoozed",
      `Notifications paused for ${mins} minute${mins > 1 ? "s" : ""}.`,
      "blue"
    );
  };

  const cancelSnooze = () => {
    setSnoozeActive(false);
    setSnoozeEnd(null);
    setSnoozeRemaining("");
    setSnoozePreset(null);
    showToast("Snooze ended", "Notifications are active again.", "green");
  };

  // Tone selection
  const handleToneSelect = (tone: SoundOption) => {
    update("soundType", tone);
    showToast(
      tone === "none" ? "Silent mode" : `Tone: ${TONES[tone].label}`,
      tone === "none" ? "No notification sound." : TONES[tone].desc,
      "blue"
    );
  };

  // Keywords
  const addKeyword = () => {
    const val = kwInputRef.current?.value.trim().toLowerCase() ?? "";
    if (!val || settings.keywords.includes(val)) return;
    update("keywords", [...settings.keywords, val]);
    if (kwInputRef.current) kwInputRef.current.value = "";
    showToast("Keyword added", `"${val}" will trigger notifications.`, "green");
  };

  const removeKeyword = (idx: number) => {
    const removed = settings.keywords[idx];
    update("keywords", settings.keywords.filter((_, i) => i !== idx));
    showToast("Keyword removed", `"${removed}" removed.`, "red");
  };

  const handleKwKeydown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") addKeyword();
  };

  const save = () => {
    localStorage.setItem('codex-teams-notifications', JSON.stringify(settings));
    showToast("Settings saved", "Your notification preferences have been updated.", "green");
  };

  const reset = () => {
    setSettings(DEFAULTS);
    localStorage.setItem('codex-teams-notifications', JSON.stringify(DEFAULTS));
    showToast("Reset complete", "All settings restored to defaults.", "blue");
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="ns-wrap">
        <div className="ns-title">Notifications</div>
        <div className="ns-sub">Control when and how you're notified about activity.</div>

        {/* ── Snooze ── */}
        <div className="ns-section-label">Snooze</div>
        <div className="ns-snooze-bar">
          <div className="ns-snooze-icon">
            <BellIcon />
          </div>
          <div>
            <div className="ns-row-title">Snooze notifications</div>
            {snoozeActive && (
              <div className="ns-snooze-sub">Resumes in {snoozeRemaining}</div>
            )}
          </div>
          {snoozeActive && (
            <div className="ns-snooze-timer">{snoozeRemaining}</div>
          )}
          <button
            className={`ns-snooze-btn${snoozeActive ? " active" : ""}`}
            onClick={snoozeActive ? cancelSnooze : () => startSnooze(30)}
          >
            {snoozeActive ? "Cancel Snooze" : "Enable Snooze"}
          </button>
        </div>
        <div className="ns-quick-btns">
          <span style={{ fontSize: 12, color: "#6b7280" }}>Quick:</span>
          {SNOOZE_PRESETS.map(({ value, label }) => (
            <button
              key={value}
              className={`ns-qbtn${snoozePreset === value && snoozeActive ? " selected" : ""}`}
              onClick={() => startSnooze(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="ns-divider" />

        {/* ── General Alerts ── */}
        <div className="ns-section-label">General alerts</div>
        {(
          [
            { key: "directMessages",      label: "Direct messages",           desc: "Get notified when someone sends you a direct message" },
            { key: "mentions",            label: "Mentions & replies",         desc: "Notify when you're @mentioned or someone replies to your message" },
            { key: "workspaceInvites",    label: "Workspace invites",          desc: "Notify when you're invited to join a workspace" },
            { key: "reactions",           label: "Reactions to your messages", desc: "Get notified when someone reacts to your message" },
            { key: "systemAnnouncements", label: "System announcements",       desc: "Platform updates, maintenance windows, and outage alerts" },
          ] as { key: keyof NotificationSettings; label: string; desc: string }[]
        ).map(({ key, label, desc }) => (
          <div key={key} className="ns-row">
            <div className="ns-row-info">
              <div className="ns-row-title">{label}</div>
              <div className="ns-row-desc">{desc}</div>
            </div>
            <Toggle checked={!!settings[key]} onChange={() => toggle(key, label)} />
          </div>
        ))}

        <div className="ns-divider" />

        {/* ── Notification Tones ── */}
        <div className="ns-section-label">Notification tone</div>
        <div className="ns-row ns-row-col" style={{ gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <div className="ns-row-info">
              <div className="ns-row-title">Notification sounds</div>
              <div className="ns-row-desc">
                Click a card to select &amp; hear the tone · Press ▶ to preview only
              </div>
            </div>
            <Toggle
              checked={settings.soundEnabled}
              onChange={() => toggle("soundEnabled", "Notification sounds")}
            />
          </div>
          <div
            style={{
              opacity: settings.soundEnabled ? 1 : 0.4,
              pointerEvents: settings.soundEnabled ? "auto" : "none",
              width: "100%",
            }}
          >
            <TonePicker
              selected={settings.soundType}
              volume={settings.volume}
              onSelect={handleToneSelect}
            />
          </div>
        </div>

        {/* Volume */}
        <div className="ns-row" style={{ marginTop: 6 }}>
          <div className="ns-row-info">
            <div className="ns-row-title">Volume</div>
          </div>
          <div className="ns-vol-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" width={16} height={16}>
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            </svg>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={settings.volume}
              onChange={(e) => update("volume", Number(e.target.value))}
            />
            <svg viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" width={16} height={16}>
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
            <span style={{ fontSize: 13, color: "#9ca3af", minWidth: 36, textAlign: "right", fontVariantNumeric: 'tabular-nums' }}>
              {settings.volume}%
            </span>
          </div>
        </div>

        <div className="ns-divider" />

        {/* ── DND Schedule ── */}
        <div className="ns-section-label">Do not disturb schedule</div>
        <div className="ns-dnd-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div className="ns-row-info">
              <div className="ns-row-title">Scheduled quiet hours</div>
              <div className="ns-row-desc">
                Automatically enable Do Not Disturb during set hours
              </div>
            </div>
            <Toggle
              checked={settings.dndEnabled}
              onChange={() => {
                const next = !settings.dndEnabled;
                update("dndEnabled", next);
                showToast(
                  "Do Not Disturb",
                  next ? "Schedule enabled." : "Schedule disabled.",
                  next ? "blue" : "red"
                );
              }}
            />
          </div>
          <div
            className="ns-time-row"
            style={{
              opacity: settings.dndEnabled ? 1 : 0.4,
              pointerEvents: settings.dndEnabled ? "auto" : "none",
            }}
          >
            From
            <input
              type="time"
              value={settings.dndFrom}
              onChange={(e) => update("dndFrom", e.target.value)}
            />
            to
            <input
              type="time"
              value={settings.dndTo}
              onChange={(e) => update("dndTo", e.target.value)}
            />
            <span style={{ marginLeft: "auto", fontSize: 12, color: "#6b7280" }}>Mon – Fri</span>
          </div>
        </div>
        <div className="ns-row">
          <div className="ns-row-info">
            <div className="ns-row-title">Allow urgent messages during DND</div>
            <div className="ns-row-desc">
              Critical alerts will still come through even when quiet hours are on
            </div>
          </div>
          <Toggle
            checked={settings.urgentDuringDnd}
            onChange={() => toggle("urgentDuringDnd", "Urgent messages during DND")}
          />
        </div>

        <div className="ns-divider" />

        {/* ── Keywords ── */}
        <div className="ns-section-label">Keyword highlights</div>
        <div className="ns-row ns-row-col" style={{ gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <div className="ns-row-info">
              <div className="ns-row-title">Notify on keywords</div>
              <div className="ns-row-desc">
                Get notified when any message contains your keywords
              </div>
            </div>
            <Toggle
              checked={settings.keywordAlertsEnabled}
              onChange={() => toggle("keywordAlertsEnabled", "Keyword alerts")}
            />
          </div>
          <div
            style={{
              opacity: settings.keywordAlertsEnabled ? 1 : 0.4,
              pointerEvents: settings.keywordAlertsEnabled ? "auto" : "none",
              width: "100%",
            }}
          >
            <div className="ns-kw-tags">
              {settings.keywords.map((kw, i) => (
                <div key={kw} className="ns-ktag">
                  {kw}
                  <button className="ns-ktag-x" onClick={() => removeKeyword(i)}>
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <input
                ref={kwInputRef}
                className="ns-kw-input"
                type="text"
                placeholder="Add keyword..."
                onKeyDown={handleKwKeydown}
              />
              <button className="ns-add-btn" onClick={addKeyword}>
                + Add
              </button>
            </div>
          </div>
        </div>

        <div className="ns-divider" />

        {/* ── Email Digest ── */}
        <div className="ns-section-label">Email digest</div>
        <div className="ns-row ns-row-col" style={{ gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <div className="ns-row-info">
              <div className="ns-row-title">Email digest</div>
              <div className="ns-row-desc">
                Receive a summary of missed notifications via email
              </div>
            </div>
            <Toggle
              checked={settings.digestEnabled}
              onChange={() => {
                const next = !settings.digestEnabled;
                update("digestEnabled", next);
                showToast(
                  "Email digest",
                  next ? "Email digest enabled." : "Disabled.",
                  next ? "green" : "red"
                );
              }}
            />
          </div>
          <div
            className="ns-digest-opts"
            style={{
              opacity: settings.digestEnabled ? 1 : 0.4,
              pointerEvents: settings.digestEnabled ? "auto" : "none",
            }}
          >
            {DIGEST_OPTIONS.map(({ value, label, icon }) => (
              <div
                key={value}
                className={`ns-doption${settings.digestFrequency === value ? " selected" : ""}`}
                onClick={() => {
                  update("digestFrequency", value);
                  showToast("Digest frequency", `Set to "${label}".`, "blue");
                }}
              >
                <div className="ns-doption-icon">{icon}</div>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Save Bar ── */}
        <div className="ns-save-bar">
          <button className="ns-btn-reset" onClick={reset}>
            Reset to defaults
          </button>
          <button className="ns-btn-save" onClick={save}>
            Save changes
          </button>
        </div>
      </div>

      {/* Toast */}
      <div
        className={`ns-toast${toast.visible ? " show" : ""}`}
        style={{ borderLeftColor: TOAST_COLORS[toast.color] }}
      >
        <div className="ns-toast-title">{toast.title}</div>
        <div className="ns-toast-body">{toast.body}</div>
      </div>
    </>
  );
}
