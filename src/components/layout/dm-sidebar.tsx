"use client";

import React from 'react';
import { Search, Plus, MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { DirectMessage } from '@/lib/types';

interface DmSidebarProps {
  activeId: string;
  onSelect: (id: string, type: 'channel' | 'dm') => void;
  directMessages: DirectMessage[];
}

export const DmSidebar: React.FC<DmSidebarProps> = ({ activeId, onSelect, directMessages }) => {
  return (
    <div className="w-64 h-full flex bg-[#19171d] flex-col overflow-hidden border-r border-white/5">
      <div className="p-4 border-b border-white/5">
        <h2 className="text-xl font-bold mb-4">Direct Messages</h2>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search for people" 
            className="pl-8 bg-white/5 border-none h-9 text-sm focus-visible:ring-1 focus-visible:ring-white/20"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3">
          <div className="space-y-1">
            {directMessages.map((dm) => (
              <button
                key={dm.id}
                onClick={() => onSelect(dm.id, 'dm')}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-all group",
                  activeId === dm.id 
                    ? "bg-primary/20 text-white font-medium" 
                    : "text-[#d1d2d3] hover:bg-white/10"
                )}
              >
                <div className="relative">
                  <Avatar className="w-6 h-6 rounded-md">
                    <AvatarImage src={dm.avatar} />
                    <AvatarFallback className="rounded-md text-[10px]">{dm.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#19171d] bg-green-500" />
                </div>
                <span className="truncate">{dm.name}</span>
              </button>
            ))}
          </div>

          <button className="flex items-center gap-3 w-full px-3 py-2 mt-4 rounded-md text-sm text-muted-foreground hover:bg-white/5 transition-colors">
            <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <span>Add teammates</span>
          </button>
        </div>
      </ScrollArea>
    </div>
  );
};
