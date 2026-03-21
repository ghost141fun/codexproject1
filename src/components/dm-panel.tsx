'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Search, Plus, Phone, Video, MoreHorizontal, Pin, Trash2, X, Check,
  CheckCheck, Circle, Mic, Image, FileText, Bell, BellOff, Edit3, Reply,
  MessageSquare,
} from 'lucide-react';
import { RichTextEditor, type Person, type ReplyTarget, type SentMessage } from '@/components/chat/rich-text-editor';

// ── Types ─────────────────────────────────────────────────────────────────────
type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';
type UserStatus = 'online' | 'away' | 'busy' | 'offline';

interface Reaction { emoji: string; users: string[]; }

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  status: MessageStatus;
  reactions: Reaction[];
  replyTo?: string;
  edited?: boolean;
  pinned?: boolean;
  attachmentType?: 'image' | 'file' | 'audio' | 'video';
  attachmentName?: string;
  attachmentUrl?: string;
}

interface Conversation {
  id: string;
  participants: Person[];
  messages: Message[];
  isGroup: boolean;
  groupName?: string;
  unread: number;
  pinned: boolean;
  muted: boolean;
  lastSeen?: Date;
}

// ── Seed people ───────────────────────────────────────────────────────────────
const ME: Person = { id: 'me', name: 'You', avatar: 'YO', color: '#7c3aed', status: 'online', role: 'Developer' };
const PEOPLE: Person[] = [
  { id: 'p1', name: 'Arjun Sharma', avatar: 'AS', color: '#7c3aed', status: 'online', role: 'Product Manager', bio: 'Building great products one sprint at a time.' },
  { id: 'p2', name: 'Priya Nair', avatar: 'PN', color: '#10b981', status: 'online', role: 'Backend Engineer', bio: 'Rust + Go enthusiast. Coffee first.' },
  { id: 'p3', name: 'Meera Das', avatar: 'MD', color: '#f59e0b', status: 'away', role: 'UX Designer', bio: 'Pixels and prototypes.' },
  { id: 'p4', name: 'Ravi Kumar', avatar: 'RK', color: '#3b82f6', status: 'busy', role: 'DevOps Engineer', bio: 'If it deploys, it ships.' },
  { id: 'p5', name: 'Sneha Rao', avatar: 'SR', color: '#ec4899', status: 'offline', role: 'Frontend Engineer', bio: 'React + Tailwind = home.' },
  { id: 'p6', name: 'Kabir Singh', avatar: 'KS', color: '#06b6d4', status: 'online', role: 'Data Analyst', bio: 'Numbers tell stories.' },
  { id: 'p7', name: 'Divya Menon', avatar: 'DM', color: '#8b5cf6', status: 'away', role: 'QA Engineer', bio: 'Finding bugs before they find you.' },
];

const STATUS_COLOR: Record<UserStatus, string> = {
  online: '#10b981', away: '#f59e0b', busy: '#ef4444', offline: '#6b7280',
};

const STATUS_LABEL: Record<UserStatus, string> = {
  online: 'Online', away: 'Away', busy: 'Do not disturb', offline: 'Offline',
};

