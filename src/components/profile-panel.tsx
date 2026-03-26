'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera, Edit3, Check, X, Bell, Shield,
  LogOut, Trash2, ChevronRight, Moon, Sun, Monitor,
  Twitter, Github, Globe, Copy, CheckCheck,
  MessageSquare, Hash, Users, TrendingUp,
  Eye, EyeOff, Upload, Palette,
  Lock, AlertTriangle, Minus, QrCode, Loader2, Download,
} from 'lucide-react';
import { useAuth } from '@/database';
import { useRouter } from 'next/navigation';

type Status    = 'online' | 'away' | 'busy' | 'offline';
type ThemeMode = 'dark' | 'light' | 'system';
type ActiveTab = 'profile' | 'account' | 'notifications' | 'appearance' | 'privacy';

interface UserProfile {
  name: string; displayName: string; username: string; email: string;
  bio: string; role: string; status: Status; timezone: string;
  website: string; twitter: string; github: string; joinedDate: string;
  avatarGradient: string;
}

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; pulse?: boolean }> = {
  online:  { label:'Online',         color:'#10b981', bg:'rgba(16,185,129,0.15)', pulse:true },
  away:    { label:'Away',           color:'#f59e0b', bg:'rgba(245,158,11,0.15)'             },
  busy:    { label:'Do Not Disturb', color:'#ef4444', bg:'rgba(239,68,68,0.15)'              },
  offline: { label:'Appear Offline', color:'#6b7280', bg:'rgba(107,114,128,0.15)'            },
};

// Removed mock constants: ACTIVITY_DAYS, RECENT_ACTIVITY, STATS

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
  'UTC-8 (Pacific)', 'UTC-5 (Eastern)', 'UTC+0 (London)',
  'UTC+1 (Paris)',   'UTC+2 (Cairo)',    'UTC+3 (Moscow)',
  'UTC+5:30 (India)','UTC+8 (Beijing)', 'UTC+9 (Tokyo)', 'UTC+10 (Sydney)',
];

