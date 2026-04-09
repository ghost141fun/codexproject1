'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera, Edit3, Check, X, Bell, BellOff, Shield, LogOut,
  Trash2, ChevronRight, Moon, Sun, Monitor, Link2, Globe,
  Copy, CheckCheck, MessageSquare, Hash, Users, TrendingUp,
  Settings, Eye, EyeOff, Upload, Lock, AlertTriangle,
  Star, ArrowRight, Plus, Crown, Building2,
  UserPlus, RefreshCw, Mail, Download, CreditCard, Loader2,
  ExternalLink, Palette,
} from 'lucide-react';
import { useAuth } from '@/database';
import { useRouter } from 'next/navigation';
import { Billing } from './Billing';
import PrivacySettings from './privacy-settings';
import NotificationSettings from './notification-settings';
import AppearanceSettings from './appearance-settings';

// ── Types ──────────────────────────────────────────────────────────────────────
type Status = 'online' | 'away' | 'busy' | 'offline';
type ThemeMode = 'dark' | 'light' | 'system';
type OwnerTab = 'profile' | 'workspace' | 'members' | 'notifications' | 'id_requests' | 'appearance' | 'privacy' | 'account' | 'billing';
type MemberRole = 'admin' | 'member' | 'guest';

interface OwnerProfile {
  displayName: string; fullName: string; username: string;
  email: string; bio: string; role: string;
  status: Status; timezone: string;
  website: string; twitter: string; github: string;
  joinedDate: string; avatarGradient: string; avatarUrl: string;
  workspaceName: string; workspaceSlug: string; workspacePlan: 'free' | 'pro';
  workspaceDescription: string; workspaceEmoji: string;
  workspaceMemberCount: number; workspaceCreated: string;
}

