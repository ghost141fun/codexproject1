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

interface WorkspaceClientProps {
  user: any;
  channels: any[];
  directMessages: any[];
  files: any[];
}

export function WorkspaceClient({ user, channels, directMessages, files }: WorkspaceClientProps) {
  const [activeView, setActiveView] = useState('workspace'); // 'workspace', 'dms', 'files'
  const [activeChannel, setActiveChannel] = useState(channels[0] ?? null);
  const [activeDm, setActiveDm] = useState(null);

  const renderActiveView = () => {
    switch (activeView) {
      case 'dms':
        return <DmSidebar directMessages={directMessages} activeDm={activeDm} setActiveDm={setActiveDm} />;
      case 'files':
        return <FilesSidebar files={files} />;
      default:
        return <WorkspaceSidebar channels={channels} activeChannel={activeChannel} setActiveChannel={setActiveChannel} />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <SideRail activeView={activeView} setActiveView={setActiveView} />
      {renderActiveView()}
      <main className="flex flex-col flex-1">
        {activeChannel && (
          <>
            <ChatHeader channel={activeChannel} />
            <MessageList channelId={activeChannel.id} />
            <MessageInput channelId={activeChannel.id} user={user} />
          </>
        )}
        {/* A DM view would be similar to a channel view and would be shown when activeDm is not null */}
      </main>
      <Toaster />
    </div>
  );
}