/* ─────────────────────────────────────────────────────────────────────────────
   ID CARD
───────────────────────────────────────────────────────────────────────────── */
function IDCard({ profile }: { profile: UserProfile }) {
  const initials = (profile.displayName || profile.name)
    .split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{
      width: 220,
      background: 'linear-gradient(160deg, #0f1923 0%, #0a1520 60%, #0d1e2e 100%)',
      borderRadius: 18,
      overflow: 'hidden',
      boxShadow: '0 24px 56px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.06)',
      position: 'relative',
      flexShrink: 0,
    }}>
      {/* Lanyard notch */}
      <div style={{ display:'flex', justifyContent:'center', paddingTop:14, paddingBottom:6, position:'relative', zIndex:2 }}>
        <div style={{
          width:44, height:9, background:'rgba(255,255,255,0.07)',
          borderRadius:999, border:'1px solid rgba(255,255,255,0.1)',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <div style={{ width:16, height:5, background:'rgba(0,0,0,0.5)', borderRadius:999, border:'1px solid rgba(255,255,255,0.08)' }} />
        </div>
      </div>

      {/* Wave pattern */}
      <div style={{ position:'absolute', inset:0, overflow:'hidden', zIndex:0, pointerEvents:'none' }}>
        <svg width="100%" height="100%" viewBox="0 0 220 360" preserveAspectRatio="xMidYMid slice" style={{ opacity:0.18 }}>
          {Array.from({ length:20 }, (_, i) => (
            <path key={i}
              d={`M-20 ${38 + i*18} Q55 ${28 + i*18} 110 ${38 + i*18} T240 ${38 + i*18}`}
              fill="none" stroke="rgba(99,179,237,0.7)" strokeWidth="1.1"
            />
          ))}
        </svg>
        {/* Purple glow */}
        <div style={{
          position:'absolute', top:'35%', left:'50%', transform:'translate(-50%,-50%)',
          width:160, height:160,
          background:'radial-gradient(circle, rgba(124,58,237,0.28) 0%, transparent 70%)',
          borderRadius:'50%',
        }} />
      </div>

      {/* Content */}
      <div style={{ position:'relative', zIndex:1, padding:'4px 20px 24px', display:'flex', flexDirection:'column', alignItems:'center' }}>

        {/* Org logo */}
        <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:16 }}>
          <div style={{ width:18, height:18, background:'#00d4b4', borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ color:'#020d0f', fontWeight:900, fontSize:10 }}>D</span>
          </div>
          <span style={{ color:'rgba(255,255,255,0.45)', fontSize:9, fontWeight:600, letterSpacing:'0.18em', fontFamily:'monospace' }}>DEVTALK</span>
        </div>

        {/* Avatar circle */}
        <div style={{
          width:76, height:76, borderRadius:'50%',
          background: profile.avatarGradient,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:26, fontWeight:800, color:'white',
          fontFamily:'system-ui, sans-serif',
          boxShadow:'0 8px 28px rgba(0,0,0,0.45), 0 0 0 3px rgba(255,255,255,0.08)',
          marginBottom:12, position:'relative',
          letterSpacing:'-0.5px',
        }}>
          {initials}
          {/* Status dot */}
          <div style={{
            position:'absolute', bottom:3, right:3,
            width:14, height:14, borderRadius:'50%',
            background: STATUS_CONFIG[profile.status].color,
            border:'2.5px solid #0f1923',
            boxShadow:`0 0 8px ${STATUS_CONFIG[profile.status].color}80`,
          }} />
        </div>

        {/* Name */}
        <p style={{ color:'white', fontWeight:700, fontSize:15, marginBottom:2, textAlign:'center', fontFamily:'system-ui, sans-serif', letterSpacing:'-0.2px' }}>
          {profile.displayName || profile.name}
        </p>

        {/* Role */}
        <p style={{ color:'rgba(255,255,255,0.4)', fontSize:10, marginBottom:3, textAlign:'center', fontFamily:'monospace' }}>
          {profile.role}
        </p>

        {/* Username */}
        <p style={{ color:'#00d4b4', fontSize:9.5, fontFamily:'monospace', marginBottom:16, opacity:0.85 }}>
          @{profile.username}
        </p>

        {/* Divider */}
        <div style={{ width:'100%', height:1, background:'rgba(255,255,255,0.07)', marginBottom:14 }} />

        {/* Info row */}
        <div style={{ width:'100%', display:'flex', justifyContent:'space-between', marginBottom:16 }}>
          {[
            { label:'JOINED',   value: profile.joinedDate.split(' ')[0] },
            { label:'STATUS',   value: STATUS_CONFIG[profile.status].label.split(' ')[0] },
            { label:'ZONE',     value: profile.timezone.split(' ')[0]   },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign:'center' }}>
              <p style={{ color:'rgba(255,255,255,0.28)', fontSize:7, fontFamily:'monospace', letterSpacing:'0.1em', marginBottom:2 }}>{label}</p>
              <p style={{ color:'rgba(255,255,255,0.7)', fontSize:9, fontFamily:'monospace', fontWeight:600 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* QR placeholder */}
        <div style={{
          width:48, height:48, background:'rgba(255,255,255,0.05)',
          border:'1px solid rgba(255,255,255,0.09)', borderRadius:9,
          display:'flex', alignItems:'center', justifyContent:'center',
          marginBottom:12,
        }}>
          <QrCode size={24} color="rgba(255,255,255,0.2)" />
        </div>

        {/* Card ID */}
        <p style={{ color:'rgba(255,255,255,0.15)', fontSize:8, fontFamily:'monospace', letterSpacing:'0.2em' }}>
          DT·{profile.username.toUpperCase().slice(0,6).padEnd(6,'·')}·24
        </p>
      </div>

      {/* Bottom accent bar */}
      <div style={{ height:3, background: profile.avatarGradient, opacity:0.85 }} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ID CARD WITH LANYARD
───────────────────────────────────────────────────────────────────────────── */
function IDCardWithLanyard({ profile }: { profile: UserProfile }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
      {/* Lanyard string */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:-2 }}>
        <div style={{ width:3, height:28, background:'linear-gradient(to bottom, rgba(255,255,255,0.15), rgba(255,255,255,0.08))', borderRadius:2 }} />
        <div style={{
          width:52, height:12,
          border:'3px solid rgba(255,255,255,0.12)',
          borderBottom:'none',
          borderRadius:'999px 999px 0 0',
          marginBottom:-1,
        }} />
      </div>
      <IDCard profile={profile} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN PROFILE PAGE
───────────────────────────────────────────────────────────────────────────── */
export function ProfilePage({ user }: { user: any }) {
  const { supabase } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const [showCard, setShowCard] = useState(false);
  const [idCardStatus, setIdCardStatus] = useState<'none' | 'pending' | 'issued'>('none');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: user?.display_name || user?.email?.split('@')[0] || 'Member',
    displayName: user?.display_name || user?.email?.split('@')[0] || 'Member',
    username: user?.username || user?.email?.split('@')[0] || 'user',
    email: user?.email || '',
    bio: user?.bio || 'No bio yet.',
    role: user?.role || 'Workspace Member',
    status: (user?.status as Status) || 'online',
    timezone: user?.timezone || 'UTC+0 (London)',
    website: user?.website || '',
    twitter: user?.twitter || '',
    github: user?.github || '',
    joinedDate: user?.joined_date || new Date().toLocaleDateString(),
    avatarGradient: user?.avatar_gradient || GRADIENT_PRESETS[0],
  });

  // ── Database Interactions ──────────────────────────────────────────────────

  const checkExistingRequest = useCallback(async () => {
    if (!user?.id || !supabase) return;
    const { data, error } = await supabase
      .from('id_card_requests')
      .select('id, status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setIdCardStatus(data.status as 'pending' | 'issued');
      setRequestId(data.id);
    } else {
      setIdCardStatus('none');
      setRequestId(null);
    }
  }, [user?.id, supabase]);

  const router = useRouter();
  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      router.push('/login');
    }
  };

  useEffect(() => {
    checkExistingRequest();
  }, [checkExistingRequest]);

  const handleRequestIDCard = async () => {
    if (!user?.id || !supabase) return;
    setIsRequesting(true);
    const { data, error } = await supabase
      .from('id_card_requests')
      .insert({
        user_id: user.id,
        status: 'pending'
      })
      .select()
      .single();

    if (!error && data) {
      setIdCardStatus('pending');
      setRequestId(data.id);
    }
    setIsRequesting(false);
  };

  const handleCancelRequest = async () => {
    if (!requestId || !supabase) return;
    setIsRequesting(true);
    const { error } = await supabase
      .from('id_card_requests')
      .delete()
      .eq('id', requestId);

    if (!error) {
      setIdCardStatus('none');
      setRequestId(null);
    }
    setIsRequesting(false);
  };

  const [draft,     setDraft]     = useState<UserProfile>(profile);
  const [copied,    setCopied]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [theme,     setTheme]     = useState<ThemeMode>('dark');
  const [showEmail, setShowEmail] = useState(false);
  const [showPass,  setShowPass]  = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Authentication State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // MFA State
  const [mfaStatus, setMfaStatus] = useState<'loading' | 'enabled' | 'disabled'>('loading');
  const [mfaFactorId, setMfaFactorId] = useState('');
  const [mfaQrCode, setMfaQrCode] = useState('');
  const [mfaChallengeId, setMfaChallengeId] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState('');
  const [showMfaModal, setShowMfaModal] = useState(false);

  const [notifs, setNotifs] = useState({
    mentions:true, threads:true, reactions:false, dms:true,
    keywords:true, sounds:true, desktop:true, mobile:false, email:false,
  });
  const [privacy, setPrivacy] = useState({
    showStatus:true, showEmail:false, showActivity:true,
    searchable:true, readReceipts:true, typingIndicator:true,
  });
  const [appearance, setAppearance] = useState({
    compactMode:false, animations:true, fontSize:'normal',
    sidebarDense:false, messageGrouping:true,
  });

  const [realStats, setRealStats] = useState({ messages: 0, channels: 0, workspaces: 0, daysActive: 0 });
  const [realActivity, setRealActivity] = useState<any[]>([]);
  const [activityDays, setActivityDays] = useState<any[]>(Array.from({ length: 364 }, (_, i) => ({ week: Math.floor(i/7), day: i%7, count: 0 })));

  const fetchUserData = useCallback(async () => {
    if (!user?.id || !supabase) return;
    
    // Stats
    const [{ count: msgCount }, { count: chanCount }, { count: wsCount }] = await Promise.all([
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('author_id', user.id),
      supabase.from('channel_memberships').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('workspaces').select('*', { count: 'exact', head: true })
    ]);
    
    // Activity heatmap
    const { data: allMsgs } = await supabase.from('messages').select('created_at').eq('author_id', user.id);
    const uniqueDays = new Set<string>();
    const dayCounts = new Map<string, number>();
    
    allMsgs?.forEach((m: any) => {
      const d = new Date(m.created_at).toISOString().split('T')[0];
      uniqueDays.add(d);
      dayCounts.set(d, (dayCounts.get(d) || 0) + 1);
    });
    
    const today = new Date();
    const actDays = Array.from({ length: 52 }, (_, week) =>
      Array.from({ length: 7 }, (_, day) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (52 - week - 1) * 7 - (today.getDay() - day));
        const dateStr = d.toISOString().split('T')[0];
        return { week, day, count: dayCounts.get(dateStr) || 0 };
      })
    ).flat();
    
    setActivityDays(actDays);
    setRealStats({ 
      messages: msgCount || 0, 
      channels: chanCount || 0, 
      workspaces: wsCount || 0, 
      daysActive: uniqueDays.size 
    });

    // Fetch MFA Status
    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (!factorsError && factors && factors.totp && factors.totp.length > 0) {
      const activeTotp = factors.totp.find((f: any) => f.status === 'verified');
      if (activeTotp) {
        setMfaStatus('enabled');
        setMfaFactorId(activeTotp.id);
      } else {
        setMfaStatus('disabled');
      }
    } else {
      setMfaStatus('disabled');
    }

    // Recent Activity
    const { data: recentMsgs } = await supabase.from('messages').select('created_at, content, channels(name)').eq('author_id', user.id).order('created_at', { ascending: false }).limit(5);
    
    if (recentMsgs) {
      setRealActivity(recentMsgs.map((m: any) => {
         let timeStr = new Date(m.created_at).toLocaleDateString();
         const hrDiff = Math.floor((Date.now() - new Date(m.created_at).getTime()) / 3600000);
         if (hrDiff < 24) timeStr = hrDiff === 0 ? 'Just now' : `${hrDiff}h ago`;
         else if (hrDiff < 48) timeStr = 'Yesterday';

         const cName = m.channels && !Array.isArray(m.channels) ? m.channels.name : 'channel';
         return { type: 'message', text: `Sent message in #${cName}`, time: timeStr, icon: '💬' };
      }));
    }
  }, [user?.id, supabase]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  async function handleUpdatePassword() {
    if (!newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    const { error } = await supabase!.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);

    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 3000);
    }
  }

  async function handleEnableMfa() {
    setShowMfaModal(true);
    setMfaLoading(true);
    setMfaError('');
    setMfaCode('');

    const { data: enrollData, error: enrollError } = await supabase!.auth.mfa.enroll({ factorType: 'totp' });
    if (enrollError || !enrollData) {
      setMfaError(enrollError?.message || 'Failed to enroll MFA');
      setMfaLoading(false);
      return;
    }

    setMfaFactorId(enrollData.id);
    setMfaQrCode(enrollData.totp.qr_code);

    const { data: challengeData, error: challengeError } = await supabase!.auth.mfa.challenge({ factorId: enrollData.id });
    if (challengeError || !challengeData) {
      setMfaError(challengeError?.message || 'Failed to challenge MFA');
      setMfaLoading(false);
      return;
    }

    setMfaChallengeId(challengeData.id);
    setMfaLoading(false);
  }

  async function handleVerifyMfa() {
    if (!mfaCode || mfaCode.length !== 6) {
      setMfaError('Please enter a valid 6-digit code.');
      return;
    }
    setMfaLoading(true);
    setMfaError('');

    const { error } = await supabase!.auth.mfa.verify({
      factorId: mfaFactorId,
      challengeId: mfaChallengeId,
      code: mfaCode
    });

    setMfaLoading(false);

    if (error) {
      setMfaError(error.message);
    } else {
      setMfaStatus('enabled');
      setShowMfaModal(false);
    }
  }

  async function handleDisableMfa() {
    if (!mfaFactorId) return;
    setMfaLoading(true);
    const { error } = await supabase!.auth.mfa.unenroll({ factorId: mfaFactorId });
    setMfaLoading(false);
    if (!error) {
      setMfaStatus('disabled');
      setMfaFactorId('');
    }
  }

  async function saveProfile() {
    if (!user?.id || !supabase) return;
    const { error } = await supabase.from('users').update({
      display_name: draft.displayName,
      username: draft.username,
      bio: draft.bio,
      role: draft.role,
      timezone: draft.timezone,
      website: draft.website,
      twitter: draft.twitter,
      github: draft.github,
      avatar_gradient: draft.avatarGradient,
      status: draft.status
    }).eq('id', user.id);
    
    if (!error) {
      setProfile(draft); 
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      console.error('Failed to update profile:', error);
    }
  }
  function copyUsername() {
    navigator.clipboard?.writeText('@' + profile.username);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }
  function getActivityColor(count: number) {
    if (count === 0) return '#1e2026';
    if (count < 3)  return '#4c1d95';
    if (count < 6)  return '#6d28d9';
    if (count < 9)  return '#7c3aed';
    return '#a855f7';
  }

  const TABS: { key: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { key:'profile',       label:'Profile',       icon:<Edit3 size={14}/>   },
    { key:'account',       label:'Account',       icon:<Shield size={14}/>  },
    { key:'notifications', label:'Notifications', icon:<Bell size={14}/>    },
    { key:'appearance',    label:'Appearance',    icon:<Palette size={14}/> },
    { key:'privacy',       label:'Privacy',       icon:<Lock size={14}/>    },
  ];

  const isDirty = JSON.stringify(profile) !== JSON.stringify(draft);
  const currentProfile = draft;

  const handleExportSVG = useCallback(() => {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="360"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="color: white; font-family: sans-serif; background: black; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 20px;">ID Card for ${currentProfile.displayName}</div></foreignObject></svg>`;
    const svgStr = encodeURIComponent(svgContent);
    const a = document.createElement('a');
    a.href = `data:image/svg+xml;utf8,${svgStr}`;
    a.download = `devtalk-id-${currentProfile.username}.svg`;
    a.click();
  }, [currentProfile]);

  return (
    <div className="flex h-full bg-[#111214] text-[#e8eaf0] overflow-hidden">

      {/* ── Left panel ── */}
      <div className="w-[260px] shrink-0 border-r border-[#2a2c33] flex flex-col bg-[#0e0f11]">
        <div className="px-5 pt-7 pb-5 border-b border-[#2a2c33]">
          {/* Avatar */}
          <div className="relative w-fit mb-4">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-2xl"
              style={{ background: profile.avatarGradient }}>
              {(profile.displayName || profile.name).split(' ').map((w:string)=>w[0]).join('').toUpperCase().slice(0,2)}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#0e0f11]"
              style={{ background: STATUS_CONFIG[profile.status].color }} />
            <button onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/0 hover:bg-black/50 rounded-2xl flex items-center justify-center opacity-0 hover:opacity-100 transition-all">
              <Camera size={18} className="text-white"/>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"/>
          </div>

          <p className="text-[15px] font-bold leading-tight">{profile.displayName || profile.name}</p>
          <p className="font-mono text-[11px] text-[#6b7280] mt-0.5">@{profile.username}</p>

          <button onClick={copyUsername}
            className="flex items-center gap-1.5 mt-2 font-mono text-[10px] text-[#6b7280] hover:text-[#a855f7] transition-colors">
            {copied ? <CheckCheck size={11} className="text-[#10b981]"/> : <Copy size={11}/>}
            {copied ? 'Copied!' : 'Copy handle'}
          </button>

          {/* Show ID Card toggle */}
          <button onClick={() => setShowCard(v => !v)}
            className="flex items-center gap-1.5 mt-2 font-mono text-[10px] text-[#6b7280] hover:text-[#a855f7] transition-colors">
            <QrCode size={11}/>
            {showCard ? 'Hide ID card' : 'Show ID card'}
          </button>

          {/* Status selector */}
          <div className="mt-3">
            <p className="font-mono text-[9px] uppercase tracking-widest text-[#6b7280] mb-1.5">Status</p>
            <div className="grid grid-cols-2 gap-1">
              {(Object.entries(STATUS_CONFIG) as [Status, typeof STATUS_CONFIG[Status]][]).map(([key, cfg]) => (
                <button key={key} onClick={() => setProfile(p => ({ ...p, status: key }))}
                  className={['flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all',
                    profile.status === key ? 'text-white' : 'text-[#6b7280] hover:bg-[#18191d] hover:text-[#e8eaf0]'].join(' ')}
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
            {[
              { label:'Messages',    val: realStats.messages.toLocaleString(), sub:'total', icon:MessageSquare, color:'#a855f7' },
              { label:'Channels',    val: realStats.channels.toString(),    sub:'joined',     icon:Hash,          color:'#3b82f6' },
              { label:'Workspaces',  val: realStats.workspaces.toString(),     sub:'joined',     icon:Users,         color:'#10b981' },
              { label:'Days Active', val: realStats.daysActive.toString(),    sub:'this year',  icon:TrendingUp,    color:'#f59e0b' },
            ].map(({ label, val, sub, icon: Icon, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: color+'18' }}>
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

        {/* Nav */}
        <div className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={['w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all text-left',
                activeTab === tab.key ? 'bg-[rgba(124,58,237,0.15)] text-[#c084fc]' : 'text-[#6b7280] hover:bg-[#18191d] hover:text-[#e8eaf0]'].join(' ')}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        <div className="px-3 py-3 border-t border-[#2a2c33]">
          <button onClick={handleSignOut} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-[#6b7280] hover:bg-[rgba(239,68,68,0.1)] hover:text-[#ef4444] transition-all text-left">
            <LogOut size={14}/> Sign out
          </button>
        </div>
      </div>

      {/* ── Main panel ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ════ PROFILE TAB ════ */}
        {activeTab === 'profile' && (
          <div className="max-w-[720px] mx-auto px-8 py-8">

            {/* Header */}
            <div className="flex items-center justify-between mb-7">
              <div>
                <h2 className="text-[20px] font-bold tracking-tight">Profile</h2>
                <p className="font-mono text-[11.5px] text-[#6b7280] mt-0.5">How others see you across DevTalk</p>
              </div>
              <div className="flex items-center gap-2">
                {saved && (
                  <span className="flex items-center gap-1.5 font-mono text-[11px] text-[#10b981] px-3 py-1.5 bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.25)] rounded-lg">
                    <Check size={11}/> Saved!
                  </span>
                )}
                {isDirty && (
                  <>
                    <button onClick={() => setDraft(profile)}
                      className="flex items-center gap-1.5 bg-[#1e2026] border border-[#2a2c33] text-[#6b7280] hover:text-[#e8eaf0] text-[12.5px] font-semibold px-4 py-2 rounded-xl transition-all">
                      <X size={13}/> Cancel
                    </button>
                    <button onClick={saveProfile}
                      className="flex items-center gap-1.5 bg-[#7c3aed] hover:bg-[#a855f7] text-white text-[12.5px] font-semibold px-4 py-2 rounded-xl transition-all">
                      <Check size={13}/> Save changes
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* ── ID CARD SECTION ── */}
            {showCard && (
              <div className="bg-[#18191d] border border-[#2a2c33] rounded-2xl p-6 mb-5" style={{ animation:'cardSectionIn 0.35s ease' }}>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280] mb-5">ID Card</p>
                <div className="flex flex-col items-center py-8 gap-5">
                  {idCardStatus === 'issued' ? (
                    <>
                      <IDCardWithLanyard profile={currentProfile} />
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={handleExportSVG}
                          className="flex items-center gap-1.5 font-mono text-[11px] bg-[#2a2c33] border border-[#33363f] hover:bg-[#33363f] text-[#e8eaf0] px-4 py-2 rounded-xl transition-all"
                        >
                          <Download size={13} /> Export SVG
                        </button>
                        <button
                          onClick={() => setShowCard(false)}
                          className="flex items-center gap-1.5 font-mono text-[11px] bg-[#1e2026] border border-[#2a2c33] hover:border-[#33363f] text-[#6b7280] hover:text-[#e8eaf0] px-4 py-2 rounded-xl transition-all"
                        >
                          <X size={13} /> Close
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Lock icon */}
                      <div style={{
                        width: 72, height: 72, borderRadius: 20,
                        background: 'rgba(124,58,237,0.1)',
                        border: '1px solid rgba(124,58,237,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(168,85,247,0.8)" strokeWidth="1.5">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      </div>

                      {/* Text */}
                      <div className="text-center max-w-[340px]">
                        <p className="text-[16px] font-bold text-white mb-2">ID Card Not Available</p>
                        <p className="font-mono text-[12px] text-[#6b7280] leading-relaxed">
                          Your workspace ID card hasn't been issued yet.
                          Request one from your workspace owner to get your official DevTalk identity card.
                        </p>
                      </div>

                      {/* Pending badge if request sent */}
                      {idCardStatus === 'pending' && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.25)]" style={{ animation:'fadeIn 0.3s ease' }}>
                          <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse" />
                          <span className="font-mono text-[11px] text-[#f59e0b]">Request sent · Awaiting approval</span>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        {idCardStatus === 'none'
                          ? <button
                              onClick={handleRequestIDCard}
                              disabled={isRequesting}
                              className="flex items-center gap-2 bg-[#7c3aed] hover:bg-[#a855f7] text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-50"
                            >
                              {isRequesting ? <Loader2 size={14} className="animate-spin" /> : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 9.81a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z"/>
                                </svg>
                              )}
                              Request ID Card
                            </button>
                          : <div className="flex gap-2">
                              <button
                                onClick={handleCancelRequest}
                                disabled={isRequesting}
                                className="flex items-center gap-2 bg-[#1e2026] hover:bg-[#2a2c33] text-[#e8eaf0] text-[13px] font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 border border-[#2a2c33] hover:border-[#33363f]"
                              >
                                Cancel request
                              </button>
                              <button
                                onClick={() => setShowCard(false)}
                                className="bg-[#1e2026] hover:bg-[#2a2c33] text-[#6b7280] hover:text-[#e8eaf0] text-[13px] font-semibold px-4 py-2.5 rounded-xl transition-all border border-[#1e2026] hover:border-[#33363f] flex items-center gap-1.5"
                              >
                                <X size={14}/> Dismiss
                              </button>
                            </div>
                        }
                      </div>
                      
                      {idCardStatus === 'none' && (
                        <p className="font-mono text-[10px] text-[#6b7280] text-center max-w-[300px] mt-4">
                          Workspace owners can issue ID cards from the workspace settings panel.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Avatar section */}
            <div className="bg-[#18191d] border border-[#2a2c33] rounded-2xl p-5 mb-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280] mb-4">Avatar</p>
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl"
                    style={{ background: currentProfile.avatarGradient }}>
                    {(profile.displayName||profile.name).split(' ').map((w:string)=>w[0]).join('').toUpperCase().slice(0,2)}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#18191d]"
                    style={{ background: STATUS_CONFIG[profile.status].color }}/>
                </div>
                <div className="flex-1">
                  <div className="flex gap-2 mb-3">
                    <button onClick={() => fileInputRef.current?.click()}
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
              <div className="mt-4 pt-4 border-t border-[#2a2c33]">
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280] mb-3">Avatar gradient</p>
                <div className="flex gap-2 flex-wrap">
                  {GRADIENT_PRESETS.map((g, i) => (
                    <button key={i} onClick={() => setDraft(p => ({ ...p, avatarGradient:g }))}
                      className={['w-8 h-8 rounded-lg transition-all',
                        currentProfile.avatarGradient === g ? 'ring-2 ring-[#7c3aed] ring-offset-1 ring-offset-[#18191d] scale-110' : 'hover:scale-105'].join(' ')}
                      style={{ background: g }}/>
                  ))}
                </div>
              </div>
            </div>

            {/* Info fields */}
            <div className="bg-[#18191d] border border-[#2a2c33] rounded-2xl p-5 mb-4 space-y-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280]">Personal info</p>
              {[
                { label:'Display name', key:'displayName', ph:'How you appear to others' },
                { label:'Full name',    key:'name',        ph:'Your legal name'           },
                { label:'Username',     key:'username',    ph:'your-handle', prefix:'@'   },
                { label:'Role / Title', key:'role',        ph:'e.g. Frontend Engineer'   },
              ].map(({ label, key, ph, prefix }) => (
                <div key={key}>
                  <label className="block font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#6b7280] mb-1.5">{label}</label>
                  <div className="flex items-center">
                    {prefix && <span className="font-mono text-[13px] text-[#6b7280] bg-[#111214] border border-r-0 border-[#2a2c33] rounded-l-lg px-3 h-[38px] flex items-center">{prefix}</span>}
                    <input type="text"
                      value={currentProfile[key as keyof UserProfile] || ''}
                      onChange={e => setDraft(p => ({ ...p, [key]:e.target.value }))}
                      placeholder={ph}
                      className={['flex-1 bg-[#111214] border border-[#2a2c33] focus:border-[#7c3aed] text-[#e8eaf0] font-mono text-[13px] px-3 outline-none transition-colors h-[38px] cursor-text',
                        prefix ? 'rounded-r-lg' : 'rounded-lg'].join(' ')}/>
                  </div>
                </div>
              ))}
              <div>
                <label className="block font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#6b7280] mb-1.5">Bio</label>
                <textarea value={currentProfile.bio || ''}
                  onChange={e => setDraft(p => ({ ...p, bio:e.target.value }))}
                  rows={3} placeholder="Tell your team about yourself..."
                  className="w-full bg-[#111214] border border-[#2a2c33] focus:border-[#7c3aed] text-[#e8eaf0] font-mono text-[13px] px-3 py-2.5 rounded-lg outline-none resize-none transition-colors cursor-text"/>
              </div>
              <div>
                <label className="block font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#6b7280] mb-1.5">Timezone</label>
                <select value={currentProfile.timezone}
                  onChange={e => setDraft(p => ({ ...p, timezone:e.target.value }))}
                  className="w-full bg-[#111214] border border-[#2a2c33] focus:border-[#7c3aed] text-[#e8eaf0] font-mono text-[13px] px-3 h-[38px] rounded-lg outline-none transition-colors cursor-pointer">
                  {TIMEZONES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Social links */}
            <div className="bg-[#18191d] border border-[#2a2c33] rounded-2xl p-5 mb-4 space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280]">Links</p>
              {[
                { label:'Website', key:'website', icon:<Globe size={14} className="text-[#6b7280]"/>,    prefix:'https://' },
                { label:'Twitter', key:'twitter', icon:<Twitter size={14} className="text-[#1da1f2]"/>,  prefix:'@'        },
                { label:'GitHub',  key:'github',  icon:<Github size={14} className="text-[#6b7280]"/>,   prefix:'github.com/' },
              ].map(({ label, key, icon, prefix }) => {
                const rawVal = (currentProfile[key as keyof UserProfile] as string) || '';
                const displayVal = rawVal.startsWith(prefix) ? rawVal.substring(prefix.length) : rawVal;

                return (
                  <div key={key}>
                    <label className="block font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#6b7280] mb-1.5">{label}</label>
                    <div className="flex items-center border border-[#2a2c33] rounded-lg overflow-hidden bg-[#111214] focus-within:border-[#7c3aed] transition-colors">
                      <span className="flex items-center gap-2 px-3 h-[38px] border-r border-[#2a2c33] bg-[#18191d] shrink-0">
                        {icon}
                        <span className="font-mono text-[11px] text-[#6b7280]">{prefix}</span>
                      </span>
                      <input type="text"
                        value={displayVal}
                        onChange={e => {
                          const inputVal = e.target.value;
                          let savedVal = inputVal;
                          if (inputVal && !inputVal.startsWith(prefix)) {
                            savedVal = prefix + inputVal;
                          } else if (!inputVal) {
                            savedVal = '';
                          }
                          setDraft(p => ({ ...p, [key]: savedVal }));
                        }}
                        placeholder={label.toLowerCase()+' handle'}
                        className="flex-1 bg-transparent border-none outline-none font-mono text-[13px] text-[#e8eaf0] px-3 h-[38px] placeholder-[#33363f] cursor-text"/>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Activity heatmap */}
            <div className="bg-[#18191d] border border-[#2a2c33] rounded-2xl p-5 mb-4">
              <div className="flex items-center justify-between mb-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280]">Activity this year</p>
                <span className="font-mono text-[10px] text-[#6b7280]">{activityDays.filter(d=>d.count>0).length} active days</span>
              </div>
              <div className="flex gap-[3px] overflow-x-auto pb-1">
                {Array.from({ length:52 }, (_, w) => (
                  <div key={w} className="flex flex-col gap-[3px]">
                    {Array.from({ length:7 }, (_, d) => {
                      const cell = activityDays.find(a=>a.week===w&&a.day===d);
                      return <div key={d} className="w-2.5 h-2.5 rounded-[2px] hover:ring-1 hover:ring-[#7c3aed] cursor-pointer transition-all"
                        style={{ background: getActivityColor(cell?.count??0) }} title={(cell?.count??0)+' messages'}/>;
                    })}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5 mt-3">
                <span className="font-mono text-[9.5px] text-[#33363f]">Less</span>
                {[0,3,6,9,12].map(n=><div key={n} className="w-2.5 h-2.5 rounded-[2px]" style={{ background: getActivityColor(n) }}/>)}
                <span className="font-mono text-[9.5px] text-[#33363f]">More</span>
              </div>
            </div>

            {/* Recent activity */}
            <div className="bg-[#18191d] border border-[#2a2c33] rounded-2xl p-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280] mb-4">Recent activity</p>
              <div className="space-y-3">
                {realActivity.length === 0 ? (
                  <p className="text-[12px] text-[#6b7280]">No recent activity to show.</p>
                ) : realActivity.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-[#1e2026] last:border-0">
                    <div className="w-8 h-8 rounded-lg bg-[#1e2026] flex items-center justify-center text-[15px] shrink-0">{a.icon}</div>
                    <div className="flex-1 min-w-0"><p className="text-[13px] truncate">{a.text}</p></div>
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
            <Section title="Email address">
              <div className="flex items-center gap-3">
                <div className="flex-1 font-mono text-[13px] text-[#e8eaf0] bg-[#111214] border border-[#2a2c33] rounded-lg px-3 h-[38px] flex items-center">
                  {showEmail ? profile.email : profile.email.replace(/(.{2}).+(@.+)/,'$1•••$2')}
                </div>
                <button onClick={() => setShowEmail(v=>!v)} className="w-9 h-9 bg-[#1e2026] border border-[#2a2c33] rounded-lg flex items-center justify-center text-[#6b7280] hover:text-[#e8eaf0] transition-colors">
                  {showEmail ? <EyeOff size={14}/> : <Eye size={14}/>}
                </button>
                <button className="flex items-center gap-1.5 bg-[#7c3aed] hover:bg-[#a855f7] text-white text-[12px] font-semibold px-3 h-9 rounded-lg transition-all">Change</button>
              </div>
            </Section>
            <Section title="Password">
              <div className="space-y-2.5 relative">
                <input type={showPass ? 'text' : 'password'} placeholder="Current password"
                  value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full bg-[#111214] border border-[#2a2c33] focus:border-[#7c3aed] text-[#e8eaf0] font-mono text-[13px] px-3 h-[38px] rounded-lg outline-none transition-colors placeholder-[#33363f]" />
                <input type={showPass ? 'text' : 'password'} placeholder="New password"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-[#111214] border border-[#2a2c33] focus:border-[#7c3aed] text-[#e8eaf0] font-mono text-[13px] px-3 h-[38px] rounded-lg outline-none transition-colors placeholder-[#33363f]" />
                <input type={showPass ? 'text' : 'password'} placeholder="Confirm new password"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#111214] border border-[#2a2c33] focus:border-[#7c3aed] text-[#e8eaf0] font-mono text-[13px] px-3 h-[38px] rounded-lg outline-none transition-colors placeholder-[#33363f]" />

                {passwordError && <p className="text-red-500 text-[11px] font-mono mt-1">{passwordError}</p>}
                {passwordSuccess && <p className="text-[#10b981] text-[11px] font-mono mt-1">{passwordSuccess}</p>}

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Toggle value={showPass} onChange={setShowPass}/>
                    <span className="font-mono text-[11px] text-[#6b7280]">Show passwords</span>
                  </label>
                  <button 
                    onClick={handleUpdatePassword} 
                    disabled={passwordLoading}
                    className="flex items-center gap-1.5 bg-[#7c3aed] hover:bg-[#a855f7] disabled:opacity-50 text-white text-[12.5px] font-semibold px-4 py-2 rounded-lg transition-all">
                    {passwordLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                    Update password
                  </button>
                </div>
              </div>
            </Section>
            <Section title="Two-factor authentication">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-semibold">
                    {mfaStatus === 'loading' ? 'Loading MFA Status...' : mfaStatus === 'enabled' ? '2FA is enabled' : '2FA is disabled'}
                  </p>
                  <p className="font-mono text-[11px] text-[#6b7280] mt-0.5">
                    {mfaStatus === 'loading' ? 'Checking your security settings...' : mfaStatus === 'enabled' ? 'Your account is protected.' : 'Add an extra layer of security.'}
                  </p>
                </div>
                <button 
                  onClick={mfaStatus === 'enabled' ? handleDisableMfa : handleEnableMfa}
                  disabled={mfaStatus === 'loading' || mfaLoading}
                  className={['flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-lg transition-all disabled:opacity-50',
                    mfaStatus === 'enabled' ? 'bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)] text-[#ef4444]' : 'bg-[#7c3aed] hover:bg-[#a855f7] text-white'].join(' ')}>
                  {mfaLoading ? <Loader2 size={13} className="animate-spin"/> : <Shield size={13}/>} 
                  {mfaStatus === 'enabled' ? 'Disable 2FA' : 'Enable 2FA'}
                </button>
              </div>

              {showMfaModal && mfaStatus !== 'enabled' && (
                <div className="mt-4 p-5 bg-[#111214] border border-[#2a2c33] rounded-xl relative" style={{ animation: 'fadeIn 0.3s ease' }}>
                  <button onClick={() => setShowMfaModal(false)} className="absolute top-3 right-3 text-[#6b7280] hover:text-[#e8eaf0]">
                    <X size={14} />
                  </button>
                  <h3 className="text-[14px] font-semibold mb-2">Configure Authenticator App</h3>
                  <p className="text-[12px] text-[#9ca3af] mb-4">Scan the QR code below with your favorite authenticator app (e.g. Google Authenticator, Authy, 1Password) and enter the 6-digit code to verify.</p>
                  
                  <div className="flex flex-col items-center gap-4">
                    {mfaQrCode ? (
                      <div className="bg-white p-2 text-black rounded-lg" dangerouslySetInnerHTML={{ __html: mfaQrCode }} />
                    ) : (
                      <div className="w-[150px] h-[150px] bg-[#1a1b20] animate-pulse rounded-lg flex items-center justify-center">
                        <Loader2 size={24} className="animate-spin text-[#6b7280]" />
                      </div>
                    )}
                    <div className="w-full max-w-[220px] space-y-3 mt-2">
                       <input type="text" placeholder="000 000" maxLength={6}
                        value={mfaCode} onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full text-center tracking-[0.4em] bg-[#1a1b20] border border-[#2a2c33] focus:border-[#7c3aed] text-[#e8eaf0] font-mono text-[16px] px-3 h-[42px] rounded-lg outline-none transition-colors placeholder-[#33363f]"/>
                       
                       {mfaError && <p className="text-[#ef4444] text-[11px] font-mono text-center leading-tight">{mfaError}</p>}
                       
                       <button onClick={handleVerifyMfa} disabled={mfaCode.length !== 6 || mfaLoading}
                         className="w-full flex justify-center items-center gap-2 bg-[#7c3aed] hover:bg-[#a855f7] text-white text-[12.5px] font-semibold h-[40px] rounded-lg transition-all disabled:opacity-50">
                         {mfaLoading && <Loader2 size={14} className="animate-spin" />} Verify and Enable
                       </button>
                    </div>
                  </div>
                </div>
              )}
            </Section>
            <div className="mt-4 bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.2)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4"><AlertTriangle size={15} className="text-[#ef4444]"/><p className="font-mono text-[10px] uppercase tracking-widest text-[#ef4444]">Danger zone</p></div>
              <div className="flex items-center justify-between">
                <div><p className="text-[13px] font-semibold">Delete account</p><p className="font-mono text-[11px] text-[#6b7280] mt-0.5">Permanently delete your account and all data.</p></div>
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
            <p className="font-mono text-[11.5px] text-[#6b7280] mb-7">Choose what you get notified about</p>
            <Section title="Notify me about">
              {[
                { key:'mentions', label:'Direct mentions',  desc:'When someone @mentions you'             },
                { key:'threads',  label:'Thread replies',   desc:'Replies in threads you participate in'  },
                { key:'reactions',label:'Reactions',        desc:'When someone reacts to your messages'   },
                { key:'dms',      label:'Direct messages',  desc:'All new direct messages'                },
                { key:'keywords', label:'Keyword alerts',   desc:'Messages containing your tracked words' },
              ].map(({ key, label, desc }) => (
                <NotifRow key={key} label={label} desc={desc} value={notifs[key as keyof typeof notifs]} onChange={v=>setNotifs(p=>({...p,[key]:v}))}/>
              ))}
            </Section>
            <Section title="How to notify me">
              {[
                { key:'sounds',  label:'Notification sounds', desc:'Play a sound for new notifications' },
                { key:'desktop', label:'Desktop alerts',      desc:'Show system notification banners'   },
                { key:'mobile',  label:'Mobile push',         desc:'Push notifications to your phone'   },
                { key:'email',   label:'Email digest',        desc:'Weekly email summary of activity'   },
              ].map(({ key, label, desc }) => (
                <NotifRow key={key} label={label} desc={desc} value={notifs[key as keyof typeof notifs]} onChange={v=>setNotifs(p=>({...p,[key]:v}))}/>
              ))}
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
                {([{key:'dark',label:'Dark',icon:<Moon size={16}/>},{key:'light',label:'Light',icon:<Sun size={16}/>},{key:'system',label:'System',icon:<Monitor size={16}/>}] as const).map(({key,label,icon})=>(
                  <button key={key} onClick={()=>setTheme(key)}
                    className={['flex flex-col items-center gap-2 p-4 rounded-xl border transition-all',
                      theme===key ? 'border-[#7c3aed] bg-[rgba(124,58,237,0.12)] text-[#c084fc]' : 'border-[#2a2c33] bg-[#18191d] text-[#6b7280] hover:border-[#33363f]'].join(' ')}>
                    {icon}<span className="font-mono text-[11px]">{label}</span>
                  </button>
                ))}
              </div>
            </Section>
            <Section title="Interface density">
              {[
                {key:'compactMode',label:'Compact message list',desc:'Reduce spacing between messages'},
                {key:'sidebarDense',label:'Dense sidebar',desc:'Show more channels with smaller spacing'},
                {key:'messageGrouping',label:'Group messages',desc:'Combine consecutive messages from same sender'},
                {key:'animations',label:'Animations',desc:'Enable transitions and micro-animations'},
              ].map(({key,label,desc})=>(
                <div key={key} className="flex items-center justify-between py-2">
                  <div><p className="text-[13px] font-semibold">{label}</p><p className="font-mono text-[11px] text-[#6b7280]">{desc}</p></div>
                  <Toggle value={appearance[key as keyof typeof appearance] as boolean} onChange={v=>setAppearance(p=>({...p,[key]:v}))}/>
                </div>
              ))}
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
                {key:'showStatus',label:'Show my online status',desc:'Others can see if you are online'},
                {key:'showEmail',label:'Show email address',desc:'Your email is visible to workspace members'},
                {key:'showActivity',label:'Show activity feed',desc:'Others can see your recent activity'},
                {key:'searchable',label:'Searchable by email',desc:'People can find you by searching your email'},
              ].map(({key,label,desc})=>(
                <NotifRow key={key} label={label} desc={desc} value={privacy[key as keyof typeof privacy]} onChange={v=>setPrivacy(p=>({...p,[key]:v}))}/>
              ))}
            </Section>
            <Section title="Messaging">
              {[
                {key:'readReceipts',label:'Send read receipts',desc:'Others see when you have read their messages'},
                {key:'typingIndicator',label:'Show typing indicator',desc:'Others see when you are composing'},
              ].map(({key,label,desc})=>(
                <NotifRow key={key} label={label} desc={desc} value={privacy[key as keyof typeof privacy]} onChange={v=>setPrivacy(p=>({...p,[key]:v}))}/>
              ))}
            </Section>
          </div>
        )}
      </div>

      <style>{`
        @keyframes cardIn        { from{opacity:0;transform:scale(0.9) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes cardSectionIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#18191d] border border-[#2a2c33] rounded-2xl p-5 mb-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280] mb-4">{title}</p>
      {children}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className={['relative w-9 h-5 rounded-full transition-all duration-200 shrink-0', value ? 'bg-[#7c3aed]' : 'bg-[#2a2c33]'].join(' ')}>
      <div className={['absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200', value ? 'left-[18px]' : 'left-0.5'].join(' ')}/>
    </button>
  );
}

function NotifRow({ label, desc, value, onChange }: { label:string; desc:string; value:boolean; onChange:(v:boolean)=>void }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#1e2026] last:border-0">
      <div><p className="text-[13px] font-semibold">{label}</p><p className="font-mono text-[10.5px] text-[#6b7280] mt-0.5">{desc}</p></div>
      <Toggle value={value} onChange={onChange}/>
    </div>
  );
}

export default ProfilePage;