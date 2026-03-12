"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SideRail } from "@/components/layout/side-rail";
import { WorkspaceSidebar } from "@/components/layout/workspace-sidebar";
import { DmSidebar } from "@/components/layout/dm-sidebar";
import { FilesSidebar } from "@/components/layout/files-sidebar";
import { ChatHeader } from "@/components/chat/chat-header";
import { MessageList } from "@/components/chat/message-list";
import { MessageInput } from "@/components/chat/message-input";
import { HuddleMeeting } from "@/components/chat/huddle-meeting";
import { GlobalSearch } from "@/components/chat/global-search";
import { useUser, useAuth } from '@/database';
import { initiateAnonymousSignIn } from '@/database/non-blocking-login';
import { 
  Loader2, 
  MessageSquare, 
  Sparkles, 
  FileText, 
  Upload, 
  Trash2,
  Image as ImageIcon,
  Code,
  Bell,
  Radio,
  Clock,
  Search,
  Users
} from 'lucide-react';
import { Toaster } from "@/components/ui/toaster";
import { Message, Channel, DirectMessage, FileAsset } from '@/lib/types';
import { directMessages as initialDms } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function DevTalkApp() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  
  // Local State
  const [channels, setChannels] = useState<Channel[]>([]);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>(initialDms);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [files, setFiles] = useState<FileAsset[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const [activeId, setActiveId] = useState<string>('general');
  const [activeType, setActiveType] = useState<'channel' | 'dm'>('channel');
  const [activeView, setActiveView] = useState<'home' | 'dms' | 'activity' | 'files' | 'huddles'>('home');
  const [activeFileCategory, setActiveFileCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'messages' | 'files' | 'pins'>('messages');
  const [isHuddleActive, setIsHuddleActive] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from LocalStorage on mount
  useEffect(() => {
    const savedChannels = localStorage.getItem('devtalk_channels');
    const savedMessages = localStorage.getItem('devtalk_messages');
    const savedFiles = localStorage.getItem('devtalk_files');
    
    if (savedChannels) {
      try {
        setChannels(JSON.parse(savedChannels));
      } catch (e) {
        console.error("Failed to parse channels", e);
      }
    } else {
      setChannels([
        { 
          id: 'general', 
          name: 'general', 
          description: 'The community hub for all developers', 
          isPrivate: false, 
          type: 'channel' 
        },
        { 
          id: 'frontend-dev', 
          name: 'frontend-dev', 
          description: 'React, Next.js and Tailwind chatter', 
          isPrivate: false, 
          type: 'channel' 
        }
      ]);
    }

    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error("Failed to parse messages", e);
      }
    } else {
      setMessages({ 
        'general': [],
        'frontend-dev': []
      });
    }

    if (savedFiles) {
      try {
        setFiles(JSON.parse(savedFiles));
      } catch (e) {
        console.error("Failed to parse files", e);
      }
    } else {
      setFiles([
        { id: '1', name: 'app-architecture.pdf', size: '2.4 MB', type: 'document', uploadedAt: new Date().toISOString(), ownerName: 'Alex Rivera', ownerAvatar: 'https://picsum.photos/seed/alex/100/100', url: '#' },
        { id: '2', name: 'hero-banner-v2.png', size: '1.8 MB', type: 'image', uploadedAt: new Date().toISOString(), ownerName: 'Sarah Chen', ownerAvatar: 'https://picsum.photos/seed/sarah/100/100', url: '#' },
        { id: '3', name: 'auth-flow.tsx', size: '12 KB', type: 'code', uploadedAt: new Date().toISOString(), ownerName: 'Alex Rivera', ownerAvatar: 'https://picsum.photos/seed/alex/100/100', url: '#' },
      ]);
    }
    
    setIsInitialized(true);
  }, []);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Save to LocalStorage on changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('devtalk_channels', JSON.stringify(channels));
      localStorage.setItem('devtalk_messages', JSON.stringify(messages));
      localStorage.setItem('devtalk_files', JSON.stringify(files));
    }
  }, [channels, messages, files, isInitialized]);

  // Reset tab when changing channel/dm
  useEffect(() => {
    setActiveTab('messages');
  }, [activeId]);

  // Initialize anonymous sign-in if not authenticated
  useEffect(() => {
    if (!isUserLoading && !user && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  const activeItem = useMemo(() => {
    if (activeType === 'channel') return channels.find(c => c.id === activeId);
    if (activeType === 'dm') return directMessages.find(d => d.id === activeId);
    return null;
  }, [channels, directMessages, activeId, activeType]);

  const currentMessages = useMemo(() => {
    return messages[activeId] || [];
  }, [messages, activeId]);

  const filteredFiles = useMemo(() => {
    if (activeFileCategory === 'all') return files;
    if (activeFileCategory === 'recent') return [...files].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()).slice(0, 5);
    return files.filter(f => f.type === activeFileCategory);
  }, [files, activeFileCategory]);

  const handleSendMessage = (content: string) => {
    if (!user || !activeId) return;

    const newMessage: Message = {
      id: Math.random().toString(36).substring(7),
      senderId: user.uid,
      senderName: user.displayName || `Dev ${user.uid.slice(0, 4)}`,
      senderAvatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
      content,
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    setMessages(prev => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), newMessage]
    }));
  };

  const handleCreateChannel = (name: string, isPrivate: boolean) => {
    const id = name.toLowerCase().replace(/\s+/g, '-');
    const newChannel: Channel = {
      id,
      name,
      description: 'A brand new channel',
      isPrivate,
      type: 'channel'
    };

    setChannels(prev => [...prev, newChannel]);
    setMessages(prev => ({ ...prev, [id]: [] }));
    setActiveId(id);
    setActiveType('channel');
    setActiveView('home');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    let type: 'image' | 'document' | 'code' | 'other' = 'other';

    const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'];
    const codeExts = ['c', 'py', 'js', 'jsx', 'ts', 'tsx', 'node', 'json', 'cpp'];
    const docExts = ['pdf', 'csv', 'txt', 'md'];

    if (imageExts.includes(extension || '')) {
      type = 'image';
    } else if (codeExts.includes(extension || '')) {
      type = 'code';
    } else if (docExts.includes(extension || '')) {
      type = 'document';
    }

    const newFile: FileAsset = {
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: file.size > 1024 * 1024 
        ? (file.size / (1024 * 1024)).toFixed(2) + ' MB' 
        : (file.size / 1024).toFixed(2) + ' KB',
      type,
      uploadedAt: new Date().toISOString(),
      ownerName: user.displayName || 'Alex Rivera',
      ownerAvatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
      url: '#'
    };

    setFiles(prev => [newFile, ...prev]);
    
    toast({
      title: "File Uploaded",
      description: `${file.name} successfully added to workspace.`,
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    toast({
      title: "File Deleted",
      description: "The file has been removed from your workspace.",
    });
  };

  const handleSelect = (id: string, type: 'channel' | 'dm') => {
    setActiveId(id);
    setActiveType(type);
    if (type === 'dm') setActiveView('dms');
    else setActiveView('home');
  };

  const handleViewChange = (view: 'home' | 'dms' | 'activity' | 'files' | 'huddles') => {
    setActiveView(view);
    if (view === 'dms' && activeType !== 'dm' && directMessages.length > 0) {
      setActiveId(directMessages[0].id);
      setActiveType('dm');
    } else if (view === 'home' && activeType !== 'channel' && channels.length > 0) {
      setActiveId(channels[0].id);
      setActiveType('channel');
    }
  };

  if (!isInitialized || isUserLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse font-medium">Connecting to DevTalk...</p>
        </div>
      </div>
    );
  }

  const renderSidebar = () => {
    switch (activeView) {
      case 'dms':
        return <DmSidebar activeId={activeId} onSelect={handleSelect} directMessages={directMessages} />;
      case 'files':
        return <FilesSidebar activeCategory={activeFileCategory} onCategorySelect={setActiveFileCategory} fileCount={files.length} />;
      case 'activity':
        return (
          <div className="w-64 h-full flex bg-[#19171d] flex-col overflow-hidden border-r border-white/5">
            <div className="p-4 border-b border-white/5">
              <h2 className="text-xl font-bold mb-4">Activity</h2>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <input placeholder="Filter activity" className="w-full bg-white/5 border-none rounded-md pl-8 h-9 text-sm focus:ring-1 focus:ring-white/20 outline-none" />
              </div>
            </div>
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-1">
                {['Mentions', 'Reactions', 'App Updates', 'Workspace'].map((item) => (
                  <button key={item} className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-[#d1d2d3] hover:bg-white/10 transition-colors">
                    {item === 'Mentions' ? <Users className="w-4 h-4" /> : item === 'Reactions' ? <Sparkles className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    <span>{item}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        );
      case 'huddles':
        return (
          <div className="w-64 h-full flex bg-[#19171d] flex-col overflow-hidden border-r border-white/5">
            <div className="p-4 border-b border-white/5">
              <h2 className="text-xl font-bold mb-4">Huddles</h2>
              <Button 
                onClick={() => setIsHuddleActive(true)}
                className="w-full gap-2 h-9 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/20"
              >
                <Radio className="w-4 h-4" />
                Start Huddle
              </Button>
            </div>
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Now</p>
                  {channels.slice(0, 2).map((c) => (
                    <button 
                      key={c.id} 
                      onClick={() => {
                        handleSelect(c.id, 'channel');
                        setIsHuddleActive(true);
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-[#d1d2d3] hover:bg-white/10 transition-colors group text-left"
                    >
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="truncate flex-1">#{c.name}</span>
                      <div className="ml-auto opacity-0 group-hover:opacity-100 bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded">Join</div>
                    </button>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>
        );
      default:
        return (
          <WorkspaceSidebar 
            activeId={activeId} 
            onSelect={handleSelect} 
            channels={channels} 
            directMessages={directMessages} 
            onCreateChannel={handleCreateChannel}
            onViewChange={handleViewChange}
          />
        );
    }
  };

  const renderContent = () => {
    if (activeView === 'files') {
      return (
        <div className="flex-1 flex flex-col min-h-0">
          <header className="h-14 flex items-center justify-between px-6 border-b border-white/5 bg-[#1a1d21] shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-lg">File Management</h2>
            </div>
            <div className="flex items-center gap-2">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              <Button className="gap-2 h-9" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4" />
                Upload File
              </Button>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Files</p>
                <p className="text-4xl font-black text-white">{files.length}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Storage Used</p>
                <p className="text-4xl font-black text-white">{Math.round(files.length * 1.2)} MB</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Workspace</p>
                <p className="text-4xl font-black text-white">Dev HQ</p>
              </div>
            </div>
            <div className="bg-[#19171d] border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground border-b border-white/5">
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Size</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center">
                            {file.type === 'image' ? <ImageIcon className="w-4 h-4 text-blue-400" /> : file.type === 'code' ? <Code className="w-4 h-4 text-green-400" /> : <FileText className="w-4 h-4 text-orange-400" />}
                          </div>
                          <span className="font-medium text-sm">{file.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground capitalize">{file.type}</td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">{file.size}</td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteFile(file.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if (activeView === 'activity') {
      return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#1a1d21]">
          <header className="h-14 flex items-center px-6 border-b border-white/5 shrink-0">
            <h2 className="font-bold text-lg">Activity Feed</h2>
          </header>
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="max-w-xs space-y-2">
              <h3 className="font-bold text-white">All caught up!</h3>
              <p className="text-sm text-muted-foreground">When you have mentions or reactions, they'll show up here.</p>
            </div>
          </div>
        </div>
      );
    }

    if (activeView === 'huddles') {
      return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#1a1d21]">
          <header className="h-14 flex items-center px-6 border-b border-white/5 shrink-0">
            <h2 className="font-bold text-lg">Huddle Hub</h2>
          </header>
          <div className="flex-1 p-8 overflow-y-auto space-y-8 scrollbar-hide">
             <div className="bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 rounded-2xl p-8 space-y-4">
               <h3 className="text-2xl font-black">Jump into a huddle</h3>
               <p className="text-muted-foreground max-w-md">Connect with your team instantly through voice and video. No scheduling required.</p>
               <Button className="gap-2" onClick={() => setIsHuddleActive(true)}>
                 <Radio className="w-4 h-4" />
                 Start Workspace Huddle
               </Button>
             </div>
             
             <div className="space-y-4">
               <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Recent Activity</h4>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                 {channels.slice(0, 3).map((c) => (
                    <div 
                      key={c.id} 
                      onClick={() => {
                        handleSelect(c.id, 'channel');
                        setIsHuddleActive(true);
                      }}
                      className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center">
                          <Radio className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex -space-x-2">
                           {[1, 2].map(i => (
                             <Avatar key={i} className="w-6 h-6 border-2 border-[#1a1d21]">
                               <AvatarImage src={`https://picsum.photos/seed/${i+40}/100/100`} />
                             </Avatar>
                           ))}
                        </div>
                      </div>
                      <h5 className="font-bold text-sm mb-1">#{c.name}</h5>
                      <p className="text-xs text-muted-foreground mb-4">Last active 2h ago</p>
                      <Button variant="outline" className="w-full text-xs h-8 group-hover:bg-primary group-hover:text-white group-hover:border-primary">Join Huddle</Button>
                    </div>
                 ))}
               </div>
             </div>
          </div>
        </div>
      );
    }

    return (
      <>
        <ChatHeader 
          activeItem={activeItem} 
          messages={currentMessages} 
          isHuddleActive={isHuddleActive}
          onToggleHuddle={() => setIsHuddleActive(!isHuddleActive)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          activeView={activeView}
          onOpenSearch={() => setIsSearchOpen(true)}
        />
        {isHuddleActive && <HuddleMeeting onLeave={() => setIsHuddleActive(false)} channelName={activeItem?.name} />}
        <div className="flex-1 flex flex-col min-h-0">
          {activeTab === 'files' ? (
            <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
              <div className="space-y-4">
                <h3 className="text-xl font-bold">Files shared in {activeType === 'channel' ? '#' + (activeItem?.name || 'channel') : activeItem?.name}</h3>
                <div className="bg-[#19171d] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground border-b border-white/5">
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Uploaded By</th>
                        <th className="px-6 py-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {files.length > 0 ? files.slice(0, 5).map((file) => (
                        <tr key={file.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center">
                                {file.type === 'image' ? <ImageIcon className="w-4 h-4 text-blue-400" /> : file.type === 'code' ? <Code className="w-4 h-4 text-green-400" /> : <FileText className="w-4 h-4 text-orange-400" />}
                              </div>
                              <span className="font-medium text-sm truncate max-w-[200px]">{file.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-5 h-5">
                                <AvatarImage src={file.ownerAvatar} />
                              </Avatar>
                              <span className="text-xs text-muted-foreground">{file.ownerName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs text-muted-foreground">{format(new Date(file.uploadedAt), 'MMM d, yyyy')}</span>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">No files shared yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <MessageList messages={currentMessages} activeName={activeItem?.name} />
          )}
          {activeTab === 'messages' && (
            <div className="w-full max-w-[1000px] mx-auto pb-4">
              <MessageInput onSendMessage={handleSendMessage} conversationHistory={currentMessages} placeholder={`Message ${activeType === 'channel' ? '#' + (activeItem?.name || 'channel') : activeItem?.name}`} />
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden relative">
      <SideRail activeView={activeView} onViewChange={handleViewChange} />
      {renderSidebar()}
      <main className="flex-1 flex flex-col min-w-0 bg-[#1a1d21] relative">
        {renderContent()}
      </main>
      <GlobalSearch 
        open={isSearchOpen} 
        onOpenChange={setIsSearchOpen} 
        messages={messages} 
        files={files}
        onSelectResult={(id, type) => {
          handleSelect(id, type as any);
        }}
      />
      <Toaster />
    </div>
  );
}
