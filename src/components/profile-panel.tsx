'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Camera, Edit3, Check, X, Bell, BellOff, Shield,
  LogOut, Trash2, ChevronRight, Moon, Sun, Monitor,
  Link2, Twitter, Github, Globe, Copy, CheckCheck,
  MessageSquare, Hash, Users, Clock, TrendingUp,
  Settings, Eye, EyeOff, Upload, Palette, Zap,
  Lock, Key, Smartphone, AlertTriangle, Star,
  Activity, Calendar, ArrowRight, Plus, Minus,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
type Status      = 'online' | 'away' | 'busy' | 'offline';
type ThemeMode   = 'dark' | 'light' | 'system';
type ActiveTab   = 'profile' | 'account' | 'notifications' | 'appearance' | 'privacy';

interface UserProfile {
  name:        string;
  displayName: string;
  username:    string;
  email:       string;
  bio:         string;
  role:        string;
  status:      Status;
  timezone:    string;
  website:     string;
  twitter:     string;
  github:      string;
  joinedDate:  string;
  avatarGradient: string;
}

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; pulse?: boolean }> = {
  online:  { label:'Online',           color:'#10b981', bg:'rgba(16,185,129,0.15)',  pulse:true  },
  away:    { label:'Away',             color:'#f59e0b', bg:'rgba(245,158,11,0.15)'              },
  busy:    { label:'Do Not Disturb',   color:'#ef4444', bg:'rgba(239,68,68,0.15)'               },
  offline: { label:'Appear Offline',   color:'#6b7280', bg:'rgba(107,114,128,0.15)'             },
};

// ── Mock activity data ─────────────────────────────────────────────────────────
const ACTIVITY_DAYS = Array.from({ length: 52 }, (_, week) =>
  Array.from({ length: 7 }, (_, day) => ({
    week, day,
    count: Math.random() > 0.35 ? Math.floor(Math.random() * 12) : 0,
  }))
).flat();

const RECENT_ACTIVITY = [
  { type:'message', text:'Sent 47 messages in #design-review',         time:'2h ago',   icon:'💬' },
  { type:'channel', text:'Joined #q4-planning channel',                time:'5h ago',   icon:'#'  },
  { type:'file',    text:'Shared sprint-14-handoff.fig in #product',   time:'Yesterday',icon:'📎' },
  { type:'mention', text:'Mentioned in #backend-infra by Priya Nair',  time:'Yesterday',icon:'@'  },
  { type:'react',   text:'Reacted to 12 messages this week',           time:'3d ago',   icon:'❤️' },
];

const STATS = [
  { label:'Messages',    val:'2,847', sub:'this month',  icon:MessageSquare, color:'#a855f7' },
  { label:'Channels',    val:'18',    sub:'active',       icon:Hash,          color:'#3b82f6' },
  { label:'Workspaces',  val:'3',     sub:'joined',       icon:Users,         color:'#10b981' },
  { label:'Days Active', val:'94',    sub:'this year',    icon:TrendingUp,    color:'#f59e0b' },
];

const GRADIENT_PRESETS = [
  'linear-gradient(135deg, #7c3aed, #3b82f6)',
  'linear-gradient(135deg, #10b981, #06b6d4)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #0ea5e9, #10b981)',
  'linear-gradient(135deg, #f97316, #eab308)',
  'linear-gradient(135deg, #6366f1, #ec4899)',
  'linear-gradient(135deg, #14b8a6, #3b82f6)',
];

const TIMEZONES = [
  'UTC-8 (Pacific)',  'UTC-5 (Eastern)',  'UTC+0 (London)',
  'UTC+1 (Paris)',    'UTC+2 (Cairo)',    'UTC+3 (Moscow)',
  'UTC+5:30 (India)', 'UTC+8 (Beijing)', 'UTC+9 (Tokyo)',
  'UTC+10 (Sydney)',
];

