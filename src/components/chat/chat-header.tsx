"use client";

import React from 'react';
import { 
  Hash, 
  ChevronDown, 
  Search, 
  Headphones, 
  Edit2, 
  MoreVertical, 
  Clock, 
  Video,
  User,
  Star,
  Copy,
  Columns2,
  EyeOff,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface ChatHeaderProps {
  activeItem: any;
  messages: any[];
  isHuddleActive: boolean;
  onToggleHuddle: () => void;
  activeTab: 'messages' | 'files' | 'pins';
  onTabChange: (tab: 'messages' | 'files' | 'pins') => void;
  activeView: string;
  onOpenSearch: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  activeItem, 
  messages, 
  isHuddleActive, 
  onToggleHuddle,
  activeTab,
  onTabChange,
  activeView,
  onOpenSearch
}) => {
  return (
    <div className="flex flex-col shrink-0">
      {/* Top Global Search Bar */}
      <div className="h-10 bg-[#121016] flex items-center justify-center px-4 border-b border-white/5">
        <div 
          onClick={onOpenSearch}
          className="flex items-center gap-4 w-full max-w-2xl px-3 h-7 bg-white/10 rounded-md border border-white/10 group hover:bg-white/15 cursor-pointer transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
          <div className="flex items-center gap-2 flex-1 text-xs text-muted-foreground">
            <span>Search Workspace</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="h-4 px-1 rounded border border-white/20 bg-black/20 text-[9px] font-mono text-muted-foreground uppercase tracking-widest">
              CMD K
            </kbd>
          </div>
        </div>
      </div>

      {/* Channel Header (only if on home or dms and item selected) */}
      {!activeItem && (activeView === 'home' || activeView === 'dms') ? (
        <header className="h-14 flex items-center px-4 border-b border-white/5 bg-[#1a1d21]">
          <span className="text-muted-foreground animate-pulse text-sm">Select a conversation...</span>
        </header>
      ) : (
        (activeView === 'home' || activeView === 'dms') && activeItem && (
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
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onOpenSearch}
                  className="h-8 w-8 text-muted-foreground hover:text-white"
                >
                  <Search className="w-4 h-4" />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 bg-[#1a1d21] border-white/10 text-white shadow-2xl p-1.5">
                    <DropdownMenuItem className="gap-2 py-2 cursor-pointer focus:bg-white/10 rounded-sm">
                      Open conversation details
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 py-2 cursor-pointer focus:bg-white/10 rounded-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      View full profile
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator className="bg-white/5 my-1.5" />
                    
                    <DropdownMenuItem className="gap-2 py-2 cursor-pointer bg-primary/10 text-white font-medium focus:bg-primary/20 transition-colors rounded-sm group">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Summarize conversation
                      <Badge className="ml-auto bg-[#b33de0] hover:bg-[#b33de0] text-[10px] font-black h-4 px-1.5 rounded-sm border-none text-white">PRO</Badge>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator className="bg-white/5 my-1.5" />
                    
                    <DropdownMenuItem className="gap-2 py-2 cursor-pointer focus:bg-white/10 rounded-sm">
                      <Star className="w-4 h-4 text-muted-foreground" />
                      Star conversation
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator className="bg-white/5 my-1.5" />
                    
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="gap-2 py-2 cursor-pointer focus:bg-white/10 rounded-sm">
                        <Copy className="w-4 h-4 text-muted-foreground" />
                        Copy
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent className="bg-[#1a1d21] border-white/10 text-white shadow-2xl min-w-[150px] p-1">
                          <DropdownMenuItem className="cursor-pointer focus:bg-white/10">Copy link</DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer focus:bg-white/10">Copy channel ID</DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                    
                    <DropdownMenuItem className="gap-2 py-2 cursor-pointer focus:bg-white/10 rounded-sm">
                      <Search className="w-4 h-4 text-muted-foreground" />
                      Search in conversation
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator className="bg-white/5 my-1.5" />
                    
                    <DropdownMenuItem className="gap-2 py-2 cursor-pointer focus:bg-white/10 rounded-sm">
                      <Columns2 className="w-4 h-4 text-muted-foreground" />
                      Open in split view
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator className="bg-white/5 my-1.5" />
                    
                    <DropdownMenuItem className="gap-2 py-2 cursor-pointer text-[#ff6b6b] focus:text-[#ff6b6b] focus:bg-red-500/10 rounded-sm font-medium">
                      <EyeOff className="w-4 h-4" />
                      Hide
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
        )
      )}
    </div>
  );
};
