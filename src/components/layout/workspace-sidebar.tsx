"use client";

import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { 
  Hash, 
  Lock, 
  Plus, 
  ChevronDown, 
  Settings, 
  Edit3,
  Radio,
  FolderOpen,
  CheckSquare,
  MessageSquare,
  UserPlus
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Channel, DirectMessage } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface WorkspaceSidebarProps {
  activeId: string;
  onSelect: (id: string, type: 'channel' | 'dm') => void;
  channels: Channel[];
  directMessages: DirectMessage[];
  onCreateChannel: (name: string, isPrivate: boolean) => void;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({ 
  activeId, 
  onSelect, 
  channels,
  directMessages,
  onCreateChannel 
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const handleCreateChannel = () => {
    if (!newChannelName.trim()) return;
    onCreateChannel(newChannelName, isPrivate);
    setNewChannelName('');
    setIsDialogOpen(false);
  };

  return (
    <div className="w-64 h-full flex bg-[#19171d] flex-col overflow-hidden border-r border-white/5">
      {/* Workspace Header */}
      <div className="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors group border-b border-white/5">
        <div className="flex items-center gap-2 truncate">
          <span className="font-bold text-lg truncate">DevTalk HQ</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded-md hover:bg-white/10 text-muted-foreground hover:text-white">
            <Settings className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-md hover:bg-white/10 text-muted-foreground hover:text-white">
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-6">
          {/* Main Actions */}
          <div className="space-y-0.5">
            <button className="flex items-center gap-3 w-full px-3 py-2 mb-2 rounded-md text-sm text-primary hover:bg-primary/10 transition-all font-bold group border border-primary/10">
              <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                <UserPlus className="w-3.5 h-3.5" />
              </div>
              <span>Invite member</span>
            </button>

            <button className="flex items-center gap-3 w-full px-3 py-1.5 rounded-md text-sm text-[#d1d2d3] hover:bg-white/10 transition-colors">
              <Radio className="w-4 h-4" />
              <span>Huddles</span>
            </button>
            <button className="flex items-center gap-3 w-full px-3 py-1.5 rounded-md text-sm text-[#d1d2d3] hover:bg-white/10 transition-colors">
              <FolderOpen className="w-4 h-4" />
              <span>Files</span>
            </button>
            <button className="flex items-center gap-3 w-full px-3 py-1.5 rounded-md text-sm text-[#d1d2d3] hover:bg-white/10 transition-colors">
              <CheckSquare className="w-4 h-4" />
              <span>All Workspace</span>
            </button>
          </div>

          {/* Channels Section */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between px-3 py-1 group">
              <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground/80 cursor-pointer hover:text-white uppercase tracking-wider">
                <ChevronDown className="w-3 h-3" />
                <span>Channels</span>
              </div>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-white hover:bg-white/10">
                    <Plus className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle>Create a channel</DialogTitle>
                    <DialogDescription>
                      Channels are where your team communicates. They're best when organized around a topic.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input 
                        id="name" 
                        placeholder="e.g. project-x" 
                        value={newChannelName}
                        onChange={(e) => setNewChannelName(e.target.value)}
                        className="bg-background border-white/10 focus:border-primary/50"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="hover:bg-white/5">Cancel</Button>
                    <Button onClick={handleCreateChannel} disabled={!newChannelName.trim()}>Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            {channels.map((channel: Channel) => (
              <button
                key={channel.id}
                onClick={() => onSelect(channel.id, 'channel')}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-1.5 rounded-md text-sm transition-all group",
                  activeId === channel.id 
                    ? "bg-primary/20 text-white font-medium" 
                    : "text-[#d1d2d3] hover:bg-white/10"
                )}
              >
                {channel.isPrivate ? <Lock className="w-3.5 h-3.5" /> : <Hash className="w-4 h-4" />}
                <span className="truncate">{channel.name}</span>
              </button>
            ))}
          </div>

          {/* Direct Messages Section */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between px-3 py-1 group">
              <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground/80 cursor-pointer hover:text-white uppercase tracking-wider">
                <ChevronDown className="w-3 h-3" />
                <span>Direct Messages</span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-white hover:bg-white/10">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {directMessages.map((dm: DirectMessage) => (
              <button
                key={dm.id}
                onClick={() => onSelect(dm.id, 'dm')}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-1.5 rounded-md text-sm transition-all group",
                  activeId === dm.id 
                    ? "bg-primary/20 text-white font-medium" 
                    : "text-[#d1d2d3] hover:bg-white/10"
                )}
              >
                <div className="relative">
                  <Avatar className="w-5 h-5 rounded-md">
                    <AvatarImage src={dm.avatar} />
                    <AvatarFallback className="rounded-md text-[8px]">{dm.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#19171d] bg-green-500" />
                </div>
                <span className="truncate">{dm.name}</span>
              </button>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};