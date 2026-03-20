"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, isToday, isYesterday } from "date-fns";
import {
  Hash, Smile, MessageSquare, Share2, MoreHorizontal, Bookmark,
  FileText, Download, ExternalLink, Film, Music, FileCode, File,
  Image as ImageIcon, Loader2, Copy, Trash2, BookmarkCheck,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from '@/database';
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
function FileCard({ name, url }: { name: string; url: string }) {
  const [downloading, setDownloading] = useState(false);
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const getIcon = () => {
    if (['mp4', 'mov', 'webm', 'avi'].includes(ext)) return <Film className="w-5 h-5" />;
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return <Music className="w-5 h-5" />;
    if (['js', 'ts', 'tsx', 'jsx', 'py', 'json', 'html', 'css', 'sql'].includes(ext)) return <FileCode className="w-5 h-5" />;
    if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext)) return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };
  const getAccent = () => {
    if (['mp4', 'mov', 'webm'].includes(ext)) return 'from-purple-500/20 border-purple-500/30 text-purple-400';
    if (['mp3', 'wav', 'ogg'].includes(ext)) return 'from-green-500/20 border-green-500/30 text-green-400';
    if (['js', 'ts', 'tsx', 'jsx', 'py'].includes(ext)) return 'from-yellow-500/20 border-yellow-500/30 text-yellow-400';
    if (['pdf'].includes(ext)) return 'from-red-500/20 border-red-500/30 text-red-400';
    if (['doc', 'docx'].includes(ext)) return 'from-blue-500/20 border-blue-500/30 text-blue-400';
    return 'from-[#b9babd]/10 border-white/10 text-[#b9babd]';
  };
  return (
    <div className={cn("mt-2 flex items-center gap-3 bg-gradient-to-r to-transparent border rounded-xl px-4 py-3 max-w-sm group transition-all hover:to-white/[0.02]", getAccent())}>
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
  const parts = text.split(/(\*\*.+?\*\*|`[^`]+`|\[.+?\]\(.+?\))/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className="bg-white/10 text-[#e3b341] px-1.5 py-0.5 rounded text-[13px] font-mono">{part.slice(1, -1)}</code>;
    const lm = part.match(/^\[(.+?)\]\((.+?)\)$/);
    if (lm) return <a key={i} href={lm[2]} target="_blank" rel="noopener noreferrer" className="text-[#4a9eff] hover:underline">{lm[1]}</a>;
    return <span key={i}>{part}</span>;
  });
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
    if (file) { flushText(); elements.push(<FileCard key={i} name={file[2]} url={file[3]} />); return; }
    textLines.push(line);
  });
  flushText();
  return <div className="space-y-0.5">{elements}</div>;
}

/* ── Emoji reactions ─────────────────────────────────────────────────────── */
const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '🚀', '✅', '😮', '👀'];

function EmojiPicker({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) {
  return (
    <div className="absolute bottom-full right-0 mb-1 bg-[#222529] border border-white/10 rounded-xl p-2 shadow-xl z-50 flex gap-1">
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
function MoreMenu({ message, currentUserId, onDelete, onCopy, onClose }: {
  message: any; currentUserId: string; onDelete: () => void; onCopy: () => void; onClose: () => void;
}) {
  return (
    <div className="absolute top-full right-0 mt-1 bg-[#222529] border border-white/10 rounded-xl py-1 shadow-xl z-50 w-44" onClick={onClose}>
      <button onClick={onCopy} className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] text-[#d1d2d3] hover:bg-white/[0.08] hover:text-white transition-colors">
        <Copy className="w-3.5 h-3.5" /> Copy text
      </button>
      <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/workspace#${message.id}`); onClose(); }}
        className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] text-[#d1d2d3] hover:bg-white/[0.08] hover:text-white transition-colors">
        <Share2 className="w-3.5 h-3.5" /> Copy link
      </button>
      {message.author_id === currentUserId && (
        <>
          <div className="h-px bg-white/[0.07] my-1" />
          <button onClick={onDelete} className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] text-red-400 hover:bg-red-500/10 transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Delete message
          </button>
        </>
      )}
    </div>
  );
}

