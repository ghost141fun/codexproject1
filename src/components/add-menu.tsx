'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Plus, X, Check, Hash, Lock, Globe, Users, ChevronRight,
  Search, Zap, MessageSquare, Bell, Upload, Copy, Link2,
  Settings, ArrowRight, Sparkles, Shield, Eye, EyeOff,
  Building2, UserPlus, Mail, AtSign, Crown, Star, RefreshCw,
  CheckCheck, Pencil,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
type View =
  | 'menu'
  | 'create-channel'
  | 'channel-success'
  | 'invite-people'
  | 'invite-success'
  | 'browse-channels'
  | 'create-workspace'
  | 'workspace-success';

type ChannelType = 'public' | 'private';
type InviteRole  = 'member' | 'admin' | 'guest';

interface WorkspaceChannel {
  id: string; name: string; type: ChannelType;
  description: string; members: number;
  joined: boolean; topic?: string;
}

interface WorkspaceMember {
  id: string; name: string; email: string;
  avatar: string; color: string; role: string;
  status: 'online'|'away'|'busy'|'offline';
}

// ── Initial data ───────────────────────────────────────────────────────────────
const INITIAL_CHANNELS: WorkspaceChannel[] = [
  { id:'1',  name:'general',       type:'public',  description:'Company-wide announcements and updates', members:24, joined:true,  topic:'🎉 Q4 planning is live!' },
  { id:'2',  name:'engineering',   type:'public',  description:'Engineering team discussions and code reviews', members:12, joined:true  },
  { id:'3',  name:'design-review', type:'public',  description:'Share and critique design work',         members:8,  joined:false },
  { id:'4',  name:'backend-infra', type:'public',  description:'Backend and infrastructure topics',      members:7,  joined:true  },
  { id:'5',  name:'product',       type:'public',  description:'Product strategy and roadmap planning',  members:15, joined:false },
  { id:'6',  name:'devops',        type:'public',  description:'Deployments, CI/CD, monitoring',        members:6,  joined:false },
  { id:'7',  name:'random',        type:'public',  description:'Off-topic banter and fun stuff',         members:22, joined:true  },
  { id:'8',  name:'announcements', type:'public',  description:'Important workspace-wide announcements', members:24, joined:true  },
  { id:'9',  name:'q4-planning',   type:'private', description:'Q4 OKR strategy (restricted)',           members:5,  joined:false },
  { id:'10', name:'leadership',    type:'private', description:'Leadership team discussions',             members:4,  joined:false },
];

const WORKSPACE_MEMBERS: WorkspaceMember[] = [
  { id:'p1', name:'Arjun Sharma',  email:'arjun@devtalk.dev',  avatar:'AS', color:'#7c3aed', role:'Product Manager',   status:'online'  },
  { id:'p2', name:'Priya Nair',    email:'priya@devtalk.dev',  avatar:'PN', color:'#10b981', role:'Backend Engineer',  status:'online'  },
  { id:'p3', name:'Meera Das',     email:'meera@devtalk.dev',  avatar:'MD', color:'#f59e0b', role:'UX Designer',       status:'away'    },
  { id:'p4', name:'Ravi Kumar',    email:'ravi@devtalk.dev',   avatar:'RK', color:'#3b82f6', role:'DevOps Engineer',   status:'busy'    },
  { id:'p5', name:'Sneha Rao',     email:'sneha@devtalk.dev',  avatar:'SR', color:'#ec4899', role:'Frontend Engineer', status:'offline' },
  { id:'p6', name:'Kabir Singh',   email:'kabir@devtalk.dev',  avatar:'KS', color:'#06b6d4', role:'Data Analyst',      status:'online'  },
  { id:'p7', name:'Divya Menon',   email:'divya@devtalk.dev',  avatar:'DM', color:'#8b5cf6', role:'QA Engineer',       status:'away'    },
];

const STATUS_DOT: Record<string, string> = {
  online:'#10b981', away:'#f59e0b', busy:'#ef4444', offline:'#6b7280',
};

const WS_TEMPLATES = [
  { id:'eng',     emoji:'⚙️', name:'Engineering Team',   desc:'Sprints, infra, code reviews, on-call',  channels:['engineering','backend-infra','devops','design-review'] },
  { id:'product', emoji:'🎯', name:'Product & Design',   desc:'Roadmaps, design crits, user research',  channels:['product','design-review','announcements','random']      },
  { id:'startup', emoji:'🚀', name:'Startup Workspace',  desc:'All-in-one for fast-moving teams',       channels:['general','engineering','product','random']              },
  { id:'blank',   emoji:'✨', name:'Start from scratch', desc:'Empty workspace you build yourself',      channels:[]                                                        },
];

const WS_EMOJI_LIST = ['🏢','🚀','⚡','💡','🎯','🔮','🛸','🌊','🔥','💎','🏆','🦄','🌟','🎪','🏗️'];

const ROLE_CONFIG: Record<InviteRole, { label:string; desc:string; color:string }> = {
  member: { label:'Member',    desc:'Standard access to channels and messages',    color:'#3b82f6' },
  admin:  { label:'Admin',     desc:'Can manage members, channels and settings',   color:'#a855f7' },
  guest:  { label:'Guest',     desc:'Limited access to specific channels only',    color:'#6b7280' },
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'').replace(/^-+|-+$/g,'');
}

