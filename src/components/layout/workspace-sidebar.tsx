'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from "@/lib/utils";
import { 
  Hash, 
  Lock, 
  Plus, 
  ChevronDown, 
  Settings, 
  Edit3,
  Headphones,
  FolderOpen,
  CheckSquare,
  MessageSquare,
  UserPlus,
  Link as LinkIcon,
  Copy,
  Check,
  Camera,
  AlertTriangle,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useDraftCount } from '@/hooks/use-drafts';

interface WorkspaceSidebarProps {
  activeId: string;
  onSelect: (id: string, type: 'channel' | 'dm') => void;
  channels: Channel[];
  directMessages: DirectMessage[];
  onCreateChannel: (name: string, isPrivate: boolean) => void;
  onViewChange?: (view: 'home' | 'dms' | 'activity' | 'files' | 'huddles' | 'drafts') => void;
  activeWorkspace?: any;
  workspaces?: any[];
  onRenameWorkspace?: (newName: string) => Promise<void>;
  onWorkspaceSwitch?: (id: string) => void;
  isOwner?: boolean;
  onDeleteWorkspace?: (id: string) => Promise<void>;
  onUpdateWorkspaceImage?: (url: string) => Promise<void>;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({ 
  activeId, 
  onSelect, 
  channels,
  directMessages,
  onCreateChannel,
  onViewChange,
  activeWorkspace,
  workspaces = [],
  onRenameWorkspace,
  onWorkspaceSwitch,
  isOwner,
  onDeleteWorkspace,
  onUpdateWorkspaceImage
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [workspaceNameInput, setWorkspaceNameInput] = useState(activeWorkspace?.name || '');
  const [isRenaming, setIsRenaming] = useState(false);
  const draftCount = useDraftCount();
  const { toast } = useToast();
  
  useEffect(() => {
    if (activeWorkspace?.name) {
      setWorkspaceNameInput(activeWorkspace.name);
    }
  }, [activeWorkspace]);

  const handleCopyInviteLink = () => {
    let wsId = activeWorkspace?.id;
    if (!wsId && typeof window !== 'undefined') {
      wsId = new URLSearchParams(window.location.search).get('ws');
    }
    const link = `${window.location.origin}/join?id=${wsId || ''}`;
    navigator.clipboard.writeText(link);
    setInviteCopied(true);
    toast({
      title: "Link Copied",
      description: "Invitation link has been copied to your clipboard.",
    });
    setTimeout(() => setInviteCopied(false), 2000);
  };

  const handleCreateChannel = () => {
    if (!newChannelName.trim()) return;
    onCreateChannel(newChannelName, isPrivate);
    setNewChannelName('');
    setIsDialogOpen(false);
  };

  const handleRenameSubmit = async () => {
    if (!workspaceNameInput.trim() || !onRenameWorkspace) return;
    setIsRenaming(true);
    await onRenameWorkspace(workspaceNameInput);
    setIsRenaming(false);
    setIsRenameDialogOpen(false);
    toast({ title: "Workspace Renamed", description: `Renamed to ${workspaceNameInput}` });
  };

  return (
    <div className="w-64 h-full flex bg-[#19171d] flex-col overflow-hidden border-r border-white/5">
      {/* Workspace Header */}
      <div className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group border-b border-white/5">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex flex-1 items-center gap-2 truncate outline-none">
            <span className="font-bold text-lg truncate text-left">{activeWorkspace?.name || (workspaces.length > 0 ? 'Loading...' : 'Codex Teams')}</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[200px] bg-[#222529] border-white/10 text-white">
            <div className="text-xs font-semibold text-muted-foreground px-2 py-1.5 uppercase tracking-wider">
              Switch Workspace
            </div>
            {workspaces.map((ws) => (
              <DropdownMenuItem 
                key={ws.id} 
                className="flex items-center justify-between cursor-pointer hover:bg-white/10 focus:bg-white/10"
                onClick={() => onWorkspaceSwitch?.(ws.id)}
              >
                <span className="truncate">{ws.name}</span>
                {ws.id === activeWorkspace?.id && <Check className="w-4 h-4 text-primary shrink-0" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex items-center gap-1">
          {isOwner ? (
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <button className="p-1.5 rounded-md hover:bg-white/10 text-muted-foreground hover:text-white">
                  <Settings className="w-4 h-4" />
                </button>
              </DialogTrigger>
              <DialogContent className="bg-[#1a1d21] border-[#222529] text-white sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Workspace Settings</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Manage workspace picture or delete the workspace.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-6 py-4">
                  {/* Workspace Image Selection */}
                  <div className="space-y-3">
                    <Label className="text-white">Workspace Image</Label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#222529] flex items-center justify-center shrink-0 border border-white/10 relative group">
                        {activeWorkspace?.logo_url ? (
                          <img src={activeWorkspace.logo_url} alt="Workspace Logo" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl">{activeWorkspace?.emoji || '🏢'}</span>
                        )}
                        <button onClick={() => fileRef.current?.click()} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="w-5 h-5 text-white" />
                        </button>
                      </div>
                      <div className="flex-1">
                        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="w-full bg-transparent border-white/10 hover:bg-white/5 text-white mb-2">Change Image</Button>
                        <p className="text-[10px] text-muted-foreground">Recommended size: 256x256px</p>
                      </div>
                      <input 
                        ref={fileRef} type="file" accept="image/*" className="hidden" 
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f && onUpdateWorkspaceImage) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const img = new Image();
                              img.onload = () => {
                                const canvas = document.createElement('canvas');
                                const MAX_SIZE = 256;
                                let width = img.width;
                                let height = img.height;
                                if (width > height) {
                                  if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
                                } else {
                                  if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
                                }
                                canvas.width = width;
                                canvas.height = height;
                                const ctx = canvas.getContext('2d');
                                ctx?.drawImage(img, 0, 0, width, height);
                                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                                
                                onUpdateWorkspaceImage(dataUrl);
                              };
                              img.src = event.target?.result as string;
                            };
                            reader.readAsDataURL(f);
                          }
                          e.target.value = '';
                        }} 
                      />
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="space-y-3 pt-4 border-t border-red-500/20 mt-2">
                    <Label className="text-red-400 flex items-center gap-2 uppercase tracking-wider text-[10px] font-black">
                      <AlertTriangle className="w-3.5 h-3.5" /> Danger Zone
                    </Label>
                    <p className="text-sm text-muted-foreground mb-3">Deleting your workspace is irreversible. All channels, messages, and files will be lost forever.</p>
                    {isDeleting ? (
                      <div className="space-y-3 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                        <Label className="text-xs text-red-200">Type <span className="font-mono bg-black/30 px-1 rounded font-bold">{activeWorkspace?.name}</span> to confirm</Label>
                        <Input 
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          className="bg-black/40 border-red-500/30 text-white focus-visible:ring-red-500"
                          placeholder={activeWorkspace?.name}
                        />
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            onClick={() => { setIsDeleting(false); setDeleteConfirmText(''); }}
                            className="flex-1 hover:bg-white/5 text-white"
                          >
                            Cancel
                          </Button>
                          <Button 
                            variant="destructive"
                            onClick={() => {
                              if (activeWorkspace?.id) onDeleteWorkspace?.(activeWorkspace.id);
                            }}
                            disabled={deleteConfirmText !== activeWorkspace?.name}
                            className="flex-1 bg-red-600 hover:bg-red-700 font-bold"
                          >
                            Delete Forever
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button 
                        variant="destructive" 
                        onClick={() => setIsDeleting(true)}
                        className="w-full bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30 font-semibold flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> Delete Workspace
                      </Button>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <button 
              className="p-1.5 rounded-md hover:bg-white/10 text-muted-foreground opacity-50 cursor-not-allowed" 
              title="Only workspace owners can access settings"
              onClick={() => toast({ title: 'Access Denied', description: 'Only workspace owners can modify workspace settings.' })}
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          
          <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
            <DialogTrigger asChild>
              <button 
                className="p-1.5 rounded-md hover:bg-white/10 text-muted-foreground hover:text-white"
                onClick={() => setWorkspaceNameInput(activeWorkspace?.name || '')}
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="bg-[#1a1d21] border-[#222529] text-white sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Rename Workspace</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Choose a new name for your team workspace.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="workspace-name" className="text-white">Workspace Name</Label>
                  <Input 
                    id="workspace-name" 
                    value={workspaceNameInput}
                    onChange={(e) => setWorkspaceNameInput(e.target.value)}
                    className="bg-[#222529] border-white/10 text-white focus-visible:ring-primary"
                    placeholder="e.g. Acme Corp"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="ghost" 
                  onClick={() => setIsRenameDialogOpen(false)}
                  className="hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleRenameSubmit}
                  className="bg-primary text-white hover:bg-primary/90"
                  disabled={isRenaming || !workspaceNameInput.trim() || workspaceNameInput === activeWorkspace?.name}
                >
                  {isRenaming ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-6">
          {/* Main Actions */}
          <div className="space-y-0.5">
            <button 
              onClick={() => setIsInviteDialogOpen(true)}
              className="flex items-center gap-3 w-full px-3 py-2 mb-2 rounded-md text-sm text-primary hover:bg-primary/10 transition-all font-bold group border border-primary/10"
            >
              <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                <UserPlus className="w-3.5 h-3.5 text-primary" />
              </div>
              <span>Invite member</span>
            </button>

            <button 
              onClick={() => onViewChange?.('huddles')}
              className="flex items-center gap-3 w-full px-3 py-1.5 rounded-md text-sm text-[#d1d2d3] hover:bg-white/10 transition-colors text-left"
            >
              <Headphones className="w-4 h-4" />
              <span>Huddles</span>
            </button>
            <button 
              onClick={() => onViewChange?.('files')}
              className="flex items-center gap-3 w-full px-3 py-1.5 rounded-md text-sm text-[#d1d2d3] hover:bg-white/10 transition-colors text-left"
            >
              <FolderOpen className="w-4 h-4" />
              <span>Files</span>
            </button>
            <button 
              onClick={() => onViewChange?.('drafts')}
              className="flex items-center gap-3 w-full px-3 py-1.5 rounded-md text-sm text-[#d1d2d3] hover:bg-white/10 transition-colors text-left"
            >
              <div className="flex items-center gap-3 flex-1">
                <Edit3 className="w-4 h-4" />
                <span>Drafts & Sent</span>
              </div>
              {draftCount > 0 && (
                <span className="bg-[#7c3aed] text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                  {draftCount}
                </span>
              )}
            </button>
            <button className="flex items-center gap-3 w-full px-3 py-1.5 rounded-md text-sm text-[#d1d2d3] hover:bg-white/10 transition-colors text-left">
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
                <DialogContent className="bg-[#1a1d21]/90 backdrop-blur-xl border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/5 animate-in fade-in zoom-in duration-500 sm:max-w-[450px] p-8 rounded-2xl overflow-hidden">
                  <DialogHeader className="space-y-2">
                    <DialogTitle className="text-2xl font-black text-white">Create a channel</DialogTitle>
                    <DialogDescription className="text-muted-foreground/80 leading-relaxed text-sm">
                      Channels are where your team communicates. They're best when organized around a topic.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-8">
                    <div className="space-y-3">
                      <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Channel Name</Label>
                      <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center transition-colors group-focus-within:text-primary">
                          <Hash className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <Input 
                          id="name" 
                          placeholder="e.g. project-apollo" 
                          value={newChannelName}
                          onChange={(e) => setNewChannelName(e.target.value)}
                          className="pl-10 bg-black/40 border-white/10 focus-visible:ring-primary/40 focus-visible:border-primary/50 h-12 text-sm transition-all placeholder:text-muted-foreground/30 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="gap-3 sm:gap-3 flex-row justify-end items-center">
                    <Button 
                      variant="ghost" 
                      onClick={() => setIsDialogOpen(false)} 
                      className="hover:bg-white/5 font-bold text-[11px] uppercase tracking-[0.2em] h-11 px-8 text-white transition-all active:scale-95"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateChannel} 
                      disabled={!newChannelName.trim()}
                      className="font-bold text-[11px] uppercase tracking-[0.2em] h-11 px-8 shadow-[0_10px_30px_rgba(168,85,247,0.3)] bg-primary hover:bg-primary/90 text-white transition-all active:scale-95 disabled:opacity-20 disabled:shadow-none rounded-xl"
                    >
                      Create Channel
                    </Button>
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
            
            {(directMessages ?? []).map((dm: DirectMessage) => (
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
                    <AvatarFallback 
                      className="rounded-md text-[8px] text-white font-bold"
                      style={{ background: dm.color || '#4a154b' }}
                    >
                      {dm.name?.[0]?.toUpperCase() ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#19171d]",
                    (dm as any).status === 'online' ? "bg-green-500" : "bg-gray-500"
                  )} />
                </div>
                <span className="truncate">{dm.name}</span>
              </button>
            ))}
          </div>
        </div>
      </ScrollArea>

      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="bg-[#1a1d21] border-white/10 text-white sm:max-w-[450px] p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-2xl font-black flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-primary" />
              </div>
              Invite to {activeWorkspace?.name || 'Workspace'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground/80 mt-2">
              Share this link with your team members to invite them to this workspace.
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-8 pb-8 space-y-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Workspace Link</Label>
              <div className="flex gap-2">
                <div className="relative flex-1 group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <Input 
                    readOnly 
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/join?id=${activeWorkspace?.id || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('ws') : '') || ''}`} 
                    className="pl-10 bg-black/40 border-white/10 h-12 text-sm text-[#d1d2d3] rounded-xl focus-visible:ring-0 focus-visible:border-white/20 select-all cursor-default"
                  />
                </div>
                <Button 
                  onClick={handleCopyInviteLink}
                  className={cn(
                    "h-12 px-6 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all active:scale-95",
                    inviteCopied ? "bg-green-600 hover:bg-green-700 text-white" : "bg-primary hover:bg-primary/90 text-white"
                  )}
                >
                  {inviteCopied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" /> Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
              <div className="text-xs font-bold text-white/90 flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-primary" />
                Security Tip
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                This link allows anyone with access to join your workspace. You can revoke it at any time in workspace settings.
              </p>
            </div>
          </div>
          
          <div className="px-8 py-4 bg-white/5 border-t border-white/5 flex justify-end">
            <Button 
              variant="ghost" 
              onClick={() => setIsInviteDialogOpen(false)}
              className="font-bold text-[11px] uppercase tracking-widest h-10 px-6 hover:bg-white/5 text-white"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