interface Member {
  id: string; name: string; avatar: string; color: string;
  email: string; role: MemberRole; status: Status;
  department: string; joined: string; lastSeen: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; pulse?: boolean }> = {
  online: { label: 'Online', color: '#10b981', bg: 'rgba(16,185,129,0.15)', pulse: true },
  away: { label: 'Away', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  busy: { label: 'Do Not Disturb', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  offline: { label: 'Appear Offline', color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
};

const ROLE_COLOR: Record<MemberRole, { color: string; bg: string; border: string }> = {
  admin: { color: '#a855f7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.3)' },
  member: { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.25)' },
  guest: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
};

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
  'UTC+1 (Paris)', 'UTC+2 (Cairo)', 'UTC+3 (Moscow)',
  'UTC+5:30 (India)', 'UTC+8 (Beijing)', 'UTC+9 (Tokyo)',
];

const ACTIVITY_DAYS = Array.from({ length: 52 }, (_, week) =>
  Array.from({ length: 7 }, (_, day) => ({
    week, day, count: Math.random() > 0.35 ? Math.floor(Math.random() * 12) : 0,
  }))
).flat();

interface Channel {
  id: string; name: string; type: 'public' | 'private';
  members: number; msgs: number; unread: number;
  muted: boolean; pinned: boolean; topic: string;
  description: string;
}

function heatColor(n: number) {
  if (n === 0) return '#1e2026';
  if (n < 3) return '#4c1d95';
  if (n < 6) return '#6d28d9';
  if (n < 9) return '#7c3aed';
  return '#a855f7';
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className={['relative w-10 h-[22px] rounded-full transition-all duration-200 shrink-0', value ? 'bg-[#7c3aed]' : 'bg-[#2a2c33]'].join(' ')}>
      <div className={['absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-all duration-200', value ? 'left-[22px]' : 'left-[3px]'].join(' ')} />
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#18191d] border border-[#2a2c33] rounded-2xl p-5 mb-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280] mb-5">{title}</p>
      {children}
    </div>
  );
}

function NotifRow({ label, desc, value, onChange }: {
  label: string; desc: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#1e2026] last:border-0">
      <div>
        <p className="text-[13px] font-semibold">{label}</p>
        <p className="font-mono text-[10.5px] text-[#6b7280] mt-0.5">{desc}</p>
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

function FieldInput({ label, value, onChange, editing, prefix, type = 'text', placeholder, optional }: {
  label: string; value: string; onChange: (v: string) => void;
  editing: boolean; prefix?: string; type?: string; placeholder?: string; optional?: boolean;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#6b7280] mb-1.5">
        {label}
        {optional && <span className="normal-case tracking-normal font-normal text-[#33363f]">(optional)</span>}
      </label>
      <div className={['flex items-center border rounded-lg overflow-hidden transition-colors', editing ? 'border-[#2a2c33] focus-within:border-[#7c3aed]' : 'border-[#1e2026]'].join(' ')}
        style={{ background: '#111214' }}>
        {prefix && (
          <span className="px-3 font-mono text-[13px] text-[#6b7280] border-r border-[#2a2c33] h-[38px] flex items-center bg-[#18191d] shrink-0">{prefix}</span>
        )}
        <input type={type} value={value} onChange={e => onChange(e.target.value)} readOnly={!editing}
          placeholder={placeholder}
          className={['flex-1 bg-transparent border-none outline-none font-mono text-[13px] px-3 h-[38px] transition-colors', editing ? 'text-[#e8eaf0] cursor-text' : 'text-[#9ca3af] cursor-default'].join(' ')} />
      </div>
    </div>
  );
}

// Tabs defined outside component
const OWNER_TABS = [
  { key: 'profile' as const, label: 'Profile', iconName: 'edit' },
  { key: 'workspace' as const, label: 'My Workspace', iconName: 'building' },
  { key: 'members' as const, label: 'Members', iconName: 'users' },
  { key: 'notifications' as const, label: 'Notifications', iconName: 'bell' },
  { key: 'id_requests' as const, label: 'ID Card Requests', iconName: 'creditcard' },
  { key: 'appearance' as const, label: 'Appearance', iconName: 'palette' },
  { key: 'privacy' as const, label: 'Privacy & Safety', iconName: 'lock' },
  { key: 'account' as const, label: 'Account', iconName: 'shield' },
  { key: 'billing' as const, label: 'Plan & Billing', iconName: 'star' },
];

function OwnerTabIcon({ name }: { name: string }) {
  if (name === 'edit') return <Edit3 size={14} />;
  if (name === 'building') return <Building2 size={14} />;
  if (name === 'users') return <Users size={14} />;
  if (name === 'bell') return <Bell size={14} />;
  if (name === 'creditcard') return <CreditCard size={14} />;
  if (name === 'palette') return <Palette size={14} />;
  if (name === 'lock') return <Lock size={14} />;
  if (name === 'shield') return <Shield size={14} />;
  return <Star size={14} />;
}

export function OwnerProfilePage({ user, activeWorkspace, refresh }: { user: any; activeWorkspace: any; refresh?: () => Promise<void>; }) {
  const { supabase } = useAuth();
  const [activeTab, setActiveTab] = useState<OwnerTab>('profile');
  const [profile, setProfile] = useState<OwnerProfile>({
    displayName: user?.display_name || user?.email?.split('@')[0] || 'Owner',
    fullName: user?.display_name || user?.email?.split('@')[0] || 'Owner',
    username: user?.username || user?.email?.split('@')[0] || 'owner',
    email: user?.email || '',
    bio: user?.bio || 'Workspace Owner',
    role: user?.role || 'Owner',
    status: (user?.status as Status) || 'online',
    timezone: user?.timezone || 'UTC+0 (London)',
    website: user?.website || '',
    twitter: user?.twitter || '',
    github: user?.github || '',
    joinedDate: user?.joined_date || new Date().toLocaleDateString(),
    avatarGradient: user?.avatar_gradient || GRADIENT_PRESETS[0],
    avatarUrl: user?.avatar_url || '',
    workspaceName: activeWorkspace?.name || 'My Workspace',
    workspaceSlug: activeWorkspace?.name?.toLowerCase().replace(/\s+/g, '-') || 'workspace',
    workspacePlan: 'free',
    workspaceDescription: activeWorkspace?.description || 'Active workspace',
    workspaceEmoji: '🏢',
    workspaceMemberCount: 1,
    workspaceCreated: activeWorkspace?.created_at ? new Date(activeWorkspace.created_at).toLocaleDateString() : 'Today',
  });

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<OwnerProfile>(profile);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [twoFA, setTwoFA] = useState<boolean>(false);
  const [isToggling2FA, setIsToggling2FA] = useState(false);
  // Real MFA state
  const [mfaStatus, setMfaStatus] = useState<'loading' | 'enabled' | 'disabled'>('loading');
  const [mfaFactorId, setMfaFactorId] = useState('');
  const [mfaQrCode, setMfaQrCode] = useState('');
  const [mfaUri, setMfaUri] = useState('');
  const [mfaChallengeId, setMfaChallengeId] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState('');
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<MemberRole>('member');
  const [memberSearch, setMemberSearch] = useState('');
  const [msgCount, setMsgCount] = useState<number>(0);
  const fileRef = useRef<HTMLInputElement>(null);

  // ID Card Requests State
  const [idRequests, setIdRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!supabase || !activeWorkspace) return;

    try {
      // First fetch user IDs belonging to this workspace
      const { data: memberRecords, error: memberError } = await supabase
        .from('workspace_memberships')
        .select('user_id')
        .eq('workspace_id', activeWorkspace.id);

      if (memberError || !memberRecords) {
        console.error('Error fetching workspace members:', memberError);
        return;
      }

      const memberIds = memberRecords.map(m => m.user_id);
      if (memberIds.length === 0) {
        setMembers([]);
        return;
      }

      const { data } = await supabase
        .from('users')
        .select('*')
        .in('id', memberIds);

      if (data) {
        setMembers(data.map((u: any) => ({
          id: u.id,
          name: u.display_name || u.username || 'Anonymous',
          avatar: (u.display_name || u.username || 'U')[0].toUpperCase(),
          color: u.avatar_gradient || GRADIENT_PRESETS[Math.floor(Math.random() * GRADIENT_PRESETS.length)],
          email: u.email || '',
          role: (u.role === 'owner' || u.role === 'workspace_owner') ? 'admin' : 'member' as MemberRole,
          status: (u.status || 'offline') as Status,
          department: u.role || 'Contributor',
          joined: u.joined_date ? new Date(u.joined_date).toLocaleDateString() : 'N/A',
          lastSeen: 'Member',
        })));
      }
    } catch (err) {
      console.error('Fetch members error:', err);
    }
  }, [supabase, activeWorkspace]);

  const router = useRouter();
  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      router.push('/login');
    }
  };

  const fetchChannels = useCallback(async () => {
    if (!supabase || !activeWorkspace) return;
    const { data } = await supabase
      .from('channels')
      .select('*')
      .eq('workspace_id', activeWorkspace.id);
    if (data) {
      setChannels(data.map((c: any) => ({
        id: c.id,
        name: c.name,
        type: c.is_private ? 'private' : 'public',
        members: 0, 
        msgs: 0, 
        unread: 0,
        muted: false,
        pinned: false,
        topic: '',
        description: c.description || '',
      })));
    }
  }, [supabase, activeWorkspace]);

  const fetchIdRequests = useCallback(async () => {
    if (!supabase || !activeWorkspace) return;
    setLoadingRequests(true);
    const { data, error } = await supabase
      .from('id_card_requests')
      .select(`
        id, status, user_id, created_at,
        users ( id, display_name, username, email, avatar_gradient, status )
      `)
      .eq('status', 'pending')
      .eq('workspace_id', activeWorkspace.id);
    
    if (!error && data) {
      setIdRequests(data);
    }
    setLoadingRequests(false);
  }, [supabase, activeWorkspace]);

  const fetchMessageCount = useCallback(async () => {
    if (!supabase || !activeWorkspace) return;

    try {
      // 1. Fetch count from channels in this workspace
      const { count: channelMsgs, error: channelError } = await supabase
        .from('messages')
        .select('*, channels!inner(workspace_id)', { count: 'exact', head: true })
        .eq('channels.workspace_id', activeWorkspace.id);

      if (channelError) console.error('Error fetching channel message count:', channelError);

      // 2. Fetch count from DMs in this workspace
      const { count: dmMsgs, error: dmError } = await supabase
        .from('messages')
        .select('*, direct_message_conversations!inner(workspace_id)', { count: 'exact', head: true })
        .eq('direct_message_conversations.workspace_id', activeWorkspace.id);

      if (dmError) console.error('Error fetching DM message count:', dmError);

      const total = (channelMsgs ?? 0) + (dmMsgs ?? 0);
      setMsgCount(total);
    } catch (err) {
      console.error('Fetch message count error:', err);
    }
  }, [supabase, activeWorkspace]);

  useEffect(() => {
    fetchMembers();
    fetchChannels();
    fetchIdRequests();
    fetchMessageCount();
  }, [fetchMembers, fetchChannels, fetchIdRequests, fetchMessageCount]);

  async function issueIdCard(requestId: string) {
    if (!supabase) return;
    const { error } = await supabase
      .from('id_card_requests')
      .update({ status: 'issued' })
      .eq('id', requestId);
    if (!error) {
      setIdRequests(prev => prev.filter(r => r.id !== requestId));
      showToast('ID card issued successfully!');
    } else {
      showToast('Failed to issue ID card: ' + error.message);
    }
  }

  async function rejectIdCard(requestId: string) {
    if (!supabase) return;
    const { error } = await supabase
      .from('id_card_requests')
      .delete()
      .eq('id', requestId);
    if (!error) {
      setIdRequests(prev => prev.filter(r => r.id !== requestId));
      showToast('ID card request rejected.');
    } else {
      showToast('Failed to reject request: ' + error.message);
    }
  }

  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [channelModal, setChannelModal] = useState<Channel | null>(null);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChName, setNewChName] = useState('');
  const [newChType, setNewChType] = useState<'public' | 'private'>('public');
  const [newChDesc, setNewChDesc] = useState('');
  const [notifs, setNotifs] = useState({
    mentions: true, threads: true, reactions: false,
    dms: true, memberJoined: true, workspaceAlerts: true,
  });
  const [privacy, setPrivacy] = useState({
    showStatus: true, readReceipts: true, showActivity: true,
  });

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2600); }

  async function saveProfile() {
    if (!supabase || !user?.id) return;
    
    try {
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
        status: draft.status,
        avatar_url: draft.avatarUrl
      }).eq('id', user.id);

      if (error) {
        showToast('Failed to save profile: ' + error.message);
      } else {
        setProfile(draft);
        setEditing(false);
        setSaved(true);
        if (refresh) await refresh();
        showToast('Profile saved!');
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err: any) {
      showToast('An unexpected error occurred');
    }
  }

  function copyHandle() {
    navigator.clipboard?.writeText('@' + profile.username).catch(() => { });
    setCopied(true); setTimeout(() => setCopied(false), 2000);
    showToast('Handle copied!');
  }

  function removeImage() {
    setDraft(p => ({ ...p, avatarUrl: '' }));
    if (fileRef.current) fileRef.current.value = '';
  }

  function muteChannel(id: string) {
    setChannels(prev => prev.map(c => {
      if (c.id !== id) return c;
      const nowMuted = !c.muted;
      showToast((nowMuted ? 'Muted' : 'Unmuted') + ' #' + c.name);
      return { ...c, muted: nowMuted };
    }));
  }

  function markChannelRead(id: string) {
    setChannels(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));
  }

  function togglePinChannel(id: string) {
    setChannels(prev => prev.map(c => {
      if (c.id !== id) return c;
      const nowPinned = !c.pinned;
      showToast((nowPinned ? 'Pinned' : 'Unpinned') + ' #' + c.name);
      return { ...c, pinned: nowPinned };
    }));
  }

  function deleteChannel(id: string) {
    const ch = channels.find(c => c.id === id);
    setChannels(prev => prev.filter(c => c.id !== id));
    if (selectedChannel?.id === id) setSelectedChannel(null);
    setChannelModal(null);
    showToast('Deleted #' + ch?.name);
  }

  function createChannel() {
    if (!newChName.trim()) return;
    const slug = newChName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const newCh: Channel = {
      id: 'c-' + Date.now(), name: slug, type: newChType,
      members: 1, msgs: 0, unread: 0, muted: false, pinned: false,
      topic: '', description: newChDesc,
    };
    setChannels(prev => [...prev, newCh]);
    setShowNewChannel(false); setNewChName(''); setNewChDesc(''); setNewChType('public');
    showToast('Created #' + slug);
  }

  function openChannel(ch: Channel) {
    setSelectedChannel(ch);
    markChannelRead(ch.id);
  }

  function saveChannelSettings(updated: Channel) {
    setChannels(prev => prev.map(c => c.id === updated.id ? updated : c));
    setChannelModal(null);
    showToast('Saved #' + updated.name + ' settings');
  }

  const totalUnread = channels.reduce((s, c) => s + c.unread, 0);

  function sendInvite() {
    if (!inviteEmail.includes('@')) return;
    showToast('Invite sent to ' + inviteEmail);
    setInviteEmail('');
  }

  function changeMemberRole(id: string, role: MemberRole) {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, role } : m));
    showToast('Role updated');
  }

  function removeMember(id: string) {
    const m = members.find(m => m.id === id);
    setMembers(prev => prev.filter(m => m.id !== id));
    showToast(m?.name + ' removed from workspace');
  }

  const p = editing ? draft : profile;
  const filteredMembers = members.filter(m =>
    !memberSearch || m.name.toLowerCase().includes(memberSearch.toLowerCase()) || m.email.includes(memberSearch)
  );

  const handleToggle2FA = async () => {
    // This is now a wrapper — enable opens the setup flow, disable calls unenroll
    if (mfaStatus === 'enabled') {
      await handleDisableMfa();
    } else {
      await handleEnableMfa();
    }
  };

  async function handleEnableMfa() {
    setShowMfaSetup(true); setMfaLoading(true); setMfaError(''); setMfaCode('');
    try {
      const { data: enrollData, error: enrollError } = await supabase!.auth.mfa.enroll({ factorType: 'totp' });
      if (enrollError || !enrollData) { 
        setMfaError(enrollError?.message || 'Failed to enroll MFA. Make sure MFA is enabled in your Supabase project settings.'); 
        setMfaLoading(false); 
        return; 
      }
      setMfaFactorId(enrollData.id);
      setMfaQrCode(enrollData.totp.qr_code);
      setMfaUri(enrollData.totp.uri);
      const { data: challengeData, error: challengeError } = await supabase!.auth.mfa.challenge({ factorId: enrollData.id });
      if (challengeError || !challengeData) { 
        setMfaError(challengeError?.message || 'Failed to create MFA challenge'); 
        setMfaLoading(false); 
        return; 
      }
      setMfaChallengeId(challengeData.id);
    } catch (err: any) {
      setMfaError(err?.message || 'An unexpected error occurred');
    }
    setMfaLoading(false);
  }

  async function handleVerifyMfa() {
    if (!mfaCode || mfaCode.length !== 6) { setMfaError('Please enter a valid 6-digit code.'); return; }
    setMfaLoading(true); setMfaError('');
    try {
      const { error } = await supabase!.auth.mfa.verify({ factorId: mfaFactorId, challengeId: mfaChallengeId, code: mfaCode });
      if (error) { 
        setMfaError(error.message); 
      } else { 
        setMfaStatus('enabled'); 
        setTwoFA(true); 
        setShowMfaSetup(false); 
        showToast('2FA enabled successfully!'); 
      }
    } catch (err: any) {
      setMfaError(err?.message || 'Verification failed');
    }
    setMfaLoading(false);
  }

  async function handleDisableMfa() {
    if (!mfaFactorId) { showToast('No MFA factor found to disable.'); return; }
    setIsToggling2FA(true);
    try {
      const { error } = await supabase!.auth.mfa.unenroll({ factorId: mfaFactorId });
      if (!error) { 
        setMfaStatus('disabled'); 
        setTwoFA(false); 
        setMfaFactorId(''); 
        showToast('2FA disabled successfully'); 
      } else {
        showToast('Failed to disable 2FA: ' + error.message);
      }
    } catch (err: any) {
      showToast('An error occurred while disabling 2FA');
    }
    setIsToggling2FA(false);
  }

  // Check MFA status on mount
  useEffect(() => {
    async function checkMfaStatus() {
      if (!supabase) { setMfaStatus('disabled'); return; }
      try {
        const { data: factors, error } = await supabase.auth.mfa.listFactors();
        if (!error && factors?.totp?.length > 0) {
          const activeTotp = factors.totp.find((f: any) => f.status === 'verified');
          if (activeTotp) {
            setMfaStatus('enabled');
            setTwoFA(true);
            setMfaFactorId(activeTotp.id);
          } else {
            setMfaStatus('disabled');
          }
        } else {
          setMfaStatus('disabled');
        }
      } catch {
        setMfaStatus('disabled');
      }
    }
    checkMfaStatus();
  }, [supabase]);

  const TABS = OWNER_TABS;

  // Component continues in next append...

  return (
    <div className="flex h-full bg-[#111214] text-[#e8eaf0] overflow-hidden">
      {/* LEFT SIDEBAR */}
      <div className="w-[260px] shrink-0 border-r border-[#2a2c33] flex flex-col bg-[#0e0f11]">
        <div className="px-4 py-3 border-b border-[#2a2c33]" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(245,158,11,0.1))' }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[rgba(245,158,11,0.2)] flex items-center justify-center"><Crown size={13} className="text-[#f59e0b]" /></div>
            <div>
              <p className="font-mono text-[10px] font-bold text-[#f59e0b] uppercase tracking-wider">Workspace Owner</p>
              <p className="font-mono text-[9px] text-[#6b7280]">{profile.workspaceName}</p>
            </div>
          </div>
        </div>

        <div className="px-5 pt-5 pb-4 border-b border-[#2a2c33]">
          <div className="relative w-fit mb-4 group">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl" style={{ background: p.avatarUrl ? '#111' : p.avatarGradient }}>
              {p.avatarUrl
                ? <img src={p.avatarUrl} className="w-full h-full object-cover" alt="avatar" />
                : <div className="w-full h-full flex items-center justify-center">
                  <svg width="38" height="38" viewBox="0 0 40 40" fill="none">
                    <circle cx="20" cy="20" r="10" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
                    <circle cx="20" cy="20" r="16" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                    <line x1="20" y1="4" x2="20" y2="36" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                    <line x1="4" y1="20" x2="36" y2="20" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                    <circle cx="20" cy="20" r="3" fill="rgba(255,255,255,0.9)" />
                    <circle cx="20" cy="10" r="2" fill="rgba(255,255,255,0.5)" />
                    <circle cx="20" cy="30" r="2" fill="rgba(255,255,255,0.5)" />
                    <circle cx="10" cy="20" r="2" fill="rgba(255,255,255,0.5)" />
                    <circle cx="30" cy="20" r="2" fill="rgba(255,255,255,0.5)" />
                  </svg>
                </div>}
            </div>
            <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#f59e0b] border-2 border-[#0e0f11] flex items-center justify-center shadow-lg"><Crown size={11} className="text-white" /></div>
            <div className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full border-2 border-[#0e0f11]" style={{ background: STATUS_CONFIG[profile.status].color }} />
            <button onClick={() => fileRef.current?.click()} className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/55 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"><Camera size={18} className="text-white" /></button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" 
              onChange={e => { 
                const f = e.target.files?.[0]; 
                if (f) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setDraft(p => ({ ...p, avatarUrl: reader.result as string }));
                  };
                  reader.readAsDataURL(f);
                }
              }} 
            />
          </div>

          <p className="text-[15px] font-bold leading-tight">{profile.displayName}</p>
          <p className="font-mono text-[11px] text-[#6b7280] mt-0.5">{profile.role}</p>
          <button onClick={copyHandle} className="flex items-center gap-1.5 mt-1.5 font-mono text-[10px] text-[#6b7280] hover:text-[#a855f7] transition-colors">
            {copied ? <CheckCheck size={11} className="text-[#10b981]" /> : <Copy size={11} />}@{profile.username}
          </button>

          <div className="mt-3">
            <p className="font-mono text-[9px] uppercase tracking-widest text-[#33363f] mb-1.5">Status</p>
            <div className="grid grid-cols-2 gap-1">
              {(Object.entries(STATUS_CONFIG) as [Status, typeof STATUS_CONFIG[Status]][]).map(([key, cfg]) => (
                <button key={key} onClick={() => setProfile(p => ({ ...p, status: key }))}
                  className={['flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10.5px] transition-all text-left', profile.status === key ? '' : 'text-[#6b7280] hover:bg-[#18191d]'].join(' ')}
                  style={profile.status === key ? { background: cfg.bg, color: cfg.color } : {}}>
                  <div className={['w-1.5 h-1.5 rounded-full shrink-0', cfg.pulse && profile.status === key ? 'animate-pulse' : ''].join(' ')} style={{ background: cfg.color }} />
                  <span className="truncate">{cfg.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 py-4 border-b border-[#2a2c33] space-y-2.5">
          {[
            { icon: Building2, label: 'Workspaces', val: '1 owned', color: '#f59e0b' },
            { icon: Users, label: 'Members', val: members.length + ' total', color: '#10b981' },
            { icon: Hash, label: 'Channels', val: String(channels.length) + ' active', color: '#3b82f6' },
            { icon: MessageSquare, label: 'Messages', val: msgCount.toLocaleString(), color: '#a855f7' },
          ].map(({ icon: Icon, label, val, color }) => (
            <div key={label} className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: color + '15' }}><Icon size={13} style={{ color }} /></div>
              <div className="flex-1 min-w-0"><p className="text-[12px] font-bold truncate">{val}</p></div>
              <span className="font-mono text-[9.5px] text-[#6b7280] shrink-0">{label}</span>
            </div>
          ))}
        </div>

        <div className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {OWNER_TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={['w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all text-left', activeTab === tab.key ? 'bg-[rgba(124,58,237,0.15)] text-[#c084fc]' : 'text-[#6b7280] hover:bg-[#18191d] hover:text-[#e8eaf0]'].join(' ')}>
              <OwnerTabIcon name={tab.iconName} />{tab.label}
              {tab.key === 'members' && (<span className="ml-auto font-mono text-[9px] px-1.5 py-0.5 rounded-full bg-[#1e2026] text-[#6b7280]">{members.length}</span>)}
              {tab.key === 'id_requests' && idRequests.length > 0 && (<span className="ml-auto font-mono text-[9px] px-1.5 py-0.5 rounded-full bg-[rgba(245,158,11,0.15)] text-[#f59e0b] border border-[rgba(245,158,11,0.25)]">{idRequests.length}</span>)}
            </button>
          ))}
        </div>

        <div className="px-3 py-3 border-t border-[#2a2c33]">
          <button onClick={handleSignOut} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-[#6b7280] hover:bg-[rgba(239,68,68,0.1)] hover:text-[#ef4444] transition-all text-left"><LogOut size={14} /> Sign out</button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto">

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="max-w-[680px] mx-auto px-8 py-8">
            <div className="flex items-center justify-between mb-7">
              <div>
                <h2 className="text-[20px] font-bold tracking-tight flex items-center gap-2.5">Profile
                  <span className="flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-full bg-[rgba(245,158,11,0.15)] text-[#f59e0b] border border-[rgba(245,158,11,0.3)]"><Crown size={9} /> Owner</span>
                </h2>
                <p className="font-mono text-[11.5px] text-[#6b7280] mt-0.5">How others see you across Codex Teams</p>
              </div>
              <div className="flex items-center gap-2">
                {saved && (<span className="flex items-center gap-1.5 font-mono text-[11px] text-[#10b981] px-3 py-1.5 bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.25)] rounded-lg" style={{ animation: 'fadeIn 0.2s ease' }}><Check size={11} /> Saved!</span>)}
                {editing
                  ? <>
                    <button onClick={() => { setDraft(profile); setEditing(false); }} className="flex items-center gap-1.5 bg-[#1e2026] border border-[#2a2c33] text-[#6b7280] hover:text-[#e8eaf0] text-[12.5px] font-semibold px-4 py-2 rounded-xl transition-all"><X size={13} /> Cancel</button>
                    <button onClick={saveProfile} className="flex items-center gap-1.5 bg-[#7c3aed] hover:bg-[#a855f7] text-white text-[12.5px] font-semibold px-4 py-2 rounded-xl transition-all"><Check size={13} /> Save changes</button>
                  </>
                  : <button onClick={() => { setDraft(profile); setEditing(true); }} className="flex items-center gap-1.5 bg-[#1e2026] border border-[#2a2c33] hover:border-[#7c3aed] text-[#e8eaf0] text-[12.5px] font-semibold px-4 py-2 rounded-xl transition-all"><Edit3 size={13} /> Edit profile</button>
                }
              </div>
            </div>

            <Section title="Avatar">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl" style={{ background: p.avatarUrl ? '#111' : p.avatarGradient }}>
                    {p.avatarUrl ? <img src={p.avatarUrl} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center"><svg width="38" height="38" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="10" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" /><circle cx="20" cy="20" r="16" stroke="rgba(255,255,255,0.2)" strokeWidth="1" /><line x1="20" y1="4" x2="20" y2="36" stroke="rgba(255,255,255,0.3)" strokeWidth="1" /><line x1="4" y1="20" x2="36" y2="20" stroke="rgba(255,255,255,0.3)" strokeWidth="1" /><circle cx="20" cy="20" r="3" fill="rgba(255,255,255,0.9)" /><circle cx="20" cy="10" r="2" fill="rgba(255,255,255,0.5)" /><circle cx="20" cy="30" r="2" fill="rgba(255,255,255,0.5)" /></svg></div>}
                  </div>
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#f59e0b] border-2 border-[#18191d] flex items-center justify-center"><Crown size={9} className="text-white" /></div>
                  <div className="absolute -bottom-1 -right-1 rounded-full border-2 border-[#18191d]" style={{ background: STATUS_CONFIG[profile.status].color, width: '18px', height: '18px' }} />
                </div>
                <div className="flex-1">
                  <div className="flex gap-2 mb-2">
                    <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 bg-[#7c3aed] hover:bg-[#a855f7] text-white text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all"><Upload size={12} /> Upload photo</button>
                    <button onClick={removeImage} className="flex items-center gap-1.5 bg-[#1e2026] border border-[#2a2c33] text-[#6b7280] hover:text-[#e8eaf0] text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all"><Trash2 size={12} /> Remove</button>
                  </div>
                  <p className="font-mono text-[10.5px] text-[#6b7280]">JPG, PNG or GIF \u00b7 Max 4MB</p>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-[#2a2c33]">
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280] mb-3">Avatar gradient</p>
                <div className="flex gap-2 flex-wrap">
                  {GRADIENT_PRESETS.map((g, i) => (
                    <button key={i} onClick={() => editing && setDraft(p => ({ ...p, avatarGradient: g }))}
                      className={['w-8 h-8 rounded-lg transition-all', (editing ? draft : profile).avatarGradient === g ? 'ring-2 ring-[#7c3aed] ring-offset-1 ring-offset-[#18191d] scale-110' : 'hover:scale-105'].join(' ')}
                      style={{ background: g }} />
                  ))}
                </div>
              </div>
            </Section>

            <Section title="Personal info">
              <div className="space-y-4">
                <FieldInput label="Display name" value={p.displayName} onChange={v => setDraft(p => ({ ...p, displayName: v }))} editing={editing} placeholder="How you appear" />
                <FieldInput label="Full name" value={p.fullName} onChange={v => setDraft(p => ({ ...p, fullName: v }))} editing={editing} placeholder="Your legal name" />
                <FieldInput label="Username" value={p.username} onChange={v => setDraft(p => ({ ...p, username: v }))} editing={editing} prefix="@" placeholder="your-handle" />
                <FieldInput label="Role / Title" value={p.role} onChange={v => setDraft(p => ({ ...p, role: v }))} editing={editing} placeholder="e.g. Founder" />
                <div>
                  <label className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#6b7280] mb-1.5">Bio</label>
                  <textarea value={p.bio} onChange={e => setDraft(p => ({ ...p, bio: e.target.value }))} readOnly={!editing} rows={3} placeholder="Tell your team about yourself..."
                    className={['w-full border rounded-lg px-3 py-2.5 font-mono text-[13px] outline-none resize-none transition-colors', editing ? 'bg-[#111214] border-[#2a2c33] focus:border-[#7c3aed] text-[#e8eaf0] cursor-text' : 'bg-[#111214] border-[#1e2026] text-[#9ca3af] cursor-default'].join(' ')} />
                  {editing && <p className="font-mono text-[10px] text-[#33363f] mt-1 text-right">{draft.bio.length}/200</p>}
                </div>
                <div>
                  <label className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#6b7280] mb-1.5 block">Timezone</label>
                  <select value={p.timezone} onChange={e => setDraft(prev => ({ ...prev, timezone: e.target.value }))} disabled={!editing}
                    className={['w-full border rounded-lg px-3 h-[38px] font-mono text-[13px] outline-none transition-colors', editing ? 'bg-[#111214] border-[#2a2c33] focus:border-[#7c3aed] text-[#e8eaf0]' : 'bg-[#111214] border-[#1e2026] text-[#9ca3af]'].join(' ')}>
                    {TIMEZONES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </Section>

            <Section title="Links">
              <div className="space-y-3">
                {[
                  { label: 'Website', key: 'website' as const, icon: <Globe size={13} className="text-[#6b7280]" />, pfx: 'https://' },
                  { label: 'Twitter', key: 'twitter' as const, icon: <TwitterIcon />, pfx: '@' },
                  { label: 'GitHub', key: 'github' as const, icon: <GithubIcon />, pfx: 'github.com/' },
                ].map(({ label, key, icon, pfx }) => (
                  <div key={key}>
                    <label className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#6b7280] mb-1.5 block">{label}</label>
                    <div className={['flex items-center border rounded-lg overflow-hidden transition-colors', editing ? 'border-[#2a2c33] focus-within:border-[#7c3aed]' : 'border-[#1e2026]'].join(' ')} style={{ background: '#111214' }}>
                      <span className="flex items-center gap-2 px-3 h-[38px] border-r border-[#2a2c33] bg-[#18191d] shrink-0">{icon}<span className="font-mono text-[11px] text-[#6b7280]">{pfx}</span></span>
                      <input type="text" value={p[key]} readOnly={!editing} onChange={e => setDraft(prev => ({ ...prev, [key]: e.target.value }))} placeholder={label.toLowerCase()}
                        className={['flex-1 bg-transparent border-none outline-none font-mono text-[13px] px-3 h-[38px] placeholder-[#33363f]', editing ? 'text-[#e8eaf0] cursor-text' : 'text-[#9ca3af] cursor-default'].join(' ')} />
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Activity this year">
              <div className="flex gap-[3px] overflow-x-auto pb-1">
                {Array.from({ length: 52 }, (_, w) => (
                  <div key={w} className="flex flex-col gap-[3px]">
                    {Array.from({ length: 7 }, (_, d) => {
                      const cell = ACTIVITY_DAYS.find(a => a.week === w && a.day === d);
                      return (<div key={d} className="w-2.5 h-2.5 rounded-[2px] hover:ring-1 hover:ring-[#7c3aed] cursor-pointer" style={{ background: heatColor(cell?.count ?? 0) }} title={(cell?.count ?? 0) + ' messages'} />);
                    })}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5 mt-2.5">
                <span className="font-mono text-[9.5px] text-[#33363f]">Less</span>
                {[0, 3, 6, 9, 12].map(n => <div key={n} className="w-2.5 h-2.5 rounded-[2px]" style={{ background: heatColor(n) }} />)}
                <span className="font-mono text-[9.5px] text-[#33363f]">More</span>
              </div>
            </Section>
          </div>
        )}

        {/* WORKSPACE TAB */}
        {activeTab === 'workspace' && (
          <div className="max-w-[700px] mx-auto px-8 py-8">
            <h2 className="text-[20px] font-bold tracking-tight mb-1">My Workspace</h2>
            <p className="font-mono text-[11.5px] text-[#6b7280] mb-7">Manage {profile.workspaceName} settings and channels</p>

            <div className="bg-[#18191d] border border-[#2a2c33] rounded-2xl p-5 mb-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280] mb-4">Workspace identity</p>
              <div className="flex items-center gap-4 p-4 bg-[#111214] border border-[#2a2c33] rounded-xl mb-4">
                <div className="w-14 h-14 rounded-2xl bg-[rgba(124,58,237,0.15)] border border-[rgba(124,58,237,0.25)] flex items-center justify-center text-[28px] shrink-0">{profile.workspaceEmoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[15px] font-bold">{profile.workspaceName}</p>
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full bg-[rgba(168,85,247,0.15)] text-[#a855f7] border border-[rgba(168,85,247,0.3)]">{profile.workspacePlan === 'pro' ? '\u2726 Pro' : 'Free'}</span>
                    {totalUnread > 0 && (<span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full bg-[rgba(239,68,68,0.15)] text-[#ef4444] border border-[rgba(239,68,68,0.3)]">{totalUnread} unread</span>)}
                  </div>
                  <p className="font-mono text-[11px] text-[#6b7280]">{profile.workspaceDescription}</p>
                  <p className="font-mono text-[10.5px] text-[#33363f] mt-0.5">devtalk.dev/{profile.workspaceSlug} \u00b7 Created {profile.workspaceCreated}</p>
                </div>
                <button onClick={() => showToast('Opening workspace settings...')} className="flex items-center gap-1.5 bg-[#1e2026] border border-[#2a2c33] hover:border-[#7c3aed] text-[#e8eaf0] text-[12px] font-semibold px-3 py-1.5 rounded-xl transition-all shrink-0"><Settings size={12} /> Settings</button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Members', val: members.length, color: '#10b981', icon: Users },
                  { label: 'Channels', val: channels.length, color: '#3b82f6', icon: Hash },
                  { label: 'Messages', val: msgCount.toLocaleString(), color: '#a855f7', icon: MessageSquare },
                ].map(({ label, val, color, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-3 p-3.5 bg-[#111214] border border-[#2a2c33] rounded-xl">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: color + '18' }}><Icon size={16} style={{ color }} /></div>
                    <div><p className="text-[18px] font-extrabold leading-none" style={{ color }}>{val}</p><p className="font-mono text-[9.5px] text-[#6b7280] mt-0.5">{label}</p></div>
                  </div>
                ))}
              </div>
            </div>

            {/* CHANNELS */}
            <div className="bg-[#18191d] border border-[#2a2c33] rounded-2xl p-5 mb-4">
              <div className="flex items-center justify-between mb-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280]">Channels</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => { const unreadChs = channels.filter(c => c.unread > 0); if (unreadChs.length > 0) { setChannels(prev => prev.map(c => ({ ...c, unread: 0 }))); showToast('All channels marked as read'); } }}
                    className="font-mono text-[10.5px] text-[#6b7280] hover:text-[#e8eaf0] transition-colors">Mark all read</button>
                  <button onClick={() => setShowNewChannel(v => !v)} className="flex items-center gap-1 font-mono text-[10.5px] text-[#a855f7] hover:text-[#c084fc] transition-colors"><Plus size={11} /> New channel</button>
                </div>
              </div>

              {showNewChannel && (
                <div className="mb-4 p-4 bg-[#111214] border border-[#7c3aed] rounded-xl space-y-3" style={{ animation: 'fadeIn 0.15s ease' }}>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#a855f7]">New channel</p>
                  <div className="flex items-center border border-[#2a2c33] focus-within:border-[#7c3aed] rounded-lg overflow-hidden bg-[#18191d] transition-colors">
                    <span className="px-3 font-mono text-[14px] text-[#a855f7] h-9 flex items-center border-r border-[#2a2c33] bg-[#1a1b1f] select-none">#</span>
                    <input type="text" value={newChName} onChange={e => setNewChName(e.target.value)} placeholder="channel-name" autoFocus className="flex-1 bg-transparent border-none outline-none font-mono text-[13px] text-[#e8eaf0] px-3 h-9 placeholder-[#33363f]" />
                  </div>
                  <input type="text" value={newChDesc} onChange={e => setNewChDesc(e.target.value)} placeholder="Description (optional)" className="w-full bg-[#18191d] border border-[#2a2c33] focus:border-[#7c3aed] text-[#e8eaf0] font-mono text-[12.5px] px-3 h-9 rounded-lg outline-none transition-colors placeholder-[#33363f]" />
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {(['public', 'private'] as const).map(t => (
                        <button key={t} onClick={() => setNewChType(t)} className={['flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[11px] border transition-all', newChType === t ? 'border-[#7c3aed] bg-[rgba(124,58,237,0.15)] text-[#c084fc]' : 'border-[#2a2c33] text-[#6b7280] hover:border-[#33363f]'].join(' ')}>
                          {t === 'private' ? <Lock size={10} /> : <Hash size={10} />} {t}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setShowNewChannel(false); setNewChName(''); setNewChDesc(''); }} className="font-mono text-[11px] text-[#6b7280] hover:text-[#e8eaf0] px-3 py-1.5 rounded-lg border border-[#2a2c33] transition-colors">Cancel</button>
                      <button onClick={createChannel} disabled={!newChName.trim()} className="flex items-center gap-1 font-mono text-[11px] bg-[#7c3aed] hover:bg-[#a855f7] disabled:opacity-40 text-white px-3 py-1.5 rounded-lg transition-all"><Check size={11} /> Create</button>
                    </div>
                  </div>
                </div>
              )}

              {channels.filter(c => c.pinned).length > 0 && (
                <div className="mb-2">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#33363f] px-1 mb-1">📌 Pinned</p>
                  {channels.filter(c => c.pinned).map(ch => (<ChannelRow key={ch.id} ch={ch} selected={selectedChannel?.id === ch.id} onClick={() => openChannel(ch)} onMute={() => muteChannel(ch.id)} onSettings={() => setChannelModal(ch)} onMarkRead={() => markChannelRead(ch.id)} />))}
                </div>
              )}

              {channels.filter(c => !c.pinned).map(ch => (<ChannelRow key={ch.id} ch={ch} selected={selectedChannel?.id === ch.id} onClick={() => openChannel(ch)} onMute={() => muteChannel(ch.id)} onSettings={() => setChannelModal(ch)} onMarkRead={() => markChannelRead(ch.id)} />))}

              {selectedChannel && (
                <div className="mt-4 p-4 bg-[#111214] border border-[rgba(124,58,237,0.3)] rounded-xl" style={{ animation: 'fadeIn 0.15s ease' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={['w-7 h-7 rounded-lg flex items-center justify-center', selectedChannel.type === 'private' ? 'bg-[rgba(168,85,247,0.15)]' : 'bg-[rgba(59,130,246,0.15)]'].join(' ')}>
                        {selectedChannel.type === 'private' ? <Lock size={12} className="text-[#a855f7]" /> : <Hash size={12} className="text-[#3b82f6]" />}
                      </div>
                      <p className="text-[14px] font-bold">#{selectedChannel.name}</p>
                      {selectedChannel.muted && <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#1e2026] text-[#6b7280] border border-[#2a2c33]">muted</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => muteChannel(selectedChannel.id)} className="flex items-center gap-1 font-mono text-[10.5px] px-2.5 py-1 rounded-lg bg-[#1e2026] border border-[#2a2c33] hover:border-[#7c3aed] text-[#6b7280] hover:text-[#e8eaf0] transition-all">
                        {selectedChannel.muted ? <><Bell size={11} /> Unmute</> : <><BellOff size={11} /> Mute</>}
                      </button>
                      <button onClick={() => setChannelModal(selectedChannel)} className="flex items-center gap-1 font-mono text-[10.5px] px-2.5 py-1 rounded-lg bg-[#1e2026] border border-[#2a2c33] hover:border-[#7c3aed] text-[#6b7280] hover:text-[#e8eaf0] transition-all"><Settings size={11} /> Settings</button>
                      <button onClick={() => setSelectedChannel(null)} className="text-[#6b7280] hover:text-[#e8eaf0] transition-colors w-6 h-6 flex items-center justify-center"><X size={13} /></button>
                    </div>
                  </div>
                  {selectedChannel.topic && (<div className="flex items-center gap-2 mb-3 px-3 py-2 bg-[rgba(124,58,237,0.08)] border border-[rgba(124,58,237,0.2)] rounded-lg"><span className="text-[12px]">📌</span><p className="font-mono text-[11.5px] text-[#c084fc]">{selectedChannel.topic}</p></div>)}
                  <p className="font-mono text-[11.5px] text-[#6b7280] mb-4">{selectedChannel.description || 'No description set.'}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ label: 'Members', val: selectedChannel.members, color: '#10b981' }, { label: 'Messages', val: selectedChannel.msgs.toLocaleString(), color: '#a855f7' }, { label: 'Unread', val: selectedChannel.unread, color: selectedChannel.unread > 0 ? '#ef4444' : '#6b7280' }].map(s => (
                      <div key={s.label} className="p-2.5 bg-[#18191d] rounded-lg text-center"><p className="text-[16px] font-extrabold" style={{ color: s.color }}>{s.val}</p><p className="font-mono text-[9.5px] text-[#6b7280]">{s.label}</p></div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => { markChannelRead(selectedChannel.id); setSelectedChannel(prev => prev ? { ...prev, unread: 0 } : null); showToast('Marked #' + selectedChannel.name + ' as read'); }} className="flex-1 flex items-center justify-center gap-1.5 font-mono text-[11px] py-2 rounded-lg bg-[#18191d] border border-[#2a2c33] hover:border-[#7c3aed] text-[#6b7280] hover:text-[#e8eaf0] transition-all"><Check size={11} /> Mark read</button>
                    <button onClick={() => togglePinChannel(selectedChannel.id)} className="flex-1 flex items-center justify-center gap-1.5 font-mono text-[11px] py-2 rounded-lg bg-[#18191d] border border-[#2a2c33] hover:border-[#7c3aed] text-[#6b7280] hover:text-[#e8eaf0] transition-all">📌 {selectedChannel.pinned ? 'Unpin' : 'Pin'}</button>
                    <button onClick={() => showToast('Opening #' + selectedChannel.name + '...')} className="flex-1 flex items-center justify-center gap-1.5 font-mono text-[11px] py-2 rounded-lg bg-[#7c3aed] hover:bg-[#a855f7] text-white transition-all"><ArrowRight size={11} /> Open</button>
                  </div>
                </div>
              )}
            </div>

            {/* NOTIFICATIONS */}
            <div className="bg-[#18191d] border border-[#2a2c33] rounded-2xl p-5 mb-4">
              <div className="flex items-center justify-between mb-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280]">Notifications</p>
                <button onClick={() => { const allOn = Object.values(notifs).every(Boolean); const next = { mentions: !allOn, threads: !allOn, reactions: !allOn, dms: !allOn, memberJoined: !allOn, workspaceAlerts: !allOn }; setNotifs(next); showToast(allOn ? 'All notifications muted' : 'All notifications enabled'); }}
                  className="font-mono text-[10.5px] text-[#6b7280] hover:text-[#a855f7] transition-colors">{Object.values(notifs).every(Boolean) ? 'Mute all' : 'Enable all'}</button>
              </div>
              <NotifRow label="Direct mentions" desc="When @mentioned in any channel" value={notifs.mentions} onChange={v => { setNotifs(p => ({ ...p, mentions: v })); showToast(v ? 'Mention notifications on' : 'Mention notifications off'); }} />
              <NotifRow label="Direct messages" desc="All new DMs from members" value={notifs.dms} onChange={v => { setNotifs(p => ({ ...p, dms: v })); showToast(v ? 'DM notifications on' : 'DM notifications off'); }} />
              <NotifRow label="Thread replies" desc="Replies in threads you participate" value={notifs.threads} onChange={v => { setNotifs(p => ({ ...p, threads: v })); showToast(v ? 'Thread notifications on' : 'Thread notifications off'); }} />
              <NotifRow label="Reactions" desc="When someone reacts to your messages" value={notifs.reactions} onChange={v => { setNotifs(p => ({ ...p, reactions: v })); showToast(v ? 'Reaction notifications on' : 'Reaction notifications off'); }} />
              <NotifRow label="New member joined" desc="When someone joins the workspace" value={notifs.memberJoined} onChange={v => { setNotifs(p => ({ ...p, memberJoined: v })); showToast(v ? 'New member alerts on' : 'New member alerts off'); }} />
              <NotifRow label="Workspace alerts" desc="Security and system-level alerts" value={notifs.workspaceAlerts} onChange={v => { setNotifs(p => ({ ...p, workspaceAlerts: v })); showToast(v ? 'Workspace alerts on' : 'Workspace alerts off'); }} />
              {channels.filter(c => c.muted).length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#1e2026]">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280] mb-2">Muted channels</p>
                  <div className="flex flex-wrap gap-1.5">
                    {channels.filter(c => c.muted).map(ch => (
                      <button key={ch.id} onClick={() => muteChannel(ch.id)} className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1e2026] border border-[#2a2c33] rounded-full hover:border-[#7c3aed] transition-colors">
                        <BellOff size={10} className="text-[#6b7280]" /><span className="font-mono text-[11px] text-[#6b7280]">#{ch.name}</span><X size={9} className="text-[#33363f]" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MEMBERS TAB */}
        {activeTab === 'members' && (
          <div className="max-w-[680px] mx-auto px-8 py-8">
            <div className="flex items-center justify-between mb-7">
              <div>
                <h2 className="text-[20px] font-bold tracking-tight">Members</h2>
                <p className="font-mono text-[11.5px] text-[#6b7280] mt-0.5">{members.length} members in {profile.workspaceName}</p>
              </div>
            </div>
            <Section title="Invite a member">
              <p className="font-mono text-[11.5px] text-[#6b7280] mb-4">Invited users get a <span className="text-[#e8eaf0] font-semibold">standard member profile</span> \u2014 they can chat, join channels, and collaborate but cannot access workspace settings or billing.</p>
              <div className="flex gap-2 mb-3">
                <div className="flex-1 flex items-center border border-[#2a2c33] focus-within:border-[#7c3aed] rounded-lg overflow-hidden bg-[#111214] transition-colors">
                  <Mail size={13} className="ml-3 text-[#6b7280] shrink-0" />
                  <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendInvite()} placeholder="colleague@company.com" className="flex-1 bg-transparent border-none outline-none font-mono text-[12.5px] text-[#e8eaf0] px-2.5 h-10 placeholder-[#33363f]" />
                </div>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value as MemberRole)} className="bg-[#1e2026] border border-[#2a2c33] text-[#e8eaf0] font-mono text-[12px] px-3 h-10 rounded-lg outline-none cursor-pointer">
                  <option value="admin">Admin</option><option value="member">Member</option><option value="guest">Guest</option>
                </select>
                <button onClick={sendInvite} disabled={!inviteEmail.includes('@')} className="flex items-center gap-1.5 bg-[#7c3aed] hover:bg-[#a855f7] disabled:opacity-40 text-white text-[12px] font-semibold px-4 h-10 rounded-lg transition-all shrink-0"><UserPlus size={13} /> Invite</button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {([['admin', 'Admin', 'Manage members & settings'], ['member', 'Member', 'Standard workspace access'], ['guest', 'Guest', 'Limited channel access']] as const).map(([key, label, desc]) => (
                  <div key={key} className="p-2.5 rounded-xl border" style={{ background: ROLE_COLOR[key].bg, borderColor: ROLE_COLOR[key].border }}>
                    <p className="text-[11.5px] font-bold" style={{ color: ROLE_COLOR[key].color }}>{label}</p>
                    <p className="font-mono text-[9.5px] text-[#6b7280] mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </Section>



            <Section title="All members">
              <div className="flex items-center gap-2 bg-[#111214] border border-[#2a2c33] rounded-lg px-3 py-2 mb-4 focus-within:border-[#7c3aed] transition-colors">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                <input type="text" value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Search members..." className="bg-transparent border-none outline-none font-mono text-[12.5px] text-[#e8eaf0] flex-1 placeholder-[#33363f]" />
              </div>
              <div className="space-y-0.5">
                {filteredMembers.map(m => {
                  const rc = ROLE_COLOR[m.role];
                  return (
                    <div key={m.id} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[#1e2026] transition-colors">
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: m.color }}>{m.avatar}</div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#18191d]" style={{ background: STATUS_CONFIG[m.status].color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-semibold">{m.name}</p>
                          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full border" style={{ color: rc.color, background: rc.bg, borderColor: rc.border }}>{m.role}</span>
                        </div>
                        <p className="font-mono text-[10.5px] text-[#6b7280] truncate">{m.email} \u00b7 {m.department}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <select value={m.role} onChange={e => changeMemberRole(m.id, e.target.value as MemberRole)} className="bg-[#111214] border border-[#2a2c33] text-[#e8eaf0] font-mono text-[11px] px-2 h-8 rounded-lg outline-none cursor-pointer hover:border-[#7c3aed] transition-colors">
                          <option value="admin">Admin</option><option value="member">Member</option><option value="guest">Guest</option>
                        </select>
                        <button onClick={() => removeMember(m.id)} className="w-8 h-8 flex items-center justify-center text-[#6b7280] hover:text-[#ef4444] hover:bg-[rgba(239,68,68,0.1)] rounded-lg transition-all"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center gap-2.5 px-3.5 py-3 bg-[#111214] border border-[#2a2c33] rounded-xl">
                <Link2 size={13} className="text-[#6b7280] shrink-0" />
                <span className="font-mono text-[11px] text-[#6b7280] flex-1 truncate">devtalk.dev/invite/ws-a7b3c2f1</span>
                <button onClick={() => { navigator.clipboard?.writeText('https://devtalk.dev/invite/ws-a7b3c2f1').catch(() => { }); showToast('Invite link copied!'); }} className="flex items-center gap-1.5 font-mono text-[11px] text-[#a855f7] hover:text-[#c084fc] transition-colors shrink-0"><Copy size={11} /> Copy link</button>
              </div>
            </Section>
          </div>
        )}

        {/* ACCOUNT TAB */}
        {activeTab === 'account' && (
          <div className="max-w-[620px] mx-auto px-8 py-8">
            <h2 className="text-[20px] font-bold tracking-tight mb-1">Account</h2>
            <p className="font-mono text-[11.5px] text-[#6b7280] mb-7">Manage your login credentials and security</p>
            <Section title="Email address">
              <div className="flex items-center gap-3">
                <div className="flex-1 font-mono text-[13px] text-[#9ca3af] bg-[#111214] border border-[#1e2026] rounded-lg px-3 h-[38px] flex items-center">{showEmail ? profile.email : profile.email.replace(/(.{2}).+(@.+)/, '$1\u2022\u2022\u2022$2')}</div>
                <button onClick={() => setShowEmail(v => !v)} className="w-9 h-9 bg-[#1e2026] border border-[#2a2c33] rounded-lg flex items-center justify-center text-[#6b7280] hover:text-[#e8eaf0] transition-colors">{showEmail ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                <button onClick={() => showToast('Change email flow coming soon!')} className="flex items-center gap-1.5 bg-[#7c3aed] hover:bg-[#a855f7] text-white text-[12px] font-semibold px-3 h-9 rounded-lg transition-all">Change</button>
              </div>
            </Section>
            <Section title="Password">
              <div className="space-y-3">
                {['Current password', 'New password', 'Confirm new password'].map(label => (
                  <div key={label}><p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#6b7280] mb-1.5">{label}</p><input type="password" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" className="w-full bg-[#111214] border border-[#2a2c33] focus:border-[#7c3aed] text-[#e8eaf0] font-mono text-[13px] px-3 h-[38px] rounded-lg outline-none transition-colors placeholder-[#2a2c33]" /></div>
                ))}
                <div className="flex justify-end pt-1"><button onClick={() => showToast('Password updated!')} className="flex items-center gap-1.5 bg-[#7c3aed] hover:bg-[#a855f7] text-white text-[12.5px] font-semibold px-5 py-2 rounded-xl transition-all"><Check size={13} /> Update password</button></div>
              </div>
            </Section>
            <Section title="Two-factor authentication">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[13px] font-semibold">
                    {mfaStatus === 'loading' ? 'Checking MFA status...' : twoFA ? '2FA is enabled' : '2FA is disabled'}
                  </p>
                  <p className="font-mono text-[11px] text-[#6b7280] mt-0.5">
                    {mfaStatus === 'loading' ? 'Please wait...' : twoFA ? 'Authenticator app connected.' : 'Strongly recommended for workspace owners.'}
                  </p>
                </div>
                <button 
                  onClick={handleToggle2FA} 
                  disabled={isToggling2FA || mfaLoading || mfaStatus === 'loading'}
                  className={['flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-lg transition-all disabled:opacity-50', twoFA ? 'bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)] text-[#ef4444]' : 'bg-[#7c3aed] hover:bg-[#a855f7] text-white'].join(' ')}
                >
                  {(isToggling2FA || mfaLoading) ? <Loader2 size={13} className="animate-spin" /> : <Shield size={13} />}
                  {isToggling2FA ? 'Updating...' : (twoFA ? 'Disable 2FA' : 'Enable 2FA')}
                </button>
              </div>

              {twoFA && !showMfaSetup && (
                <div className="flex items-center gap-2 p-3 bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.2)] rounded-xl">
                  <Check size={13} className="text-[#10b981] shrink-0" />
                  <p className="font-mono text-[11px] text-[#10b981]">Authenticator app verified and active</p>
                </div>
              )}

              {/* MFA Setup Panel with QR Code */}
              {showMfaSetup && !twoFA && (
                <div className="mt-2 p-5 bg-[#111214] border border-[#2a2c33] rounded-xl relative" style={{ animation: 'fadeIn 0.3s ease' }}>
                  <button onClick={() => setShowMfaSetup(false)} className="absolute top-3 right-3 text-[#6b7280] hover:text-[#e8eaf0] transition-colors"><X size={14} /></button>
                  
                  <h3 className="text-[14px] font-bold mb-1">Configure Authenticator App</h3>
                  <p className="text-[11px] text-[#6b7280] mb-5 font-mono">Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.) then enter the 6-digit code.</p>
                  
                  <div className="flex flex-col items-center gap-4">
                    {mfaLoading && !mfaQrCode ? (
                      <div className="w-[180px] h-[180px] bg-[#1a1b20] rounded-xl flex items-center justify-center border border-[#2a2c33]">
                        <Loader2 size={24} className="animate-spin text-[#6b7280]" />
                      </div>
                    ) : mfaQrCode ? (
                      <>
                        <div className="bg-white p-3 rounded-xl shadow-lg" dangerouslySetInnerHTML={{ __html: mfaQrCode }} />
                        
                        {/* Manual entry URI */}
                        {mfaUri && (
                          <div className="w-full max-w-[320px]">
                            <p className="font-mono text-[9px] uppercase tracking-widest text-[#33363f] mb-1.5 text-center">Can't scan? Copy this key:</p>
                            <div className="flex items-center gap-1.5 bg-[#1a1b20] border border-[#2a2c33] rounded-lg px-3 py-2">
                              <code className="flex-1 font-mono text-[10px] text-[#6b7280] truncate select-all">{mfaUri}</code>
                              <button onClick={() => { navigator.clipboard.writeText(mfaUri); showToast('Key copied!'); }} className="text-[#6b7280] hover:text-[#a855f7] transition-colors shrink-0">
                                <Copy size={12} />
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : mfaError ? (
                      <div className="w-[180px] h-[180px] bg-[#1a1b20] rounded-xl flex flex-col items-center justify-center border border-[rgba(239,68,68,0.2)] gap-2 px-4">
                        <AlertTriangle size={20} className="text-[#ef4444]" />
                        <p className="font-mono text-[10px] text-[#ef4444] text-center">{mfaError}</p>
                        <button onClick={handleEnableMfa} className="font-mono text-[10px] text-[#a855f7] hover:underline mt-1">Try again</button>
                      </div>
                    ) : null}

                    {/* Verification code input */}
                    {mfaQrCode && (
                      <div className="w-full max-w-[240px] space-y-3 mt-2">
                        <p className="font-mono text-[9px] uppercase tracking-widest text-[#33363f] text-center">Enter 6-digit code</p>
                        <input 
                          type="text" 
                          placeholder="000 000" 
                          maxLength={6}
                          value={mfaCode} 
                          onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                          className="w-full text-center tracking-[0.4em] bg-[#1a1b20] border border-[#2a2c33] focus:border-[#7c3aed] text-[#e8eaf0] font-mono text-[18px] px-3 h-[46px] rounded-lg outline-none transition-colors placeholder-[#33363f]" 
                        />
                        {mfaError && <p className="text-[#ef4444] text-[11px] font-mono text-center">{mfaError}</p>}
                        <button 
                          onClick={handleVerifyMfa} 
                          disabled={mfaCode.length !== 6 || mfaLoading}
                          className="w-full flex justify-center items-center gap-2 bg-[#7c3aed] hover:bg-[#a855f7] text-white text-[12.5px] font-semibold h-[42px] rounded-lg transition-all disabled:opacity-50"
                        >
                          {mfaLoading && <Loader2 size={14} className="animate-spin" />} Verify & Enable
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Section>
            <div className="bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.2)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4"><AlertTriangle size={14} className="text-[#ef4444]" /><p className="font-mono text-[10px] uppercase tracking-widest text-[#ef4444]">Danger zone</p></div>
              <div className="flex items-center justify-between">
                <div><p className="text-[13px] font-semibold">Delete account</p><p className="font-mono text-[11px] text-[#6b7280] mt-0.5">Permanently deletes your account and transfers workspace ownership.</p></div>
                <button onClick={() => showToast('Account deletion requires confirmation via email')} className="flex items-center gap-1.5 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[#ef4444] text-[12.5px] font-semibold px-4 py-2 rounded-lg hover:bg-[rgba(239,68,68,0.18)] transition-all"><Trash2 size={13} /> Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="max-w-[680px] mx-auto px-8 py-4">
            <NotificationSettings />
          </div>
        )}

        {/* ID CARD REQUESTS TAB */}
        {activeTab === 'id_requests' && (
          <div className="max-w-[680px] mx-auto px-8 py-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)] flex items-center justify-center">
                <CreditCard size={16} className="text-[#f59e0b]" />
              </div>
              <div>
                <h2 className="text-[20px] font-black text-[#e8eaf0]">ID Card Requests</h2>
                <p className="font-mono text-[11px] text-[#6b7280]">Review and manage member ID card requests</p>
              </div>
            </div>

            {loadingRequests ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw size={18} className="animate-spin text-[#6b7280]" />
              </div>
            ) : idRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#18191d] border border-[#2a2c33] flex items-center justify-center">
                  <CreditCard size={24} className="text-[#33363f]" />
                </div>
                <div className="text-center">
                  <p className="text-[15px] font-bold text-[#e8eaf0] mb-1">No pending requests</p>
                  <p className="font-mono text-[11px] text-[#6b7280] max-w-[300px]">
                    When members request an ID card, they'll appear here for your review.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 mt-6">
                {idRequests.map(req => {
                  const u = Array.isArray(req.users) ? req.users[0] : req.users;
                  if (!u) return null;
                  const avatarStr = (u.display_name || u.username || 'U')[0].toUpperCase();
                  const color = u.avatar_gradient || GRADIENT_PRESETS[0];
                  const requestDate = req.created_at ? new Date(req.created_at).toLocaleDateString() : '';
                  return (
                    <div key={req.id} className="flex items-center gap-3 px-4 py-4 bg-[#18191d] border border-[rgba(245,158,11,0.2)] rounded-xl relative overflow-hidden group hover:border-[rgba(245,158,11,0.35)] transition-colors">
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#f59e0b]" />
                      <div className="relative shrink-0 ml-2">
                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-[14px] font-bold text-white shadow-md" style={{ background: color }}>{avatarStr}</div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#18191d]" style={{ background: STATUS_CONFIG[(u.status || 'offline') as Status]?.color || '#6b7280' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold text-[#e8eaf0]">{u.display_name || u.username}</p>
                        <p className="font-mono text-[11px] text-[#8b92a5] truncate">{u.email}</p>
                        {requestDate && <p className="font-mono text-[9px] text-[#33363f] mt-0.5">Requested {requestDate}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => rejectIdCard(req.id)} disabled={loadingRequests} className="flex items-center gap-1.5 bg-[#1e2026] hover:bg-[rgba(239,68,68,0.15)] text-[#ef4444] text-[12px] font-bold px-3 h-9 rounded-lg transition-all border border-[#2a2c33] hover:border-[rgba(239,68,68,0.3)]">
                          <X size={13} strokeWidth={2.5} /> Reject
                        </button>
                        <button onClick={() => issueIdCard(req.id)} disabled={loadingRequests} className="flex items-center gap-1.5 bg-[#f59e0b] hover:bg-[#d97706] text-[#0e0f11] text-[12px] font-bold px-4 h-9 rounded-lg transition-all shadow-sm">
                          <Check size={14} color="#0e0f11" strokeWidth={3} /> Issue ID
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* APPEARANCE TAB */}
        {activeTab === 'appearance' && (
          <div className="max-w-[680px] mx-auto px-8 py-4">
            <AppearanceSettings />
          </div>
        )}

        {/* PRIVACY TAB */}
        {activeTab === 'privacy' && (
          <div className="max-w-[680px] mx-auto px-8 py-4">
            <PrivacySettings />
          </div>
        )}

        {/* BILLING TAB */}
        {activeTab === 'billing' && (
          <div className="w-full max-w-[940px] mx-auto px-4">
             <Billing user={user} />
          </div>
        )}
      </div>

      {/* Channel settings modal */}
      {channelModal && (<ChannelSettingsModal ch={channelModal} onClose={() => setChannelModal(null)} onSave={saveChannelSettings} onDelete={deleteChannel} />)}

      {/* Toast */}
      {toast && (<div className="fixed bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#1e2026] border border-[#33363f] rounded-xl px-4 py-2.5 text-[#e8eaf0] font-semibold text-[13px] shadow-2xl z-50" style={{ animation: 'fadeIn 0.22s ease' }}><Check size={13} className="text-[#10b981]" />{toast}</div>)}

      <style>{`@keyframes fadeIn { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}

// ── ChannelRow sub-component ─────────────────────────────────────────────────
function ChannelRow({ ch, selected, onClick, onMute, onSettings, onMarkRead }: {
  ch: Channel; selected: boolean;
  onClick: () => void; onMute: () => void;
  onSettings: () => void; onMarkRead: () => void;
}) {
  const [hover, setHover] = React.useState(false);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      className={['flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all mb-1.5', selected ? 'bg-[#111214] border border-[rgba(124,58,237,0.4)]' : 'bg-[#111214] border border-[#2a2c33] hover:border-[#33363f]'].join(' ')}>
      <div className={['w-8 h-8 rounded-lg flex items-center justify-center shrink-0', ch.type === 'private' ? 'bg-[rgba(168,85,247,0.12)]' : 'bg-[rgba(59,130,246,0.12)]'].join(' ')} onClick={onClick}>
        {ch.type === 'private' ? <Lock size={13} className="text-[#a855f7]" /> : <Hash size={13} className="text-[#3b82f6]" />}
      </div>
      <div className="flex-1 min-w-0" onClick={onClick}>
        <div className="flex items-center gap-2">
          <p className={['text-[13px] font-semibold', ch.muted ? 'text-[#6b7280]' : ''].join(' ')}>#{ch.name}</p>
          {ch.type === 'private' && <span className="font-mono text-[9px] px-1 py-0.5 rounded bg-[rgba(168,85,247,0.1)] text-[#a855f7] border border-[rgba(168,85,247,0.2)]">private</span>}
          {ch.muted && <BellOff size={10} className="text-[#33363f]" />}
        </div>
        {ch.topic && !hover && <p className="font-mono text-[10px] text-[#33363f] truncate">{ch.topic}</p>}
        {!ch.topic && <p className="font-mono text-[10px] text-[#6b7280]">{ch.members} members</p>}
      </div>
      {hover ? (
        <div className="flex items-center gap-1 shrink-0" style={{ animation: 'fadeIn 0.1s ease' }}>
          <button onClick={e => { e.stopPropagation(); onMarkRead(); }} title="Mark as read" className="w-6 h-6 flex items-center justify-center rounded text-[#6b7280] hover:text-[#10b981] hover:bg-[rgba(16,185,129,0.1)] transition-all"><Check size={11} /></button>
          <button onClick={e => { e.stopPropagation(); onMute(); }} title={ch.muted ? 'Unmute' : 'Mute'} className="w-6 h-6 flex items-center justify-center rounded text-[#6b7280] hover:text-[#f59e0b] hover:bg-[rgba(245,158,11,0.1)] transition-all">{ch.muted ? <Bell size={11} /> : <BellOff size={11} />}</button>
          <button onClick={e => { e.stopPropagation(); onSettings(); }} title="Channel settings" className="w-6 h-6 flex items-center justify-center rounded text-[#6b7280] hover:text-[#a855f7] hover:bg-[rgba(168,85,247,0.1)] transition-all"><Settings size={11} /></button>
        </div>
      ) : (
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right"><p className="font-mono text-[12px] font-bold" style={{ color: '#a855f7' }}>{ch.msgs.toLocaleString()}</p><p className="font-mono text-[9px] text-[#6b7280]">messages</p></div>
          {ch.unread > 0 && (<div className="w-5 h-5 bg-[#ef4444] rounded-full flex items-center justify-center"><span className="font-mono text-[9px] font-bold text-white">{ch.unread > 9 ? '9+' : ch.unread}</span></div>)}
        </div>
      )}
    </div>
  );
}

// ── Channel Settings Modal ─────────────────────────────────────────────────────
function ChannelSettingsModal({ ch, onClose, onSave, onDelete }: {
  ch: Channel; onClose: () => void;
  onSave: (updated: Channel) => void; onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = React.useState<Channel>({ ...ch });
  const [tab, setTab] = React.useState<'general' | 'danger'>('general');
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[#16171b] border border-[#2a2c33] rounded-2xl w-[480px] shadow-2xl overflow-hidden" style={{ animation: 'fadeIn 0.2s cubic-bezier(0.34,1.2,0.64,1)' }}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2a2c33]">
          <div className={['w-8 h-8 rounded-lg flex items-center justify-center shrink-0', ch.type === 'private' ? 'bg-[rgba(168,85,247,0.12)]' : 'bg-[rgba(59,130,246,0.12)]'].join(' ')}>
            {ch.type === 'private' ? <Lock size={14} className="text-[#a855f7]" /> : <Hash size={14} className="text-[#3b82f6]" />}
          </div>
          <p className="text-[15px] font-bold flex-1">#{ch.name} \u00b7 Settings</p>
          <button onClick={onClose} className="w-7 h-7 bg-[#1e2026] border border-[#2a2c33] rounded-lg flex items-center justify-center text-[#6b7280] hover:text-[#e8eaf0] transition-colors"><X size={14} /></button>
        </div>
        <div className="flex border-b border-[#2a2c33]">
          {(['general', 'danger'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={['flex-1 py-2.5 font-mono text-[11px] uppercase tracking-wider capitalize transition-colors', tab === t ? 'text-[#c084fc] border-b-2 border-[#7c3aed]' : 'text-[#6b7280] hover:text-[#e8eaf0]'].join(' ')}>{t === 'danger' ? 'Danger zone' : t}</button>
          ))}
        </div>
        <div className="px-5 py-5">
          {tab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#6b7280] mb-1.5">Channel name</label>
                <div className="flex items-center border border-[#2a2c33] focus-within:border-[#7c3aed] rounded-lg overflow-hidden bg-[#111214] transition-colors">
                  <span className="px-3 font-mono text-[14px] text-[#a855f7] h-10 flex items-center border-r border-[#2a2c33] bg-[#18191d]">#</span>
                  <input value={draft.name} onChange={e => setDraft(p => ({ ...p, name: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} className="flex-1 bg-transparent border-none outline-none font-mono text-[13px] text-[#e8eaf0] px-3 h-10" />
                </div>
              </div>
              <div>
                <label className="block font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#6b7280] mb-1.5">Description</label>
                <input value={draft.description} onChange={e => setDraft(p => ({ ...p, description: e.target.value }))} placeholder="What's this channel about?" className="w-full bg-[#111214] border border-[#2a2c33] focus:border-[#7c3aed] text-[#e8eaf0] font-mono text-[13px] px-3 h-10 rounded-lg outline-none transition-colors placeholder-[#33363f]" />
              </div>
              <div>
                <label className="block font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#6b7280] mb-1.5">Channel topic</label>
                <input value={draft.topic} onChange={e => setDraft(p => ({ ...p, topic: e.target.value }))} placeholder="Current focus or pinned info" className="w-full bg-[#111214] border border-[#2a2c33] focus:border-[#7c3aed] text-[#e8eaf0] font-mono text-[13px] px-3 h-10 rounded-lg outline-none transition-colors placeholder-[#33363f]" />
              </div>
              <div>
                <label className="block font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#6b7280] mb-1.5">Visibility</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['public', 'private'] as const).map(t => (
                    <button key={t} onClick={() => setDraft(p => ({ ...p, type: t }))} className={['flex items-center gap-2 p-3 rounded-xl border transition-all', draft.type === t ? 'border-[#7c3aed] bg-[rgba(124,58,237,0.1)]' : 'border-[#2a2c33] bg-[#111214] hover:border-[#33363f]'].join(' ')}>
                      {t === 'private' ? <Lock size={13} className="text-[#a855f7]" /> : <Hash size={13} className="text-[#3b82f6]" />}
                      <div className="text-left"><p className="text-[12.5px] font-semibold capitalize">{t}</p><p className="font-mono text-[9.5px] text-[#6b7280]">{t === 'private' ? 'Invite only' : 'Anyone can join'}</p></div>
                      {draft.type === t && <Check size={12} className="text-[#7c3aed] ml-auto shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between py-2.5 border-t border-[#1e2026]">
                <div><p className="text-[13px] font-semibold">Mute channel</p><p className="font-mono text-[10.5px] text-[#6b7280]">Suppress all notifications</p></div>
                <button onClick={() => setDraft(p => ({ ...p, muted: !p.muted }))} className={['relative w-10 h-[22px] rounded-full transition-all duration-200', draft.muted ? 'bg-[#7c3aed]' : 'bg-[#2a2c33]'].join(' ')}><div className={['absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-all duration-200', draft.muted ? 'left-[22px]' : 'left-[3px]'].join(' ')} /></button>
              </div>
              <div className="flex items-center justify-between py-2.5 border-t border-[#1e2026]">
                <div><p className="text-[13px] font-semibold">Pin channel</p><p className="font-mono text-[10.5px] text-[#6b7280]">Show at top of channel list</p></div>
                <button onClick={() => setDraft(p => ({ ...p, pinned: !p.pinned }))} className={['relative w-10 h-[22px] rounded-full transition-all duration-200', draft.pinned ? 'bg-[#7c3aed]' : 'bg-[#2a2c33]'].join(' ')}><div className={['absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-all duration-200', draft.pinned ? 'left-[22px]' : 'left-[3px]'].join(' ')} /></button>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={onClose} className="bg-[#1e2026] border border-[#2a2c33] text-[#6b7280] hover:text-[#e8eaf0] text-[12.5px] font-semibold px-4 py-2 rounded-xl transition-colors">Cancel</button>
                <button onClick={() => onSave(draft)} className="flex items-center gap-1.5 bg-[#7c3aed] hover:bg-[#a855f7] text-white text-[12.5px] font-semibold px-5 py-2 rounded-xl transition-all"><Check size={13} /> Save changes</button>
              </div>
            </div>
          )}
          {tab === 'danger' && (
            <div className="space-y-3">
              <div className="p-4 bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.2)] rounded-xl">
                <p className="text-[13.5px] font-bold text-[#ef4444] mb-1">Delete #{ch.name}</p>
                <p className="font-mono text-[11.5px] text-[#6b7280] mb-3">All messages and files will be permanently deleted. This cannot be undone.</p>
                {!confirmDelete
                  ? <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.3)] text-[#ef4444] text-[12.5px] font-semibold px-4 py-2 rounded-xl hover:bg-[rgba(239,68,68,0.2)] transition-all"><Trash2 size={13} /> Delete channel</button>
                  : <div className="space-y-2">
                    <p className="font-mono text-[11px] text-[#ef4444] font-bold">Are you sure? Type DELETE to confirm.</p>
                    <div className="flex gap-2">
                      <button onClick={() => onDelete(ch.id)} className="flex items-center gap-1.5 bg-[#ef4444] hover:bg-red-400 text-white text-[12.5px] font-semibold px-4 py-2 rounded-xl transition-all"><Trash2 size={13} /> Yes, delete forever</button>
                      <button onClick={() => setConfirmDelete(false)} className="text-[#6b7280] hover:text-[#e8eaf0] text-[12.5px] font-semibold px-4 py-2 rounded-xl border border-[#2a2c33] transition-colors">Cancel</button>
                    </div>
                  </div>
                }
              </div>
              <div className="p-4 bg-[#111214] border border-[#2a2c33] rounded-xl">
                <p className="text-[13px] font-semibold mb-1">Archive #{ch.name}</p>
                <p className="font-mono text-[11.5px] text-[#6b7280] mb-3">Channel becomes read-only. Members can still view history.</p>
                <button onClick={() => { onClose(); }} className="flex items-center gap-1.5 bg-[#1e2026] border border-[#2a2c33] text-[#6b7280] hover:text-[#e8eaf0] text-[12.5px] font-semibold px-4 py-2 rounded-xl transition-all">Archive channel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Inline icon stubs ──────────────────────────────────────────────────────────
function TwitterIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="#1da1f2"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>;
}
function GithubIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="#e8eaf0"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" /></svg>;
}

export default OwnerProfilePage