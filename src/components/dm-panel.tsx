'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Plus, Phone, Video, MoreHorizontal, Pin, Trash2, X, Check,
  CheckCheck, Circle, Mic, Image, FileText, Bell, BellOff, Edit3, Reply,
  MessageSquare, Loader2
} from 'lucide-react';
import { RichTextEditor, type Person, type ReplyTarget, type SentMessage } from '@/components/chat/rich-text-editor';
import { useAuth } from '@/database';

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
  { id: 'p1', name: 'Arjun Sharma', avatar: 'AS', color: '#7c3aed', status: 'online', role: 'Product Manager' },
  { id: 'p2', name: 'Priya Nair', avatar: 'PN', color: '#10b981', status: 'online', role: 'Backend Engineer' },
  { id: 'p3', name: 'Meera Das', avatar: 'MD', color: '#f59e0b', status: 'away', role: 'UX Designer' },
  { id: 'p4', name: 'Ravi Kumar', avatar: 'RK', color: '#3b82f6', status: 'busy', role: 'DevOps Engineer' },
  { id: 'p5', name: 'Sneha Rao', avatar: 'SR', color: '#ec4899', status: 'offline', role: 'Frontend Engineer' },
  { id: 'p6', name: 'Kabir Singh', avatar: 'KS', color: '#06b6d4', status: 'online', role: 'Data Analyst' },
  { id: 'p7', name: 'Divya Menon', avatar: 'DM', color: '#8b5cf6', status: 'away', role: 'QA Engineer' },
];

const STATUS_COLOR: Record<UserStatus, string> = {
  online: '#10b981', away: '#f59e0b', busy: '#ef4444', offline: '#6b7280',
};

const STATUS_LABEL: Record<UserStatus, string> = {
  online: 'Online', away: 'Away', busy: 'Do not disturb', offline: 'Offline',
};