// ─────────────────────────────────────────────────────────────────────────────
export function AddMenu({ onClose, onChannelCreated, onWorkspaceCreated, onMembersInvited }: {
  onClose?:            () => void;
  onChannelCreated?:   (ch: WorkspaceChannel) => void;
  onWorkspaceCreated?: (ws: { name:string; emoji:string; slug:string }) => void;
  onMembersInvited?:   (emails: string[]) => void;
}) {
  const [view,         setView]         = useState<View>('menu');
  const [channels,     setChannels]     = useState<WorkspaceChannel[]>(INITIAL_CHANNELS);
  const [toast,        setToast]        = useState<string|null>(null);

  // ── Channel creation ────────────────────────────────────────────────────────
  const [chName,       setChName]       = useState('');
  const [chDesc,       setChDesc]       = useState('');
  const [chTopic,      setChTopic]      = useState('');
  const [chType,       setChType]       = useState<ChannelType>('public');
  const [chCreated,    setChCreated]    = useState<WorkspaceChannel|null>(null);
  const [chLoading,    setChLoading]    = useState(false);

  // ── Invite ──────────────────────────────────────────────────────────────────
  const [invEmail,     setInvEmail]     = useState('');
  const [invRole,      setInvRole]      = useState<InviteRole>('member');
  const [invitees,     setInvitees]     = useState<WorkspaceMember[]>([]);
  const [invSearch,    setInvSearch]    = useState('');
  const [invLoading,   setInvLoading]   = useState(false);
  const [invCopied,    setInvCopied]    = useState(false);
  const [invSent,      setInvSent]      = useState<string[]>([]);
  const [invChannel,   setInvChannel]   = useState<string>('');

  // ── Browse ──────────────────────────────────────────────────────────────────
  const [brSearch,     setBrSearch]     = useState('');
  const [brFilter,     setBrFilter]     = useState<'all'|'joined'|'public'|'private'>('all');
  const [brJoining,    setBrJoining]    = useState<string|null>(null);

  // ── Workspace ───────────────────────────────────────────────────────────────
  const [wsStep,       setWsStep]       = useState<1|2|3>(1);
  const [wsName,       setWsName]       = useState('');
  const [wsEmoji,      setWsEmoji]      = useState('🏢');
  const [wsTemplate,   setWsTemplate]   = useState('blank');
  const [wsCreated,    setWsCreated]    = useState<{name:string;emoji:string;slug:string}|null>(null);
  const [wsLoading,    setWsLoading]    = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, [view]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function close() { onClose?.(); }

  // ── Create channel ──────────────────────────────────────────────────────────
  function createChannel() {
    if (!chName.trim()) return;
    setChLoading(true);
    setTimeout(() => {
      const newCh: WorkspaceChannel = {
        id:          String(Date.now()),
        name:        slugify(chName),
        type:        chType,
        description: chDesc,
        topic:       chTopic,
        members:     1,
        joined:      true,
      };
      setChannels(prev => [newCh, ...prev]);
      setChCreated(newCh);
      setChLoading(false);
      setView('channel-success');
      onChannelCreated?.(newCh);
      showToast('#' + newCh.name + ' created!');
    }, 900);
  }

  // ── Join / leave channel ────────────────────────────────────────────────────
  function toggleJoin(id: string) {
    setBrJoining(id);
    setTimeout(() => {
      setChannels(prev => prev.map(c => {
        if (c.id !== id) return c;
        const joining = !c.joined;
        showToast(joining ? 'Joined #' + c.name : 'Left #' + c.name);
        return { ...c, joined: joining, members: joining ? c.members+1 : c.members-1 };
      }));
      setBrJoining(null);
    }, 500);
  }

  // ── Invite ──────────────────────────────────────────────────────────────────
  function addEmail() {
    const e = invEmail.trim();
    if (!e) return;
    if (e.includes('@')) {
      const synth: WorkspaceMember = {
        id:'ext-'+Date.now(), name:e, email:e,
        avatar:e[0].toUpperCase(), color:'#6b7280',
        role:'External', status:'offline',
      };
      setInvitees(prev => prev.find(i=>i.email===e) ? prev : [...prev, synth]);
      setInvEmail('');
    }
  }

  function toggleInvitee(m: WorkspaceMember) {
    setInvitees(prev =>
      prev.find(i=>i.id===m.id) ? prev.filter(i=>i.id!==m.id) : [...prev, m]
    );
  }

  function sendInvites() {
    if (invitees.length === 0) return;
    setInvLoading(true);
    setTimeout(() => {
      const emails = invitees.map(i => i.email);
      setInvSent(emails);
      setInvLoading(false);
      setView('invite-success');
      onMembersInvited?.(emails);
    }, 1000);
  }

  function copyInviteLink() {
    const link = 'https://devtalk.dev/invite/ws-' + Math.random().toString(36).slice(2,8);
    navigator.clipboard?.writeText(link).catch(()=>{});
    setInvCopied(true);
    setTimeout(() => setInvCopied(false), 2500);
    showToast('Invite link copied!');
  }

  // ── Create workspace ────────────────────────────────────────────────────────
  function createWorkspace() {
    if (!wsName.trim()) return;
    setWsLoading(true);
    setTimeout(() => {
      const ws = { name:wsName, emoji:wsEmoji, slug:slugify(wsName) };
      setWsCreated(ws);
      setWsLoading(false);
      setView('workspace-success');
      onWorkspaceCreated?.(ws);
      showToast(wsEmoji + ' ' + wsName + ' workspace created!');
    }, 1100);
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  const filteredBrowse = channels.filter(c => {
    const q = brSearch.toLowerCase();
    const matchQ = !q || c.name.includes(q) || c.description.toLowerCase().includes(q);
    const matchF =
      brFilter==='all'     ? true :
      brFilter==='joined'  ? c.joined :
      brFilter==='public'  ? c.type==='public' :
      c.type==='private';
    return matchQ && matchF;
  });

  const filteredMembers = WORKSPACE_MEMBERS.filter(m => {
    const q = invSearch.toLowerCase();
    return !q || m.name.toLowerCase().includes(q) || m.email.includes(q);
  });

  const joinedCount   = channels.filter(c=>c.joined).length;
  const publicCount   = channels.filter(c=>c.type==='public').length;
  const privateCount  = channels.filter(c=>c.type==='private').length;
  const chSlug        = slugify(chName);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) close(); }}
    >

      {/* ══════ MAIN MENU ══════ */}
      {view === 'menu' && (
        <div className="bg-[#16171b] border border-[#2a2c33] rounded-2xl w-[420px] shadow-2xl overflow-hidden"
          style={{ animation:'amSlide 0.2s cubic-bezier(0.34,1.2,0.64,1)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2c33]">
            <div>
              <p className="text-[16px] font-bold">Add to DevTalk</p>
              <p className="font-mono text-[10.5px] text-[#6b7280] mt-0.5">
                {joinedCount} channels joined · {WORKSPACE_MEMBERS.length} members
              </p>
            </div>
            <button onClick={close}
              className="w-7 h-7 bg-[#1e2026] border border-[#2a2c33] rounded-lg flex items-center justify-center text-[#6b7280] hover:text-[#e8eaf0] transition-colors">
              <X size={14}/>
            </button>
          </div>

          <div className="p-2.5 space-y-1">
            {[
              {
                icon: <Hash size={19} className="text-[#7c3aed]"/>,
                bg:   'rgba(124,58,237,0.14)',
                label:'Create a channel',
                desc: 'Start a new public or private channel for your team',
                badge: null,
                go:   () => setView('create-channel'),
              },
              {
                icon: <UserPlus size={19} className="text-[#10b981]"/>,
                bg:   'rgba(16,185,129,0.14)',
                label:'Invite people',
                desc: 'Add teammates to your DevTalk workspace',
                badge: WORKSPACE_MEMBERS.length + ' members',
                go:   () => setView('invite-people'),
              },
              {
                icon: <Search size={19} className="text-[#3b82f6]"/>,
                bg:   'rgba(59,130,246,0.14)',
                label:'Browse channels',
                desc: 'Explore and join channels in your workspace',
                badge: channels.length + ' channels',
                go:   () => setView('browse-channels'),
              },
              {
                icon: <Building2 size={19} className="text-[#f59e0b]"/>,
                bg:   'rgba(245,158,11,0.14)',
                label:'Create a workspace',
                desc: 'Start a brand new workspace for a team or project',
                badge: null,
                go:   () => { setWsStep(1); setView('create-workspace'); },
              },
            ].map(item => (
              <button key={item.label} onClick={item.go}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-[#1e2026] transition-all text-left group">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                  style={{ background: item.bg }}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-semibold">{item.label}</p>
                    {item.badge && (
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full bg-[#1e2026] text-[#6b7280] border border-[#2a2c33]">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-[11.5px] text-[#6b7280] mt-0.5">{item.desc}</p>
                </div>
                <ChevronRight size={15} className="text-[#33363f] group-hover:text-[#a855f7] transition-colors shrink-0"/>
              </button>
            ))}
          </div>

          <div className="px-5 py-3 border-t border-[#2a2c33]">
            <p className="font-mono text-[10px] text-[#33363f] text-center">
              DevTalk workspace · {WORKSPACE_MEMBERS.length} members · {channels.length} channels
            </p>
          </div>
        </div>
      )}

      {/* ══════ CREATE CHANNEL ══════ */}
      {view === 'create-channel' && (
        <div className="bg-[#16171b] border border-[#2a2c33] rounded-2xl w-[500px] shadow-2xl overflow-hidden"
          style={{ animation:'amSlide 0.18s ease' }}>
          <ModalHeader title="Create a channel" onBack={() => setView('menu')} onClose={close}/>

          <div className="px-6 py-5 space-y-5">
            {/* Name */}
            <div>
              <Label>Channel name</Label>
              <div className="flex items-center border border-[#2a2c33] focus-within:border-[#7c3aed] rounded-lg overflow-hidden bg-[#111214] transition-colors">
                <span className="px-3 font-mono text-[15px] text-[#a855f7] h-[40px] flex items-center border-r border-[#2a2c33] bg-[#1a1b1f] select-none">#</span>
                <input ref={inputRef} type="text" value={chName}
                  onChange={e => setChName(e.target.value.replace(/[^a-zA-Z0-9\s-_]/g,''))}
                  onBlur={e => setChName(slugify(e.target.value))}
                  placeholder="e.g. design-review"
                  maxLength={80}
                  className="flex-1 bg-transparent border-none outline-none font-mono text-[13px] text-[#e8eaf0] px-3 h-[40px] placeholder-[#33363f]"/>
                {chName && (
                  <span className="font-mono text-[10px] text-[#33363f] px-2">{chSlug.length}/80</span>
                )}
              </div>
              <p className="font-mono text-[10.5px] text-[#33363f] mt-1">Lowercase letters, numbers and hyphens only</p>
            </div>

            {/* Description */}
            <div>
              <Label optional>Description</Label>
              <input type="text" value={chDesc} onChange={e => setChDesc(e.target.value)}
                placeholder="What's this channel about?"
                className="w-full bg-[#111214] border border-[#2a2c33] focus:border-[#7c3aed] text-[#e8eaf0] font-mono text-[13px] px-3 h-[40px] rounded-lg outline-none transition-colors placeholder-[#33363f]"/>
            </div>

            {/* Topic */}
            <div>
              <Label optional>Channel topic</Label>
              <input type="text" value={chTopic} onChange={e => setChTopic(e.target.value)}
                placeholder="Set a topic to show at the top of the channel"
                className="w-full bg-[#111214] border border-[#2a2c33] focus:border-[#7c3aed] text-[#e8eaf0] font-mono text-[13px] px-3 h-[40px] rounded-lg outline-none transition-colors placeholder-[#33363f]"/>
            </div>

            {/* Type */}
            <div>
              <Label>Channel type</Label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { key:'public'  as ChannelType, icon:<Globe size={15}/>,  title:'Public',  desc:'Anyone can join and read', color:'#3b82f6' },
                  { key:'private' as ChannelType, icon:<Lock size={15}/>,   title:'Private', desc:'Invite-only access',        color:'#a855f7' },
                ]).map(opt => (
                  <button key={opt.key} onClick={() => setChType(opt.key)}
                    className={[
                      'flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left',
                      chType===opt.key ? 'border-[#7c3aed] bg-[rgba(124,58,237,0.1)]' : 'border-[#2a2c33] bg-[#111214] hover:border-[#33363f]',
                    ].join(' ')}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background:opt.color+'20', color:opt.color }}>{opt.icon}</div>
                    <div>
                      <p className="text-[13px] font-semibold">{opt.title}</p>
                      <p className="font-mono text-[10.5px] text-[#6b7280]">{opt.desc}</p>
                    </div>
                    {chType===opt.key && <Check size={13} className="text-[#7c3aed] ml-auto shrink-0"/>}
                  </button>
                ))}
              </div>
            </div>

            {/* Live preview */}
            {chName && (
              <div className="flex items-center gap-2.5 px-4 py-3 bg-[rgba(124,58,237,0.07)] border border-[rgba(124,58,237,0.2)] rounded-xl"
                style={{ animation:'amFade 0.15s ease' }}>
                {chType==='private' ? <Lock size={13} className="text-[#a855f7] shrink-0"/> : <Hash size={13} className="text-[#a855f7] shrink-0"/>}
                <div>
                  <span className="font-mono text-[12.5px] text-[#c084fc] font-semibold">#{chSlug}</span>
                  {chDesc && <span className="font-mono text-[11px] text-[#6b7280] ml-2">— {chDesc}</span>}
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-1">
              <GhostBtn onClick={() => setView('menu')}>Cancel</GhostBtn>
              <PrimaryBtn onClick={createChannel} disabled={!chName.trim()} loading={chLoading}>
                <Hash size={13}/> Create channel
              </PrimaryBtn>
            </div>
          </div>
        </div>
      )}

      {/* ══════ CHANNEL SUCCESS ══════ */}
      {view === 'channel-success' && chCreated && (
        <div className="bg-[#16171b] border border-[#2a2c33] rounded-2xl w-[440px] shadow-2xl overflow-hidden"
          style={{ animation:'amSlide 0.22s cubic-bezier(0.34,1.4,0.64,1)' }}>
          <ModalHeader title="Channel created" onClose={close}/>
          <div className="px-6 py-8 text-center">
            {/* Animated success ring */}
            <div className="relative w-20 h-20 mx-auto mb-5">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{ background:'rgba(124,58,237,0.15)' }}>
                {chCreated.type==='private'
                  ? <Lock size={30} className="text-[#a855f7]"/>
                  : <Hash size={30} className="text-[#a855f7]"/>}
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#10b981] flex items-center justify-center border-2 border-[#16171b]">
                <Check size={12} className="text-white" strokeWidth={3}/>
              </div>
            </div>

            <p className="text-[18px] font-bold mb-1">
              #{chCreated.name} is live!
            </p>
            <p className="font-mono text-[12px] text-[#6b7280] mb-1">
              Your {chCreated.type} channel has been created.
            </p>
            {chCreated.description && (
              <p className="font-mono text-[11.5px] text-[#33363f] mb-5">{chCreated.description}</p>
            )}

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { icon:<UserPlus size={13}/>,    label:'Invite members', action:() => setView('invite-people') },
                { icon:<Settings size={13}/>,    label:'Channel settings', action: close },
                { icon:<Pencil size={13}/>,      label:'Set a topic',   action: close },
                { icon:<ArrowRight size={13}/>,  label:'Open channel',  action: close },
              ].map(a => (
                <button key={a.label} onClick={a.action}
                  className="flex items-center gap-2 px-3 py-2.5 bg-[#1e2026] border border-[#2a2c33] hover:border-[#7c3aed] hover:text-[#c084fc] rounded-xl transition-all text-left text-[12.5px] font-medium">
                  <span className="text-[#6b7280]">{a.icon}</span>{a.label}
                </button>
              ))}
            </div>

            <button onClick={close}
              className="w-full flex items-center justify-center gap-1.5 bg-[#7c3aed] hover:bg-[#a855f7] text-white text-[13px] font-semibold h-10 rounded-xl transition-all">
              <ArrowRight size={14}/> Go to #{chCreated.name}
            </button>
          </div>
        </div>
      )}

      {/* ══════ INVITE PEOPLE ══════ */}
      {view === 'invite-people' && (
        <div className="bg-[#16171b] border border-[#2a2c33] rounded-2xl w-[540px] shadow-2xl overflow-hidden"
          style={{ animation:'amSlide 0.18s ease' }}>
          <ModalHeader title="Invite people" onBack={() => setView('menu')} onClose={close}/>

          <div className="px-5 py-4 space-y-4">
            {/* Email input */}
            <div>
              <Label>Email address</Label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center border border-[#2a2c33] focus-within:border-[#7c3aed] rounded-lg overflow-hidden bg-[#111214] transition-colors">
                  <Mail size={13} className="ml-3 text-[#6b7280] shrink-0"/>
                  <input ref={inputRef} type="email" value={invEmail}
                    onChange={e => setInvEmail(e.target.value)}
                    onKeyDown={e => e.key==='Enter' && addEmail()}
                    placeholder="colleague@company.com"
                    className="flex-1 bg-transparent border-none outline-none font-mono text-[12.5px] text-[#e8eaf0] px-2.5 h-[40px] placeholder-[#33363f]"/>
                </div>
                <button onClick={addEmail} disabled={!invEmail.includes('@')}
                  className="flex items-center gap-1.5 bg-[#7c3aed] hover:bg-[#a855f7] disabled:opacity-40 text-white text-[12px] font-semibold px-3.5 h-[40px] rounded-lg transition-all shrink-0">
                  <Plus size={13}/> Add
                </button>
              </div>
            </div>

            {/* Invitees chips */}
            {invitees.length > 0 && (
              <div className="flex gap-1.5 flex-wrap p-3 bg-[#111214] border border-[#2a2c33] rounded-xl min-h-[48px]"
                style={{ animation:'amFade 0.15s ease' }}>
                {invitees.map(i => (
                  <div key={i.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1e2026] border border-[#2a2c33] rounded-full">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                      style={{ background:i.color }}>{i.avatar[0]}</div>
                    <span className="font-mono text-[11px] text-[#e8eaf0]">{i.name.split(' ')[0]}</span>
                    <button onClick={() => setInvitees(p=>p.filter(x=>x.id!==i.id))}
                      className="text-[#6b7280] hover:text-[#ef4444] transition-colors ml-0.5">
                      <X size={9}/>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Role */}
            <div>
              <Label>Invite as</Label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(ROLE_CONFIG) as [InviteRole, typeof ROLE_CONFIG[InviteRole]][]).map(([key, cfg]) => (
                  <button key={key} onClick={() => setInvRole(key)}
                    className={[
                      'p-3 rounded-xl border transition-all text-left',
                      invRole===key ? 'border-[#7c3aed] bg-[rgba(124,58,237,0.1)]' : 'border-[#2a2c33] bg-[#111214] hover:border-[#33363f]',
                    ].join(' ')}>
                    <p className={['text-[12px] font-bold mb-0.5', invRole===key?'text-[#c084fc]':'text-[#e8eaf0]'].join(' ')}>{cfg.label}</p>
                    <p className="font-mono text-[9.5px] text-[#6b7280] leading-relaxed">{cfg.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Channel selector */}
            <div>
              <Label optional>Add to a channel</Label>
              <select value={invChannel} onChange={e => setInvChannel(e.target.value)}
                className="w-full bg-[#111214] border border-[#2a2c33] focus:border-[#7c3aed] text-[#e8eaf0] font-mono text-[12.5px] px-3 h-[40px] rounded-lg outline-none transition-colors">
                <option value="">No specific channel</option>
                {channels.filter(c=>c.joined).map(c => (
                  <option key={c.id} value={c.id}>#{c.name}</option>
                ))}
              </select>
            </div>

            {/* Member suggestions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Workspace members</Label>
                <div className="flex items-center gap-1.5 bg-[#111214] border border-[#2a2c33] rounded-lg px-2 py-1 focus-within:border-[#7c3aed] transition-colors">
                  <Search size={10} className="text-[#6b7280]"/>
                  <input type="text" value={invSearch} onChange={e => setInvSearch(e.target.value)}
                    placeholder="search..." className="bg-transparent border-none outline-none font-mono text-[11px] text-[#e8eaf0] w-20 placeholder-[#33363f]"/>
                </div>
              </div>
              <div className="space-y-0.5 max-h-[190px] overflow-y-auto rounded-xl border border-[#2a2c33] bg-[#111214]">
                {filteredMembers.map(m => {
                  const added = !!invitees.find(i=>i.id===m.id);
                  return (
                    <button key={m.id} onClick={() => toggleInvitee(m)}
                      className={[
                        'w-full flex items-center gap-3 px-3 py-2.5 transition-all text-left',
                        added ? 'bg-[rgba(124,58,237,0.08)]' : 'hover:bg-[#1e2026]',
                      ].join(' ')}>
                      <div className="relative shrink-0">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                          style={{ background:m.color }}>{m.avatar}</div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#111214]"
                          style={{ background:STATUS_DOT[m.status] }}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-semibold truncate">{m.name}</p>
                        <p className="font-mono text-[10px] text-[#6b7280] truncate">{m.role}</p>
                      </div>
                      <div className={[
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
                        added ? 'bg-[#7c3aed] border-[#7c3aed]' : 'border-[#33363f]',
                      ].join(' ')}>
                        {added && <Check size={10} className="text-white" strokeWidth={3}/>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Invite link */}
            <div className="flex items-center gap-2.5 px-3.5 py-3 bg-[#111214] border border-[#2a2c33] rounded-xl">
              <Link2 size={13} className="text-[#6b7280] shrink-0"/>
              <span className="font-mono text-[11px] text-[#6b7280] flex-1 truncate">
                devtalk.dev/invite/ws-••••••
              </span>
              <button onClick={copyInviteLink}
                className={[
                  'flex items-center gap-1.5 font-mono text-[11px] font-semibold transition-colors shrink-0',
                  invCopied ? 'text-[#10b981]' : 'text-[#a855f7] hover:text-[#c084fc]',
                ].join(' ')}>
                {invCopied ? <><CheckCheck size={11}/> Copied!</> : <><Copy size={11}/> Copy link</>}
              </button>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <GhostBtn onClick={() => setView('menu')}>Cancel</GhostBtn>
              <PrimaryBtn onClick={sendInvites} disabled={invitees.length===0} loading={invLoading}>
                <Mail size={13}/>
                Send {invitees.length > 0 ? invitees.length + ' ' : ''}invite{invitees.length!==1?'s':''}
              </PrimaryBtn>
            </div>
          </div>
        </div>
      )}

      {/* ══════ INVITE SUCCESS ══════ */}
      {view === 'invite-success' && (
        <div className="bg-[#16171b] border border-[#2a2c33] rounded-2xl w-[420px] shadow-2xl overflow-hidden"
          style={{ animation:'amSlide 0.22s cubic-bezier(0.34,1.4,0.64,1)' }}>
          <ModalHeader title="Invites sent" onClose={close}/>
          <div className="px-6 py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[rgba(16,185,129,0.15)] flex items-center justify-center mx-auto mb-4 border-2 border-[rgba(16,185,129,0.3)]">
              <CheckCheck size={26} className="text-[#10b981]"/>
            </div>
            <p className="text-[17px] font-bold mb-1">Invitations sent!</p>
            <p className="font-mono text-[12px] text-[#6b7280] mb-5">
              {invSent.length} {invSent.length===1?'person':'people'} will receive an invite email shortly.
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center mb-6">
              {invitees.map(i => (
                <div key={i.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1e2026] border border-[#2a2c33] rounded-full">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                    style={{ background:i.color }}>{i.avatar[0]}</div>
                  <span className="font-mono text-[11px]">{i.name.split(' ')[0]}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-center">
              <button onClick={() => { setInvitees([]); setView('invite-people'); }}
                className="flex items-center gap-1.5 bg-[#1e2026] border border-[#2a2c33] hover:border-[#7c3aed] text-[#e8eaf0] text-[12.5px] font-semibold px-4 py-2 rounded-xl transition-all">
                <UserPlus size={13}/> Invite more
              </button>
              <button onClick={close}
                className="flex items-center gap-1.5 bg-[#7c3aed] hover:bg-[#a855f7] text-white text-[12.5px] font-semibold px-5 py-2 rounded-xl transition-all">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════ BROWSE CHANNELS ══════ */}
      {view === 'browse-channels' && (
        <div className="bg-[#16171b] border border-[#2a2c33] rounded-2xl w-[560px] shadow-2xl overflow-hidden"
          style={{ animation:'amSlide 0.18s ease' }}>
          <ModalHeader title="Browse channels" onBack={() => setView('menu')} onClose={close}
            subtitle={joinedCount + ' joined · ' + publicCount + ' public · ' + privateCount + ' private'}/>

          {/* Search */}
          <div className="px-4 py-3 border-b border-[#2a2c33]">
            <div className="flex items-center gap-2 bg-[#111214] border border-[#2a2c33] focus-within:border-[#7c3aed] rounded-lg px-3 py-2 transition-colors">
              <Search size={13} className="text-[#6b7280] shrink-0"/>
              <input ref={inputRef} type="text" value={brSearch}
                onChange={e => setBrSearch(e.target.value)}
                placeholder="Search channels by name or topic..."
                className="flex-1 bg-transparent border-none outline-none font-mono text-[13px] text-[#e8eaf0] placeholder-[#33363f]"/>
              {brSearch && (
                <button onClick={() => setBrSearch('')} className="text-[#6b7280] hover:text-[#e8eaf0] transition-colors">
                  <X size={12}/>
                </button>
              )}
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 px-4 py-2 border-b border-[#2a2c33]">
            {([
              { key:'all',     label:'All',     count:channels.length     },
              { key:'joined',  label:'Joined',  count:joinedCount          },
              { key:'public',  label:'Public',  count:publicCount          },
              { key:'private', label:'Private', count:privateCount         },
            ] as const).map(f => (
              <button key={f.key} onClick={() => setBrFilter(f.key)}
                className={[
                  'flex items-center gap-1.5 px-3 py-1 rounded-lg font-mono text-[11px] transition-all',
                  brFilter===f.key ? 'bg-[rgba(124,58,237,0.18)] text-[#c084fc]' : 'text-[#6b7280] hover:text-[#e8eaf0] hover:bg-[#1e2026]',
                ].join(' ')}>
                {f.label}
                <span className={['px-1.5 py-0.5 rounded-full text-[9px]', brFilter===f.key?'bg-[rgba(124,58,237,0.3)]':'bg-[#1e2026]'].join(' ')}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          {/* Channel rows */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-[#1a1c1e]">
            {filteredBrowse.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-[#6b7280]">
                <Search size={24} className="opacity-30"/>
                <p className="font-mono text-[12px]">No channels found</p>
              </div>
            ) : filteredBrowse.map(ch => {
              const isJoining = brJoining === ch.id;
              return (
                <div key={ch.id} className="flex items-center gap-3 px-5 py-4 hover:bg-[#1a1c1e] transition-colors group">
                  <div className={[
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    ch.type==='private' ? 'bg-[rgba(168,85,247,0.12)]' : 'bg-[rgba(59,130,246,0.12)]',
                  ].join(' ')}>
                    {ch.type==='private'
                      ? <Lock size={16} className="text-[#a855f7]"/>
                      : <Hash size={16} className="text-[#3b82f6]"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13.5px] font-semibold">#{ch.name}</p>
                      {ch.type==='private' && (
                        <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[rgba(168,85,247,0.1)] text-[#a855f7] border border-[rgba(168,85,247,0.25)]">private</span>
                      )}
                      {ch.joined && (
                        <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[rgba(16,185,129,0.1)] text-[#10b981] border border-[rgba(16,185,129,0.25)]">joined</span>
                      )}
                    </div>
                    <p className="font-mono text-[11px] text-[#6b7280] truncate">{ch.description}</p>
                    {ch.topic && (
                      <p className="font-mono text-[10.5px] text-[#33363f] truncate mt-0.5">📌 {ch.topic}</p>
                    )}
                    <p className="font-mono text-[10px] text-[#2a2c33] mt-0.5">{ch.members} member{ch.members!==1?'s':''}</p>
                  </div>
                  <button onClick={() => toggleJoin(ch.id)} disabled={isJoining}
                    className={[
                      'shrink-0 font-semibold text-[12px] px-4 py-1.5 rounded-lg border transition-all min-w-[76px] flex items-center justify-center gap-1.5',
                      isJoining ? 'opacity-60 cursor-wait' :
                      ch.joined
                        ? 'bg-[rgba(16,185,129,0.1)] text-[#10b981] border-[rgba(16,185,129,0.3)] hover:bg-[rgba(239,68,68,0.1)] hover:text-[#ef4444] hover:border-[rgba(239,68,68,0.3)]'
                        : 'bg-[#7c3aed] text-white border-transparent hover:bg-[#a855f7]',
                    ].join(' ')}>
                    {isJoining
                      ? <RefreshCw size={12} className="animate-spin"/>
                      : ch.joined ? 'Joined ✓' : '+ Join'
                    }
                  </button>
                </div>
              );
            })}
          </div>

          <div className="px-5 py-3.5 border-t border-[#2a2c33] flex items-center justify-between bg-[#111214]">
            <p className="font-mono text-[10.5px] text-[#6b7280]">
              {filteredBrowse.length} of {channels.length} channels
            </p>
            <button onClick={() => setView('create-channel')}
              className="flex items-center gap-1.5 font-mono text-[11px] text-[#a855f7] hover:text-[#c084fc] transition-colors">
              <Plus size={11}/> Create channel
            </button>
          </div>
        </div>
      )}

      {/* ══════ CREATE WORKSPACE ══════ */}
      {view === 'create-workspace' && (
        <div className="bg-[#16171b] border border-[#2a2c33] rounded-2xl w-[500px] shadow-2xl overflow-hidden"
          style={{ animation:'amSlide 0.18s ease' }}>
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2a2c33]">
            <button onClick={() => wsStep===1 ? setView('menu') : setWsStep(s => (s-1) as 1|2)}
              className="font-mono text-[11.5px] text-[#6b7280] hover:text-[#e8eaf0] transition-colors">← Back</button>
            <p className="text-[15px] font-bold">Create workspace</p>
            <div className="flex items-center gap-1 ml-auto mr-2">
              {[1,2].map(s => (
                <div key={s} className={[
                  'h-1.5 rounded-full transition-all duration-300',
                  wsStep>=s ? 'bg-[#7c3aed] w-6' : 'bg-[#2a2c33] w-3',
                ].join(' ')}/>
              ))}
            </div>
            <button onClick={close} className="w-7 h-7 bg-[#1e2026] border border-[#2a2c33] rounded-lg flex items-center justify-center text-[#6b7280] hover:text-[#e8eaf0] transition-colors">
              <X size={14}/>
            </button>
          </div>

          {/* Step 1 — Name & identity */}
          {wsStep === 1 && (
            <div className="px-6 py-5 space-y-5">
              <div>
                <p className="text-[15px] font-bold mb-0.5">Name your workspace</p>
                <p className="font-mono text-[11.5px] text-[#6b7280]">You can always change this later.</p>
              </div>

              {/* Emoji picker */}
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[rgba(124,58,237,0.12)] flex items-center justify-center text-3xl cursor-pointer hover:scale-105 transition-transform border border-[rgba(124,58,237,0.2)] hover:border-[rgba(124,58,237,0.4)]"
                    onClick={() => setWsEmoji(WS_EMOJI_LIST[Math.floor(Math.random()*WS_EMOJI_LIST.length)])}>
                    {wsEmoji}
                  </div>
                  <p className="font-mono text-[9px] text-[#33363f] mt-1">click to change</p>
                </div>
                <div className="flex-1">
                  <Label>Workspace name</Label>
                  <input ref={inputRef} type="text" value={wsName}
                    onChange={e => setWsName(e.target.value)}
                    placeholder="e.g. Acme Engineering..."
                    maxLength={50}
                    className="w-full bg-[#111214] border border-[#2a2c33] focus:border-[#7c3aed] text-[#e8eaf0] font-mono text-[13px] px-3 h-[40px] rounded-lg outline-none transition-colors placeholder-[#33363f]"/>
                  {wsName && (
                    <p className="font-mono text-[10.5px] text-[#33363f] mt-1">
                      devtalk.dev/<span className="text-[#a855f7]">{slugify(wsName) || '...'}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Emoji grid */}
              <div>
                <p className="font-mono text-[10px] text-[#6b7280] mb-2">Or pick one:</p>
                <div className="flex flex-wrap gap-1.5">
                  {WS_EMOJI_LIST.map(e => (
                    <button key={e} onClick={() => setWsEmoji(e)}
                      className={[
                        'w-9 h-9 rounded-lg text-xl transition-all hover:scale-110',
                        wsEmoji===e ? 'ring-2 ring-[#7c3aed] bg-[rgba(124,58,237,0.15)]' : 'bg-[#1e2026] hover:bg-[#2a2c33]',
                      ].join(' ')}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => wsName.trim() && setWsStep(2)} disabled={!wsName.trim()}
                className="w-full flex items-center justify-center gap-1.5 bg-[#7c3aed] hover:bg-[#a855f7] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[13px] font-semibold h-10 rounded-xl transition-all">
                Continue <ArrowRight size={14}/>
              </button>
            </div>
          )}

          {/* Step 2 — Template */}
          {wsStep === 2 && (
            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="text-[15px] font-bold mb-0.5">What's <span className="text-[#a855f7]">{wsEmoji} {wsName}</span> for?</p>
                <p className="font-mono text-[11.5px] text-[#6b7280]">We'll set up the right channels automatically.</p>
              </div>

              <div className="space-y-2">
                {WS_TEMPLATES.map(tpl => (
                  <button key={tpl.id} onClick={() => setWsTemplate(tpl.id)}
                    className={[
                      'w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left',
                      wsTemplate===tpl.id ? 'border-[#7c3aed] bg-[rgba(124,58,237,0.09)]' : 'border-[#2a2c33] bg-[#111214] hover:border-[#33363f]',
                    ].join(' ')}>
                    <span className="text-2xl shrink-0">{tpl.emoji}</span>
                    <div className="flex-1">
                      <p className="text-[13.5px] font-semibold">{tpl.name}</p>
                      <p className="font-mono text-[10.5px] text-[#6b7280]">{tpl.desc}</p>
                      {tpl.channels.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {tpl.channels.map(c => (
                            <span key={c} className="font-mono text-[9px] px-1.5 py-0.5 bg-[#1e2026] text-[#6b7280] border border-[#2a2c33] rounded">#{c}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    {wsTemplate===tpl.id && <Check size={14} className="text-[#7c3aed] shrink-0"/>}
                  </button>
                ))}
              </div>

              <PrimaryBtn onClick={createWorkspace} loading={wsLoading} className="w-full justify-center h-10">
                <Sparkles size={14}/> Create {wsEmoji} {wsName}
              </PrimaryBtn>
            </div>
          )}
        </div>
      )}

      {/* ══════ WORKSPACE SUCCESS ══════ */}
      {view === 'workspace-success' && wsCreated && (
        <div className="bg-[#16171b] border border-[#2a2c33] rounded-2xl w-[440px] shadow-2xl overflow-hidden"
          style={{ animation:'amSlide 0.22s cubic-bezier(0.34,1.4,0.64,1)' }}>
          <ModalHeader title="Workspace created" onClose={close}/>
          <div className="px-6 py-8 text-center">
            <div className="relative w-24 h-24 mx-auto mb-5">
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl shadow-xl"
                style={{ background:'rgba(124,58,237,0.15)', border:'1px solid rgba(124,58,237,0.3)' }}>
                {wsCreated.emoji}
              </div>
              <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-[#10b981] flex items-center justify-center border-2 border-[#16171b]">
                <Check size={14} className="text-white" strokeWidth={3}/>
              </div>
            </div>

            <p className="text-[20px] font-bold mb-1">{wsCreated.name}</p>
            <p className="font-mono text-[11.5px] text-[#a855f7] mb-1">devtalk.dev/{wsCreated.slug}</p>
            <p className="font-mono text-[11.5px] text-[#6b7280] mb-6">
              Your workspace is ready. Start by inviting your team.
            </p>

            {/* Pre-created channels */}
            {WS_TEMPLATES.find(t=>t.id===wsTemplate)?.channels?.length ? (
              <div className="mb-5 text-left">
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280] mb-2.5">Channels created</p>
                <div className="flex flex-wrap gap-1.5">
                  {WS_TEMPLATES.find(t=>t.id===wsTemplate)!.channels.map(c => (
                    <span key={c} className="flex items-center gap-1 font-mono text-[11px] px-2.5 py-1 bg-[#1e2026] border border-[#2a2c33] rounded-lg text-[#9ca3af]">
                      <Hash size={10}/>{c}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setView('invite-people')}
                className="flex items-center justify-center gap-1.5 bg-[#1e2026] border border-[#2a2c33] hover:border-[#7c3aed] text-[#e8eaf0] text-[12.5px] font-semibold py-2.5 rounded-xl transition-all">
                <UserPlus size={13}/> Invite team
              </button>
              <button onClick={close}
                className="flex items-center justify-center gap-1.5 bg-[#7c3aed] hover:bg-[#a855f7] text-white text-[12.5px] font-semibold py-2.5 rounded-xl transition-all">
                <ArrowRight size={13}/> Open workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#1e2026] border border-[#33363f] rounded-xl px-4 py-2.5 text-[#e8eaf0] font-semibold text-[13px] shadow-2xl z-[60]"
          style={{ animation:'amFade 0.25s ease' }}>
          <Check size={14} className="text-[#10b981]"/>{toast}
        </div>
      )}

      <style>{`
        @keyframes amSlide {
          from { opacity:0; transform:translateY(14px) scale(0.96); }
          to   { opacity:1; transform:translateY(0)    scale(1);    }
        }
        @keyframes amFade {
          from { opacity:0; transform:translateY(4px); }
          to   { opacity:1; transform:translateY(0);   }
        }
      `}</style>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────
function ModalHeader({ title, subtitle, onBack, onClose }: {
  title: string; subtitle?: string; onBack?: ()=>void; onClose: ()=>void;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2a2c33]">
      {onBack && (
        <button onClick={onBack} className="font-mono text-[11.5px] text-[#6b7280] hover:text-[#e8eaf0] transition-colors shrink-0">
          ← Back
        </button>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-bold leading-tight">{title}</p>
        {subtitle && <p className="font-mono text-[10.5px] text-[#6b7280] mt-0.5">{subtitle}</p>}
      </div>
      <button onClick={onClose}
        className="w-7 h-7 bg-[#1e2026] border border-[#2a2c33] rounded-lg flex items-center justify-center text-[#6b7280] hover:text-[#e8eaf0] transition-colors shrink-0">
        <X size={14}/>
      </button>
    </div>
  );
}

function Label({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <label className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#6b7280] mb-2">
      {children}
      {optional && <span className="normal-case text-[#33363f] font-normal tracking-normal">(optional)</span>}
    </label>
  );
}

function GhostBtn({ children, onClick }: { children: React.ReactNode; onClick: ()=>void }) {
  return (
    <button onClick={onClick}
      className="bg-[#1e2026] border border-[#2a2c33] hover:border-[#33363f] text-[#6b7280] hover:text-[#e8eaf0] text-[12.5px] font-semibold px-4 py-2 rounded-xl transition-all">
      {children}
    </button>
  );
}

function PrimaryBtn({ children, onClick, disabled, loading, className }: {
  children: React.ReactNode; onClick?: ()=>void;
  disabled?: boolean; loading?: boolean; className?: string;
}) {
  return (
    <button onClick={onClick} disabled={disabled||loading}
      className={[
        'flex items-center gap-1.5 bg-[#7c3aed] hover:bg-[#a855f7] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[12.5px] font-semibold px-5 py-2 rounded-xl transition-all',
        className||'',
      ].join(' ')}>
      {loading
        ? <RefreshCw size={13} className="animate-spin"/>
        : children
      }
    </button>
  );
}

export default AddMenu;
