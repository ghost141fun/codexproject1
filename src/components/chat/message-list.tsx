"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, isToday, isYesterday } from "date-fns";
import {
  Hash, Smile, MessageSquare, Share2, MoreHorizontal, Bookmark,
  FileText, Download, ExternalLink, Film, Music, FileCode, File,
  Image as ImageIcon, Loader2, Copy, Trash2, BookmarkCheck,
  Check, Pin, Clock, EyeOff, Edit3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, useUser } from '@/database';
import { useToast } from '@/hooks/use-toast';

interface MessageListProps {
  channelId: string;
}

/* ── Blob download ────────────────────────────────────────────────────────── */
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

/* ── File card ────────────────────────────────────────────────────────────── */
function FileCard({ name, url, type }: { name: string; url: string; type?: string }) {
  const [downloading, setDownloading] = useState(false);
  const [playing, setPlaying] = useState(false);
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

/* ── Image card ───────────────────────────────────────────────────────────── */
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

/* ── Inline text renderer ────────────────────────────────────────────────── */
function renderInline(text: string): React.ReactNode {
  if (!text) return null;

  // Order of rules matters for proper matching (e.g., ** before *)
  const rules = [
    { type: 'mention', regex: /@([a-zA-Z0-9_]+)/ },
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
    case 'mention':
      element = <span key={key} className="text-[#ef4444] font-bold hover:underline cursor-pointer">@{firstMatch.content}</span>;
      break;
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

/* ── Emoji reactions ─────────────────────────────────────────────────────── */
const QUICK_EMOJIS = [
  '👍', '❤️', '😂', '🔥', '🚀', '✅', '😮', '👀', '💯', '🙌', 
  '🎉', '✨', '👏', '🙏', '😭', '🥺', '😎', '🤔', '😊', '🥰',
  '😍', '🤩', '😘', '🤷', '🤦', '😅', '🤣', '😁', '🤗', '😋',
  '🙃', '🥲', '🤫', '🤪', '🤬', '😡', '😱', '🤯', '🥳', '😴',
  '🤢', '🤮', '🥶', '🥵', '😵', '😷', '🤒', '🤕', '🥱', '🤐',
  '💪', '✌️', '🤞', '🤙', '👋', '🤝', '👊', '🤜', '🤛', '🧠',
  '🫀', '🫁', '👁️', '👅', '👄', '💋', '🩸', '🦷', '🦴', '💀',
  '👻', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼',
  '😽', '🙀', '😿', '😾', '🙈', '🙉', '🙊', '🐵', '🐒', '🦍',
  '🐶', '🐕', '🦮', '🐩', '🐺', '🦊', '🦝', '🐱', '🐈', '🦁'
];

function EmojiPicker({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) {
  return (
    <div className="absolute bottom-full right-0 mb-1 bg-[#222529] border border-white/10 rounded-xl p-2 shadow-xl z-50 grid grid-cols-8 sm:grid-cols-10 gap-1 w-[260px] sm:w-[320px] max-h-48 overflow-y-auto custom-scrollbar">
      {QUICK_EMOJIS.map(e => (
        <button key={e} onClick={() => { onSelect(e); onClose(); }}
          className="text-lg w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">
          {e}
        </button>
      ))}
    </div>
  );
}

/* ── More actions dropdown ───────────────────────────────────────────────── */
function MoreMenu({ message, currentUserId, onDelete, onCopy, onClose, onEdit, onRemind, onPin, onUnread, isPinned }: {
  message: any; currentUserId: string; onDelete: () => void; onCopy: () => void; onClose: () => void;
  onEdit: () => void; onRemind: () => void; onPin: () => void; onUnread: () => void; isPinned: boolean;
}) {
  return (
    <div className="absolute top-full right-0 mt-1 bg-[#222529] border border-white/10 rounded-xl py-1 shadow-xl z-50 w-44">
      <button onClick={() => { onUnread(); onClose(); }} className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] text-[#d1d2d3] hover:bg-white/[0.08] hover:text-white transition-colors">
        <EyeOff className="w-3.5 h-3.5" /> Mark unread
      </button>
      <button onClick={() => { onRemind(); onClose(); }} className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] text-[#d1d2d3] hover:bg-white/[0.08] hover:text-white transition-colors">
        <Clock className="w-3.5 h-3.5" /> Remind me
      </button>
      <button onClick={() => { onPin(); onClose(); }} className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] text-[#d1d2d3] hover:bg-white/[0.08] hover:text-white transition-colors">
        <Pin className="w-3.5 h-3.5" /> {isPinned ? 'Unpin' : 'Pin to channel'}
      </button>

      <div className="h-px bg-white/[0.07] my-1" />

      <button onClick={() => { onCopy(); onClose(); }} className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] text-[#d1d2d3] hover:bg-white/[0.08] hover:text-white transition-colors">
        <Copy className="w-3.5 h-3.5" /> Copy text
      </button>
      <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/workspace#${message.id}`); onClose(); }}
        className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] text-[#d1d2d3] hover:bg-white/[0.08] hover:text-white transition-colors">
        <Share2 className="w-3.5 h-3.5" /> Copy link
      </button>
      
      {message.author_id === currentUserId && (
        <>
          <div className="h-px bg-white/[0.07] my-1" />
          <button onClick={() => { onEdit(); onClose(); }} className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] text-[#d1d2d3] hover:bg-white/[0.08] hover:text-white transition-colors">
            <Edit3 className="w-3.5 h-3.5" /> Edit message
          </button>
          <button onClick={() => { onDelete(); onClose(); }} className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] text-red-400 hover:bg-red-500/10 transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Delete message
          </button>
        </>
      )}
    </div>
  );
}

/* ── Message hover toolbar ───────────────────────────────────────────────── */
function MessageToolbar({ message, currentUserId, onReact, onDelete, onEdit, onRemind, onPin, onUnread, isPinned, bookmarked, onBookmark, toast, onMenuOpenChange, onThread }: {
  message: any; currentUserId: string;
  onReact: (emoji: string) => void;
  onDelete: () => void;
  onEdit: () => void;
  onRemind: () => void;
  onPin: () => void;
  onUnread: () => void;
  isPinned: boolean;
  bookmarked: boolean;
  onBookmark: () => void;
  toast: Function;
  onMenuOpenChange: (open: boolean) => void;
  onThread: () => void;
}) {
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const handleCopyText = () => {
    navigator.clipboard.writeText(message.content);
    toast({ title: 'Copied', description: 'Message text copied to clipboard.' });
    setShowMore(false);
  };

  const handleForward = () => {
    navigator.clipboard.writeText(message.content);
    toast({ title: 'Forwarded', description: 'Message copied — paste it anywhere.' });
  };

  return (
    <>
      {(showEmoji || showMore) && (
        <div 
          className="fixed inset-0 z-40 cursor-default" 
          onClick={(e) => {
            e.stopPropagation();
            setShowEmoji(false);
            setShowMore(false);
            onMenuOpenChange(false);
          }}
        />
      )}
      
      <div className={cn(
        "relative flex items-center gap-0.5 bg-[#222529] border border-white/[0.1] rounded-lg px-1 py-0.5 shadow-lg",
        (showEmoji || showMore) ? "z-50" : "z-10"
      )}>
        <div className="relative">
          <button 
            onClick={() => { 
              const next = !showEmoji;
              setShowEmoji(next); 
              onMenuOpenChange(next); 
              setShowMore(false); 
            }} 
            title="Add reaction"
            className="h-7 w-7 flex items-center justify-center rounded hover:bg-white/10 text-[#b9babd] hover:text-white transition-colors"
          >
            <Smile className="w-4 h-4" />
          </button>
          {showEmoji && <EmojiPicker onSelect={(e) => { onReact(e); onMenuOpenChange(false); }} onClose={() => { setShowEmoji(false); onMenuOpenChange(false); }} />}
        </div>

      <button onClick={onThread} title="Reply in thread"
        className="h-7 w-7 flex items-center justify-center rounded hover:bg-white/10 text-[#b9babd] hover:text-white transition-colors">
        <MessageSquare className="w-4 h-4" />
      </button>

      <button onClick={handleForward} title="Forward message"
        className="h-7 w-7 flex items-center justify-center rounded hover:bg-white/10 text-[#b9babd] hover:text-white transition-colors">
        <Share2 className="w-4 h-4" />
      </button>

      <button onClick={onBookmark} title={bookmarked ? 'Remove bookmark' : 'Save for later'}
        className={cn("h-7 w-7 flex items-center justify-center rounded hover:bg-white/10 transition-colors",
          bookmarked ? "text-yellow-400" : "text-[#b9babd] hover:text-white"
        )}>
        {bookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
      </button>

        <div className="relative">
          <button 
            onClick={() => { 
              const next = !showMore;
              setShowMore(next); 
              onMenuOpenChange(next); 
              setShowEmoji(false); 
            }} 
            title="More actions"
            className="h-7 w-7 flex items-center justify-center rounded hover:bg-white/10 text-[#b9babd] hover:text-white transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {showMore && (
          <MoreMenu
            message={message}
            currentUserId={currentUserId}
            onDelete={() => { onDelete(); setShowMore(false); onMenuOpenChange(false); }}
            onCopy={handleCopyText}
            onClose={() => { setShowMore(false); onMenuOpenChange(false); }}
            onEdit={() => { onEdit(); setShowMore(false); onMenuOpenChange(false); }}
            onRemind={() => { onRemind(); setShowMore(false); onMenuOpenChange(false); }}
            onPin={() => { onPin(); setShowMore(false); onMenuOpenChange(false); }}
            onUnread={() => { onUnread(); setShowMore(false); onMenuOpenChange(false); }}
            isPinned={isPinned}
          />
        )}
      </div>
    </div>
  </>
);
}

interface MessageListProps {
  channelId: string;
  onThread?: (message: any) => void;
  activeThreadId?: string;
  parentId?: string | null;
}

export const MessageList: React.FC<MessageListProps> = ({ channelId, onThread, parentId = null }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const { supabase } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [users, setUsers] = useState<Record<string, any>>({});
  const [reactions, setReactions] = useState<Record<string, Record<string, string[]>>>({});
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [pinnedMessages, setPinnedMessages] = useState<Record<string, { pinnerName: string }>>({});
  const [unreadMessages, setUnreadMessages] = useState<Set<string>>(new Set());
  const [activeMenuMessageId, setActiveMenuMessageId] = useState<string | null>(null);
  const { user } = useUser();
  const currentUserId = user?.id || '';
  const { toast } = useToast();

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!supabase || !channelId) return;
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

      if (error) console.error('Error fetching messages:', error.message, error);
      else setMessages(data || []);
    };
    fetchMessages();

    const subscription = supabase
      .channel(`messages-${channelId}-${Math.random()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          const newMsg = payload.new as any;
          setMessages(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          setMessages(prev => prev.filter(m => m.id !== (payload.old as any).id));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          const updatedMsg = payload.new as any;
          setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
        }
      )
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, [supabase, channelId]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!supabase || messages.length === 0) return;
      const userIds = [...new Set(messages.map(m => m.author_id))];
      const { data, error } = await supabase.from('users').select('id, display_name, avatar_url, profile_picture_url, username').in('id', userIds);
      if (error) console.error('Error fetching users:', error.message);
      else {
        const map = (data || []).reduce((acc, u) => { acc[u.id] = u; return acc; }, {} as Record<string, any>);
        setUsers(prev => ({ ...prev, ...map }));
      }
    };
    fetchUsers();
  }, [supabase, messages]);

  const handleReact = (messageId: string, emoji: string) => {
    setReactions(prev => {
      const msgReactions = { ...(prev[messageId] || {}) };
      const users = msgReactions[emoji] || [];
      if (users.includes(currentUserId)) {
        msgReactions[emoji] = users.filter(u => u !== currentUserId);
        if (!msgReactions[emoji].length) delete msgReactions[emoji];
      } else {
        msgReactions[emoji] = [...users, currentUserId];
      }
      return { ...prev, [messageId]: msgReactions };
    });
  };

  const handleDelete = async (messageId: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('messages').delete().eq('id', messageId);
    if (error) toast({ variant: 'destructive', title: 'Error', description: 'Could not delete message.' });
    else setMessages(prev => prev.filter(m => m.id !== messageId));
  };

  const handleBookmark = (messageId: string) => {
    const isBookmarked = bookmarks.has(messageId);
    if (isBookmarked) {
      toast({ title: 'Bookmark removed' });
    } else {
      toast({ title: 'Saved', description: 'Message saved to bookmarks.' });
    }
    setBookmarks(prev => {
      const next = new Set(prev);
      if (isBookmarked) next.delete(messageId);
      else next.add(messageId);
      return next;
    });
  };

  const handleEditInit = (message: any) => {
    setEditingMessageId(message.id);
    setEditContent(message.content);
  };

  const handleEditSubmit = async (messageId: string) => {
    if (!supabase || !editContent.trim()) return;
    const { error } = await supabase.from('messages').update({ content: editContent, edited_at: new Date().toISOString() }).eq('id', messageId);
    if (error) toast({ variant: 'destructive', title: 'Edit failed', description: error.message });
    else setEditingMessageId(null);
  };

  const handlePin = (messageId: string) => {
    const isPinned = !!pinnedMessages[messageId];
    if (isPinned) {
      toast({ title: 'Unpinned message' });
    } else {
      toast({ title: 'Pinned to channel' });
    }
    setPinnedMessages(prev => {
      const next = { ...prev };
      if (isPinned) {
        delete next[messageId];
      } else {
        next[messageId] = { pinnerName: user?.display_name || user?.username || 'You' };
      }
      return next;
    });
  };

  const handleUnread = (messageId: string) => {
    setUnreadMessages(prev => {
      const next = new Set(prev);
      next.add(messageId);
      return next;
    });
    toast({ title: 'Marked as unread' });
  };

  const handleRemind = (messageId: string) => {
    toast({ title: 'Reminder set', description: 'We will remind you about this in 1 hour.' });
  };

  const formatTime = (ts: string) => { if (!mounted) return ""; try { return format(new Date(ts), 'h:mm a'); } catch { return ""; } };
  const formatDateDivider = (ts: string) => {
    if (!mounted) return "";
    try {
      const d = new Date(ts);
      if (isToday(d)) return "Today";
      if (isYesterday(d)) return "Yesterday";
      return format(d, 'MMMM d, yyyy');
    } catch { return ""; }
  };

  const displayedMessages = messages.filter(m => {
    if (parentId) return m.parent_id === parentId;
    return !m.parent_id;
  });

  const groupedMessages: { date: string; messages: any[] }[] = [];
  displayedMessages.forEach(msg => {
    const dateKey = mounted ? format(new Date(msg.created_at), 'yyyy-MM-dd') : 'today';
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === dateKey) last.messages.push(msg);
    else groupedMessages.push({ date: dateKey, messages: [msg] });
  });

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto bg-[#1a1d21]">
      <div className="px-5 pt-8 pb-4">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.07] flex items-center justify-center mb-4">
          <Hash className="w-8 h-8 text-[#b9babd]" strokeWidth={2.5} />
        </div>
        <h1 className="text-[22px] font-extrabold text-white mb-1">Welcome to #general!</h1>
        <p className="text-[#b9babd] text-[14px]">This is the very beginning of the <strong className="text-white font-semibold">#general</strong> channel.</p>
      </div>

      <div className="pb-4">
        {groupedMessages.map(({ date, messages: dayMessages }) => (
          <div key={date}>
            <div className="flex items-center gap-3 px-5 py-3">
              <div className="flex-1 h-px bg-white/[0.07]" />
              <span className="text-[12px] font-semibold text-[#b9babd] border border-white/[0.1] rounded-full px-3 py-0.5 shrink-0">
                {formatDateDivider(dayMessages[0].created_at)}
              </span>
              <div className="flex-1 h-px bg-white/[0.07]" />
            </div>

            {dayMessages.map((message, index) => {
              const user = users[message.author_id];
              const prevMsg = dayMessages[index - 1];
              const isGrouped = !pinnedMessages[message.id] && !unreadMessages.has(message.id) && prevMsg && prevMsg.author_id === message.author_id &&
                new Date(message.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 5 * 60 * 1000;
              const msgReactions = reactions[message.id] || {};

              return (
                <div key={message.id} className="relative flex flex-col">
                  {unreadMessages.has(message.id) && (
                     <div className="flex items-center gap-3 px-5 py-2">
                       <div className="flex-1 h-px bg-red-500/50" />
                       <span className="text-[10px] uppercase font-bold text-red-500">New messages</span>
                       <div className="flex-1 h-px bg-red-500/50" />
                     </div>
                  )}

                  {pinnedMessages[message.id] && (
                    <div className="px-5 text-[11px] text-yellow-500/90 font-bold flex items-center gap-2 mt-3 mb-0.5 group/pin">
                      <div className="flex items-center gap-1.5 bg-yellow-500/10 px-2 py-0.5 rounded-md border border-yellow-500/20 shadow-sm transition-all hover:bg-yellow-500/20">
                        <Pin className="w-3 h-3 rotate-45" /> 
                        <span className="uppercase tracking-[0.05em]">Pinned by {pinnedMessages[message.id].pinnerName}</span>
                      </div>
                    </div>
                  )}

                  <div className={cn(
                    "group relative flex gap-3 px-5 hover:bg-white/[0.03] transition-all duration-300 rounded-sm", 
                    isGrouped ? "py-0.5" : "pt-3 pb-0.5", 
                    pinnedMessages[message.id] && "bg-yellow-500/[0.04] border-l-[3px] border-yellow-500/60 shadow-[inset_0_0_20px_rgba(234,179,8,0.02)]"
                  )}>
                    <div className="w-9 shrink-0 mt-0.5">
                      {!isGrouped ? (
                        <Avatar className="w-9 h-9 rounded-lg cursor-pointer hover:opacity-80 transition-opacity">
                          <AvatarImage src={user?.avatar_url || user?.profile_picture_url} />
                          <AvatarFallback className="rounded-lg bg-[#4a154b] text-white text-sm font-bold">
                            {(user?.display_name || user?.username || '?')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <span className="text-[11px] text-[#5c5f63] opacity-0 group-hover:opacity-100 transition-opacity leading-tight block text-right pt-0.5">
                          {formatTime(message.created_at)}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 pb-1">
                      {!isGrouped && (
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-bold text-[15px] text-white hover:underline cursor-pointer">
                            {user?.display_name || user?.username || 'Unknown'}
                          </span>
                          <span className="text-[11px] text-[#5c5f63]">{formatTime(message.created_at)}</span>
                        </div>
                      )}

                      {editingMessageId === message.id ? (
                        <div className="mt-1 mb-2 flex flex-col">
                          <textarea
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            className="w-full bg-[#222529] border border-white/10 focus:border-primary rounded-lg p-2.5 text-white text-[14px] outline-none transition-colors"
                            rows={2}
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSubmit(message.id); }
                              if (e.key === 'Escape') { setEditingMessageId(null); }
                            }}
                          />
                          <div className="flex justify-end gap-2 mt-2">
                            <button onClick={() => setEditingMessageId(null)} className="text-[12px] font-semibold text-[#b9babd] hover:text-white px-3 py-1.5 rounded-lg transition-colors">Cancel</button>
                            <button onClick={() => handleEditSubmit(message.id)} className="text-[12px] font-semibold text-white bg-primary hover:bg-primary/80 px-3 py-1.5 rounded-lg transition-colors shadow-lg">Save</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-1">
                          <MessageContent content={message.content} />
                          {message.edited_at && <span className="text-[10px] text-[#5c5f63] ml-1 mt-1 shrink-0 select-none">(edited)</span>}
                        </div>
                      )}

                    {Object.keys(msgReactions).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {Object.entries(msgReactions).map(([emoji, reactors]) => (
                          <button key={emoji}
                            onClick={() => handleReact(message.id, emoji)}
                            className={cn(
                              "flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] border transition-all",
                              reactors.includes(currentUserId)
                                ? "bg-primary/20 border-primary/40 text-white"
                                : "bg-white/[0.05] border-white/10 text-[#d1d2d3] hover:bg-white/10"
                            )}>
                            <span>{emoji}</span>
                            <span className="font-semibold">{reactors.length}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className={cn(
                    "absolute right-4 top-2 transition-opacity z-10", 
                    activeMenuMessageId === message.id ? "opacity-100 visible" : "opacity-0 group-hover:opacity-100",
                    activeMenuMessageId && activeMenuMessageId !== message.id ? "group-hover:opacity-0 invisible" : ""
                  )}>
                    <MessageToolbar
                      message={message}
                      currentUserId={currentUserId}
                      onReact={(emoji) => handleReact(message.id, emoji)}
                      onDelete={() => handleDelete(message.id)}
                      onEdit={() => handleEditInit(message)}
                      onPin={() => handlePin(message.id)}
                      onRemind={() => handleRemind(message.id)}
                      onUnread={() => handleUnread(message.id)}
                      isPinned={!!pinnedMessages[message.id]}
                      bookmarked={bookmarks.has(message.id)}
                      onBookmark={() => handleBookmark(message.id)}
                      toast={toast}
                      onMenuOpenChange={(open) => setActiveMenuMessageId(open ? message.id : null)}
                      onThread={() => onThread?.(message)}
                    />
                  </div>
                </div>
                
                {!parentId && (
                  <div className="mt-1 ml-11">
                    {(() => {
                      const count = messages.filter(m => m.parent_id === message.id).length;
                      if (count === 0) return null;
                      
                      return (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onThread?.(message);
                          }}
                          className="group flex items-center gap-2 px-2 py-1 rounded hover:bg-white/10 transition-colors"
                        >
                          <div className="flex -space-x-1.5 overflow-hidden">
                            <div className="w-5 h-5 rounded-md bg-[#4a154b] flex items-center justify-center text-[8px] font-bold text-white border border-[#1a1d21]">
                              {count}
                            </div>
                          </div>
                          <span className="text-[12px] font-semibold text-[#1d9bd1] group-hover:underline">
                            {count} {count === 1 ? 'reply' : 'replies'}
                          </span>
                          <span className="text-[11px] text-[#b9babd] opacity-0 group-hover:opacity-100 transition-opacity">
                            View thread
                          </span>
                        </button>
                      );
                    })()}
                  </div>
                )}
              </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};