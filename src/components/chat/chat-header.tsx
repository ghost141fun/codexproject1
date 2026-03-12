
"use client";

import React from 'react';
import { Hash, ChevronDown, Search, Headphones, Edit2, Info, Clock, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  activeItem: any;
  messages: any[];
  isHuddleActive: boolean;
  onToggleHuddle: () => void;
  activeTab: 'messages' | 'files' | 'pins';
  onTabChange: (tab: 'messages' | 'files' | 'pins') => void;
  activeView: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  activeItem, 
  messages, 
  isHuddleActive, 
  onToggleHuddle,
  activeTab,
  onTabChange,
  activeView
}) => {
  if (!activeItem && (activeView === 'home' || activeView === 'dms')) return (
    <header className="h-14 flex items-center px-4 border-b border-white/5 bg-[#1a1d21]">
      <span className="text-muted-foreground animate-pulse text-sm">Select a conversation...</span>
    </header>
  );

  return (
    <div className="flex flex-col shrink-0">
      {/* Top Global Search Bar with Dynamic Path */}
      <div className="h-10 bg-[#121016] flex items-center justify-center px-4 border-b border-white/5">
        <div className="flex items-center gap-4 w-full max-w-2xl px-3 h-7 bg-white/10 rounded-md border border-white/10 group focus-within:bg-white/15 transition-colors">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <div className="flex items-center gap-2 flex-1 text-xs text-muted-foreground">
            <span className="text-primary font-bold">/{activeView}</span>
            <div className="w-px h-3 bg-white/10 mx-1" />
            <Search className="w-3.5 h-3.5" />
            <span>Search Workspace</span>
          </div>
        </div>
      </div>

      {/* Channel Header (only if on home or dms and item selected) */}
      {(activeView === 'home' || activeView === 'dms') && activeItem && (
        <>
          <header className="h-14 flex items-center justify-between px-4 border-b border-white/5 bg-[#1a1d21]">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 cursor-pointer hover:bg-white/5 px-2 py-1 rounded-md transition-colors">
                <Hash className="w-5 h-5 text-muted-foreground" />
                <h2 className="font-bold text-lg">{activeItem.name}</h2>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="flex items-center gap-1">
              <div className="flex -space-x-2 mr-4 hidden sm:flex">
                {[1, 2, 3].map((i) => (
                  <Avatar key={i} className="w-6 h-6 border-2 border-[#1a1d21] rounded">
                    <AvatarImage src={`https://picsum.photos/seed/${i + 20}/100/100`} data-ai-hint="user avatar" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                ))}
                <div className="w-6 h-6 rounded bg-[#2e3136] flex items-center justify-center text-[10px] font-bold border-2 border-[#1a1d21]">
                  12
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onToggleHuddle}
                className={cn(
                  "h-8 gap-2 border transition-all",
                  isHuddleActive 
                    ? "bg-green-600 hover:bg-green-700 border-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]" 
                    : "bg-white/5 hover:bg-white/10 border-white/10"
                )}
              >
                {isHuddleActive ? <Video className="w-4 h-4 animate-pulse" /> : <Headphones className="w-4 h-4" />}
                <span>{isHuddleActive ? "Joining Huddle..." : "Huddle"}</span>
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>

              <div className="w-px h-6 bg-white/10 mx-1" />

              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                <Search className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                <Info className="w-4 h-4" />
              </Button>
            </div>
          </header>

          {/* Tabs */}
          <div className="flex px-4 border-b border-white/5 bg-[#1a1d21]">
            {[
              { id: 'messages', label: 'Messages' },
              { id: 'files', label: 'Files' },
              { id: 'pins', label: 'Pins' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id as any)}
                className={cn(
                  "px-4 py-2 text-sm transition-colors border-b-2",
                  activeTab === tab.id 
                    ? "text-white border-primary" 
                    : "text-muted-foreground border-transparent hover:text-white hover:border-white/20"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
