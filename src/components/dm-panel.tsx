'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Plus, Phone, Video, MoreHorizontal, Pin, Trash2, X, Check,
  CheckCheck, Circle, Mic, Image, FileText, Bell, BellOff, Edit3, Reply,
  MessageSquare, Loader2, Download, ExternalLink, Film, Music, FileCode, File,
  Image as ImageIcon
} from 'lucide-react';
import { RichTextEditor, type Person, type ReplyTarget, type SentMessage } from '@/components/chat/rich-text-editor';
import { useAuth } from '@/database';
import { cn } from "@/lib/utils";

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

const STATUS_COLOR: Record<UserStatus, string> = {
  online: '#10b981', away: '#f59e0b', busy: '#ef4444', offline: '#6b7280',
};

const STATUS_LABEL: Record<UserStatus, string> = {
  online: 'Online', away: 'Away', busy: 'Do not disturb', offline: 'Offline',
};


// ── Helpers ───────────────────────────────────────────────────────────────────

// ── Helpers ───────────────────────────────────────────────────────────────────
async function downloadFile(url: string, filename: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(blobUrl);
  } catch { window.open(url, '_blank'); }
}

function FileCard({ name, url, type }: { name: string; url: string; type?: string }) {
  const [downloading, setDownloading] = useState(false);
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  // Prioritize emoji type label from editor, fallback to extension
  const isAudio = type === '🎵' || (type !== '🎬' && ['mp3', 'wav', 'ogg', 'm4a'].includes(ext));
  const isVideo = type === '🎬' || (type !== '🎵' && ['mp4', 'mov', 'webm', 'avi'].includes(ext));

  const getIcon = () => {
    if (isVideo) return <Film className="w-5 h-5" />;
    if (isAudio) return <Music className="w-5 h-5" />;
    if (['js', 'ts', 'tsx', 'jsx', 'py', 'json', 'html', 'css', 'sql'].includes(ext)) return <FileCode className="w-5 h-5" />;
    if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext)) return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const getAccent = () => {
    if (isVideo) return 'from-purple-500/20 border-purple-500/30 text-purple-400';
    if (isAudio) return 'from-green-500/20 border-green-500/30 text-green-400';
    if (['js', 'ts', 'tsx', 'jsx', 'py'].includes(ext)) return 'from-yellow-500/20 border-yellow-500/30 text-yellow-400';
    if (['pdf'].includes(ext)) return 'from-red-500/20 border-red-500/30 text-red-400';
    if (['doc', 'docx'].includes(ext)) return 'from-blue-500/20 border-blue-500/30 text-blue-400';
    return 'from-[#b9babd]/10 border-white/10 text-[#b9babd]';
  };

  return (
    <div className="mt-2 space-y-2 max-w-sm">
      <div className={cn("flex items-center gap-3 bg-gradient-to-r to-transparent border rounded-xl px-4 py-3 group transition-all hover:to-white/[0.02]", getAccent())}>
        <div className={cn("w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0", getAccent().split(' ')[2])}>{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-white truncate">{name}</p>
          <p className="text-[11px] text-[#5c5f63] uppercase tracking-wider mt-0.5">{ext} file</p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <a href={url} target="_blank" rel="noopener noreferrer" className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-[#b9babd] hover:text-white transition-colors"><ExternalLink className="w-3.5 h-3.5" /></a>
          <button onClick={async () => { setDownloading(true); await downloadFile(url, name); setDownloading(false); }} disabled={downloading} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-[#b9babd] hover:text-white transition-colors disabled:opacity-50">
            {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      
      {isAudio && (
        <div className="px-1">
          <audio controls className="w-full h-8 scale-90 origin-left" style={{ filter: 'invert(1) hue-rotate(180deg) brightness(1.5) contrast(1.2)' }}>
            <source src={url} type={['mp3', 'wav', 'ogg', 'm4a'].includes(ext) ? `audio/${ext === 'm4a' ? 'mp4' : ext}` : undefined} />
          </audio>
        </div>
      )}

      {isVideo && (
        <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40">
          <video controls className="w-full aspect-video">
            <source src={url} type={['mp4', 'mov', 'webm'].includes(ext) ? `video/${ext === 'mov' ? 'quicktime' : ext}` : undefined} />
          </video>
        </div>
      )}
    </div>
  );
}

function ImageCard({ name, url }: { name: string; url: string }) {
  const [loaded, setLoaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  return (
    <div className="mt-2 max-w-sm group">
      <div className="relative rounded-xl overflow-hidden border border-white/[0.08] bg-white/[0.03]">
        {!loaded && <div className="w-full h-40 flex items-center justify-center bg-white/[0.03]"><ImageIcon className="w-8 h-8 text-white/20 animate-pulse" /></div>}
        <img src={url} alt={name} onLoad={() => setLoaded(true)} className={cn("w-full max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity", loaded ? 'block' : 'hidden')} onClick={() => window.open(url, '_blank')} />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none" />
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <a href={url} target="_blank" rel="noopener noreferrer" className="h-7 w-7 flex items-center justify-center rounded-lg bg-black/60 backdrop-blur text-white hover:bg-black/80 transition-colors"><ExternalLink className="w-3.5 h-3.5" /></a>
          <button onClick={async () => { setDownloading(true); await downloadFile(url, name); setDownloading(false); }} disabled={downloading} className="h-7 w-7 flex items-center justify-center rounded-lg bg-black/60 backdrop-blur text-white hover:bg-black/80 transition-colors">
            {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      <p className="text-[11px] text-[#5c5f63] mt-1 px-0.5 truncate">{name}</p>
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  const textLines: string[] = [];
  const flushText = () => {
    if (!textLines.length) return;
    const text = textLines.splice(0).join('\n');
    elements.push(<div key={`t-${elements.length}`} className="text-[14.5px] text-[#d1d2d3] leading-[1.6] whitespace-pre-wrap break-words">{renderInline(text)}</div>);
  };
  lines.forEach((line, i) => {
    const img = line.match(/^!\[(.+?)\]\((.+?)\)$/);
    if (img) { flushText(); elements.push(<ImageCard key={i} name={img[1]} url={img[2]} />); return; }
    const file = line.match(/^([📎🎬🎵])\s\[(.+?)\]\((.+?)\)$/u);
    if (file) { flushText(); elements.push(<FileCard key={i} type={file[1]} name={file[2]} url={file[3]} />); return; }
    textLines.push(line);
  });
  flushText();
  return <div className="space-y-0.5">{elements}</div>;
}

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

/* ── Inline text renderer ────────────────────────────────────────────────── */
function renderInline(text: string): React.ReactNode {
  if (!text) return null;

  // Order of rules matters for proper matching (e.g., ** before *)
  const rules = [
    { type: 'bold',   regex: /\*\*(.+?)\*\*/ },
    { type: 'italic', regex: /_(.+?)_/ },
    { type: 'strike', regex: /~~(.+?)~~/ },
    { type: 'code',   regex: /`(.+?)`/ },
    { type: 'link',   regex: /\[(.+?)\]\((.+?)\)/ }
  ];

  let firstMatch: { rule: typeof rules[0], start: number, end: number, content: string, extra?: string } | null = null;

  for (const rule of rules) {
    const match = text.match(rule.regex);
    if (match && match.index !== undefined) {
      if (!firstMatch || match.index < firstMatch.start) {
        firstMatch = {
          rule,
          start: match.index,
          end: match.index + match[0].length,
          content: match[1],
          extra: match[2] // for links
        };
      }
    }
  }

  if (!firstMatch) return text;

  const prefix = text.slice(0, firstMatch.start);
  const suffix = text.slice(firstMatch.end);

  const key = `${firstMatch.rule.type}-${firstMatch.start}`;

  let element: React.ReactNode;
  switch (firstMatch.rule.type) {
    case 'bold':
      element = <strong key={key} className="text-white font-semibold">{renderInline(firstMatch.content)}</strong>;
      break;
    case 'italic':
      element = <em key={key} className="italic text-[#d1d2d3]">{renderInline(firstMatch.content)}</em>;
      break;
    case 'strike':
      element = <s key={key} className="line-through opacity-60">{renderInline(firstMatch.content)}</s>;
      break;
    case 'code':
      element = <code key={key} className="bg-white/10 text-[#e3b341] px-1.5 py-0.5 rounded text-[13px] font-mono whitespace-nowrap">{firstMatch.content}</code>;
      break;
    case 'link':
      element = <a key={key} href={firstMatch.extra} target="_blank" rel="noopener noreferrer" className="text-[#4a9eff] hover:underline">{renderInline(firstMatch.content)}</a>;
      break;
    default:
      element = firstMatch.content;
  }

  return (
    <>
      {renderInline(prefix)}
      {element}
      {renderInline(suffix)}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export function DMPage({ user, activeWorkspace, initialConvId }: { user: any; activeWorkspace: any; initialConvId?: string | null }) {
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
      .from('messages')
      .select('*')
      .eq('dm_id', convId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    const formatted: Message[] = (data || []).map((m: any) => ({
      id: m.id,
      senderId: m.author_id,
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
    if (!supabase || !user || !activeWorkspace) return [];

    // Filter by workspace membership. If you have the workspace_members table:
    try {
      const { data: members, error: memberError } = await supabase
        .from('workspace_memberships')
        .select('user_id')
        .eq('workspace_id', activeWorkspace.id);

      if (memberError || !members || members.length === 0) {
        return [];
      }

      const memberIds = members.map(m => m.user_id);
      const { data } = await supabase
        .from('users')
        .select('id, display_name, username, email, avatar_gradient, status, role')
        .in('id', memberIds)
        .neq('id', user.id); // exclude self
        
      return data || [];
    } catch (err) {
      console.error('Isolation error:', err);
      return [];
    }
  }, [supabase, user, activeWorkspace]);

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
    if (!user?.id || !supabase) return;

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
    if (initialConvId) {
      if (initialConvId.startsWith('new-dm-')) {
        const userId = initialConvId.replace('new-dm-', '');
        startConversation(userId);
      } else {
        setActiveId(initialConvId);
        fetchMessages(initialConvId);
      }
    }
  }, [initialConvId]);

  useEffect(() => {
    if (activeId && supabase) {
      fetchMessages(activeId);

      const channel = supabase
        .channel(`messages:${activeId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `dm_id=eq.${activeId}`
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
    if (supabase && user) {
      fetchAllUsers().then(setAllUsers);
    }
  }, [supabase, user?.id, fetchAllUsers]);

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

    let finalContent = msg.formattedText || msg.text;
    
    // Handle attachments from RichTextEditor (voice, video, etc.)
    if (msg.attachmentUrl) {
      const prefix = msg.attachmentType === 'audio' ? '🎵' : msg.attachmentType === 'video' ? '🎬' : '📎';
      const label = msg.attachmentName || (msg.attachmentType === 'audio' ? 'Voice Message' : msg.attachmentType === 'video' ? 'Video Message' : 'Attachment');
      finalContent = `${finalContent}\n${prefix} [${label}](${msg.attachmentUrl})`.trim();
    }

    const tempId = `temp-${Date.now()}`;
    const tempMsg: Message = {
      id: tempId,
      senderId: user.id,
      text: finalContent,
      timestamp: new Date(),
      status: 'sending',
      reactions: [],
    };

    // Optimistically add message immediately
    setConversations(prev => prev.map(c =>
      c.id === activeId ? { ...c, messages: [...c.messages, tempMsg] } : c
    ));

    const { error } = await supabase
      .from('messages')
      .insert({
        dm_id: activeId,
        author_id: user.id,
        content: finalContent,
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
                  const sender = isMine ? { name: 'You', avatar: 'YO', color: '#7c3aed' } : (senderP ?? active.participants[0]);
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
                             <span className="truncate max-w-[200px]">{renderInline(replyMsg.text)}</span>
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
                               <MessageContent content={msg.text} />
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
          <div className="px-4 pb-4">
            <RichTextEditor
              placeholder={`Message ${getConvName(active)}`}
              people={allUsers.map(u => ({
                id: u.id,
                name: u.display_name || u.username || 'User',
                avatar: (u.display_name || u.username || 'U')[0].toUpperCase(),
                color: u.avatar_gradient || '#7c3aed',
                status: u.status || 'offline',
              }))}
              replyTo={replyTo ? {
                id: replyTo.id,
                senderId: replyTo.senderId,
                senderName: (allUsers.find(u => u.id === replyTo.senderId)?.display_name || 'User'),
                text: replyTo.text,
              } : null}
              draftId={active.id}
              draftType="dm"
              onClearReply={() => setReplyTo(null)}
              onSend={handleSend}
            />
          </div>
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
