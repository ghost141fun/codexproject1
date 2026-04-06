"use client";

import React, { useState, useMemo } from 'react';
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
  Clock,
  UserPlus,
  Check,
  Link as LinkIcon,
  Bell,
  X,
  Settings as SettingsIcon,
  Puzzle,
  Layout,
  Sparkles,
  MessageSquare,
  Layers,
  AlertTriangle,
  RefreshCw,
  Palette,
  Trello as TrelloIcon,
  BookOpen,
  Activity,
  BellRing,
  FileText,
  CheckSquare,
  Workflow,
  HelpCircle,
  Loader2,
  Lock,
  Archive,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useUser, useAuth } from "@/database";

interface ChatHeaderProps {
  activeItem: any;
  messages: any[];
  isHuddleActive: boolean;
  onToggleHuddle: () => void;
  activeTab: 'messages' | 'files' | 'pins';
  onTabChange: (tab: 'messages' | 'files' | 'pins') => void;
  activeView: string;
  onOpenSearch: () => void;
  onLeaveChannel?: (id: string) => void;
}



const mockIntegrations = [
  { id: 'github', name: 'GitHub', desc: 'Sync repository activity and pull requests.', icon: BookOpen, color: 'text-white' },
  { id: 'trello', name: 'Trello', desc: 'Manage boards and cards from channels.', icon: TrelloIcon, color: 'text-blue-400' },
  { id: 'gdrive', name: 'Google Drive', desc: 'Share and preview files instantly.', icon: FileText, color: 'text-green-500' },
  { id: 'zoom', name: 'Zoom', desc: 'Start video meetings directly from chat.', icon: Video, color: 'text-blue-500' },
  { id: 'jira', name: 'Jira', desc: 'Track issues and project progress.', icon: Activity, color: 'text-blue-600' },
  { id: 'figma', name: 'Figma', desc: 'Preview and comment on designs.', icon: Palette, color: 'text-purple-500' },
  { id: 'vercel', name: 'Vercel', desc: 'Monitor deployments and logs.', icon: Layers, color: 'text-white' },
  { id: 'sentry', name: 'Sentry', desc: 'Real-time error tracking and alerts.', icon: AlertTriangle, color: 'text-red-500' },
  { id: 'linear', name: 'Linear', desc: 'Issue tracking for high-performance teams.', icon: Workflow, color: 'text-blue-400' },
  { id: 'notion', name: 'Notion', desc: 'Connect documents and workspace notes.', icon: BookOpen, color: 'text-white' },
];

