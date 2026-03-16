'use client';

import React, { useState } from 'react';
import { SideRail } from "@/components/layout/side-rail";
import { WorkspaceSidebar } from "@/components/layout/workspace-sidebar";
import { DmSidebar } from "@/components/layout/dm-sidebar";
import { FilesSidebar } from "@/components/layout/files-sidebar";
import { ChatHeader } from "@/components/chat/chat-header";
import { MessageList } from "@/components/chat/message-list";
import { MessageInput } from "@/components/chat/message-input";
import { Toaster } from "@/components/ui/toaster";
import { createClient } from '@/lib/supabase/client';

interface WorkspaceClientProps {
  user: any;
  channels: any[];
  directMessages: any[];
  files: any[];
}

export function WorkspaceClient({ user, channels: initialChannels, directMessages, files }: WorkspaceClientProps) {
  const [activeView, setActiveView] = useState<'home' | 'dms' | 'activity' | 'files' | 'huddles'>('home');
  const [channels, setChannels] = useState(initialChannels);
  const [activeId, setActiveId] = useState(initialChannels[0]?.id ?? '');
  const [activeType, setActiveType] = useState<'channel' | 'dm'>('channel');
  const [activeDm, setActiveDm] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');

  const supabase = createClient();

  const handleSelect = (id: string, type: 'channel' | 'dm') => {
    setActiveId(id);
    setActiveType(type);
    if (type === 'dm') {
      const dm = directMessages.find(d => d.id === id);
      setActiveDm(dm ?? null);
    }
  };

  const handleCreateChannel = async (name: string, isPrivate: boolean) => {
    const { data, error } = await supabase
      .from('channels')
      .insert({ name, is_private: isPrivate, owner_id: user.id })
      .select()
      .single();
    if (!error && data) {
      setChannels(prev => [...prev, data]);
      setActiveId(data.id);
      setActiveType('channel');
    }
  };

  const activeChannel = channels.find(c => c.id === activeId) ?? null;

  const renderSidebar = () => {
    switch (activeView) {
      case 'dms':
        return <DmSidebar directMessages={directMessages} activeDm={activeDm} setActiveDm={setActiveDm} />;
      case 'files':
        return (
          <FilesSidebar
            activeCategory={activeCategory}
            onCategorySelect={setActiveCategory}
            fileCount={files.length}
          />
        );
      default:
        return (
          <WorkspaceSidebar
            activeId={activeId}
            onSelect={handleSelect}
            channels={channels}
            directMessages={directMessages}
            onCreateChannel={handleCreateChannel}
            onViewChange={setActiveView}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <SideRail activeView={activeView} onViewChange={setActiveView} />
      {renderSidebar()}
      <main className="flex flex-col flex-1">
        {activeChannel && activeType === 'channel' && (
          <>
            <ChatHeader channel={activeChannel} />
            <MessageList channelId={activeChannel.id} />
            <MessageInput channelId={activeChannel.id} user={user} />
          </>
        )}
      </main>
      <Toaster />
    </div>
  );
}