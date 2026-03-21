'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SideRail } from "@/components/layout/side-rail";
import { WorkspaceSidebar } from "@/components/layout/workspace-sidebar";
import { DmSidebar } from "@/components/layout/dm-sidebar";
import { FilesSidebar } from "@/components/layout/files-sidebar";
import { ChatHeader } from "@/components/chat/chat-header";
import { MessageList } from "@/components/chat/message-list";
import { MessageInput } from "@/components/chat/message-input";
import { HuddleMeeting } from "@/components/chat/huddle-meeting";
import { Toaster } from "@/components/ui/toaster";
import { createClient } from '@/lib/supabase/client';
import {
  Radio, Bell, FileText, MessageSquare,
  Image as ImageIcon, Code, File, Loader2,
  Download, Trash2, ExternalLink, Blocks,
  Hash, Pin
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { IntegrationsPanel } from '@/components/integrations-panel';
import ActivityPage from '@/components/activity-panel';
import { DMPage } from '@/components/dm-panel';
import { ProfilePage } from '@/components/profile-panel';
import { AddMenu } from '@/components/add-menu';
interface WorkspaceClientProps {
  user: any;
  channels: any[];
  directMessages: any[];
  files: any[];
}

function HuddlesSidebar({ channels, activeHuddles, onStart }: {
  channels: any[];
  activeHuddles: { channelId: string; channelName: string }[];
  onStart: (id: string, name: string) => void;
}) {
  return (
    <div className="w-[260px] h-full flex flex-col bg-[#19171d] border-r border-white/[0.07] overflow-hidden shrink-0">
      <div className="px-4 h-[49px] flex items-center border-b border-white/[0.07] shrink-0">
        <h2 className="font-extrabold text-[18px] text-white">Huddles</h2>
      </div>
      <div className="px-3 pt-3 pb-2 shrink-0">
        <button onClick={() => onStart(channels[0]?.id ?? '', channels[0]?.name ?? 'general')}
          className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-[#6c42c4] hover:bg-[#7c52d4] text-white font-semibold text-[14px] transition-colors">
          <Radio className="w-4 h-4" /> Start Huddle
        </button>
      </div>
      {activeHuddles.length > 0 && (
        <div className="px-3 py-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#b9babd] px-1 mb-2">Active Now</p>
          {activeHuddles.map(h => (
            <button key={h.channelId} onClick={() => onStart(h.channelId, h.channelName)}
              className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-lg text-[14px] text-white hover:bg-white/[0.08] transition-colors">
              <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              <span className="truncate">#{h.channelName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function HuddleHub({ channels, user, onStart }: { channels: any[]; user: any; onStart: (id: string, name: string) => void; }) {
  return (
    <div className="flex-1 flex flex-col bg-[#1a1d21] overflow-y-auto">
      <div className="px-8 py-6 border-b border-white/[0.07] shrink-0">
        <h1 className="text-[20px] font-bold text-white">Huddle Hub</h1>
      </div>
      <div className="px-8 py-6 space-y-8">
        <div className="rounded-2xl bg-[#2c2340] border border-[#6c42c4]/30 p-8">
          <h2 className="text-[22px] font-extrabold text-white mb-2">Jump into a huddle</h2>
          <p className="text-[#b9babd] text-[14px] mb-6">Connect with your team instantly through voice and video.<br />No scheduling required.</p>
          <button onClick={() => onStart(channels[0]?.id ?? '', channels[0]?.name ?? 'general')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#6c42c4] hover:bg-[#7c52d4] text-white font-semibold text-[14px] transition-colors">
            <Radio className="w-4 h-4" /> Start Workspace Huddle
          </button>
        </div>
        <div>
          <p className="text-[12px] font-bold uppercase tracking-widest text-[#b9babd] mb-4">Recent Activity</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.map(channel => (
              <div key={channel.id} className="rounded-2xl bg-[#222529] border border-white/[0.07] p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#6c42c4]/20 flex items-center justify-center">
                    <Radio className="w-5 h-5 text-[#9b6dff]" />
                  </div>
                  <Avatar className="w-7 h-7 border-2 border-[#222529]">
                    <AvatarImage src={`https://picsum.photos/seed/${user?.id}/100/100`} />
                    <AvatarFallback className="text-[10px] bg-[#4a154b] text-white">
                      {(user?.email || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <p className="text-[15px] font-bold text-white">#{channel.name}</p>
                  <p className="text-[12px] text-[#b9babd] mt-0.5">Last active 2h ago</p>
                </div>
                <button onClick={() => onStart(channel.id, channel.name)}
                  className="w-full py-2 rounded-lg bg-[#1a1d21] hover:bg-white/[0.08] text-white font-semibold text-[13px] border border-white/[0.07] transition-colors">
                  Join Huddle
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

  // Replaced ActivityView with imported ActivityPage


function FilesView({ files, category, searchQuery, onDelete }: {
  files: any[]; category: string; searchQuery: string; onDelete: (file: any) => void;
}) {
  const getFileIcon = (type: string) => {
    if (type?.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-blue-400" />;
    if (type?.startsWith('video/')) return <FileText className="w-8 h-8 text-purple-400" />;
    if (type?.includes('pdf') || type?.includes('document') || type?.includes('text')) return <FileText className="w-8 h-8 text-orange-400" />;
    if (type?.includes('javascript') || type?.includes('typescript') || type?.includes('json') || type?.includes('html')) return <Code className="w-8 h-8 text-green-400" />;
    return <File className="w-8 h-8 text-[#b9babd]" />;
  };
  const matchesCategory = (file: any) => {
    if (category === 'all' || category === 'recent' || category === 'favorites') return true;
    if (category === 'image') return file.type?.startsWith('image/');
    if (category === 'document') return file.type?.includes('pdf') || file.type?.includes('document') || file.type?.includes('text');
    if (category === 'code') return file.type?.includes('javascript') || file.type?.includes('typescript') || file.type?.includes('json') || file.type?.includes('html');
    if (category === 'other') return !file.type?.startsWith('image/') && !file.type?.includes('pdf') && !file.type?.includes('javascript');
    return true;
  };
  const filtered = files.filter(matchesCategory).filter(f => !searchQuery || f.name?.toLowerCase().includes(searchQuery.toLowerCase()));
  const formatSize = (bytes: any) => {
    const n = Number(bytes);
    if (!n) return 'Unknown';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  };
  return (
    <div className="flex-1 flex flex-col bg-[#1a1d21] overflow-y-auto">
      <div className="px-8 py-6 border-b border-white/[0.07]">
        <h1 className="text-[20px] font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5" /> Files
          <span className="text-[14px] font-normal text-[#b9babd] ml-1">({filtered.length})</span>
        </h1>
      </div>
      {filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center flex-col gap-3 text-[#b9babd]">
          <FileText className="w-10 h-10 opacity-20" />
          <p className="text-sm">{searchQuery ? 'No files match your search' : 'No files uploaded yet'}</p>
        </div>
      ) : (
        <div className="p-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((file: any) => (
            <div key={file.id} className="group rounded-xl bg-[#222529] border border-white/[0.07] p-4 flex flex-col gap-3 hover:border-white/20 transition-all">
              <div className="flex items-start justify-between">
                {getFileIcon(file.type)}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {file.url && <a href={file.url} target="_blank" rel="noopener noreferrer" className="h-6 w-6 flex items-center justify-center rounded hover:bg-white/10 text-[#b9babd] hover:text-white transition-colors"><ExternalLink className="w-3.5 h-3.5" /></a>}
                  {file.url && <a href={file.url} download={file.name} className="h-6 w-6 flex items-center justify-center rounded hover:bg-white/10 text-[#b9babd] hover:text-white transition-colors"><Download className="w-3.5 h-3.5" /></a>}
                  <button onClick={() => onDelete(file)} className="h-6 w-6 flex items-center justify-center rounded hover:bg-red-500/20 text-[#b9babd] hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {file.type?.startsWith('image/') && file.url && <img src={file.url} alt={file.name} className="w-full h-24 object-cover rounded-lg" />}
              <div>
                <p className="text-[13px] font-semibold text-white truncate">{file.name}</p>
                <p className="text-[11px] text-[#b9babd] mt-0.5">{formatSize(file.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Channel Files tab view ──────────────────────────────────────────────── */
function ChannelFilesView({ files, channelName, isLoading, onDelete }: {
  files: any[]; channelName: string; isLoading: boolean; onDelete: (file: any) => void;
}) {
  const getFileIcon = (type: string) => {
    if (type?.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-blue-400" />;
    if (type?.startsWith('video/')) return <FileText className="w-8 h-8 text-purple-400" />;
    if (type?.includes('pdf') || type?.includes('document') || type?.includes('text')) return <FileText className="w-8 h-8 text-orange-400" />;
    if (type?.includes('javascript') || type?.includes('typescript') || type?.includes('json') || type?.includes('html')) return <Code className="w-8 h-8 text-green-400" />;
    return <File className="w-8 h-8 text-[#b9babd]" />;
  };
  const formatSize = (bytes: any) => {
    const n = Number(bytes);
    if (!n) return 'Unknown';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  };
  if (isLoading) return (
    <div className="flex-1 flex items-center justify-center bg-[#1a1d21]">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );
  return (
    <div className="flex-1 flex flex-col bg-[#1a1d21] overflow-y-auto">
      <div className="px-6 py-4 border-b border-white/[0.07] shrink-0 flex items-center gap-2">
        <Hash className="w-4 h-4 text-[#b9babd]" />
        <span className="text-[15px] font-bold text-white">{channelName}</span>
        <span className="text-[13px] text-[#b9babd]">— {files.length} file{files.length !== 1 ? 's' : ''}</span>
      </div>
      {files.length === 0 ? (
        <div className="flex-1 flex items-center justify-center flex-col gap-3 text-[#b9babd]">
          <FileText className="w-10 h-10 opacity-20" />
          <p className="text-sm font-medium">No files in this channel yet</p>
          <p className="text-xs text-[#5c5f63]">Files shared in messages will appear here</p>
        </div>
      ) : (
        <div className="p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {files.map((file: any) => (
            <div key={file.id} className="group rounded-xl bg-[#222529] border border-white/[0.07] p-4 flex flex-col gap-3 hover:border-white/20 transition-all">
              <div className="flex items-start justify-between">
                {getFileIcon(file.type)}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {file.url && <a href={file.url} target="_blank" rel="noopener noreferrer" className="h-6 w-6 flex items-center justify-center rounded hover:bg-white/10 text-[#b9babd] hover:text-white transition-colors"><ExternalLink className="w-3.5 h-3.5" /></a>}
                  {file.url && <a href={file.url} download={file.name} className="h-6 w-6 flex items-center justify-center rounded hover:bg-white/10 text-[#b9babd] hover:text-white transition-colors"><Download className="w-3.5 h-3.5" /></a>}
                  <button onClick={() => onDelete(file)} className="h-6 w-6 flex items-center justify-center rounded hover:bg-red-500/20 text-[#b9babd] hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {file.type?.startsWith('image/') && file.url && <img src={file.url} alt={file.name} className="w-full h-24 object-cover rounded-lg" />}
              <div>
                <p className="text-[13px] font-semibold text-white truncate">{file.name}</p>
                <p className="text-[11px] text-[#b9babd] mt-0.5">{formatSize(file.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DmChatView({ activeDm }: { activeDm: any }) {
  if (!activeDm) return (
    <div className="flex-1 flex items-center justify-center flex-col gap-3 text-[#b9babd] bg-[#1a1d21]">
      <MessageSquare className="w-10 h-10 opacity-20" />
      <p className="text-sm">Select a conversation to start messaging</p>
    </div>
  );
  return (
    <div className="flex-1 flex flex-col bg-[#1a1d21]">
      <div className="h-[49px] flex items-center px-4 border-b border-white/[0.07] shrink-0">
        <div className="flex items-center gap-2">
          <Avatar className="w-7 h-7 rounded-lg">
            <AvatarImage src={activeDm.avatar} />
            <AvatarFallback className="rounded-lg text-xs bg-[#4a154b] text-white">{activeDm.name?.[0]?.toUpperCase() ?? 'U'}</AvatarFallback>
          </Avatar>
          <span className="font-bold text-[15px] text-white">{activeDm.name}</span>
          <div className="w-2 h-2 rounded-full bg-green-500 ml-1" />
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center flex-col gap-3 text-[#b9babd]">
        <Avatar className="w-16 h-16 rounded-2xl">
          <AvatarImage src={activeDm.avatar} />
          <AvatarFallback className="rounded-2xl text-2xl bg-[#4a154b] text-white">{activeDm.name?.[0]?.toUpperCase() ?? 'U'}</AvatarFallback>
        </Avatar>
        <p className="font-bold text-white text-[18px]">{activeDm.name.includes('@') ? activeDm.name.split('@')[0] : activeDm.name}</p>
        <p className="text-sm text-[#b9babd]">This is the beginning of your conversation</p>
      </div>
    </div>
  );
}

export function WorkspaceClient({ user, channels: initialChannels, directMessages, files: initialFiles }: WorkspaceClientProps) {
  const [activeView, setActiveView] = useState<'home' | 'dms' | 'activity' | 'files' | 'huddles' | 'integrations' | 'profile'>('home');
  const [channels, setChannels] = useState(initialChannels);
  const [activeId, setActiveId] = useState(initialChannels[0]?.id ?? '');
  const [activeType, setActiveType] = useState<'channel' | 'dm'>('channel');
  const [activeDm, setActiveDm] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTab, setActiveTab] = useState<'messages' | 'files' | 'pins'>('messages');
  const [searchQuery, setSearchQuery] = useState('');
  const [files, setFiles] = useState<any[]>(initialFiles);
  const [isUploading, setIsUploading] = useState(false);
  const [channelFiles, setChannelFiles] = useState<any[]>([]);
  const [isLoadingChannelFiles, setIsLoadingChannelFiles] = useState(false);
  const [isHuddleActive, setIsHuddleActive] = useState(false);
  const [huddleChannelId, setHuddleChannelId] = useState<string | null>(null);
  const [huddleChannelName, setHuddleChannelName] = useState<string | null>(null);
  const [activeHuddles, setActiveHuddles] = useState<{ channelId: string; channelName: string }[]>([]);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const supabase = createClient();

  const fetchFiles = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from('files').select('*').eq('owner_id', user.id).order('created_at', { ascending: false });
    if (!error && data) setFiles(data);
  }, [supabase, user.id]);

  const fetchChannelFiles = useCallback(async (channelId: string) => {
    if (!supabase || !channelId) return;
    setIsLoadingChannelFiles(true);
    const { data, error } = await supabase.from('files').select('*').eq('channel_id', channelId).order('created_at', { ascending: false });
    if (!error && data) setChannelFiles(data);
    setIsLoadingChannelFiles(false);
  }, [supabase]);

  useEffect(() => { if (activeView === 'files') fetchFiles(); }, [activeView, fetchFiles]);
  useEffect(() => { if (activeTab === 'files' && activeId) fetchChannelFiles(activeId); }, [activeTab, activeId, fetchChannelFiles]);

  const handleUpload = async (fileList: FileList) => {
    if (!supabase || isUploading) return;
    setIsUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const path = `${user.id}/${Date.now()}_${file.name}`;
        const { error: storageError } = await supabase.storage.from('Files').upload(path, file, { upsert: false });
        if (storageError) { console.error('Upload error:', storageError.message); continue; }
        const { data: { publicUrl } } = supabase.storage.from('Files').getPublicUrl(path);
        await supabase.from('files').insert({ name: file.name, url: publicUrl, size: file.size.toString(), type: file.type, owner_id: user.id });
      }
      await fetchFiles();
    } finally { setIsUploading(false); }
  };

  const handleDeleteFile = async (file: any) => {
    if (!supabase) return;
    await supabase.from('files').delete().eq('id', file.id);
    setFiles(prev => prev.filter(f => f.id !== file.id));
    setChannelFiles(prev => prev.filter(f => f.id !== file.id));
  };

  const handleSelectChannel = (id: string, type: 'channel' | 'dm') => {
    setActiveId(id);
    setActiveType(type);
    setActiveTab('messages');
    if (type === 'dm') { const dm = directMessages.find(d => d.id === id); setActiveDm(dm ?? null); setActiveView('dms'); }
    else { setActiveDm(null); setActiveView('home'); }
  };

  const handleSelectDm = (dm: any) => { setActiveDm(dm); setActiveId(dm.id); setActiveType('dm'); };

  const handleCreateChannel = async (name: string, isPrivate: boolean) => {
    const { data, error } = await supabase.from('channels').insert({ name, is_private: isPrivate, owner_id: user.id }).select().single();
    if (!error && data) { setChannels(prev => [...prev, data]); setActiveId(data.id); setActiveType('channel'); setActiveView('home'); }
  };

  const handleStartHuddle = (channelId: string, channelName: string) => {
    setIsHuddleActive(true); setHuddleChannelId(channelId); setHuddleChannelName(channelName);
    setActiveHuddles(prev => prev.find(h => h.channelId === channelId) ? prev : [...prev, { channelId, channelName }]);
    setActiveView('home'); setActiveId(channelId); setActiveType('channel');
  };

  const handleLeaveHuddle = () => { setIsHuddleActive(false); setHuddleChannelId(null); setHuddleChannelName(null); };
  const handleToggleHuddle = () => { if (isHuddleActive) handleLeaveHuddle(); else handleStartHuddle(activeId, activeChannel?.name ?? ''); };

  const activeChannel = channels.find(c => c.id === activeId) ?? null;
  const activeItem = activeType === 'channel' ? activeChannel : activeDm;

  const renderSidebar = () => {
    switch (activeView) {
      case 'dms':
        return null; // DMPage has its own sidebar
      case 'files':
        return (
          <FilesSidebar
            activeCategory={activeCategory}
            onCategorySelect={setActiveCategory}
            fileCount={files.length}
            onUpload={handleUpload}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        );
      case 'huddles':
        return <HuddlesSidebar channels={channels} activeHuddles={activeHuddles} onStart={handleStartHuddle} />;
      case 'activity':
        return null;
      case 'integrations':
        return null;
      default:
        return (
          <WorkspaceSidebar
            activeId={activeId}
            onSelect={handleSelectChannel}
            channels={channels}
            directMessages={directMessages}
            onCreateChannel={handleCreateChannel}
            onViewChange={setActiveView}
          />
        );
    }
  };

  const renderMain = () => {
    if (activeView === 'huddles' && !isHuddleActive) return <HuddleHub channels={channels} user={user} onStart={handleStartHuddle} />;
    if (activeView === 'activity') return <ActivityPage />;
    if (activeView === 'integrations') return <IntegrationsPanel />;
    if (activeView === 'profile') return <ProfilePage />;
    if (activeView === 'files') return (
      <div className="flex-1 flex flex-col relative min-h-0">
        {isUploading && (
          <div className="absolute inset-0 z-10 bg-black/40 flex items-center justify-center">
            <div className="flex items-center gap-3 bg-[#222529] px-6 py-4 rounded-xl border border-white/10">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-white text-sm font-semibold">Uploading files…</span>
            </div>
          </div>
        )}
        <FilesView files={files} category={activeCategory} searchQuery={searchQuery} onDelete={handleDeleteFile} />
      </div>
    );

    if (activeView === 'dms') return <DMPage />;

    // ── Home / channel view ──
    return (
      <>
        <ChatHeader
          activeItem={activeItem}
          messages={[]}
          isHuddleActive={isHuddleActive}
          onToggleHuddle={handleToggleHuddle}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          activeView={activeView}
          onOpenSearch={() => { }}
        />

        {activeChannel && activeType === 'channel' ? (
          <>
            {/* Messages tab */}
            {activeTab === 'messages' && (
              <>
                <MessageList channelId={activeChannel.id} />
                <MessageInput channelId={activeChannel.id} user={user} placeholder={`Message #${activeChannel.name}`} />
              </>
            )}

            {/* Files tab — channel-specific files */}
            {activeTab === 'files' && (
              <ChannelFilesView
                files={channelFiles}
                channelName={activeChannel.name}
                isLoading={isLoadingChannelFiles}
                onDelete={handleDeleteFile}
              />
            )}

            {/* Pins tab */}
            {activeTab === 'pins' && (
              <div className="flex-1 flex items-center justify-center flex-col gap-3 text-[#b9babd] bg-[#1a1d21]">
                <Pin className="w-10 h-10 opacity-20" />
                <p className="text-sm font-medium">No pinned messages yet</p>
                <p className="text-xs text-[#5c5f63]">Pin important messages to find them easily</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#b9babd] text-sm bg-[#1a1d21]">
            Select a channel to start messaging
          </div>
        )}

        {isHuddleActive && huddleChannelId && (
          <HuddleMeeting
            workspaceId={user.id}
            channelId={huddleChannelId}
            channelName={huddleChannelName ?? activeChannel?.name}
            onLeave={handleLeaveHuddle}
          />
        )}
      </>
    );
  };

  return (
    <div className="flex h-screen bg-[#1a1d21] overflow-hidden">
      <SideRail 
        activeView={activeView} 
        onViewChange={setActiveView} 
        onOpenAddMenu={() => setIsAddMenuOpen(true)}
      />
      {renderSidebar()}
      <main className="flex flex-col flex-1 min-w-0 relative overflow-hidden">
        {renderMain()}
      </main>
      {isAddMenuOpen && <AddMenu onClose={() => setIsAddMenuOpen(false)} />}
      <Toaster />
    </div>
  );
}