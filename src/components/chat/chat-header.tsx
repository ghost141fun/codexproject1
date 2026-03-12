
"use client";

import React, { useState } from 'react';
import { 
  Hash, 
  ChevronDown, 
  Search, 
  Headphones, 
  Edit2, 
  MoreVertical, 
  Video,
  User,
  Star,
  Copy,
  Columns2,
  EyeOff,
  Mail,
  Briefcase,
  MapPin,
  Clock
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const isDm = activeItem?.type === 'dm';

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
                  {isDm ? (
                     <div className="relative">
                       <Avatar className="w-5 h-5 rounded-md">
                         <AvatarImage src={activeItem.avatar} />
                         <AvatarFallback className="rounded-md text-[8px]">{activeItem.name[0]}</AvatarFallback>
                       </Avatar>
                       <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-[#1a1d21] bg-green-500" />
                     </div>
                  ) : (
                    <Hash className="w-5 h-5 text-muted-foreground" />
                  )}
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
                    
                    {isDm && (
                      <DropdownMenuItem 
                        onClick={() => setIsProfileOpen(true)}
                        className="gap-2 py-2 cursor-pointer focus:bg-white/10 rounded-sm"
                      >
                        <User className="w-4 h-4 text-muted-foreground" />
                        View full profile
                      </DropdownMenuItem>
                    )}
                    
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
                          <DropdownMenuItem className="cursor-pointer focus:bg-white/10">Copy ID</DropdownMenuItem>
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

      {/* User Profile Dialog */}
      {isDm && (
        <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-[#1a1d21] border-white/10 text-white">
            <DialogHeader className="sr-only">
               <DialogTitle>User Profile</DialogTitle>
               <DialogDescription>Full profile details for {activeItem.name}</DialogDescription>
            </DialogHeader>
            
            <div className="relative h-32 bg-gradient-to-r from-primary/40 to-primary/10">
              <div className="absolute -bottom-12 left-6">
                <Avatar className="w-24 h-24 border-4 border-[#1a1d21] rounded-2xl">
                  <AvatarImage src={activeItem.avatar} />
                  <AvatarFallback className="text-2xl">{activeItem.name[0]}</AvatarFallback>
                </Avatar>
              </div>
            </div>

            <div className="pt-16 pb-8 px-8 space-y-6">
              <div>
                <h3 className="text-2xl font-black">{activeItem.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs text-muted-foreground font-medium">Active Now</span>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Role</span>
                    <span className="text-sm font-medium">Senior Software Engineer</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Email</span>
                    <span className="text-sm font-medium lowercase">{activeItem.name.replace(' ', '.').toLowerCase()}@devtalk.app</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Location</span>
                    <span className="text-sm font-medium">San Francisco, CA</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Local Time</span>
                    <span className="text-sm font-medium">10:45 AM (UTC-7)</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button className="flex-1 bg-primary hover:bg-primary/90">Message</Button>
                <Button variant="outline" className="flex-1 border-white/10 hover:bg-white/5">Huddle</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