// ── Helpers ───────────────────────────────────────────────────────────────────

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
export function DMPage({ user }: { user: any }) {
  const { supabase } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showNewDM, setShowNewDM] = useState(false);
  const [dmSearch, setDmSearch] = useState('');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showPinned, setShowPinned] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async (convId: string) => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from('direct_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    const formatted: Message[] = (data || []).map((m: any) => ({
      id: m.id,
      senderId: m.sender_id,
      text: m.content,
      timestamp: new Date(m.created_at),
      status: 'sent',
      reactions: [],
      edited: !!m.edited_at
    }));

    setConversations(prev => prev.map(c => 
      c.id === convId ? { ...c, messages: formatted } : c
    ));
  }, [supabase]);

  const fetchAllUsers = useCallback(async () => {
    if (!supabase || !user) return [];
    const { data } = await supabase
      .from('users')
      .select('id, display_name, username, email, avatar_gradient, status, role')
      .neq('id', user.id); // exclude self
    return data || [];
  }, [supabase, user]);

  async function startConversation(otherUserId: string) {
    if (!supabase || !user) return;

    // Check if conversation already exists
    const { data: existing } = await supabase
      .from('direct_message_conversations')
      .select('id')
      .or(
        `and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`
      )
      .maybeSingle();

    let convId = existing?.id;

    if (!convId) {
      // Create new conversation
      const { data: newConv } = await supabase
        .from('direct_message_conversations')
        .insert({ user1_id: user.id, user2_id: otherUserId })
        .select('id')
        .single();
      convId = newConv?.id;
    }

    if (convId) {
      setShowNewDM(false);
      await fetchConversations(); // refresh list
      setActiveId(convId);
      fetchMessages(convId);
    }
  }

  const fetchConversations = useCallback(async () => {
    if (!user || !supabase) return;

    const { data, error } = await supabase
      .from('direct_message_conversations')
      .select(`
        *,
        user1:user1_id(id, display_name, username, avatar_gradient, role, status),
        user2:user2_id(id, display_name, username, avatar_gradient, role, status)
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return;
    }

    const formatted: Conversation[] = (data || []).map((c: any) => {
      const otherUser = c.user1_id === user.id ? c.user2 : c.user1;
      return {
        id: c.id,
        isGroup: false,
        unread: 0,
        pinned: false,
        muted: false,
        participants: [{
          id: otherUser.id,
          name: otherUser.display_name || otherUser.username,
          avatar: (otherUser.display_name || otherUser.username || 'U')[0].toUpperCase(),
          color: otherUser.avatar_gradient || '#7c3aed',
          status: (otherUser.status || 'offline') as UserStatus,
          role: otherUser.role || ''
        }],
        messages: []
      };
    });

    setConversations(formatted);
    setIsLoading(false);
    if (formatted.length > 0 && !activeId) {
      setActiveId(formatted[0].id);
      fetchMessages(formatted[0].id);
    }
  }, [user, supabase, activeId, fetchMessages]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (activeId && supabase) {
      fetchMessages(activeId);

      const channel = supabase
        .channel(`messages:${activeId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${activeId}`
        }, () => {
          fetchMessages(activeId);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeId, fetchMessages, supabase]);

  useEffect(() => {
    if (showNewDM) console.log('Current user ID:', user?.id);
  }, [showNewDM, user?.id]);

  useEffect(() => {
    if (!showNewDM || !supabase || !user) return;
    
    supabase
      .from('users')
      .select('id, display_name, username, email, avatar_gradient, status, role')
      .neq('id', user.id)
      .then(({ data, error }) => {
        if (error) console.error('Error fetching users:', error.message);
        else setAllUsers(data || []);
      });
  }, [showNewDM, supabase, user]);

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

  async function handleSend(msg: SentMessage) {
    if (!activeId || !user || !supabase) return;

    const tempId = `temp-${Date.now()}`;
    const tempMsg: Message = {
      id: tempId,
      senderId: user.id,
      text: msg.formattedText || msg.text,
      timestamp: new Date(),
      status: 'sending',
      reactions: [],
    };

    // Optimistically add message immediately
    setConversations(prev => prev.map(c =>
      c.id === activeId ? { ...c, messages: [...c.messages, tempMsg] } : c
    ));

    const { error } = await supabase
      .from('direct_messages')
      .insert({
        conversation_id: activeId,
        sender_id: user.id,
        content: msg.formattedText || msg.text,
      });

    if (error) {
      console.error('Error sending message:', error);
      // Remove temp message on failure
      setConversations(prev => prev.map(c =>
        c.id === activeId ? { ...c, messages: c.messages.filter(m => m.id !== tempId) } : c
      ));
      return;
    }

    // Replace temp with real data
    await fetchMessages(activeId);
    setReplyTo(null);
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

        <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 opacity-40">
              <Loader2 className="w-5 h-5 animate-spin mb-2" />
              <p className="text-[10px] font-mono tracking-tighter uppercase">Initializing secure line...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 opacity-20 px-6 text-center">
              <MessageSquare className="w-8 h-8 mb-2 mx-auto" />
              <p className="text-[10px] font-mono tracking-tighter uppercase">No conversations found</p>
            </div>
          ) : filtered
            .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
            .map(conv => {
              const last = getLastMsg(conv);
              const isMine = last?.senderId === user.id;
              return (
                <div key={conv.id}
                  onClick={() => {
                    setActiveId(conv.id);
                    fetchMessages(conv.id);
                  }}
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
                  const isMine = msg.senderId === user.id;
                  const senderP = active.participants.find(p => p.id === msg.senderId);
                  const sender = isMine ? { name: 'You', avatar: 'YO', color: '#7c3aed' } : (senderP ?? PEOPLE[0]);
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

      {showNewDM && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setShowNewDM(false); }}>
          <div className="bg-[#16171b] border border-[#2a2c33] rounded-2xl w-[420px] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2c33]">
              <p className="text-[15px] font-bold">New Direct Message</p>
              <button onClick={() => setShowNewDM(false)}
                className="w-7 h-7 bg-[#1e2026] border border-[#2a2c33] rounded-lg flex items-center justify-center text-[#6b7280] hover:text-white transition-colors">
                <X size={14}/>
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 bg-[#1e2026] border border-[#2a2c33] rounded-lg px-3 py-2 mb-3 focus-within:border-[#7c3aed] transition-colors">
                <Search size={13} className="text-[#6b7280] shrink-0"/>
                <input autoFocus type="text" placeholder="Search people by name or email..."
                  value={dmSearch} onChange={e => setDmSearch(e.target.value)}
                  className="bg-transparent border-none outline-none text-[#e8eaf0] text-[13px] w-full placeholder-[#6b7280]"/>
              </div>
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {allUsers
                  .filter(u => !dmSearch ||
                    (u.display_name || u.username || '').toLowerCase().includes(dmSearch.toLowerCase()) ||
                    u.email?.toLowerCase().includes(dmSearch.toLowerCase())
                  )
                  .map(u => (
                    <button key={u.id} onClick={() => startConversation(u.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#1e2026] transition-colors text-left">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0"
                        style={{ background: u.avatar_gradient || '#7c3aed' }}>
                        {(u.display_name || u.username || 'U')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[#e8eaf0] truncate">
                          {u.display_name || u.username}
                        </p>
                        <p className="font-mono text-[11px] text-[#6b7280] truncate">{u.email}</p>
                      </div>
                      <div className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: u.status === 'online' ? '#10b981' : '#6b7280' }}/>
                    </button>
                  ))
                }
                {allUsers.filter(u => !dmSearch ||
                  (u.display_name || u.username || '').toLowerCase().includes(dmSearch.toLowerCase()) ||
                  u.email?.toLowerCase().includes(dmSearch.toLowerCase())
                ).length === 0 && (
                  <div className="text-center py-8 text-[#6b7280]">
                    <p className="text-[13px]">No users found</p>
                  </div>
                )}
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
