'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell, MessageSquare, AtSign, Heart, UserPlus, GitPullRequest,
  CheckCircle2, AlertCircle, Star, Trash2, Archive, Filter,
  Search, RefreshCw, Settings, ChevronDown, X, Check, Eye,
  EyeOff, Clock, TrendingUp, Users, Zap, MoreHorizontal,
  Pin, Volume2, VolumeX, Circle, ArrowRight, Hash, Lock, Loader2,
} from 'lucide-react';
import { useAuth } from '@/database';

// ── Types ─────────────────────────────────────────────────────────────────────
type ActivityType =
  | 'mention' | 'message' | 'reaction' | 'thread_reply'
  | 'channel_invite' | 'task_assigned' | 'pr_review'
  | 'milestone' | 'system';

type Priority = 'high' | 'medium' | 'low';

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  body: string;
  actor: { name: string; avatar: string; color: string };
  channel?: string;
  channelPrivate?: boolean;
  timestamp: Date;
  read: boolean;
  pinned: boolean;
  priority: Priority;
  actionUrl?: string;
  meta?: Record<string, string>;
}

type FilterType = 'all' | 'unread' | 'mentions' | 'threads' | 'reactions' | 'tasks' | 'pinned';

// ── Seed data ─────────────────────────────────────────────────────────────────
function seedActivities(): Activity[] {
  const now = new Date();
  const ago = (m: number) => new Date(now.getTime() - m * 60_000);

  return [
    {
      id: 'a1', type: 'mention', priority: 'high', read: false, pinned: true,
      title: 'Arjun Sharma mentioned you',
      body: 'Hey @you can you review the new onboarding flow before the 3pm standup? Need your sign-off on the copy.',
      actor: { name: 'Arjun Sharma', avatar: 'AS', color: '#7c3aed' },
      channel: 'design-review', timestamp: ago(4),
    },
    {
      id: 'a2', type: 'thread_reply', priority: 'high', read: false, pinned: false,
      title: 'Priya Nair replied in a thread',
      body: 'The API latency issue has been traced to the Redis cache expiry. Fix is ready to merge.',
      actor: { name: 'Priya Nair', avatar: 'PN', color: '#10b981' },
      channel: 'backend-infra', timestamp: ago(12),
    },
    {
      id: 'a3', type: 'task_assigned', priority: 'high', read: false, pinned: false,
      title: 'Task assigned to you',
      body: 'Write integration test suite for the payment webhook handler — due Friday.',
      actor: { name: 'Meera Das', avatar: 'MD', color: '#f59e0b' },
      channel: 'engineering', timestamp: ago(28),
      meta: { due: 'Friday', project: 'Q3 Payments' },
    },
    {
      id: 'a4', type: 'pr_review', priority: 'medium', read: false, pinned: false,
      title: 'PR review requested',
      body: 'feat: add Supabase realtime subscriptions to workspace channels (#142)',
      actor: { name: 'Ravi Kumar', avatar: 'RK', color: '#3b82f6' },
      channel: 'github', timestamp: ago(45),
      meta: { pr: '#142', status: 'Awaiting review' },
    },
    {
      id: 'a5', type: 'mention', priority: 'medium', read: false, pinned: false,
      title: 'Sneha Rao mentioned you',
      body: '@you the Figma handoff for sprint 14 is done. Dropping the link here for everyone.',
      actor: { name: 'Sneha Rao', avatar: 'SR', color: '#ec4899' },
      channel: 'product', timestamp: ago(62),
    },
    {
      id: 'a6', type: 'reaction', priority: 'low', read: true, pinned: false,
      title: '4 people reacted to your message',
      body: 'Your message "The new channel layout ships today!" got reactions from Arjun, Priya, Meera and 1 other.',
      actor: { name: 'Arjun Sharma', avatar: 'AS', color: '#7c3aed' },
      channel: 'announcements', timestamp: ago(90),
    },
    {
      id: 'a7', type: 'channel_invite', priority: 'medium', read: true, pinned: false,
      title: 'You were added to a channel',
      body: 'Ravi Kumar added you to #q4-planning. This channel has 14 members.',
      actor: { name: 'Ravi Kumar', avatar: 'RK', color: '#3b82f6' },
      channel: 'q4-planning', channelPrivate: true, timestamp: ago(140),
    },
    {
      id: 'a8', type: 'message', priority: 'low', read: true, pinned: false,
      title: 'New message in #general',
      body: 'Lunch is here in the kitchen. First come first served — we got biryani today.',
      actor: { name: 'Kabir Singh', avatar: 'KS', color: '#06b6d4' },
      channel: 'general', timestamp: ago(175),
    },
    {
      id: 'a9', type: 'milestone', priority: 'high', read: false, pinned: false,
      title: 'Milestone reached',
      body: 'DevTalk just hit 1,000 messages in the workspace this week. Team velocity is up 34%.',
      actor: { name: 'DevTalk', avatar: 'DT', color: '#a855f7' },
      timestamp: ago(220),
      meta: { milestone: '1,000 messages', growth: '+34%' },
    },
    {
      id: 'a10', type: 'thread_reply', priority: 'medium', read: true, pinned: false,
      title: 'Meera Das replied in a thread',
      body: 'Confirmed — the staging environment is back up. The deploy pipeline was blocked by a stale lock file.',
      actor: { name: 'Meera Das', avatar: 'MD', color: '#f59e0b' },
      channel: 'devops', timestamp: ago(300),
    },
    {
      id: 'a11', type: 'task_assigned', priority: 'medium', read: true, pinned: false,
      title: 'Task completed',
      body: 'Arjun completed "Update onboarding copy for v2 launch" — marked done.',
      actor: { name: 'Arjun Sharma', avatar: 'AS', color: '#7c3aed' },
      channel: 'design', timestamp: ago(420),
      meta: { project: 'Launch Prep' },
    },
    {
      id: 'a12', type: 'system', priority: 'low', read: true, pinned: false,
      title: 'Workspace settings updated',
      body: 'Two-factor authentication has been enforced for all workspace members by the admin.',
      actor: { name: 'System', avatar: 'SY', color: '#6b7280' },
      timestamp: ago(600),
    },
  ];
}