// ─────────────────────────────────────────────────────────────────────────────
export function ProfilePage() {
  const [activeTab, setActiveTab]   = useState<ActiveTab>('profile');
  const [profile,   setProfile]     = useState<UserProfile>({
    name:            'Nilufar Rashidova',
    displayName:     'Nilufar',
    username:        'nilufar',
    email:           'nilufar@devtalk.dev',
    bio:             'Frontend engineer obsessed with craft. Building beautiful things at the intersection of design and code. ✨',
    role:            'Frontend Engineer',
    status:          'online',
    timezone:        'UTC+5:30 (India)',
    website:         'https://nilufar.dev',
    twitter:         '@nilufardev',
    github:          'nilufar',
    joinedDate:      'March 2024',
    avatarGradient:  GRADIENT_PRESETS[0],
  });

  const [editing,    setEditing]    = useState(false);
  const [draft,      setDraft]      = useState<UserProfile>(profile);
  const [copied,     setCopied]     = useState(false);
  const [showGrad,   setShowGrad]   = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [theme,      setTheme]      = useState<ThemeMode>('dark');
  const [showEmail,  setShowEmail]  = useState(false);
  const [twoFA,      setTwoFA]      = useState(false);
  const [showPass,   setShowPass]   = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Notification prefs ───────────────────────────────────────────────────────
  const [notifs, setNotifs] = useState({
    mentions:    true,  threads:    true,  reactions:  false,
    dms:         true,  keywords:   true,  sounds:     true,
    desktop:     true,  mobile:     false, email:      false,
  });

  // ── Privacy prefs ────────────────────────────────────────────────────────────
  const [privacy, setPrivacy] = useState({
    showStatus:    true,  showEmail:    false, showActivity: true,
    searchable:    true,  readReceipts: true,  typingIndicator: true,
  });

  // ── Appearance prefs ─────────────────────────────────────────────────────────
  const [appearance, setAppearance] = useState({
    compactMode: false, animations: true, fontSize: 'normal',
    sidebarDense: false, messageGrouping: true,
  });

  function saveProfile() {
    setProfile(draft);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function copyUsername() {
    navigator.clipboard?.writeText('@' + profile.username);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function getActivityColor(count: number) {
    if (count === 0) return '#1e2026';
    if (count < 3)  return '#4c1d95';
    if (count < 6)  return '#6d28d9';
    if (count < 9)  return '#7c3aed';
    return '#a855f7';
  }

  const TABS: { key: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { key:'profile',       label:'Profile',       icon:<Edit3 size={14}/>       },
    { key:'account',       label:'Account',       icon:<Shield size={14}/>      },
    { key:'notifications', label:'Notifications', icon:<Bell size={14}/>        },
    { key:'appearance',    label:'Appearance',    icon:<Palette size={14}/>     },
    { key:'privacy',       label:'Privacy',       icon:<Lock size={14}/>        },
  ];

  return (
    <div className="flex h-full bg-[#111214] text-[#e8eaf0] overflow-hidden">

      {/* ── Left panel ── */}
      <div className="w-[260px] shrink-0 border-r border-[#2a2c33] flex flex-col bg-[#0e0f11]">

        {/* Avatar + identity */}
        <div className="px-5 pt-7 pb-5 border-b border-[#2a2c33]">
          {/* Avatar */}
          <div className="relative w-fit mb-4">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-2xl"
              style={{ background: profile.avatarGradient }}
            >
              {/* Abstract geometric pattern — no letter */}
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="10" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/>
                <circle cx="20" cy="20" r="16" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
                <line x1="20" y1="4" x2="20" y2="36" stroke="rgba(255,255,255,0.35)" strokeWidth="1"/>
                <line x1="4" y1="20" x2="36" y2="20" stroke="rgba(255,255,255,0.35)" strokeWidth="1"/>
                <circle cx="20" cy="20" r="3" fill="rgba(255,255,255,0.85)"/>
                <circle cx="20" cy="10" r="2" fill="rgba(255,255,255,0.5)"/>
                <circle cx="20" cy="30" r="2" fill="rgba(255,255,255,0.5)"/>
                <circle cx="10" cy="20" r="2" fill="rgba(255,255,255,0.5)"/>
                <circle cx="30" cy="20" r="2" fill="rgba(255,255,255,0.5)"/>
              </svg>
            </div>
            {/* Status dot */}
            <div
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#0e0f11] flex items-center justify-center"
              style={{ background: STATUS_CONFIG[profile.status].color }}>
              {profile.status === 'busy' && <Minus size={9} className="text-white" strokeWidth={3}/>}
            </div>
            {/* Edit avatar overlay */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/0 hover:bg-black/50 rounded-2xl flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-200">
              <Camera size={18} className="text-white"/>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => { /* handle avatar upload */ }}/>
          </div>

          {/* Name + username */}
          <p className="text-[15px] font-bold leading-tight">{profile.displayName || profile.name}</p>
          <p className="font-mono text-[11px] text-[#6b7280] mt-0.5">@{profile.username}</p>

          {/* Copy username */}
          <button onClick={copyUsername}
            className="flex items-center gap-1.5 mt-2 font-mono text-[10px] text-[#6b7280] hover:text-[#a855f7] transition-colors">
            {copied ? <CheckCheck size={11} className="text-[#10b981]"/> : <Copy size={11}/>}
            {copied ? 'Copied!' : 'Copy handle'}
          </button>

          {/* Status selector */}
          <div className="mt-3">
            <p className="font-mono text-[9px] uppercase tracking-widest text-[#6b7280] mb-1.5">Status</p>
            <div className="grid grid-cols-2 gap-1">
              {(Object.entries(STATUS_CONFIG) as [Status, typeof STATUS_CONFIG[Status]][]).map(([key, cfg]) => (
                <button key={key} onClick={() => setProfile(p => ({ ...p, status: key }))}
                  className={[
                    'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all',
                    profile.status === key
                      ? 'text-white'
                      : 'text-[#6b7280] hover:bg-[#18191d] hover:text-[#e8eaf0]',
                  ].join(' ')}
                  style={profile.status === key ? { background: cfg.bg, color: cfg.color } : {}}>
                  <div className={['w-2 h-2 rounded-full shrink-0', cfg.pulse ? 'animate-pulse' : ''].join(' ')}
                    style={{ background: cfg.color }}/>
                  <span className="text-[10.5px] truncate">{cfg.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 py-4 border-b border-[#2a2c33]">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#6b7280] mb-3">Your Stats</p>
          <div className="space-y-2.5">
            {STATS.map(({ label, val, sub, icon: Icon, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: color + '18' }}>
                  <Icon size={13} style={{ color }}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold">{val}</p>
                  <p className="font-mono text-[9.5px] text-[#6b7280]">{label} · {sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nav tabs */}
        <div className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={[
                'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all text-left',
                activeTab === tab.key
                  ? 'bg-[rgba(124,58,237,0.15)] text-[#c084fc]'
                  : 'text-[#6b7280] hover:bg-[#18191d] hover:text-[#e8eaf0]',
              ].join(' ')}>
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sign out */}
        <div className="px-3 py-3 border-t border-[#2a2c33]">
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-[#6b7280] hover:bg-[rgba(239,68,68,0.1)] hover:text-[#ef4444] transition-all text-left">
            <LogOut size={14}/>
            Sign out
          </button>
        </div>
      </div>

      {/* ── Main panel ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ════ PROFILE TAB ════ */}
        {activeTab === 'profile' && (
          <div className="max-w-[680px] mx-auto px-8 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-7">
              <div>
                <h2 className="text-[20px] font-bold tracking-tight">Profile</h2>
                <p className="font-mono text-[11.5px] text-[#6b7280] mt-0.5">How others see you across DevTalk</p>
              </div>
              <div className="flex items-center gap-2">
                {saved && (
                  <span className="flex items-center gap-1.5 font-mono text-[11px] text-[#10b981] px-3 py-1.5 bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.25)] rounded-lg"
                    style={{ animation:'fadeIn 0.2s ease' }}>
                    <Check size={11}/> Saved!
                  </span>
                )}
                {editing
                  ? <>
                      <button onClick={() => { setDraft(profile); setEditing(false); }}
                        className="flex items-center gap-1.5 bg-[#1e2026] border border-[#2a2c33] text-[#6b7280] hover:text-[#e8eaf0] text-[12.5px] font-semibold px-4 py-2 rounded-xl transition-all">
                        <X size={13}/> Cancel
                      </button>
                      <button onClick={saveProfile}
                        className="flex items-center gap-1.5 bg-[#7c3aed] hover:bg-[#a855f7] text-white text-[12.5px] font-semibold px-4 py-2 rounded-xl transition-all">
                        <Check size={13}/> Save changes
                      </button>
                    </>
                  : <button onClick={() => { setDraft(profile); setEditing(true); }}
                      className="flex items-center gap-1.5 bg-[#1e2026] border border-[#2a2c33] hover:border-[#7c3aed] text-[#e8eaf0] text-[12.5px] font-semibold px-4 py-2 rounded-xl transition-all">
                      <Edit3 size={13}/> Edit profile
                    </button>
                }
              </div>
            </div>

            {/* Avatar section */}
            <div className="bg-[#18191d] border border-[#2a2c33] rounded-2xl p-5 mb-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280] mb-4">Avatar</p>
              <div className="flex items-center gap-5">
                {/* Preview */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl"
                    style={{ background: editing ? draft.avatarGradient : profile.avatarGradient }}>
                    <svg width="38" height="38" viewBox="0 0 40 40" fill="none">
                      <circle cx="20" cy="20" r="10" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/>
                      <circle cx="20" cy="20" r="16" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
                      <line x1="20" y1="4" x2="20" y2="36" stroke="rgba(255,255,255,0.35)" strokeWidth="1"/>
                      <line x1="4" y1="20" x2="36" y2="20" stroke="rgba(255,255,255,0.35)" strokeWidth="1"/>
                      <circle cx="20" cy="20" r="3" fill="rgba(255,255,255,0.85)"/>
                      <circle cx="20" cy="10" r="2" fill="rgba(255,255,255,0.5)"/>
                      <circle cx="20" cy="30" r="2" fill="rgba(255,255,255,0.5)"/>
                      <circle cx="10" cy="20" r="2" fill="rgba(255,255,255,0.5)"/>
                      <circle cx="30" cy="20" r="2" fill="rgba(255,255,255,0.5)"/>
                    </svg>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#18191d]"
                    style={{ background: STATUS_CONFIG[profile.status].color }}/>
                </div>

                <div className="flex-1">
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 bg-[#7c3aed] hover:bg-[#a855f7] text-white text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all">
                      <Upload size={12}/> Upload photo
                    </button>
                    <button className="flex items-center gap-1.5 bg-[#1e2026] border border-[#2a2c33] text-[#6b7280] hover:text-[#e8eaf0] text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all">
                      <Trash2 size={12}/> Remove
                    </button>
                  </div>
                  <p className="font-mono text-[10.5px] text-[#6b7280]">JPG, PNG or GIF · Max 4MB</p>
                </div>
              </div>

              {/* Gradient picker */}
              <div className="mt-4 pt-4 border-t border-[#2a2c33]">
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280] mb-3">Avatar gradient</p>
                <div className="flex gap-2 flex-wrap">
                  {GRADIENT_PRESETS.map((g, i) => (
                    <button key={i} onClick={() => editing && setDraft(p => ({ ...p, avatarGradient:g }))}
                      className={[
                        'w-8 h-8 rounded-lg transition-all',
                        (editing ? draft : profile).avatarGradient === g ? 'ring-2 ring-[#7c3aed] ring-offset-1 ring-offset-[#18191d] scale-110' : 'hover:scale-105',
                      ].join(' ')}
                      style={{ background: g }}/>
                  ))}
                </div>
              </div>
            </div>

            {/* Info fields */}
            <div className="bg-[#18191d] border border-[#2a2c33] rounded-2xl p-5 mb-4 space-y-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280]">Personal info</p>

              {[
                { label:'Display name',  key:'displayName',  ph:'How you appear to others'  },
                { label:'Full name',     key:'name',         ph:'Your legal name'            },
                { label:'Username',      key:'username',     ph:'your-handle',               prefix:'@' },
                { label:'Role / Title',  key:'role',         ph:'e.g. Frontend Engineer'    },
              ].map(({ label, key, ph, prefix }) => (
                <div key={key}>
                  <label className="block font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#6b7280] mb-1.5">{label}</label>
                  <div className="flex items-center gap-0">
                    {prefix && <span className="font-mono text-[13px] text-[#6b7280] bg-[#111214] border border-r-0 border-[#2a2c33] rounded-l-lg px-3 h-[38px] flex items-center">{prefix}</span>}
                    <input
                      type="text"
                      value={(editing ? draft : profile)[key as keyof UserProfile]}
                      onChange={e => editing && setDraft(p => ({ ...p, [key]:e.target.value }))}
                      readOnly={!editing}
                      placeholder={ph}
                      className={[
                        'flex-1 bg-[#111214] border border-[#2a2c33] text-[#e8eaf0] font-mono text-[13px] px-3 outline-none transition-colors h-[38px]',
                        prefix ? 'rounded-r-lg' : 'rounded-lg',
                        editing ? 'focus:border-[#7c3aed] cursor-text' : 'cursor-default text-[#9ca3af]',
                      ].join(' ')}
                    />
                  </div>
                </div>
              ))}

              {/* Bio */}
              <div>
                <label className="block font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#6b7280] mb-1.5">Bio</label>
                <textarea
                  value={editing ? draft.bio : profile.bio}
                  onChange={e => editing && setDraft(p => ({ ...p, bio:e.target.value }))}
                  readOnly={!editing}
                  rows={3}
                  placeholder="Tell your team about yourself..."
                  className={[
                    'w-full bg-[#111214] border border-[#2a2c33] text-[#e8eaf0] font-mono text-[13px] px-3 py-2.5 rounded-lg outline-none resize-none transition-colors',
                    editing ? 'focus:border-[#7c3aed] cursor-text' : 'cursor-default text-[#9ca3af]',
                  ].join(' ')}
                />
                {editing && <p className="font-mono text-[10px] text-[#33363f] mt-1 text-right">{draft.bio.length}/200</p>}
              </div>

              {/* Timezone */}
              <div>
                <label className="block font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#6b7280] mb-1.5">Timezone</label>
                <select
                  value={editing ? draft.timezone : profile.timezone}
                  onChange={e => editing && setDraft(p => ({ ...p, timezone:e.target.value }))}
                  disabled={!editing}
                  className={[
                    'w-full bg-[#111214] border border-[#2a2c33] text-[#e8eaf0] font-mono text-[13px] px-3 h-[38px] rounded-lg outline-none transition-colors',
                    editing ? 'focus:border-[#7c3aed] cursor-pointer' : 'cursor-default text-[#9ca3af]',
                  ].join(' ')}>
                  {TIMEZONES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Social links */}
            <div className="bg-[#18191d] border border-[#2a2c33] rounded-2xl p-5 mb-4 space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280]">Links</p>
              {[
                { label:'Website', key:'website', icon:<Globe size={14} className="text-[#6b7280]"/>,   prefix:'https://' },
                { label:'Twitter', key:'twitter', icon:<Twitter size={14} className="text-[#1da1f2]"/>, prefix:'@'        },
                { label:'GitHub',  key:'github',  icon:<Github size={14} className="text-[#6b7280]"/>,  prefix:'github.com/'},
              ].map(({ label, key, icon, prefix }) => (
                <div key={key}>
                  <label className="block font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#6b7280] mb-1.5">{label}</label>
                  <div className="flex items-center border border-[#2a2c33] rounded-lg overflow-hidden bg-[#111214] focus-within:border-[#7c3aed] transition-colors">
                    <span className="flex items-center gap-2 px-3 h-[38px] border-r border-[#2a2c33] bg-[#18191d] shrink-0">
                      {icon}
                      <span className="font-mono text-[11px] text-[#6b7280]">{prefix}</span>
                    </span>
                    <input type="text"
                      value={(editing ? draft : profile)[key as keyof UserProfile].replace(prefix,'')}
                      onChange={e => editing && setDraft(p => ({ ...p, [key]: prefix+e.target.value }))}
                      readOnly={!editing}
                      placeholder={label.toLowerCase() + ' handle'}
                      className="flex-1 bg-transparent border-none outline-none font-mono text-[13px] text-[#e8eaf0] px-3 h-[38px] placeholder-[#33363f]"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Activity heatmap */}
            <div className="bg-[#18191d] border border-[#2a2c33] rounded-2xl p-5 mb-4">
              <div className="flex items-center justify-between mb-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280]">Activity this year</p>
                <span className="font-mono text-[10px] text-[#6b7280]">
                  {ACTIVITY_DAYS.filter(d => d.count > 0).length} active days
                </span>
              </div>
              {/* Heatmap grid */}
              <div className="flex gap-[3px] overflow-x-auto pb-1">
                {Array.from({ length:52 }, (_, w) => (
                  <div key={w} className="flex flex-col gap-[3px]">
                    {Array.from({ length:7 }, (_, d) => {
                      const cell = ACTIVITY_DAYS.find(a => a.week===w && a.day===d);
                      return (
                        <div key={d}
                          className="w-2.5 h-2.5 rounded-[2px] transition-all hover:ring-1 hover:ring-[#7c3aed] cursor-pointer"
                          style={{ background: getActivityColor(cell?.count ?? 0) }}
                          title={cell ? (cell.count + ' messages') : '0 messages'}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5 mt-3">
                <span className="font-mono text-[9.5px] text-[#33363f]">Less</span>
                {[0,3,6,9,12].map(n => (
                  <div key={n} className="w-2.5 h-2.5 rounded-[2px]" style={{ background: getActivityColor(n) }}/>
                ))}
                <span className="font-mono text-[9.5px] text-[#33363f]">More</span>
              </div>
            </div>

            {/* Recent activity */}
            <div className="bg-[#18191d] border border-[#2a2c33] rounded-2xl p-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280] mb-4">Recent activity</p>
              <div className="space-y-3">
                {RECENT_ACTIVITY.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-[#1e2026] last:border-0">
                    <div className="w-8 h-8 rounded-lg bg-[#1e2026] flex items-center justify-center text-[15px] shrink-0">
                      {a.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] truncate">{a.text}</p>
                    </div>
                    <span className="font-mono text-[10.5px] text-[#6b7280] shrink-0">{a.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════ ACCOUNT TAB ════ */}
        {activeTab === 'account' && (
          <div className="max-w-[620px] mx-auto px-8 py-8">
            <h2 className="text-[20px] font-bold tracking-tight mb-1">Account</h2>
            <p className="font-mono text-[11.5px] text-[#6b7280] mb-7">Manage your login credentials and security</p>

            {/* Email */}
            <Section title="Email address">
              <div className="flex items-center gap-3">
                <div className="flex-1 font-mono text-[13px] text-[#e8eaf0] bg-[#111214] border border-[#2a2c33] rounded-lg px-3 h-[38px] flex items-center">
                  {showEmail ? profile.email : profile.email.replace(/(.{2}).+(@.+)/, '$1•••$2')}
                </div>
                <button onClick={() => setShowEmail(v => !v)}
                  className="w-9 h-9 bg-[#1e2026] border border-[#2a2c33] rounded-lg flex items-center justify-center text-[#6b7280] hover:text-[#e8eaf0] transition-colors">
                  {showEmail ? <EyeOff size={14}/> : <Eye size={14}/>}
                </button>
                <button className="flex items-center gap-1.5 bg-[#7c3aed] hover:bg-[#a855f7] text-white text-[12px] font-semibold px-3 h-9 rounded-lg transition-all">
                  Change
                </button>
              </div>
            </Section>

            {/* Password */}
            <Section title="Password">
              <div className="space-y-2.5">
                {['Current password', 'New password', 'Confirm new password'].map(label => (
                  <div key={label} className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder={label}
                      className="w-full bg-[#111214] border border-[#2a2c33] focus:border-[#7c3aed] text-[#e8eaf0] font-mono text-[13px] px-3 h-[38px] rounded-lg outline-none transition-colors placeholder-[#33363f]"/>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Toggle value={showPass} onChange={setShowPass}/>
                    <span className="font-mono text-[11px] text-[#6b7280]">Show passwords</span>
                  </label>
                  <button className="flex items-center gap-1.5 bg-[#7c3aed] hover:bg-[#a855f7] text-white text-[12.5px] font-semibold px-4 py-2 rounded-lg transition-all">
                    Update password
                  </button>
                </div>
              </div>
            </Section>

            {/* 2FA */}
            <Section title="Two-factor authentication">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-semibold">{twoFA ? '2FA is enabled' : '2FA is disabled'}</p>
                  <p className="font-mono text-[11px] text-[#6b7280] mt-0.5">
                    {twoFA ? 'Your account is protected with an authenticator app.' : 'Add an extra layer of security to your account.'}
                  </p>
                </div>
                <button onClick={() => setTwoFA(v => !v)}
                  className={[
                    'flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-lg transition-all',
                    twoFA
                      ? 'bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)] text-[#ef4444] hover:bg-[rgba(239,68,68,0.18)]'
                      : 'bg-[#7c3aed] hover:bg-[#a855f7] text-white',
                  ].join(' ')}>
                  {twoFA ? <><Shield size={13}/> Disable</> : <><Shield size={13}/> Enable 2FA</>}
                </button>
              </div>
              {twoFA && (
                <div className="mt-3 p-3 bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.2)] rounded-xl flex items-center gap-2.5">
                  <Check size={14} className="text-[#10b981] shrink-0"/>
                  <p className="font-mono text-[11px] text-[#10b981]">Authenticator app connected · Last used 2h ago</p>
                </div>
              )}
            </Section>

            {/* Sessions */}
            <Section title="Active sessions">
              {[
                { device:'Chrome on macOS',       loc:'Mumbai, IN',      time:'Now',      current:true  },
                { device:'DevTalk Mobile (iOS)',   loc:'Mumbai, IN',      time:'2h ago',   current:false },
                { device:'Firefox on Windows',     loc:'Bengaluru, IN',   time:'3d ago',   current:false },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-[#1e2026] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#1e2026] flex items-center justify-center text-[15px]">
                      {s.device.includes('Mobile') ? '📱' : '💻'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-semibold">{s.device}</p>
                        {s.current && (
                          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[rgba(16,185,129,0.12)] text-[#10b981] border border-[rgba(16,185,129,0.25)]">current</span>
                        )}
                      </div>
                      <p className="font-mono text-[10.5px] text-[#6b7280]">{s.loc} · {s.time}</p>
                    </div>
                  </div>
                  {!s.current && (
                    <button className="font-mono text-[11px] text-[#ef4444] hover:text-red-400 transition-colors">Revoke</button>
                  )}
                </div>
              ))}
              <button className="mt-3 w-full font-mono text-[11.5px] text-[#ef4444] hover:text-red-400 transition-colors text-center">
                Sign out all other sessions
              </button>
            </Section>

            {/* Danger zone */}
            <div className="mt-4 bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.2)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={15} className="text-[#ef4444]"/>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#ef4444]">Danger zone</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-semibold">Delete account</p>
                  <p className="font-mono text-[11px] text-[#6b7280] mt-0.5">Permanently delete your account and all data.</p>
                </div>
                <button className="flex items-center gap-1.5 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[#ef4444] text-[12.5px] font-semibold px-4 py-2 rounded-lg hover:bg-[rgba(239,68,68,0.18)] transition-all">
                  <Trash2 size={13}/> Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════ NOTIFICATIONS TAB ════ */}
        {activeTab === 'notifications' && (
          <div className="max-w-[620px] mx-auto px-8 py-8">
            <h2 className="text-[20px] font-bold tracking-tight mb-1">Notifications</h2>
            <p className="font-mono text-[11.5px] text-[#6b7280] mb-7">Choose what you get notified about and how</p>

            <Section title="Notify me about">
              {[
                { key:'mentions',  label:'Direct mentions',        desc:'When someone @mentions you in a channel' },
                { key:'threads',   label:'Thread replies',         desc:'Replies in threads you participate in'   },
                { key:'reactions', label:'Reactions',              desc:'When someone reacts to your messages'    },
                { key:'dms',       label:'Direct messages',        desc:'All new direct messages'                 },
                { key:'keywords',  label:'Keyword alerts',         desc:'Messages containing your tracked words'  },
              ].map(({ key, label, desc }) => (
                <NotifRow key={key} label={label} desc={desc}
                  value={notifs[key as keyof typeof notifs]}
                  onChange={v => setNotifs(p => ({ ...p, [key]:v }))}/>
              ))}
            </Section>

            <Section title="How to notify me">
              {[
                { key:'sounds',   label:'Notification sounds',  desc:'Play a sound for new notifications' },
                { key:'desktop',  label:'Desktop alerts',       desc:'Show system notification banners'   },
                { key:'mobile',   label:'Mobile push',          desc:'Push notifications to your phone'   },
                { key:'email',    label:'Email digest',         desc:'Weekly email summary of activity'   },
              ].map(({ key, label, desc }) => (
                <NotifRow key={key} label={label} desc={desc}
                  value={notifs[key as keyof typeof notifs]}
                  onChange={v => setNotifs(p => ({ ...p, [key]:v }))}/>
              ))}
            </Section>

            <Section title="Do Not Disturb schedule">
              <div className="flex items-center gap-3">
                <div className="flex-1 font-mono text-[12px] text-[#9ca3af]">
                  Automatically mute from
                </div>
                <input type="time" defaultValue="22:00"
                  className="bg-[#111214] border border-[#2a2c33] focus:border-[#7c3aed] text-[#e8eaf0] font-mono text-[12px] px-3 h-9 rounded-lg outline-none transition-colors"/>
                <span className="font-mono text-[12px] text-[#6b7280]">to</span>
                <input type="time" defaultValue="08:00"
                  className="bg-[#111214] border border-[#2a2c33] focus:border-[#7c3aed] text-[#e8eaf0] font-mono text-[12px] px-3 h-9 rounded-lg outline-none transition-colors"/>
              </div>
            </Section>
          </div>
        )}

        {/* ════ APPEARANCE TAB ════ */}
        {activeTab === 'appearance' && (
          <div className="max-w-[620px] mx-auto px-8 py-8">
            <h2 className="text-[20px] font-bold tracking-tight mb-1">Appearance</h2>
            <p className="font-mono text-[11.5px] text-[#6b7280] mb-7">Customise how DevTalk looks and feels</p>

            <Section title="Theme">
              <div className="grid grid-cols-3 gap-3">
                {([
                  { key:'dark',   label:'Dark',   icon:<Moon size={16}/> },
                  { key:'light',  label:'Light',  icon:<Sun size={16}/>  },
                  { key:'system', label:'System', icon:<Monitor size={16}/> },
                ] as const).map(({ key, label, icon }) => (
                  <button key={key} onClick={() => setTheme(key)}
                    className={[
                      'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all',
                      theme === key
                        ? 'border-[#7c3aed] bg-[rgba(124,58,237,0.12)] text-[#c084fc]'
                        : 'border-[#2a2c33] bg-[#18191d] text-[#6b7280] hover:border-[#33363f] hover:text-[#e8eaf0]',
                    ].join(' ')}>
                    {icon}
                    <span className="font-mono text-[11px]">{label}</span>
                    {theme === key && <div className="w-1.5 h-1.5 rounded-full bg-[#7c3aed]"/>}
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Interface density">
              <div className="space-y-3">
                {[
                  { key:'compactMode',    label:'Compact message list',  desc:'Reduce spacing between messages'         },
                  { key:'sidebarDense',   label:'Dense sidebar',          desc:'Show more channels with smaller spacing' },
                  { key:'messageGrouping',label:'Group messages',          desc:'Combine consecutive messages from same sender' },
                  { key:'animations',     label:'Animations',              desc:'Enable transitions and micro-animations' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-[13px] font-semibold">{label}</p>
                      <p className="font-mono text-[11px] text-[#6b7280]">{desc}</p>
                    </div>
                    <Toggle
                      value={appearance[key as keyof typeof appearance] as boolean}
                      onChange={v => setAppearance(p => ({ ...p, [key]:v }))}/>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Font size">
              <div className="grid grid-cols-3 gap-2">
                {['small','normal','large'].map(size => (
                  <button key={size} onClick={() => setAppearance(p => ({ ...p, fontSize:size }))}
                    className={[
                      'py-2.5 rounded-lg border font-mono transition-all capitalize',
                      appearance.fontSize === size
                        ? 'border-[#7c3aed] bg-[rgba(124,58,237,0.12)] text-[#c084fc]'
                        : 'border-[#2a2c33] bg-[#18191d] text-[#6b7280] hover:border-[#33363f]',
                      size === 'small' ? 'text-[11px]' : size === 'large' ? 'text-[15px]' : 'text-[13px]',
                    ].join(' ')}>
                    {size === 'small' ? 'Aa' : size === 'normal' ? 'Aa' : 'Aa'} {size}
                  </button>
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* ════ PRIVACY TAB ════ */}
        {activeTab === 'privacy' && (
          <div className="max-w-[620px] mx-auto px-8 py-8">
            <h2 className="text-[20px] font-bold tracking-tight mb-1">Privacy</h2>
            <p className="font-mono text-[11.5px] text-[#6b7280] mb-7">Control what others can see about you</p>

            <Section title="Visibility">
              {[
                { key:'showStatus',   label:'Show my online status', desc:'Others can see if you are online, away, or offline' },
                { key:'showEmail',    label:'Show email address',    desc:'Your email is visible to workspace members'          },
                { key:'showActivity', label:'Show activity feed',    desc:'Others can see your recent messages and reactions'   },
                { key:'searchable',   label:'Searchable by email',   desc:'People can find you by searching your email'        },
              ].map(({ key, label, desc }) => (
                <NotifRow key={key} label={label} desc={desc}
                  value={privacy[key as keyof typeof privacy]}
                  onChange={v => setPrivacy(p => ({ ...p, [key]:v }))}/>
              ))}
            </Section>

            <Section title="Messaging">
              {[
                { key:'readReceipts',     label:'Send read receipts',    desc:'Others see when you have read their messages'  },
                { key:'typingIndicator',  label:'Show typing indicator', desc:'Others see when you are composing a message'  },
              ].map(({ key, label, desc }) => (
                <NotifRow key={key} label={label} desc={desc}
                  value={privacy[key as keyof typeof privacy]}
                  onChange={v => setPrivacy(p => ({ ...p, [key]:v }))}/>
              ))}
            </Section>

            <Section title="Data & usage">
              <div className="space-y-2.5">
                <button className="w-full flex items-center justify-between px-4 py-3 bg-[#111214] border border-[#2a2c33] rounded-xl hover:border-[#33363f] transition-all">
                  <div className="flex items-center gap-3">
                    <Download size={14} className="text-[#6b7280]"/>
                    <div className="text-left">
                      <p className="text-[13px] font-semibold">Download my data</p>
                      <p className="font-mono text-[10.5px] text-[#6b7280]">Export all your messages and files</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-[#6b7280]"/>
                </button>
                <button className="w-full flex items-center justify-between px-4 py-3 bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.18)] rounded-xl hover:bg-[rgba(239,68,68,0.1)] transition-all">
                  <div className="flex items-center gap-3">
                    <Trash2 size={14} className="text-[#ef4444]"/>
                    <div className="text-left">
                      <p className="text-[13px] font-semibold text-[#ef4444]">Delete all my messages</p>
                      <p className="font-mono text-[10.5px] text-[#6b7280]">Permanently remove all messages you have sent</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-[#6b7280]"/>
                </button>
              </div>
            </Section>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

// ── Helper: Section wrapper ────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#18191d] border border-[#2a2c33] rounded-2xl p-5 mb-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280] mb-4">{title}</p>
      {children}
    </div>
  );
}

// ── Helper: Toggle switch ─────────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className={[
        'relative w-9 h-5 rounded-full transition-all duration-200 shrink-0',
        value ? 'bg-[#7c3aed]' : 'bg-[#2a2c33]',
      ].join(' ')}>
      <div className={[
        'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200',
        value ? 'left-[18px]' : 'left-0.5',
      ].join(' ')}/>
    </button>
  );
}

// ── Helper: Notification row ──────────────────────────────────────────────────
function NotifRow({ label, desc, value, onChange }: {
  label: string; desc: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#1e2026] last:border-0">
      <div>
        <p className="text-[13px] font-semibold">{label}</p>
        <p className="font-mono text-[10.5px] text-[#6b7280] mt-0.5">{desc}</p>
      </div>
      <Toggle value={value} onChange={onChange}/>
    </div>
  );
}

// ── Missing icon stub ─────────────────────────────────────────────────────────
function Download({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}
      fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}

export default ProfilePage;