/* ── Message hover toolbar ───────────────────────────────────────────────── */
function MessageToolbar({ message, currentUserId, onReact, onDelete, bookmarked, onBookmark, toast }: {
  message: any; currentUserId: string;
  onReact: (emoji: string) => void;
  onDelete: () => void;
  bookmarked: boolean;
  onBookmark: () => void;
  toast: Function;
}) {
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyText = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast({ title: 'Copied', description: 'Message text copied to clipboard.' });
    setTimeout(() => setCopied(false), 2000);
    setShowMore(false);
  };

  const handleForward = () => {
    navigator.clipboard.writeText(message.content);
    toast({ title: 'Forwarded', description: 'Message copied — paste it anywhere.' });
  };

  const handleReply = () => {
    toast({ title: 'Thread reply', description: 'Thread replies coming soon.' });
  };

  return (
    <div className="relative flex items-center gap-0.5 bg-[#222529] border border-white/[0.1] rounded-lg px-1 py-0.5 shadow-lg">
      {/* Emoji reaction */}
      <div className="relative">
        <button onClick={() => { setShowEmoji(v => !v); setShowMore(false); }} title="Add reaction"
          className="h-7 w-7 flex items-center justify-center rounded hover:bg-white/10 text-[#b9babd] hover:text-white transition-colors">
          <Smile className="w-4 h-4" />
        </button>
        {showEmoji && <EmojiPicker onSelect={onReact} onClose={() => setShowEmoji(false)} />}
      </div>

      {/* Reply in thread */}
      <button onClick={handleReply} title="Reply in thread"
        className="h-7 w-7 flex items-center justify-center rounded hover:bg-white/10 text-[#b9babd] hover:text-white transition-colors">
        <MessageSquare className="w-4 h-4" />
      </button>

      {/* Forward */}
      <button onClick={handleForward} title="Forward message"
        className="h-7 w-7 flex items-center justify-center rounded hover:bg-white/10 text-[#b9babd] hover:text-white transition-colors">
        <Share2 className="w-4 h-4" />
      </button>

      {/* Bookmark */}
      <button onClick={onBookmark} title={bookmarked ? 'Remove bookmark' : 'Save for later'}
        className={cn("h-7 w-7 flex items-center justify-center rounded hover:bg-white/10 transition-colors",
          bookmarked ? "text-yellow-400" : "text-[#b9babd] hover:text-white"
        )}>
        {bookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
      </button>

      {/* More actions */}
      <div className="relative">
        <button onClick={() => { setShowMore(v => !v); setShowEmoji(false); }} title="More actions"
          className="h-7 w-7 flex items-center justify-center rounded hover:bg-white/10 text-[#b9babd] hover:text-white transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
        {showMore && (
          <MoreMenu
            message={message}
            currentUserId={currentUserId}
            onDelete={() => { onDelete(); setShowMore(false); }}
            onCopy={handleCopyText}
            onClose={() => setShowMore(false)}
          />
        )}
      </div>
    </div>
  );
}

/* ── Main MessageList ─────────────────────────────────────────────────────── */
export const MessageList: React.FC<MessageListProps> = ({ channelId }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const { supabase } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [users, setUsers] = useState<Record<string, any>>({});
  const [reactions, setReactions] = useState<Record<string, Record<string, string[]>>>({});
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState('');
  const { toast } = useToast();

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  useEffect(() => {
    if (supabase) {
      supabase.auth.getUser().then(({ data }) => { if (data.user) setCurrentUserId(data.user.id); });
    }
  }, [supabase]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!supabase) return;
      const { data, error } = await supabase.from('messages').select('*').eq('channel_id', channelId).order('created_at', { ascending: true });
      if (error) console.error('Error fetching messages:', error);
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
            // avoid duplicate if we already have it
            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Fetch sender user data if not cached
          supabase
            .from('users')
            .select('id, display_name, profile_picture_url, username')
            .eq('id', newMsg.author_id)
            .single()
            .then(({ data }) => {
              if (data) setUsers(prev => ({ ...prev, [data.id]: data }));
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
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime subscribed for channel:', channelId);
        }
      });

    return () => { subscription.unsubscribe(); };
  }, [supabase, channelId]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!supabase || messages.length === 0) return;
      const userIds = [...new Set(messages.map(m => m.author_id))];
      const { data, error } = await supabase.from('users').select('id, display_name, profile_picture_url, username').in('id', userIds);
      if (error) console.error('Error fetching users:', error.message);
      else {
        const map = (data || []).reduce((acc, u) => { acc[u.id] = u; return acc; }, {} as Record<string, any>);
        setUsers(prev => ({ ...prev, ...map }));
      }
    };
    fetchUsers();
  }, [supabase, messages]);

  /* ── Reactions (local state) ── */
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

  /* ── Delete message ── */
  const handleDelete = async (messageId: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('messages').delete().eq('id', messageId);
    if (error) toast({ variant: 'destructive', title: 'Error', description: 'Could not delete message.' });
    else setMessages(prev => prev.filter(m => m.id !== messageId));
  };

  /* ── Bookmark (local state) ── */
  const handleBookmark = (messageId: string) => {
    const isBookmarked = bookmarks.has(messageId);
    const next = new Set(bookmarks);
    if (isBookmarked) { next.delete(messageId); }
    else { next.add(messageId); }
    setBookmarks(next);
    if (isBookmarked) toast({ title: 'Bookmark removed' });
    else toast({ title: 'Saved', description: 'Message saved to bookmarks.' });
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

  const groupedMessages: { date: string; messages: any[] }[] = [];
  messages.forEach(msg => {
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
              const isGrouped = prevMsg && prevMsg.author_id === message.author_id &&
                new Date(message.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 5 * 60 * 1000;
              const msgReactions = reactions[message.id] || {};

              return (
                <div key={message.id}
                  className={cn("group relative flex gap-3 px-5 hover:bg-white/[0.03] transition-colors rounded-sm", isGrouped ? "py-0.5" : "pt-3 pb-0.5")}>
                  <div className="w-9 shrink-0 mt-0.5">
                    {!isGrouped ? (
                      <Avatar className="w-9 h-9 rounded-lg cursor-pointer hover:opacity-80 transition-opacity">
                        <AvatarImage src={user?.profile_picture_url} />
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
                    <MessageContent content={message.content} />

                    {/* Reactions row */}
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

                  {/* Hover toolbar */}
                  <div className="absolute right-4 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <MessageToolbar
                      message={message}
                      currentUserId={currentUserId}
                      onReact={(emoji) => handleReact(message.id, emoji)}
                      onDelete={() => handleDelete(message.id)}
                      bookmarked={bookmarks.has(message.id)}
                      onBookmark={() => handleBookmark(message.id)}
                      toast={toast}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};