export const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  activeItem, 
  messages, 
  isHuddleActive, 
  onToggleHuddle,
  activeTab,
  onTabChange,
  activeView,
  onOpenSearch,
  onLeaveChannel
}) => {
  const { user } = useUser();
  const { supabase } = useAuth();
  const { toast } = useToast();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMemberListOpen, setIsMemberListOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeDialogTab, setActiveDialogTab] = useState<'about' | 'members' | 'integrations' | 'settings'>('members');

  // Permission Editor State
  const [isEditingPermissions, setIsEditingPermissions] = useState(false);
  const [postingRule, setPostingRule] = useState('guests');
  const [allowThreads, setAllowThreads] = useState(true);
  const [allowMentions, setAllowMentions] = useState(true);

  const [membersList, setMembersList] = useState<any[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  
  // Workspace Users State (for Members Tab Invite)
  const [workspaceUsers, setWorkspaceUsers] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [invitingUserId, setInvitingUserId] = useState<string | null>(null);

  // Settings State
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [isUpdatingChannel, setIsUpdatingChannel] = useState(false);

  const isDm = activeItem?.type === 'dm';
  
  // Define if the user can manage this channel's members
  const canManageMembers = user?.role === 'owner' || user?.role === 'admin' || user?.role === 'workspace_owner' || activeItem?.created_by === user?.id;

  const fetchMembers = React.useCallback(async () => {
    if (!activeItem || !supabase) return;
    setIsLoadingMembers(true);
      try {
        if (activeItem.type === 'channel') {
          const { data, error } = await supabase
            .from('channel_memberships')
            .select(`
              user_id,
              users (id, display_name, username, avatar_gradient, avatar_url, profile_picture_url, role, status)
            `)
            .eq('channel_id', activeItem.id);
            
          if (!error && data) {
            setMembersList(data.map((d: any) => ({
              id: d.users.id,
              name: d.users.display_name || d.users.username || 'Unknown',
              role: d.users.role || 'Member',
              avatar: d.users.avatar_url || d.users.profile_picture_url || d.users.avatar_gradient || '',
              status: d.users.status || 'offline'
            })));
          }
        } else if (activeItem.type === 'dm') {
          const { data, error } = await supabase
            .from('direct_message_conversations')
            .select(`
              user1:user1_id(id, display_name, username, avatar_gradient, role, status),
              user2:user2_id(id, display_name, username, avatar_gradient, role, status)
            `)
            .eq('id', activeItem.id)
            .single();
            
          if (!error && data) {
             const u1: any = data.user1;
             const u2: any = data.user2;
             const m = [];
             if (u1) m.push({ id: u1.id, name: u1.display_name || u1.username, role: u1.role || 'Member', avatar: u1.avatar_gradient || '', status: u1.status || 'offline' });
             if (u2) m.push({ id: u2.id, name: u2.display_name || u2.username, role: u2.role || 'Member', avatar: u2.avatar_gradient || '', status: u2.status || 'offline' });
             setMembersList(m);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingMembers(false);
      }
  }, [activeItem, supabase]);

  React.useEffect(() => {
    if (isMemberListOpen) fetchMembers();
  }, [isMemberListOpen, fetchMembers]);

  // Fetch workspace users directly in the Members tab based on memberSearch
  React.useEffect(() => {
    if (!isMemberListOpen || !supabase || isDm) return;
    
    async function searchUsers() {
      setIsSearchingUsers(true);
      
      const { data: memberRecords } = await supabase!.from('workspace_memberships').select('user_id').eq('workspace_id', activeItem.workspace_id);
      const memberIds = (memberRecords || []).map(r => r.user_id);
      
      if (memberIds.length === 0) {
        setWorkspaceUsers([]);
        setIsSearchingUsers(false);
        return;
      }

      let query = supabase!.from('users').select('id, display_name, username, avatar_gradient, role').in('id', memberIds).limit(20);
      if (memberSearch) {
         query = query.or(`display_name.ilike.%${memberSearch}%,username.ilike.%${memberSearch}%`);
      }
      const { data, error } = await query;
      if (!error && data) {
         const currentMemberIds = new Set(membersList.map(m => m.id));
         setWorkspaceUsers(data.filter(u => !currentMemberIds.has(u.id)));
      }
      setIsSearchingUsers(false);
    }
    
    const timeoutMsg = setTimeout(() => {
       searchUsers();
    }, 300);
    return () => clearTimeout(timeoutMsg);
  }, [isMemberListOpen, memberSearch, supabase, membersList, isDm]);

  const handleInviteUser = async (targetUser: any) => {
    if (!supabase || isDm) return;
    setInvitingUserId(targetUser.id);
    const { error } = await supabase.from('channel_memberships').insert({
      channel_id: activeItem.id,
      user_id: targetUser.id
    });
    
    if (!error) {
       // Send an automated system message into the channel
       const inviterName = (user as any)?.display_name || (user as any)?.name || (user as any)?.email?.split('@')[0] || 'A user';
       const inviteeName = targetUser.display_name || targetUser.username || targetUser.email?.split('@')[0] || 'a user';
       
       await supabase.from('messages').insert({
         channel_id: activeItem.id,
         author_id: user?.id,
         content: `${inviterName} invited ${inviteeName}`
       });

       toast({ title: 'User added!', description: `${inviteeName} has been added to the channel.` });
       setWorkspaceUsers(prev => prev.filter(u => u.id !== targetUser.id));
       fetchMembers();
    } else {
       toast({ title: 'Error adding user', description: error.message, variant: 'destructive' });
    }
    
    setInvitingUserId(null);
  };

  const handleRenameChannel = async () => {
    if (!editNameValue.trim() || editNameValue === activeItem?.name) {
      setIsEditingName(false);
      return;
    }
    if (!supabase) return;
    setIsUpdatingChannel(true);
    const { error } = await supabase.from('channels').update({ name: editNameValue }).eq('id', activeItem.id);
    setIsUpdatingChannel(false);
    if (!error) {
      toast({ title: "Channel updated", description: "The channel name has been updated." });
      setIsEditingName(false);
      if (activeItem) activeItem.name = editNameValue;
    } else {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleArchiveChannel = async () => {
    if (!supabase || !canManageMembers) return;
    if (!window.confirm("Are you sure you want to archive this channel for everyone? This cannot be undone.")) return;
    const { error } = await supabase.from('channels').delete().eq('id', activeItem.id);
    if (!error) {
      toast({ title: "Channel archived", description: "The channel was permanently archived." });
      setIsMemberListOpen(false);
      if (onLeaveChannel) onLeaveChannel(activeItem.id);
    } else {
      toast({ title: "Error archiving", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteChannel = async () => {
    if (!supabase || !canManageMembers) return;
    if (!window.confirm("Are you sure you want to permanently delete this channel? This cannot be undone.")) return;
    const { error } = await supabase.from('channels').delete().eq('id', activeItem.id);
    if (!error) {
      toast({ title: "Channel deleted", description: "The channel was permanently deleted." });
      setIsMemberListOpen(false);
      if (onLeaveChannel) onLeaveChannel(activeItem.id);
    } else {
      toast({ title: "Error deleting", description: error.message, variant: "destructive" });
    }
  };

  const handleTogglePublic = async () => {
    if (!supabase || !canManageMembers) return;
    setIsUpdatingChannel(true);
    const { error } = await supabase.from('channels').update({ is_private: !activeItem.is_private }).eq('id', activeItem.id);
    setIsUpdatingChannel(false);
    if (!error) {
      toast({ title: "Visibility updated", description: `Channel is now ${activeItem.is_private ? 'public' : 'private'}.` });
      if (activeItem) activeItem.is_private = !activeItem.is_private;
    } else {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const copyHuddleLinkLocal = () => {
    const link = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?huddle=${activeItem?.id}` : '';
    navigator.clipboard.writeText(link);
    toast({ title: "Link Copied", description: "Huddle link has been copied to your clipboard." });
  };

  const filteredMembers = useMemo(() => {
    return membersList.filter(m => 
      m.name.toLowerCase().includes(memberSearch.toLowerCase()) || 
      m.role.toLowerCase().includes(memberSearch.toLowerCase())
    );
  }, [memberSearch, membersList]);

  const handleRemoveMember = async (memberId: string) => {
    if (!supabase) return;
    if (activeItem.type === 'channel') {
      const { error } = await supabase
        .from('channel_memberships')
        .delete()
        .match({ channel_id: activeItem.id, user_id: memberId });
        
      if (!error) {
        setMembersList(prev => prev.filter(m => m.id !== memberId));
        toast({
          title: "Member Removed",
          description: "The user has been securely removed from the channel.",
        });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Cannot Remove", description: "Direct messages cannot have members removed.", variant: "destructive" });
    }
  };

  const copyInviteLink = () => {
    const link = `https://devtalk.app/join/${activeItem?.id || 'general'}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast({
      title: "Link Copied",
      description: "Invitation link has been copied to your clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeaveChannel = () => {
    if (activeItem && onLeaveChannel) {
      onLeaveChannel(activeItem.id);
      setIsMemberListOpen(false);
      toast({
        title: "Channel Update",
        description: `You have successfully left the #${activeItem?.name} channel.`,
      });
    }
  };

  return (
    <div className="flex flex-col shrink-0">
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

      {activeItem && (activeView === 'home' || activeView === 'dms') && (
        <>
          <header className="h-14 flex items-center justify-between px-4 border-b border-white/5 bg-[#1a1d21]">
            <div className="flex items-center gap-2">
              <div 
                onClick={() => {
                  setIsMemberListOpen(true);
                  setIsEditingPermissions(false);
                }}
                className="flex items-center gap-1 cursor-pointer hover:bg-white/5 px-2 py-1 rounded-md transition-colors"
              >
                {isDm ? (
                  <Avatar className="w-5 h-5 rounded-md">
                    <AvatarImage src={activeItem.avatar} />
                    <AvatarFallback className="rounded-md text-[8px]">{activeItem.name[0]}</AvatarFallback>
                  </Avatar>
                ) : (
                  <Hash className="w-5 h-5 text-muted-foreground" />
                )}
                <h2 className="font-bold text-lg">{activeItem.name}</h2>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setIsMemberListOpen(true);
                  setActiveDialogTab('settings');
                }}
                className="h-8 gap-2 border bg-white/5 hover:bg-white/10 border-white/10 transition-all"
              >
                <SettingsIcon className="w-4 h-4" />
                <span>Manage Channel</span>
              </Button>

              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onToggleHuddle}
                className={cn(
                  "h-8 gap-2 border transition-all",
                  isHuddleActive 
                    ? "bg-green-600 hover:bg-green-700 border-green-500 text-white" 
                    : "bg-white/5 hover:bg-white/10 border-white/10"
                )}
              >
                {isHuddleActive ? <Video className="w-4 h-4 animate-pulse" /> : <Headphones className="w-4 h-4" />}
                <span>{isHuddleActive ? "Joining..." : "Huddle"}</span>
              </Button>

              <div className="w-px h-6 bg-white/10 mx-1" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#1a1d21] border-white/10 text-white shadow-2xl p-1.5">
                  <DropdownMenuItem 
                    onClick={() => {
                      setIsMemberListOpen(true);
                      setActiveDialogTab('about');
                    }}
                    className="gap-2 py-2 cursor-pointer focus:bg-white/10 rounded-sm text-sm"
                  >
                    <BookOpen className="w-4 h-4" /> 
                    Open conversation details
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

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

      <Dialog open={isMemberListOpen} onOpenChange={setIsMemberListOpen}>
        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden bg-[#1a1d21] border-white/10 text-white">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center justify-between mb-4">
              <DialogTitle className="text-2xl font-black flex items-center gap-2">
                {isEditingPermissions ? <SettingsIcon className="w-6 h-6 text-primary" /> : <Hash className="w-6 h-6 text-muted-foreground" />}
                {isEditingPermissions ? "Posting permissions" : activeItem?.name}
              </DialogTitle>
            </div>
            
            {!isEditingPermissions && (
              <div className="flex border-b border-white/10">
                {['About', 'Members', 'Integrations', 'Settings'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveDialogTab(tab.toLowerCase() as any)}
                    className={cn(
                      "px-4 py-2 text-xs font-bold transition-colors border-b-2 relative -mb-[2px]",
                      activeDialogTab === tab.toLowerCase() 
                        ? "text-white border-primary" 
                        : "text-muted-foreground border-transparent hover:text-white hover:border-white/20"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}
          </DialogHeader>

          <div className="p-6">
            {isEditingPermissions ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="space-y-4">
                  <p className="text-sm font-bold text-white/90 uppercase tracking-widest text-[10px]">Who can post in this channel?</p>
                  <RadioGroup value={postingRule} onValueChange={setPostingRule} className="space-y-3">
                    {[
                      { id: 'everyone', label: 'Everyone', desc: 'All members including guests can post messages.' },
                      { id: 'guests', label: 'Everyone, except guests', desc: 'Standard workspace members only.' },
                      { id: 'admins', label: 'Admins and owners only', desc: 'Restricted to workspace administrators.' }
                    ].map((opt) => (
                      <div key={opt.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                        <RadioGroupItem value={opt.id} id={`p-${opt.id}`} className="mt-1 border-white/30 text-primary" />
                        <Label htmlFor={`p-${opt.id}`} className="flex flex-col cursor-pointer">
                          <span className="text-sm font-bold group-hover:text-primary transition-colors">{opt.label}</span>
                          <span className="text-xs text-muted-foreground">{opt.desc}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <Separator className="bg-white/10" />

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <Checkbox 
                      id="allow-threads" 
                      checked={allowThreads} 
                      onCheckedChange={(val) => setAllowThreads(!!val)}
                      className="mt-1 border-white/30"
                    />
                    <div className="space-y-1">
                      <Label htmlFor="allow-threads" className="text-sm font-bold cursor-pointer">Allow threads</Label>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">Everyone can reply to messages regardless of posting permissions.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <Checkbox 
                      id="allow-mentions" 
                      checked={allowMentions} 
                      onCheckedChange={(val) => setAllowMentions(!!val)}
                      className="mt-1 border-white/30"
                    />
                    <div className="space-y-1">
                      <Label htmlFor="allow-mentions" className="text-sm font-bold cursor-pointer">Allow global mentions</Label>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">Permit use of @everyone, @here, and @channel in this workspace.</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-4">
                  <Button variant="ghost" onClick={() => setIsEditingPermissions(false)} className="text-xs font-bold uppercase tracking-widest px-6 h-11">Cancel</Button>
                  <Button 
                    onClick={() => {
                      setIsEditingPermissions(false);
                      toast({ title: "Permissions Saved", description: "Channel rules updated successfully." });
                    }} 
                    className="bg-primary text-white text-xs font-bold uppercase tracking-widest px-8 h-11 rounded-xl shadow-lg shadow-primary/20"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              <div className="min-h-[300px]">
                {activeDialogTab === 'settings' && (
                  <div className="space-y-4 animate-in fade-in duration-300 pb-4">
                    {/* Channel Name */}
                    <div className="bg-white/5 rounded-xl border border-white/10 p-5 group flex flex-col gap-2">
                      <div className="flex justify-between items-center w-full relative">
                         <h4 className="font-bold text-[15px] text-white tracking-wide">Channel name</h4>
                         {!isEditingName && canManageMembers && (
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             onClick={() => { setIsEditingName(true); setEditNameValue(activeItem?.name || ''); }}
                             className="text-primary hover:text-primary hover:bg-primary/10 h-6 px-2 text-[13px] font-bold"
                           >
                             Edit
                           </Button>
                         )}
                      </div>
                      
                      {isEditingName ? (
                        <div className="flex items-center gap-2 mt-2">
                          <Input 
                            value={editNameValue} 
                            onChange={e => setEditNameValue(e.target.value)} 
                            className="h-8 bg-black/40 border-white/20 text-sm focus-visible:ring-primary/50"
                            autoFocus
                            onKeyDown={e => e.key === 'Enter' && handleRenameChannel()}
                          />
                          <Button 
                            size="sm" 
                            onClick={handleRenameChannel} 
                            disabled={isUpdatingChannel}
                            className="h-8 bg-primary hover:bg-primary/90 text-white font-bold"
                          >
                            {isUpdatingChannel ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setIsEditingName(false)} 
                            className="h-8 hover:bg-white/10"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="text-sm text-white/80 flex items-center gap-1.5 font-medium -mt-1 transition-all">
                          {activeItem?.is_private ? <Lock className="w-3.5 h-3.5 opacity-80" /> : <Hash className="w-3.5 h-3.5 opacity-80" />}
                          {activeItem?.name}
                        </div>
                      )}
                    </div>

                    {/* Huddles */}
                    <div className="bg-white/5 rounded-xl border border-white/10 p-5 flex flex-col gap-2">
                      <div className="flex justify-between items-center w-full">
                         <h4 className="font-bold text-[15px] text-white tracking-wide">Huddles</h4>
                         <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-white cursor-pointer" />
                      </div>
                      <p className="text-[13px] text-white/80 font-medium">Members can start and join huddles in this channel. <span className="text-primary hover:underline cursor-pointer">Learn more</span></p>
                      
                      <div className="flex items-center gap-3 mt-3">
                         <Button 
                           variant="outline" 
                           onClick={() => { if (onToggleHuddle) onToggleHuddle(); setIsMemberListOpen(false); }}
                           className="h-9 bg-transparent border-white/20 hover:bg-white/10 text-white font-bold text-[13px] rounded-lg gap-2 px-3"
                         >
                           <Headphones className="w-4 h-4" /> Start Huddle
                         </Button>
                         <Button 
                           variant="outline" 
                           onClick={copyHuddleLinkLocal}
                           className="h-9 bg-transparent border-white/20 hover:bg-white/10 text-white font-bold text-[13px] rounded-lg gap-2 px-3"
                         >
                           <LinkIcon className="w-4 h-4" /> Copy Huddle Link
                         </Button>
                      </div>
                    </div>

                    {/* Tabs Permission */}
                    <div className="bg-white/5 rounded-xl border border-white/10 p-5 flex flex-col gap-3">
                      <h4 className="font-bold text-[15px] text-white tracking-wide">Choose who can add, remove, and reorder tabs</h4>
                      <div className="relative mt-1 group">
                        <select 
                          disabled={!canManageMembers}
                          onChange={(e) => toast({ title: "Permissions Updated", description: "Tab permissions saved." })}
                          className="w-[180px] appearance-none bg-[#1a1d21] border border-white/20 text-white text-[13px] font-medium pl-3 pr-9 py-2 rounded-lg group-hover:border-white/40 focus:outline-none focus:border-white/50 cursor-pointer transition-colors disabled:opacity-50"
                        >
                          <option value="owner">Channel owner</option>
                          <option value="admin">Admins</option>
                          <option value="everyone">Everyone</option>
                        </select>
                        <ChevronDown className="absolute left-[150px] top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 pointer-events-none group-hover:text-white" />
                      </div>
                    </div>

                    {/* Meta Actions (Change Public / Archive) */}
                    <div className="bg-white/5 rounded-xl border border-white/10 flex flex-col overflow-hidden">
                      <div className="flex justify-between items-center p-5 border-b border-white/10 group">
                        <div className="flex gap-3">
                          <Hash className="w-5 h-5 text-white/80 mt-0.5 shrink-0" />
                          <div className="flex flex-col gap-0.5">
                             <h4 className="font-bold text-[15px] text-white/90">Change to a {activeItem?.is_private ? 'public' : 'private'} channel</h4>
                             <p className="text-[13px] text-muted-foreground font-medium">
                               {canManageMembers 
                                 ? `You can change this channel to be ${activeItem?.is_private ? 'public' : 'private'}.` 
                                 : `You don't have permission to change this channel.`}
                             </p>
                          </div>
                        </div>
                        {canManageMembers && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={isUpdatingChannel}
                            onClick={handleTogglePublic}
                            className="border-white/20 hover:bg-white/10 text-white"
                          >
                            {isUpdatingChannel ? <Loader2 className="w-4 h-4 animate-spin" /> : "Change"}
                          </Button>
                        )}
                      </div>
                      
                      <div 
                        className={cn("flex items-center gap-3 p-5 transition-colors border-b border-white/5", canManageMembers ? "cursor-pointer hover:bg-destructive/10 group" : "opacity-50 cursor-not-allowed")}
                        onClick={() => canManageMembers && handleArchiveChannel()}
                      >
                        <Archive className={cn("w-5 h-5 transition-colors", canManageMembers ? "text-red-400 group-hover:text-red-300" : "text-muted-foreground")} />
                        <span className={cn("font-bold text-[15px] transition-colors", canManageMembers ? "text-red-400 group-hover:text-red-300" : "text-muted-foreground")}>
                          Archive channel for everyone
                        </span>
                      </div>

                      <div 
                        className={cn("flex items-center gap-3 p-5 transition-colors rounded-b-xl", canManageMembers ? "cursor-pointer hover:bg-destructive/10 group" : "opacity-50 cursor-not-allowed")}
                        onClick={() => canManageMembers && handleDeleteChannel()}
                      >
                        <Trash2 className={cn("w-5 h-5 transition-colors", canManageMembers ? "text-red-500 group-hover:text-red-400" : "text-muted-foreground")} />
                        <span className={cn("font-bold text-[15px] transition-colors", canManageMembers ? "text-red-500 group-hover:text-red-400" : "text-muted-foreground")}>
                          Delete channel
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeDialogTab === 'members' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Find members" 
                          value={memberSearch}
                          onChange={e => setMemberSearch(e.target.value)}
                          className="pl-9 bg-white/5 border-white/10 h-10" 
                        />
                      </div>
                      <Button 
                        onClick={copyInviteLink}
                        className="h-10 px-4 bg-primary text-white hover:bg-primary/90 flex items-center gap-2 font-bold"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy Link'}
                      </Button>
                    </div>
                    <ScrollArea className="h-[280px]">
                      {isLoadingMembers ? (
                        <div className="flex justify-center p-8 text-white/50"><Loader2 className="w-5 h-5 animate-spin"/></div>
                      ) : (
                        <div className="flex flex-col gap-1 pr-3 pb-4">
                          {/* Members in the channel */}
                          {filteredMembers.map(m => (
                            <div key={m.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 group border border-transparent">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8 rounded-lg">
                                  {m.avatar.includes('http') ? (
                                    <AvatarImage src={m.avatar} />
                                  ) : (
                                    <div className="w-full h-full" style={{ background: m.avatar || 'linear-gradient(to right, #2b5876, #4e4376)' }} />
                                  )}
                                  <AvatarFallback>{m.name?.[0]}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-bold">{m.name}</span>
                              </div>
                              {canManageMembers && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Remove Member"
                                  onClick={() => handleRemoveMember(m.id)}
                                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity h-8 text-xs px-2"
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                          ))}

                          {/* Workspace users available to invite */}
                          {!isDm && workspaceUsers.length > 0 && (
                            <>
                              <div className="mt-4 mb-2 px-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block">Available in Workspace</Label>
                              </div>
                              {isSearchingUsers ? (
                                <div className="flex justify-center p-4 text-white/30"><Loader2 className="w-4 h-4 animate-spin"/></div>
                              ) : (
                                workspaceUsers.map(u => (
                                  <div key={u.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 group border border-transparent hover:border-white/5 transition-all">
                                    <div className="flex items-center gap-3">
                                      <Avatar className="w-8 h-8 rounded-lg shadow-sm">
                                        {u.avatar_gradient && u.avatar_gradient.includes('http') ? (
                                          <AvatarImage src={u.avatar_gradient} />
                                        ) : (
                                          <div className="w-full h-full" style={{ background: u.avatar_gradient || 'linear-gradient(to right, #2b5876, #4e4376)' }} />
                                        )}
                                        <AvatarFallback>{u.display_name?.[0] || u.username?.[0]}</AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="text-sm font-bold text-white leading-tight">{u.display_name || u.username}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{u.role || 'Member'}</p>
                                      </div>
                                    </div>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      disabled={invitingUserId === u.id}
                                      onClick={() => handleInviteUser(u)}
                                      className="bg-white/10 hover:bg-primary hover:text-white text-xs h-8 px-4 rounded-lg font-bold transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                      {invitingUserId === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Add'}
                                    </Button>
                                  </div>
                                ))
                              )}
                            </>
                          )}
                          
                          {filteredMembers.length === 0 && workspaceUsers.length === 0 && !isLoadingMembers && !isSearchingUsers && (
                            <div className="text-center p-8 text-muted-foreground text-xs font-bold opacity-60">No users found.</div>
                          )}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                )}

                {activeDialogTab === 'integrations' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6">
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm font-bold text-white">Recommended for your team</p>
                          <p className="text-[11px] text-muted-foreground">Boost productivity with these essential tools.</p>
                        </div>
                      </div>
                    </div>
                    
                    <ScrollArea className="h-[300px] pr-4">
                      <div className="grid gap-3">
                        {mockIntegrations.map((app) => (
                          <div key={app.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/[0.07] transition-all group">
                            <div className="flex items-center gap-4">
                              <div className={cn("w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5 group-hover:scale-105 transition-transform", app.color)}>
                                <app.icon className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-white mb-0.5">{app.name}</p>
                                <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">{app.desc}</p>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/10 hover:text-primary"
                            >
                              Connect
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <div className="pt-4 flex justify-center">
                      <Button variant="link" className="text-[11px] text-muted-foreground hover:text-white uppercase tracking-widest font-bold">
                        Browse all integrations
                      </Button>
                    </div>
                  </div>
                )}

                {activeDialogTab === 'about' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 block">Channel Name</Label>
                        <div className="flex items-center gap-2 text-white font-bold p-3 bg-white/5 rounded-xl border border-white/10">
                          <Hash className="w-4 h-4 text-muted-foreground" />
                          {activeItem?.name}
                        </div>
                      </div>
                      <div>
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 block">Topic</Label>
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-sm text-[#d1d2d3]">
                          {activeItem?.topic || "This channel is for collaborative engineering and development discussions."}
                        </div>
                      </div>
                      <div>
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 block">Created By</Label>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Avatar className="w-6 h-6 rounded">
                            <AvatarImage src="https://picsum.photos/seed/alex/100/100" />
                            <AvatarFallback>A</AvatarFallback>
                          </Avatar>
                          <span>Alex Rivera on March 15, 2026</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

import { LogOut } from 'lucide-react';
