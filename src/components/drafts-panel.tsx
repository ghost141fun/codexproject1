'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/database';
import { Edit3, Hash, MessageSquare, Loader2, Clock, Trash2, Check, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface DraftsPanelProps {
  user: any;
  channels: any[];
  directMessages: any[];
  onSelect: (id: string, type: 'channel' | 'dm') => void;
}

export function DraftsPanel({ user, channels, directMessages, onSelect }: DraftsPanelProps) {
  const { supabase } = useAuth();
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function fetchDrafts() {
    if (!supabase || !user) return;
    const { data, error } = await supabase
      .from('drafts')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setDrafts(data);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    fetchDrafts();

    if (supabase && user?.id) {
      const channel = supabase.channel(`drafts-${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'drafts', filter: `user_id=eq.${user.id}` }, fetchDrafts)
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [supabase, user?.id]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!supabase) return;
    
    const { error } = await supabase.from('drafts').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not delete draft.' });
    } else {
      setDrafts(prev => prev.filter(d => d.id !== id));
      toast({ title: 'Draft deleted' });
    }
  };

  const startEditing = (e: React.MouseEvent, draft: any) => {
    e.stopPropagation();
    setEditingId(draft.id);
    setEditValue(draft.content);
  };

  const handleSaveEdit = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!supabase || !editValue.trim()) return;
    
    setIsSaving(true);
    const { error } = await supabase
      .from('drafts')
      .update({ content: editValue.trim(), updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save draft.' });
    } else {
      setEditingId(null);
      fetchDrafts();
      toast({ title: 'Draft updated' });
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#1a1d21]">
        <Loader2 className="w-6 h-6 animate-spin text-[#7c3aed]" />
      </div>
    );
  }

  const getContextMeta = (draft: any) => {
    if (draft.context_type === 'channel') {
      const ch = channels.find(c => c.id === draft.context_id);
      return {
        name: ch ? ch.name : 'Unknown Channel',
        icon: <Hash className="w-4 h-4 text-[#b9babd]" />,
        fallback: '#',
      };
    } else {
      const dm = directMessages.find(d => d.id === draft.context_id);
      return {
        name: dm ? dm.name : 'Unknown Contact',
        icon: <MessageSquare className="w-4 h-4 text-[#b9babd]" />,
        avatarUrl: dm ? dm.avatar : undefined,
        fallback: dm?.name?.[0]?.toUpperCase() || 'U',
      };
    }
  };

  const timeLabel = (dateString: string) => {
    const d = new Date(dateString);
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex-1 flex flex-col bg-[#1a1d21] overflow-hidden">
      <div className="px-8 py-6 border-b border-white/[0.07] shrink-0">
        <h1 className="text-[20px] font-bold text-white flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-[#a855f7]" /> Drafts & Sent
          <span className="text-[14px] font-normal text-[#b9babd] ml-1">({drafts.length})</span>
        </h1>
      </div>
      
      {drafts.length === 0 ? (
        <div className="flex-1 flex items-center justify-center flex-col gap-3 text-[#b9babd]">
          <Edit3 className="w-10 h-10 opacity-20" />
          <p className="text-sm font-medium">No active drafts</p>
          <p className="text-xs text-[#5c5f63]">Messages you start typing will be saved here</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
          <div className="max-w-4xl space-y-3">
            {drafts.map(draft => {
              const meta = getContextMeta(draft);
              const isEditing = editingId === draft.id;
              
              return (
                <div key={draft.id} 
                  onClick={() => !isEditing && onSelect(draft.context_id, draft.context_type)}
                  className={cn(
                    "group rounded-xl bg-[#222529] border border-white/[0.07] p-4 flex flex-col transition-all shadow-sm relative",
                    !isEditing ? "hover:border-[#7c3aed]/50 hover:bg-[#25282d] cursor-pointer" : "border-[#7c3aed]/50 bg-[#25282d]"
                  )}>
                  
                  {/* Actions Toolbar on Hover */}
                  {!isEditing && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => startEditing(e, draft)}
                        className="w-8 h-8 rounded-lg bg-[#1a1d21] border border-white/5 flex items-center justify-center text-[#b9babd] hover:text-white hover:bg-white/5 transition-colors"
                        title="Edit draft"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, draft.id)}
                        className="w-8 h-8 rounded-lg bg-[#1a1d21] border border-white/5 flex items-center justify-center text-[#b9babd] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete draft"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-2">
                    {draft.context_type === 'dm' && meta.avatarUrl ? (
                      <Avatar className="w-6 h-6 rounded-lg pointer-events-none">
                        <AvatarImage src={meta.avatarUrl} />
                        <AvatarFallback className="rounded-lg text-[10px] bg-[#4a154b] text-white">{meta.fallback}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-6 h-6 rounded-lg bg-[#1a1d21] border border-white/[0.07] flex items-center justify-center text-xs font-bold text-[#b9babd]">
                        {meta.fallback}
                      </div>
                    )}
                    <span className="font-semibold text-[13px] text-white flex-1">{meta.name}</span>
                    {!isEditing && (
                      <div className="flex items-center gap-1.5 text-[#5c5f63] font-mono text-[10.5px] group-hover:opacity-0 transition-opacity">
                        <Clock className="w-3 h-3" />
                        {timeLabel(draft.updated_at)}
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="pl-9 space-y-3" onClick={e => e.stopPropagation()}>
                      <textarea
                        autoFocus
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-[13.5px] text-white focus:outline-none focus:border-[#7c3aed]/50 min-h-[100px] resize-none leading-relaxed"
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <button 
                          onClick={() => setEditingId(null)}
                          className="px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-[#b9babd] hover:text-white hover:bg-white/5 transition-all"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={(e) => handleSaveEdit(e, draft.id)}
                          disabled={isSaving || !editValue.trim()}
                          className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#7c3aed] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#8b5cf6] transition-all disabled:opacity-50"
                        >
                          {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pl-9 pr-4 text-[13px] text-[#d1d2d3] leading-relaxed line-clamp-3 overflow-hidden pointer-events-none">
                      {draft.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