// ── Icon map ──────────────────────────────────────────────────────────────────
const TYPE_ICON: Record<ActivityType, { icon: React.ReactNode; color: string; bg: string }> = {
  mention:        { icon: <AtSign size={13}/>,        color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  message:        { icon: <MessageSquare size={13}/>, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  reaction:       { icon: <Heart size={13}/>,         color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
  thread_reply:   { icon: <MessageSquare size={13}/>, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  channel_invite: { icon: <UserPlus size={13}/>,      color: '#06b6d4', bg: 'rgba(6,182,212,0.12)'  },
  task_assigned:  { icon: <CheckCircle2 size={13}/>,  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  pr_review:      { icon: <GitPullRequest size={13}/>,color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  milestone:      { icon: <Star size={13}/>,          color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  system:         { icon: <Zap size={13}/>,           color: '#6b7280', bg: 'rgba(107,114,128,0.12)'},
};

const PRIORITY_DOT: Record<Priority, string> = {
  high:   'bg-[#ef4444]',
  medium: 'bg-[#f59e0b]',
  low:    'bg-[#33363f]',
};

const FILTERS: { key: FilterType; label: string; icon: React.ReactNode }[] = [
  { key: 'all',       label: 'All',       icon: <Bell size={13}/>           },
  { key: 'unread',    label: 'Unread',    icon: <Circle size={13}/>         },
  { key: 'mentions',  label: 'Mentions',  icon: <AtSign size={13}/>         },
  { key: 'threads',   label: 'Threads',   icon: <MessageSquare size={13}/>  },
  { key: 'reactions', label: 'Reactions', icon: <Heart size={13}/>          },
  { key: 'tasks',     label: 'Tasks',     icon: <CheckCircle2 size={13}/>   },
  { key: 'pinned',    label: 'Pinned',    icon: <Pin size={13}/>            },
];

// ── Time formatter ────────────────────────────────────────────────────────────
function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

function groupByDate(activities: Activity[]): { label: string; items: Activity[] }[] {
  const now = new Date();
  const todayStart   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400_000);
  const weekStart    = new Date(todayStart.getTime() - 6 * 86400_000);

  const groups: Record<string, Activity[]> = { Today:[], Yesterday:[], 'This week':[], Earlier:[] };

  for (const a of activities) {
    if      (a.timestamp >= todayStart)      groups['Today'].push(a);
    else if (a.timestamp >= yesterdayStart)  groups['Yesterday'].push(a);
    else if (a.timestamp >= weekStart)       groups['This week'].push(a);
    else                                     groups['Earlier'].push(a);
  }

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ActivityPage({ user }: { user: any }) {
  const { supabase } = useAuth();
  const [activities, setActivities]     = useState<Activity[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [filter,     setFilter]         = useState<FilterType>('all');
  const [search,     setSearch]         = useState('');
  const [selected,   setSelected]       = useState<Activity | null>(null);
  const [muted,      setMuted]          = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [refreshing, setRefreshing]     = useState(false);
  const [liveToast,  setLiveToast]      = useState<string | null>(null);
  const [notifPrefs, setNotifPrefs]     = useState({
    mentions: true, threads: true, reactions: false,
    tasks: true, milestones: true, system: false,
  });

  const fetchNotifications = useCallback(async () => {
    if (!user || !supabase) return;
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*, actor:actor_id(display_name, username, avatar_gradient, role)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      // Table may not exist yet — fall back to seed data
      console.warn('Notifications table not available, using seed data');
      setActivities(seedActivities());
      setIsLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      // No notifications yet — show seed data for demo
      setActivities(seedActivities());
      setIsLoading(false);
      return;
    }

    const formatted = (data || []).map((n: any) => ({
      id: n.id,
      type: n.type as ActivityType,
      title: n.title,
      body: n.body || '',
      read: n.is_read,
      pinned: n.is_pinned,
      priority: (n.meta?.priority || 'medium') as Priority,
      timestamp: new Date(n.created_at),
      actor: {
        name: n.actor?.display_name || 'System',
        avatar: (n.actor?.display_name || 'S')[0].toUpperCase(),
        color: n.actor?.avatar_gradient || '#6b7280'
      },
      channel: n.channel_id,
      meta: n.meta
    }));

    setActivities(formatted);
    setIsLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchNotifications();

    if (!supabase) return;

    // Subscribe to real-time changes
    const channel = supabase
      .channel('notifications_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id, supabase, fetchNotifications]);

  const unreadCount = activities.filter(a => !a.read).length;

  // ── Derived list ──────────────────────────────────────────────────────────
  const filtered = activities.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q) || a.actor.name.toLowerCase().includes(q);
    if (!matchSearch) return false;
    switch (filter) {
      case 'unread':    return !a.read;
      case 'mentions':  return a.type === 'mention';
      case 'threads':   return a.type === 'thread_reply';
      case 'reactions': return a.type === 'reaction';
      case 'tasks':     return a.type === 'task_assigned' || a.type === 'pr_review';
      case 'pinned':    return a.pinned;
      default:          return true;
    }
  });

  const groups = groupByDate(filtered);

  // ── Actions ───────────────────────────────────────────────────────────────
  async function markRead(id: string) {
    if (!supabase) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) console.error('Error marking read:', error);
  }
  async function markAllRead() {
    if (!supabase) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id);

    if (error) console.error('Error marking all read:', error);
  }
  async function togglePin(id: string) {
    if (!supabase) return;
    const activity = activities.find(a => a.id === id);
    if (!activity) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_pinned: !activity.pinned })
      .eq('id', id);

    if (error) console.error('Error toggling pin:', error);
  }
  async function dismiss(id: string) {
    if (!supabase) return;
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error dismissing notification:', error);
      return;
    }
    if (selected?.id === id) setSelected(null);
  }
  function dismissAll() {
    // This could also be a DB delete if needed
    setActivities(prev => prev.filter(a => a.read === false && a.pinned));
  }
  function clearAll() {
    // Warning: this could be destructive if it deletes from DB
    setActivities([]);
    setSelected(null);
  }

  function openActivity(a: Activity) {
    setSelected(a);
    if (!a.read) markRead(a.id);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = [
    { label:'Unread',   val: activities.filter(a=>!a.read).length,                          color:'#a855f7' },
    { label:'Mentions', val: activities.filter(a=>a.type==='mention').length,               color:'#ec4899' },
    { label:'Tasks',    val: activities.filter(a=>a.type==='task_assigned').length,         color:'#f59e0b' },
    { label:'Pinned',   val: activities.filter(a=>a.pinned).length,                         color:'#3b82f6' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#111214] text-[#e8eaf0] overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2c33] shrink-0">
        <div className="flex items-center gap-3">
          <Bell size={18} className="text-[#a855f7]"/>
          <h1 className="text-[16px] font-bold tracking-tight">Activity</h1>
          {unreadCount > 0 && (
            <span className="bg-[#7c3aed] text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="flex items-center gap-2 bg-[#18191d] border border-[#2a2c33] rounded-lg px-3 py-1.5 w-[190px] focus-within:border-[#7c3aed] transition-colors">
            <Search size={12} className="text-[#6b7280] shrink-0"/>
            <input type="text" placeholder="Search activity..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-[#e8eaf0] text-[12px] w-full placeholder-[#6b7280] font-mono"/>
          </div>
          {/* Refresh */}
          <button onClick={handleRefresh}
            className={`w-8 h-8 bg-[#18191d] border border-[#2a2c33] rounded-lg flex items-center justify-center text-[#6b7280] hover:text-[#e8eaf0] hover:border-[#33363f] transition-all ${refreshing ? 'animate-spin' : ''}`}>
            <RefreshCw size={13}/>
          </button>
          {/* Mute */}
          <button onClick={() => setMuted(m => !m)}
            className={`w-8 h-8 bg-[#18191d] border rounded-lg flex items-center justify-center transition-all
              ${muted ? 'border-[#f59e0b] text-[#f59e0b]' : 'border-[#2a2c33] text-[#6b7280] hover:text-[#e8eaf0] hover:border-[#33363f]'}`}
            title={muted ? 'Notifications muted' : 'Mute notifications'}>
            {muted ? <VolumeX size={13}/> : <Volume2 size={13}/>}
          </button>
          {/* Settings */}
          <button onClick={() => setShowSettings(true)}
            className="w-8 h-8 bg-[#18191d] border border-[#2a2c33] rounded-lg flex items-center justify-center text-[#6b7280] hover:text-[#e8eaf0] hover:border-[#33363f] transition-all">
            <Settings size={13}/>
          </button>
          {/* Mark all read */}
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="flex items-center gap-1.5 bg-[#18191d] border border-[#2a2c33] hover:border-[#7c3aed] text-[#6b7280] hover:text-[#c084fc] text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all font-mono">
              <Check size={12}/> Mark all read
            </button>
          )}
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-4 gap-2.5 px-6 py-3 border-b border-[#2a2c33] shrink-0">
        {stats.map(({ label, val, color }) => (
          <div key={label} className="bg-[#18191d] border border-[#2a2c33] rounded-lg px-3 py-2 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280]">{label}</span>
            <span className="text-[18px] font-extrabold leading-none tracking-tight" style={{ color }}>{val}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: filter sidebar + feed ── */}
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Filter tabs */}
          <div className="flex items-center gap-1 px-6 py-2.5 border-b border-[#2a2c33] shrink-0 overflow-x-auto">
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`flex items-center gap-1.5 font-mono text-[11px] px-3 py-1.5 rounded-lg shrink-0 transition-all
                  ${filter===f.key
                    ? 'bg-[rgba(124,58,237,0.18)] text-[#c084fc] border border-[rgba(124,58,237,0.35)]'
                    : 'text-[#6b7280] hover:text-[#e8eaf0] hover:bg-[#18191d]'}`}>
                {f.icon}{f.label}
                {f.key === 'unread' && unreadCount > 0 && (
                  <span className="bg-[#7c3aed] text-white text-[9px] font-bold px-1 rounded-full">{unreadCount}</span>
                )}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-1.5 shrink-0">
              {filtered.length > 0 && (
                <button onClick={clearAll}
                  className="flex items-center gap-1 font-mono text-[10.5px] text-[#6b7280] hover:text-[#ef4444] transition-colors px-2 py-1 rounded">
                  <Trash2 size={11}/> Clear all
                </button>
              )}
            </div>
          </div>

          {/* Feed */}
          <div className="flex flex-1 overflow-hidden">
            <div className={`flex-1 overflow-y-auto ${selected ? 'border-r border-[#2a2c33]' : ''}`}>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-[#6b7280]">
                  <Loader2 size={36} className="animate-spin opacity-20"/>
                  <p className="font-mono text-[11px]">Loading activity...</p>
                </div>
              ) : groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-[#6b7280]">
                  <Bell size={36} className="opacity-20"/>
                  <div className="text-center">
                    <p className="font-semibold text-[14px] text-[#33363f]">
                      {filter === 'all' ? 'No recent activity' : `No ${filter} notifications`}
                    </p>
                    <p className="font-mono text-[11px] mt-1 text-[#2a2c33]">
                      {filter !== 'all' ? 'Switch to All to see everything.' : 'You\'re all caught up!'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-3">
                  {groups.map(({ label, items }) => (
                    <div key={label} className="mb-5">
                      {/* Date group header */}
                      <div className="flex items-center gap-3 mb-3 sticky top-0 bg-[#111214] py-1 z-10">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280]">{label}</span>
                        <div className="flex-1 h-px bg-[#1e2026]"/>
                        <span className="font-mono text-[9px] text-[#33363f]">{items.length} item{items.length>1?'s':''}</span>
                      </div>

                      {/* Activity items */}
                      <div className="space-y-1.5">
                        {items.map(a => (
                          <ActivityRow
                            key={a.id}
                            activity={a}
                            isSelected={selected?.id === a.id}
                            onClick={() => openActivity(a)}
                            onPin={() => togglePin(a.id)}
                            onDismiss={() => dismiss(a.id)}
                            onMarkRead={() => markRead(a.id)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Detail panel ── */}
            {selected && (
              <div className="w-[360px] shrink-0 flex flex-col overflow-hidden bg-[#111214]"
                style={{ animation:'slideInRight 0.18s ease' }}>
                <DetailPanel
                  activity={selected}
                  onClose={() => setSelected(null)}
                  onPin={() => togglePin(selected.id)}
                  onDismiss={() => dismiss(selected.id)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Settings drawer ── */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setShowSettings(false)}/>
          <div className="w-[360px] bg-[#16171b] border-l border-[#2a2c33] flex flex-col overflow-hidden"
            style={{ animation:'slideInRight 0.22s ease' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2c33] shrink-0">
              <p className="text-[15px] font-bold">Notification Settings</p>
              <button onClick={() => setShowSettings(false)} className="w-7 h-7 bg-[#1e2026] border border-[#2a2c33] rounded-lg text-[#6b7280] hover:text-[#e8eaf0] flex items-center justify-center"><X size={14}/></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div className="flex items-center justify-between p-3 bg-[#1e2026] border border-[#2a2c33] rounded-xl">
                <div className="flex items-center gap-2">
                  {muted ? <VolumeX size={15} className="text-[#f59e0b]"/> : <Volume2 size={15} className="text-[#10b981]"/>}
                  <div>
                    <p className="text-[13px] font-semibold">{muted ? 'Notifications muted' : 'Notifications active'}</p>
                    <p className="font-mono text-[10.5px] text-[#6b7280]">Toggle all notifications at once</p>
                  </div>
                </div>
                <button onClick={() => setMuted(m=>!m)}>
                  {muted
                    ? <ToggleOff className="text-[#33363f]"/>
                    : <ToggleOn  className="text-[#7c3aed]"/>
                  }
                </button>
              </div>

              <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280] px-1">Notify me about</p>

              {(Object.keys(notifPrefs) as (keyof typeof notifPrefs)[]).map(key => (
                <div key={key} className="flex items-center justify-between bg-[#1e2026] border border-[#2a2c33] rounded-xl px-4 py-3">
                  <div>
                    <p className="text-[13px] font-semibold capitalize">{key}</p>
                    <p className="font-mono text-[10.5px] text-[#6b7280]">
                      {key==='mentions'   && 'When someone @mentions you'}
                      {key==='threads'    && 'Replies in threads you follow'}
                      {key==='reactions'  && 'Reactions to your messages'}
                      {key==='tasks'      && 'Task assignments and updates'}
                      {key==='milestones' && 'Workspace milestone events'}
                      {key==='system'     && 'System and admin notifications'}
                    </p>
                  </div>
                  <button onClick={() => setNotifPrefs(p => ({ ...p, [key]: !p[key] }))}>
                    {notifPrefs[key]
                      ? <ToggleOn  className="text-[#7c3aed]"/>
                      : <ToggleOff className="text-[#33363f]"/>
                    }
                  </button>
                </div>
              ))}

              <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280] px-1 pt-2">Danger zone</p>
              <button onClick={() => { clearAll(); setShowSettings(false); }}
                className="w-full flex items-center gap-2 bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] text-[#ef4444] rounded-xl px-4 py-3 text-[13px] font-semibold hover:bg-[rgba(239,68,68,0.14)] transition-all">
                <Trash2 size={14}/> Clear all activity
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Live toast ── */}
      {liveToast && (
        <div className="fixed bottom-5 right-5 flex items-center gap-2.5 bg-[#18191d] border border-[#7c3aed] rounded-xl px-4 py-2.5 text-[#c084fc] font-semibold text-[12.5px] shadow-2xl z-[300]"
          style={{ animation:'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>
          <Bell size={13} className="text-[#a855f7]"/>{liveToast}
        </div>
      )}

      <style>{`
        @keyframes slideInRight { from { transform:translateX(100%); } to { transform:translateX(0); } }
        @keyframes slideUp { from { transform:translateY(20px); opacity:0; } to { transform:translateY(0); opacity:1; } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
        .activity-row { animation: fadeIn 0.2s ease both; }
      `}</style>
    </div>
  );
}

// ── Toggle icons ─────────────────────────────────────────────────────────────
function ToggleOn({ className }: { className?: string }) {
  return (
    <svg width="34" height="20" viewBox="0 0 34 20" className={className}>
      <rect width="34" height="20" rx="10" fill="currentColor" opacity="0.3"/>
      <rect width="34" height="20" rx="10" fill="currentColor" opacity="0.5"/>
      <circle cx="24" cy="10" r="8" fill="currentColor"/>
    </svg>
  );
}
function ToggleOff({ className }: { className?: string }) {
  return (
    <svg width="34" height="20" viewBox="0 0 34 20" className={className}>
      <rect width="34" height="20" rx="10" fill="currentColor" opacity="0.2"/>
      <circle cx="10" cy="10" r="8" fill="currentColor"/>
    </svg>
  );
}

// ── Activity row ──────────────────────────────────────────────────────────────
function ActivityRow({
  activity: a, isSelected, onClick, onPin, onDismiss, onMarkRead,
}: {
  activity: Activity; isSelected: boolean;
  onClick: () => void; onPin: () => void;
  onDismiss: () => void; onMarkRead: () => void;
}) {
  const [hover, setHover] = useState(false);
  const meta = TYPE_ICON[a.type];

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`activity-row relative flex items-start gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-150 group
        ${isSelected
          ? 'bg-[rgba(124,58,237,0.12)] border border-[rgba(124,58,237,0.3)]'
          : 'hover:bg-[#18191d] border border-transparent hover:border-[#2a2c33]'
        }
        ${!a.read ? '' : 'opacity-75'}`}
    >
      {/* Unread dot */}
      <div className="absolute left-1.5 top-1/2 -translate-y-1/2">
        {!a.read
          ? <div className="w-1.5 h-1.5 rounded-full bg-[#7c3aed]"/>
          : <div className="w-1.5 h-1.5"/>
        }
      </div>

      {/* Avatar */}
      <div className="relative shrink-0 ml-2">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0"
          style={{ background: a.actor.color }}>
          {a.actor.avatar}
        </div>
        {/* Type badge */}
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: meta.bg, color: meta.color, border:'1.5px solid #111214' }}>
          {meta.icon}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className={`text-[13px] font-semibold truncate ${a.read ? 'text-[#9ca3af]' : 'text-[#e8eaf0]'}`}>{a.title}</p>
          {a.pinned && <Pin size={10} className="text-[#a855f7] shrink-0"/>}
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ml-auto ${PRIORITY_DOT[a.priority]}`} title={`${a.priority} priority`}/>
        </div>
        <p className="font-mono text-[11.5px] text-[#6b7280] leading-relaxed line-clamp-2">{a.body}</p>
        <div className="flex items-center gap-2 mt-1.5">
          {a.channel && (
            <span className="flex items-center gap-1 font-mono text-[10px] text-[#6b7280]">
              {a.channelPrivate ? <Lock size={9}/> : <Hash size={9}/>}{a.channel}
            </span>
          )}
          <span className="font-mono text-[10px] text-[#33363f] ml-auto flex items-center gap-1">
            <Clock size={9}/>{timeAgo(a.timestamp)}
          </span>
        </div>
      </div>

      {/* Hover actions */}
      {hover && (
        <div className="absolute right-2 top-2 flex items-center gap-1 bg-[#111214] border border-[#2a2c33] rounded-lg p-0.5"
          onClick={e => e.stopPropagation()}>
          {!a.read && (
            <button onClick={onMarkRead} title="Mark read"
              className="w-6 h-6 flex items-center justify-center text-[#6b7280] hover:text-[#10b981] rounded transition-colors">
              <Eye size={11}/>
            </button>
          )}
          <button onClick={onPin} title={a.pinned ? 'Unpin' : 'Pin'}
            className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${a.pinned ? 'text-[#a855f7]' : 'text-[#6b7280] hover:text-[#a855f7]'}`}>
            <Pin size={11}/>
          </button>
          <button onClick={onDismiss} title="Dismiss"
            className="w-6 h-6 flex items-center justify-center text-[#6b7280] hover:text-[#ef4444] rounded transition-colors">
            <X size={11}/>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Detail panel ──────────────────────────────────────────────────────────────
function DetailPanel({
  activity: a, onClose, onPin, onDismiss,
}: {
  activity: Activity; onClose: () => void;
  onPin: () => void; onDismiss: () => void;
}) {
  const meta = TYPE_ICON[a.type];

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2c33] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background:meta.bg, color:meta.color }}>{meta.icon}</div>
          <p className="text-[12px] font-semibold capitalize text-[#9ca3af]">{a.type.replace('_',' ')}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onPin}
            className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${a.pinned ? 'text-[#a855f7]' : 'text-[#6b7280] hover:text-[#a855f7]'}`}>
            <Pin size={12}/>
          </button>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center text-[#6b7280] hover:text-[#e8eaf0] rounded transition-colors"><X size={12}/></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Actor */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0"
            style={{ background:a.actor.color }}>{a.actor.avatar}</div>
          <div>
            <p className="text-[14px] font-bold">{a.actor.name}</p>
            <p className="font-mono text-[10.5px] text-[#6b7280] flex items-center gap-1">
              <Clock size={9}/> {a.timestamp.toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' })}
            </p>
          </div>
          <div className={`ml-auto text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full
            ${a.priority==='high' ? 'bg-[rgba(239,68,68,0.12)] text-[#ef4444]' : a.priority==='medium' ? 'bg-[rgba(245,158,11,0.12)] text-[#f59e0b]' : 'bg-[#1e2026] text-[#6b7280]'}`}>
            {a.priority}
          </div>
        </div>

        {/* Title + body */}
        <div className="bg-[#1e2026] border border-[#2a2c33] rounded-xl p-4">
          <p className="text-[14px] font-bold mb-2">{a.title}</p>
          <p className="font-mono text-[12px] text-[#9ca3af] leading-relaxed">{a.body}</p>
        </div>

        {/* Channel */}
        {a.channel && (
          <div className="flex items-center gap-2 bg-[#1e2026] border border-[#2a2c33] rounded-xl px-3 py-2.5">
            {a.channelPrivate ? <Lock size={12} className="text-[#6b7280]"/> : <Hash size={12} className="text-[#6b7280]"/>}
            <span className="font-mono text-[12px] text-[#e8eaf0]">#{a.channel}</span>
            <ArrowRight size={11} className="text-[#33363f] ml-auto"/>
          </div>
        )}

        {/* Meta */}
        {a.meta && (
          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280]">Details</p>
            {Object.entries(a.meta).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between bg-[#1e2026] border border-[#2a2c33] rounded-lg px-3 py-2">
                <span className="font-mono text-[11px] text-[#6b7280] capitalize">{k}</span>
                <span className="font-mono text-[11px] text-[#e8eaf0] font-semibold">{v}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280]">Actions</p>
          {a.type === 'mention' && (
            <button className="w-full flex items-center gap-2 bg-[#7c3aed] hover:bg-[#a855f7] text-white text-[12.5px] font-semibold px-4 py-2.5 rounded-xl transition-all">
              <MessageSquare size={13}/> Reply in thread
            </button>
          )}
          {a.type === 'thread_reply' && (
            <button className="w-full flex items-center gap-2 bg-[#7c3aed] hover:bg-[#a855f7] text-white text-[12.5px] font-semibold px-4 py-2.5 rounded-xl transition-all">
              <MessageSquare size={13}/> Open thread
            </button>
          )}
          {(a.type === 'task_assigned' || a.type === 'pr_review') && (
            <>
              <button className="w-full flex items-center gap-2 bg-[#7c3aed] hover:bg-[#a855f7] text-white text-[12.5px] font-semibold px-4 py-2.5 rounded-xl transition-all">
                <CheckCircle2 size={13}/> {a.type==='task_assigned' ? 'Mark complete' : 'Start review'}
              </button>
              <button className="w-full flex items-center gap-2 bg-[#1e2026] border border-[#2a2c33] hover:border-[#33363f] text-[#9ca3af] hover:text-[#e8eaf0] text-[12.5px] font-semibold px-4 py-2.5 rounded-xl transition-all">
                <ArrowRight size={13}/> Open in {a.type==='pr_review' ? 'GitHub' : 'Asana'}
              </button>
            </>
          )}
          {a.type === 'channel_invite' && (
            <button className="w-full flex items-center gap-2 bg-[#7c3aed] hover:bg-[#a855f7] text-white text-[12.5px] font-semibold px-4 py-2.5 rounded-xl transition-all">
              <Hash size={13}/> Open channel
            </button>
          )}
          <button onClick={onDismiss}
            className="w-full flex items-center gap-2 bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] hover:bg-[rgba(239,68,68,0.14)] text-[#ef4444] text-[12.5px] font-semibold px-4 py-2.5 rounded-xl transition-all">
            <Trash2 size={13}/> Dismiss notification
          </button>
        </div>
      </div>
    </div>
  );
}