// ── Seed conversations ─────────────────────────────────────────────────────────
function seedConversations(): Conversation[] {
  const ago = (m: number) => new Date(Date.now() - m * 60_000);
  return [
    {
      id: 'c1', isGroup: false, unread: 2, pinned: true, muted: false,
      participants: [PEOPLE[0]],
      messages: [
        { id: 'm1', senderId: 'p1', text: 'Hey! Did you get a chance to look at the new onboarding mockups?', timestamp: ago(62), status: 'read', reactions: [] },
        { id: 'm2', senderId: 'me', text: 'Just opened them — the flow looks much cleaner now. Love the progress indicator on step 3.', timestamp: ago(58), status: 'read', reactions: [{ emoji: '❤️', users: ['p1'] }] },
        { id: 'm3', senderId: 'p1', text: 'Glad you like it! One thing — can we move the "Skip" button to the top right? Users keep missing it.', timestamp: ago(55), status: 'read', reactions: [] },
        { id: 'm4', senderId: 'me', text: "Totally agree. I'll update the Figma file and share the link in #design-review.", timestamp: ago(40), status: 'read', reactions: [{ emoji: '👍', users: ['p1'] }] },
        { id: 'm5', senderId: 'p1', text: 'Perfect. Also, the 3pm standup — are we still on?', timestamp: ago(8), status: 'delivered', reactions: [] },
        { id: 'm6', senderId: 'p1', text: "Can you review the PR before then? It's a small change but I want eyes on it.", timestamp: ago(4), status: 'delivered', reactions: [] },
      ],
    },
    {
      id: 'c2', isGroup: false, unread: 0, pinned: true, muted: false,
      participants: [PEOPLE[1]],
      messages: [
        { id: 'm7', senderId: 'p2', text: 'The Redis cache fix is merged. Latency dropped by 40% on the /messages endpoint.', timestamp: ago(125), status: 'read', reactions: [{ emoji: '🔥', users: ['me'] }] },
        { id: 'm8', senderId: 'me', text: "That's huge! Great work Priya 🎉", timestamp: ago(120), status: 'read', reactions: [] },
        { id: 'm9', senderId: 'p2', text: "Thanks! Next up — the WebSocket reconnect logic. That one's trickier.", timestamp: ago(118), status: 'read', reactions: [] },
        { id: 'm10', senderId: 'me', text: 'Let me know if you need a second pair of eyes.', timestamp: ago(115), status: 'read', reactions: [{ emoji: '👍', users: ['p2'] }] },
        { id: 'm11', senderId: 'p2', text: "Will do. Sharing my screen at 4pm if you're free?", timestamp: ago(30), status: 'read', reactions: [] },
      ],
    },
    {
      id: 'c3', isGroup: false, unread: 1, pinned: false, muted: false,
      participants: [PEOPLE[2]],
      messages: [
        { id: 'm12', senderId: 'p3', text: 'Hey, the Figma handoff for sprint 14 is done! Let me know if anything looks off.', timestamp: ago(200), status: 'read', reactions: [] },
        { id: 'm13', senderId: 'me', text: 'Just checked it, looks clean. Only one thing — the button radius on mobile cards is 6px but the DS says 8px.', timestamp: ago(190), status: 'read', reactions: [] },
        { id: 'm14', senderId: 'p3', text: 'Oops good catch! Fixing now...', timestamp: ago(185), status: 'read', reactions: [] },
        { id: 'm15', senderId: 'p3', text: 'Updated! Can you check once more?', timestamp: ago(45), status: 'delivered', reactions: [] },
      ],
    },
    {
      id: 'c4', isGroup: true, groupName: 'Sprint 15 Team', unread: 5, pinned: false, muted: false,
      participants: [PEOPLE[0], PEOPLE[1], PEOPLE[3]],
      messages: [
        { id: 'm16', senderId: 'p1', text: 'Morning team! Quick update: the sprint planning doc is in Notion. Please add your estimates by EOD.', timestamp: ago(480), status: 'read', reactions: [] },
        { id: 'm17', senderId: 'p4', text: 'On it. Also heads up — the staging env was down earlier, all good now.', timestamp: ago(470), status: 'read', reactions: [{ emoji: '👍', users: ['p1', 'me'] }] },
        { id: 'm18', senderId: 'me', text: '@Ravi nice catch. I noticed the deploy took 3x longer too — worth investigating?', timestamp: ago(460), status: 'read', reactions: [] },
        { id: 'm19', senderId: 'p4', text: "Yeah the pipeline has a stale lock file issue. I'll open a ticket.", timestamp: ago(455), status: 'read', reactions: [] },
        { id: 'm20', senderId: 'p1', text: "Let's sync at the standup. See everyone at 3pm!", timestamp: ago(20), status: 'delivered', reactions: [] },
        { id: 'm21', senderId: 'p4', text: '👋', timestamp: ago(18), status: 'delivered', reactions: [] },
        { id: 'm22', senderId: 'p1', text: 'Also — anyone free for a quick call before that?', timestamp: ago(5), status: 'delivered', reactions: [] },
      ],
    },
  ];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeLabel(d: Date): string {
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return 'now';
  if (diff < 3600_000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400_000) return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function groupMessages(msgs: Message[]): { date: string; items: Message[] }[] {
  const map = new Map<string, Message[]>();
  for (const m of msgs) {
    const key = m.timestamp.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }
  return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
}

function getConvName(c: Conversation): string {
  return c.isGroup ? (c.groupName || 'Unnamed Group') : c.participants[0].name;
}

function getConvAvatar(c: Conversation): string {
  return c.isGroup ? c.participants.map(p => p.avatar[0]).join('').slice(0, 2) : c.participants[0].avatar;
}

function getConvColor(c: Conversation): string {
  return c.isGroup ? '#7c3aed' : c.participants[0].color;
}

function getLastMsg(c: Conversation): Message | undefined {
  return c.messages[c.messages.length - 1];
}

// ─────────────────────────────────────────────────────────────────────────────
export function DMPage() {
  const [conversations, setConversations] = useState<Conversation[]>(seedConversations);
  const [activeId, setActiveId] = useState<string | null>('c1');
  const [searchQ, setSearchQ] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showNewDM, setShowNewDM] = useState(false);
  const [dmSearch, setDmSearch] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showPinned, setShowPinned] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  const active = conversations.find(c => c.id === activeId) ?? null;
  const person = active && !active.isGroup ? active.participants[0] : null;

  const filtered = conversations.filter(c => {
    const n = getConvName(c).toLowerCase();
    return !searchQ || n.includes(searchQ.toLowerCase());
  });

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [active?.messages.length]);

  // Mark as read
  useEffect(() => {
    if (!activeId) return;
    setConversations(prev => prev.map(c =>
      c.id === activeId ? { ...c, unread: 0 } : c
    ));
  }, [activeId]);

  // Simulated typing
  useEffect(() => {
    if (!active || active.isGroup) return;
    const t = setInterval(() => {
      if (Math.random() < 0.15) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    }, 8000);
    return () => clearInterval(t);
  }, [activeId]);

  function handleSend(msg: SentMessage) {
    if (!activeId) return;
    const newMsg: Message = {
      id: msg.id,
      senderId: 'me',
      text: msg.formattedText || msg.text,
      timestamp: msg.timestamp,
      status: 'sending',
      reactions: [],
      replyTo: replyTo?.id,
      attachmentType: msg.attachmentType,
      attachmentName: msg.attachmentName,
      attachmentUrl: msg.attachmentUrl,
    };

    setConversations(prev => prev.map(c =>
      c.id === activeId ? { ...c, messages: [...c.messages, newMsg] } : c
    ));
    setReplyTo(null);

    // Simulate sent status
    setTimeout(() => {
      setConversations(prev => prev.map(c =>
        c.id === activeId
          ? { ...c, messages: c.messages.map(m => m.id === msg.id ? { ...m, status: 'sent' } : m) }
          : c
      ));
    }, 1000);
  }

  function deleteMsg(msgId: string) {
    if (!activeId) return;
    setConversations(prev => prev.map(c =>
      c.id === activeId
        ? { ...c, messages: c.messages.filter(m => m.id !== msgId) }
        : c
    ));
  }

  function togglePin(msgId: string) {
    if (!activeId) return;
    setConversations(prev => prev.map(c =>
      c.id === activeId
        ? { ...c, messages: c.messages.map(m => m.id === msgId ? { ...m, pinned: !m.pinned } : m) }
        : c
    ));
  }

  function startEdit(m: Message) {
    setEditingId(m.id);
    setEditText(m.text);
  }

  function saveEdit() {
    if (!editingId || !activeId) return;
    setConversations(prev => prev.map(c =>
      c.id === activeId
        ? { ...c, messages: c.messages.map(m => m.id === editingId ? { ...m, text: editText, edited: true } : m) }
        : c
    ));
    setEditingId(null);
    setEditText('');
  }

  function addReaction(msgId: string, emoji: string) {
    if (!activeId) return;
    setConversations(prev => prev.map(c => {
      if (c.id !== activeId) return c;
      return {
        ...c, messages: c.messages.map(m => {
          if (m.id !== msgId) return m;
          const existing = m.reactions.find(r => r.emoji === emoji);
          if (existing) {
            const already = existing.users.includes('me');
            return {
              ...m, reactions: already
                ? m.reactions.map(r => r.emoji === emoji ? { ...r, users: r.users.filter(u => u !== 'me') } : r).filter(r => r.users.length > 0)
                : m.reactions.map(r => r.emoji === emoji ? { ...r, users: [...r.users, 'me'] } : r)
            };
          }
          return { ...m, reactions: [...m.reactions, { emoji, users: ['me'] }] };
        })
      };
    }));
  }

  const pinnedMessages = active?.messages.filter(m => m.pinned) ?? [];
  const msgGroups = active ? groupMessages(active.messages) : [];
  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);

  return (
    <div className="flex h-full bg-[#111214] text-[#e8eaf0] overflow-hidden">
      {/* Sidebar */}
      <div className="w-[272px] shrink-0 border-r border-[#2a2c33] flex flex-col bg-[#111214]">
        <div className="px-4 pt-4 pb-3 border-b border-[#2a2c33]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-bold tracking-tight">Direct Messages</h2>
              {totalUnread > 0 && (
                <span className="bg-[#7c3aed] text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full">{totalUnread}</span>
              )}
            </div>
            <button onClick={() => setShowNewDM(true)}
              className="w-7 h-7 bg-[#1e2026] border border-[#2a2c33] rounded-lg flex items-center justify-center text-[#6b7280] hover:text-[#e8eaf0] hover:border-[#7c3aed] transition-all">
              <Plus size={14} />
            </button>
          </div>
          <div className="flex items-center gap-2 bg-[#1e2026] border border-[#2a2c33] rounded-lg px-3 py-1.5 focus-within:border-[#7c3aed] transition-colors">
            <Search size={12} className="text-[#6b7280] shrink-0" />
            <input type="text" placeholder="Search people..." value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              className="bg-transparent border-none outline-none text-[#e8eaf0] text-[12px] w-full placeholder-[#6b7280]" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {filtered
            .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
            .map(conv => {
              const last = getLastMsg(conv);
              const isMine = last?.senderId === 'me';
              return (
                <div key={conv.id}
                  onClick={() => setActiveId(conv.id)}
                  className={`group relative flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-all
                    ${activeId === conv.id ? 'bg-[rgba(124,58,237,0.15)] border-r-2 border-[#7c3aed]' : 'hover:bg-[#18191d]'}`}>
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white shadow-lg"
                      style={{ background: getConvColor(conv) }}>
                      {getConvAvatar(conv)}
                    </div>
                    {!conv.isGroup && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#111214]"
                        style={{ background: STATUS_COLOR[conv.participants[0].status] }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold truncate text-[#e8eaf0]">{getConvName(conv)}</span>
                      <span className="font-mono text-[9.5px] text-[#6b7280]">{last ? timeLabel(last.timestamp) : ''}</span>
                    </div>
                    <p className="font-mono text-[11px] text-[#6b7280] truncate mt-0.5">
                      {last ? (isMine ? `You: ${last.text}` : last.text) : 'No messages yet'}
                    </p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="shrink-0 bg-[#7c3aed] text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full">{conv.unread}</span>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Main Chat */}
      {active ? (
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#2a2c33] bg-[#111214]/80 backdrop-blur-md z-10">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowProfile(true)}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white shadow-xl"
                style={{ background: getConvColor(active) }}>{getConvAvatar(active)}</div>
              <div>
                <p className="text-[14px] font-bold">{getConvName(active)}</p>
                <p className="font-mono text-[10.5px] text-[#6b7280]">
                  {active.isGroup ? `${active.participants.length + 1} members` : STATUS_LABEL[active.participants[0].status]}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button className="w-8 h-8 flex items-center justify-center text-[#6b7280] hover:text-[#e8eaf0] hover:bg-[#1e2026] rounded-lg transition-all"><Phone size={14} /></button>
              <button className="w-8 h-8 flex items-center justify-center text-[#6b7280] hover:text-[#e8eaf0] hover:bg-[#1e2026] rounded-lg transition-all"><Video size={14} /></button>
              <button onClick={() => setShowProfile(!showProfile)} className="w-8 h-8 flex items-center justify-center text-[#6b7280] hover:text-[#e8eaf0] hover:bg-[#1e2026] rounded-lg transition-all"><MoreHorizontal size={14} /></button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-2">
            {msgGroups.map(({ date, items }) => (
              <div key={date}>
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-[#1e2026]" />
                  <span className="font-mono text-[10px] text-[#33363f] uppercase tracking-widest">{date}</span>
                  <div className="flex-1 h-px bg-[#1e2026]" />
                </div>
                {items.map((msg, idx) => {
                  const isMine = msg.senderId === 'me';
                  const sender = isMine ? ME : (active.participants.find(p => p.id === msg.senderId) ?? PEOPLE[0]);
                  const sameAuthor = idx > 0 && items[idx - 1].senderId === msg.senderId;
                  const replyMsg = msg.replyTo ? active.messages.find(m => m.id === msg.replyTo) : null;

                  return (
                    <div key={msg.id}
                      onMouseEnter={() => setHoveredId(msg.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className={`group flex items-start gap-3 ${isMine ? 'flex-row-reverse' : ''} ${sameAuthor ? 'mt-1' : 'mt-4'}`}>
                      
                      {!sameAuthor ? (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-[11px] shrink-0 mt-0.5 shadow-md"
                          style={{ background: sender.color }}>{sender.avatar}</div>
                      ) : <div className="w-8 shrink-0" />}

                      <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[75%]`}>
                        {!sameAuthor && (
                          <div className={`flex items-center gap-2 mb-1 px-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                            <span className="text-[12px] font-bold text-[#e8eaf0]">{sender.name}</span>
                            <span className="font-mono text-[9px] text-[#33363f]">{timeLabel(msg.timestamp)}</span>
                          </div>
                        )}

                        {replyMsg && (
                          <div className={`flex items-center gap-2 mb-1 px-2 py-1 rounded bg-[#18191d] border-l-2 border-[#7c3aed] text-[11px] text-[#6b7280] ${isMine ? 'self-end' : ''}`}>
                            <Reply size={10} className="text-[#a855f7]" />
                            <span className="truncate max-w-[200px]">{replyMsg.text}</span>
                          </div>
                        )}

                        <div className="relative group/content">
                          {editingId === msg.id ? (
                            <div className="flex flex-col gap-2 bg-[#1e2026] p-2 rounded-xl border border-[#7c3aed] min-w-[240px]">
                              <textarea value={editText} onChange={e => setEditText(e.target.value)}
                                className="bg-transparent text-[13px] outline-none resize-none min-h-[60px]" autoFocus />
                              <div className="flex justify-end gap-2">
                                <button onClick={() => setEditingId(null)} className="px-3 py-1 text-[11px] text-[#6b7280]">Cancel</button>
                                <button onClick={saveEdit} className="px-3 py-1 bg-[#7c3aed] text-white rounded-lg text-[11px] font-bold">Save</button>
                              </div>
                            </div>
                          ) : (
                            <div className={`px-4 py-2.5 rounded-2xl text-[13.5px] leading-relaxed shadow-sm
                              ${isMine ? 'bg-[#7c3aed] text-white rounded-tr-none' : 'bg-[#1e2026] text-[#e8eaf0] rounded-tl-none border border-[#2a2c33]'}`}>
                              {msg.text}
                              {msg.edited && <span className="text-[9px] opacity-40 ml-2">(edited)</span>}
                            </div>
                          )}

                          {/* Hover Actions */}
                          {hoveredId === msg.id && !editingId && (
                            <div className={`absolute top-0 ${isMine ? '-left-12' : '-right-12'} flex items-center gap-0.5 bg-[#1a1b1f] border border-[#2a2c33] rounded-lg p-0.5 shadow-2xl z-20`}>
                              <button onClick={() => setReplyTo(msg)} className="w-6 h-6 flex items-center justify-center text-[#6b7280] hover:text-[#a855f7] rounded"><Reply size={12}/></button>
                              {isMine && <button onClick={() => startEdit(msg)} className="w-6 h-6 flex items-center justify-center text-[#6b7280] hover:text-[#10b981] rounded"><Edit3 size={12}/></button>}
                              <button onClick={() => togglePin(msg.id)} className={`w-6 h-6 flex items-center justify-center rounded ${msg.pinned ? 'text-[#f59e0b]' : 'text-[#6b7280] hover:text-[#f59e0b]'}`}><Pin size={12}/></button>
                              <button onClick={() => deleteMsg(msg.id)} className="w-6 h-6 flex items-center justify-center text-[#6b7280] hover:text-[#ef4444] rounded"><Trash2 size={12}/></button>
                            </div>
                          )}
                        </div>

                        {msg.reactions.length > 0 && (
                          <div className={`flex gap-1 mt-1 ${isMine ? 'justify-end' : ''}`}>
                            {msg.reactions.map(r => (
                              <button key={r.emoji} onClick={() => addReaction(msg.id, r.emoji)}
                                className={`px-1.5 py-0.5 rounded-full text-[11px] border transition-all ${r.users.includes('me') ? 'bg-[#7c3aed]/20 border-[#7c3aed]/40 text-[#c084fc]' : 'bg-[#1e2026] border-[#2a2c33] text-[#6b7280] hover:border-[#7c3aed]/40'}`}>
                                {r.emoji} {r.users.length}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Typing Indicator */}
          {isTyping && (
            <div className="absolute bottom-[80px] left-6 flex items-center gap-2 bg-[#1e2026] px-3 py-1.5 rounded-full border border-[#2a2c33] shadow-lg animate-bounce-subtle">
              <div className="flex gap-1 pt-1">
                <span className="w-1 h-1 bg-[#a855f7] rounded-full animate-bounce" style={{animationDelay:'0s'}}/>
                <span className="w-1 h-1 bg-[#a855f7] rounded-full animate-bounce" style={{animationDelay:'0.1s'}}/>
                <span className="w-1 h-1 bg-[#a855f7] rounded-full animate-bounce" style={{animationDelay:'0.2s'}}/>
              </div>
              <span className="text-[10px] font-mono text-[#6b7280]">{getConvName(active)} is typing...</span>
            </div>
          )}

          {/* Editor */}
          <RichTextEditor
            placeholder={`Message ${getConvName(active)}`}
            people={PEOPLE}
            replyTo={replyTo ? {
              id: replyTo.id,
              senderId: replyTo.senderId,
              senderName: PEOPLE.find(p => p.id === replyTo.senderId)?.name || 'User',
              text: replyTo.text,
            } : null}
            onClearReply={() => setReplyTo(null)}
            onSend={handleSend}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-[#33363f]">
          <div className="w-20 h-20 rounded-3xl bg-[#1e2026] flex items-center justify-center border border-[#2a2c33] shadow-inner">
            <MessageSquare size={32} className="text-[#6b7280] opacity-20" />
          </div>
          <div className="text-center">
            <h3 className="text-[16px] font-bold text-[#e8eaf0]">No Conversation Selected</h3>
            <p className="text-[12px] font-mono mt-1">Pick a chat or start a new one to begin messaging.</p>
          </div>
          <button onClick={() => setShowNewDM(true)} className="mt-2 px-6 py-2 bg-[#7c3aed] hover:bg-[#a855f7] text-white text-[13px] font-bold rounded-xl transition-all shadow-lg active:scale-95">Start New Chat</button>
        </div>
      )}

      {/* Profile Sidebar */}
      {showProfile && active && (
        <div className="w-[300px] shrink-0 border-l border-[#2a2c33] bg-[#111214] flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
          <div className="p-4 border-b border-[#2a2c33] flex items-center justify-between">
            <h3 className="text-[14px] font-bold">User Information</h3>
            <button onClick={() => setShowProfile(false)} className="text-[#6b7280] hover:text-[#e8eaf0]"><X size={16}/></button>
          </div>
          <div className="p-6 flex flex-col items-center border-b border-[#2a2c33]">
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-[32px] font-bold text-white mb-4 shadow-2xl"
              style={{ background: getConvColor(active) }}>{getConvAvatar(active)}</div>
            <p className="text-[18px] font-bold">{getConvName(active)}</p>
            {person && <p className="text-[13px] text-[#a855f7] font-semibold mt-1">{person.role}</p>}
            <div className="flex gap-3 mt-5">
              <button className="w-10 h-10 rounded-xl bg-[#1e2026] border border-[#2a2c33] flex items-center justify-center hover:border-[#7c3aed] transition-colors"><Phone size={16}/></button>
              <button className="w-10 h-10 rounded-xl bg-[#1e2026] border border-[#2a2c33] flex items-center justify-center hover:border-[#7c3aed] transition-colors"><Video size={16}/></button>
              <button className="w-10 h-10 rounded-xl bg-[#1e2026] border border-[#2a2c33] flex items-center justify-center hover:border-[#7c3aed] transition-colors"><Bell size={16}/></button>
            </div>
          </div>
          <div className="p-5 space-y-6 flex-1 overflow-y-auto">
            {person?.bio && (
              <div>
                <p className="text-[10px] font-mono text-[#33363f] uppercase tracking-widest mb-1.5">About</p>
                <p className="text-[12.5px] text-[#9ca3af] leading-relaxed italic">"{person.bio}"</p>
              </div>
            )}
            <div>
              <p className="text-[10px] font-mono text-[#33363f] uppercase tracking-widest mb-1.5">Status</p>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1e2026]/50 border border-[#2a2c33]">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: person ? STATUS_COLOR[person.status] : '#6b7280' }}/>
                <span className="text-[12px] font-semibold">{person ? STATUS_LABEL[person.status] : 'Offline'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .animate-bounce-subtle {
          animation: bounce-subtle 3s infinite ease-in-out;
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}

export default DMPage;
