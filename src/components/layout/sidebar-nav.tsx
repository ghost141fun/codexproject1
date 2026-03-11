"use client";

import React from 'react';
import { cn } from "@/lib/utils";
import { 
  Hash, 
  Lock, 
  Plus, 
  MoreVertical, 
  ChevronDown, 
  Settings, 
  Search,
  Users,
  MessageSquare,
  Sparkles
} from "lucide-react";
import { 
  channels, 
  directMessages, 
  workspaces, 
  currentUser 
} from "@/lib/mock-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface SidebarNavProps {
  activeId: string;
  onSelect: (id: string, type: 'channel' | 'dm') => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ activeId, onSelect }) => {
  return (
    <div className="w-64 h-full flex bg-[#121216] border-r border-border flex-col overflow-hidden">
      {/* Workspace Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors group">
        <div className="flex items-center gap-3 truncate">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-sm">
            {workspaces[0].icon}
          </div>
          <span className="font-bold text-sm truncate">{workspaces[0].name}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-6">
          {/* Main Navigation */}
          <div className="space-y-1">
            <button className="flex items-center gap-3 w-full px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all">
              <MessageSquare className="w-4 h-4" />
              <span>Threads</span>
            </button>
            <button className="flex items-center gap-3 w-full px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all">
              <Users className="w-4 h-4" />
              <span>People & User Groups</span>
            </button>
            <button className="flex items-center gap-3 w-full px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all">
              <MoreVertical className="w-4 h-4" />
              <span>More</span>
            </button>
          </div>

          {/* Channels Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
              <div className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors">
                <ChevronDown className="w-3 h-3" />
                <span>Channels</span>
              </div>
              <Plus className="w-4 h-4 cursor-pointer hover:text-foreground transition-colors" />
            </div>
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => onSelect(channel.id, 'channel')}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-1.5 rounded-md text-sm transition-all group",
                  activeId === channel.id 
                    ? "bg-primary text-primary-foreground font-medium" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                {channel.isPrivate ? <Lock className="w-3.5 h-3.5" /> : <Hash className="w-4 h-4" />}
                <span className="truncate">{channel.name}</span>
              </button>
            ))}
            <button className="flex items-center gap-3 w-full px-3 py-1.5 rounded-md text-sm text-muted-foreground/60 hover:bg-white/5 transition-all">
              <Plus className="w-4 h-4" />
              <span>Add Channels</span>
            </button>
          </div>

          {/* Direct Messages Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
              <div className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors">
                <ChevronDown className="w-3 h-3" />
                <span>Direct Messages</span>
              </div>
              <Plus className="w-4 h-4 cursor-pointer hover:text-foreground transition-colors" />
            </div>
            {directMessages.map((dm) => (
              <button
                key={dm.id}
                onClick={() => onSelect(dm.id, 'dm')}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-1.5 rounded-md text-sm transition-all group",
                  activeId === dm.id 
                    ? "bg-primary text-primary-foreground font-medium" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                <div className="relative">
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={dm.avatar} />
                    <AvatarFallback>{dm.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#121216] bg-green-500" />
                </div>
                <span className="truncate">{dm.name}</span>
                {dm.id === 'dm-1' && (
                  <Badge variant="secondary" className="ml-auto bg-primary/20 text-primary border-none h-4 px-1 text-[10px]">3</Badge>
                )}
              </button>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* User Footer */}
      <div className="p-3 border-t border-white/5 bg-[#1a1a1f]">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
          <Avatar className="w-9 h-9 border border-border">
            <AvatarImage src={currentUser.avatar} />
            <AvatarFallback>AR</AvatarFallback>
          </Avatar>
          <div className="flex-1 truncate">
            <p className="text-sm font-semibold truncate">{currentUser.name}</p>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};