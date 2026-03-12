
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
  HelpCircle
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

const mockMembers = [
  { id: '1', name: 'Alex Rivera', role: 'Senior Software Engineer', avatar: 'https://picsum.photos/seed/alex/100/100', status: 'online' },
  { id: '2', name: 'Sarah Chen', role: 'Staff Engineer', avatar: 'https://picsum.photos/seed/sarah/100/100', status: 'online' },
  { id: '3', name: 'Marcus Bell', role: 'DevOps', avatar: 'https://picsum.photos/seed/marcus/200/200', status: 'offline' },
  { id: '4', name: 'Elena Rodriguez', role: 'Designer', avatar: 'https://picsum.photos/seed/elena/200/200', status: 'online' },
  { id: '5', name: 'David Kim', role: 'Backend Lead', avatar: 'https://picsum.photos/seed/david/200/200', status: 'away' },
  { id: '6', name: 'Jordan Smith', role: 'Frontend Developer', avatar: 'https://picsum.photos/seed/jordan/100/100', status: 'online' },
  { id: '7', name: 'Taylor Lee', role: 'Product Manager', avatar: 'https://picsum.photos/seed/taylor/100/100', status: 'online' },
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
  const { toast } = useToast();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMemberListOpen, setIsMemberListOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeDialogTab, setActiveDialogTab] = useState<'about' | 'members' | 'integrations' | 'settings'>('members');

  // Permission Editor State
  const [isEditingPermissions, setIsEditingPermissions] = useState(false);
  const [postingRule, setPostingRule] = useState('guests');
  const [allowThreads, setAllowThreads] = useState(true);
  const [allowMentions, setAllowMentions] = useState(true);

  const isDm = activeItem?.type === 'dm';

  const filteredMembers = useMemo(() => {
    return mockMembers.filter(m => 
      m.name.toLowerCase().includes(memberSearch.toLowerCase()) || 
      m.role.toLowerCase().includes(memberSearch.toLowerCase())
    );
  }, [memberSearch]);

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

  const handleInviteUser = (name: string) => {
    toast({
      title: "Invitation Sent",
      description: `We've sent an invitation to ${name} to join this channel.`,
    });
  };

  const handleIntegrationAction = (serviceName: string, action: string) => {
    toast({
      title: `${serviceName} Integration`,
      description: `Initiating ${action.toLowerCase()} for ${serviceName}. Please follow the authentication prompts.`,
    });
  };

  const handleEditPermissions = () => {
    setIsEditingPermissions(true);
  };

  const handleLeaveChannel = () => {
    if (activeItem && onLeaveChannel) {
      onLeaveChannel(activeItem.id);
    }
    toast({
      title: "Channel Update",
      description: `You have successfully left the #${activeItem?.name} channel.`,
      variant: "destructive"
    });
    setIsMemberListOpen(false);
  };

  const handleAdvancedSettings = () => {
    toast({
      title: "Advanced Settings",
      description: "Loading advanced configuration options for this channel...",
    });
  };

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

      {/* Channel Header */}
      {!activeItem && (activeView === 'home' || activeView === 'dms') ? (
        <header className="h-14 flex items-center px-4 border-b border-white/5 bg-[#1a1d21]">
          <span className="text-muted-foreground animate-pulse text-sm">Select a conversation...</span>
        </header>
      ) : (
        (activeView === 'home' || activeView === 'dms') && activeItem && (
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
                <div 
                  onClick={() => setIsMemberListOpen(true)}
                  className="flex -space-x-2 mr-4 hidden sm:flex cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {[1, 2, 3].map((i) => (
                    <Avatar key={i} className="w-6 h-6 border-2 border-[#1a1d21] rounded">
                      <AvatarImage src={`https://picsum.photos/seed/${i + 20}/100/100`} />
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
                    <DropdownMenuItem 
                      onClick={() => {
                        setIsMemberListOpen(true);
                        setActiveDialogTab('about');
                        setIsEditingPermissions(false);
                      }}
                      className="gap-2 py-2 cursor-pointer focus:bg-white/10 rounded-sm"
                    >
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
                          <DropdownMenuItem className="cursor-pointer focus:bg-white/10" onClick={copyInviteLink}>Copy link</DropdownMenuItem>
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

      {/* Redesigned Member List / Channel Details Dialog */}
      <Dialog open={isMemberListOpen} onOpenChange={setIsMemberListOpen}>
        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden bg-[#1a1d21] border-white/10 text-white">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center justify-between mb-4">
              <DialogTitle className="text-2xl font-black flex items-center gap-2">
                <Hash className="w-6 h-6 text-muted-foreground" />
                {isEditingPermissions ? "Posting permissions" : activeItem?.name}
              </DialogTitle>
              {isEditingPermissions && (
                <Button variant="ghost" size="icon" onClick={() => setIsEditingPermissions(false)} className="h-8 w-8 text-muted-foreground hover:text-white">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            {!isEditingPermissions && (
              <>
                <div className="flex items-center gap-2 mb-6">
                  <Star className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-yellow-400" />
                  <Button variant="outline" size="sm" className="bg-[#1a1d21] border-white/10 text-white hover:bg-white/5 h-8 gap-2">
                    <Bell className="w-4 h-4" />
                    All new posts
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onToggleHuddle}
                    className="bg-[#1a1d21] border-white/10 text-white hover:bg-white/5 h-8 gap-2"
                  >
                    <Headphones className="w-4 h-4" />
                    Huddle
                  </Button>
                </div>

                <DialogDescription className="sr-only">
                  Channel details, members, and settings for {activeItem?.name}
                </DialogDescription>

                {/* Tabs Row */}
                <div className="flex border-b border-white/10">
                  {[
                    { id: 'about', label: 'About' },
                    { id: 'members', label: `Members ${mockMembers.length + 5}` },
                    { id: 'integrations', label: 'Integrations' },
                    { id: 'settings', label: 'Settings' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveDialogTab(tab.id as any)}
                      className={cn(
                        "px-4 py-2 text-xs font-bold transition-colors border-b-2 relative -mb-[2px]",
                        activeDialogTab === tab.id 
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
          </DialogHeader>

          <div className="p-6">
            {isEditingPermissions ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <p className="text-sm font-bold text-white/90">Who can post in this channel?</p>
                  <RadioGroup value={postingRule} onValueChange={setPostingRule} className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="everyone" id="p-everyone" className="border-white/30 text-primary" />
                      <Label htmlFor="p-everyone" className="text-sm font-medium cursor-pointer">Everyone</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="guests" id="p-guests" className="border-white/30 text-primary" />
                      <Label htmlFor="p-guests" className="text-sm font-medium cursor-pointer">Everyone, except guests</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="specific" id="p-specific" className="border-white/30 text-primary" />
                      <Label htmlFor="p-specific" className="text-sm font-medium cursor-pointer">You, and specific people</Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator className="bg-white/10" />

                <div className="space-y-6">
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      id="allow-threads" 
                      checked={allowThreads} 
                      onCheckedChange={(val) => setAllowThreads(!!val)}
                      className="mt-1 border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <div className="space-y-1">
                      <Label htmlFor="allow-threads" className="text-sm font-bold leading-none cursor-pointer">Allow threads</Label>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Everyone will be able to add replies to messages posted in this channel, regardless of overall posting permissions
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox 
                      id="allow-mentions" 
                      checked={allowMentions} 
                      onCheckedChange={(val) => setAllowMentions(!!val)}
                      className="mt-1 border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <div className="space-y-1">
                      <Label htmlFor="allow-mentions" className="text-sm font-bold leading-none cursor-pointer">Allow @everyone, @here and @channel mentions</Label>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        <span className="font-bold">@everyone</span> notifies every person in the #{activeItem?.name} channel, <span className="font-bold">@channel</span> notifies all members of a channel, and <span className="font-bold">@here</span> notifies members of a channel who are active at that moment. <button className="text-[#36C5F0] hover:underline">how mentions work.</button> <span className="font-bold">Note:</span> Because of your workspace settings, only people who have permission can use @here and @channel.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsEditingPermissions(false)} className="bg-black/20 border-white/10 hover:bg-white/5 text-sm font-bold px-6">
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsEditingPermissions(false);
                      toast({ title: "Permissions saved", description: "Channel posting rules have been updated." });
                    }} 
                    className="bg-[#35373b] hover:bg-[#4a4d52] text-white border-none text-sm font-bold px-6"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {activeDialogTab === 'members' && (
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Find members"
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        className="pl-9 bg-transparent border-white/10 h-10 focus-visible:ring-primary/40 focus-visible:border-primary/50"
                      />
                    </div>
                    
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-1">
                        <Button 
                          variant="ghost" 
                          onClick={() => {
                            setIsMemberListOpen(false);
                            setIsInviteOpen(true);
                          }}
                          className="w-full justify-start gap-3 h-12 text-sm font-bold text-white hover:bg-white/5 mb-2"
                        >
                          <div className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center">
                            <UserPlus className="w-4 h-4 text-primary" />
                          </div>
                          Add people
                        </Button>

                        {filteredMembers.map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-all group cursor-pointer">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <Avatar className="w-8 h-8 rounded-md border border-white/5">
                                  <AvatarImage src={member.avatar} />
                                  <AvatarFallback className="rounded-md font-bold text-xs">{member.name[0]}</AvatarFallback>
                                </Avatar>
                                <div className={cn(
                                  "absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-[#1a1d21]",
                                  member.status === 'online' ? "bg-green-500" : member.status === 'away' ? "bg-yellow-500" : "bg-white/20"
                                )} />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold group-hover:text-primary transition-colors">{member.name}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {activeDialogTab === 'about' && (
                  <div className="space-y-6 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-bold text-white">Description</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {activeItem?.description || "No description set for this channel."}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Created by</span>
                        <p className="font-medium">Alex Rivera</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Created on</span>
                        <p className="font-medium">October 12, 2023</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeDialogTab === 'integrations' && (
                  <ScrollArea className="h-[350px]">
                    <div className="space-y-4">
                      {[
                        { name: 'GitHub', desc: 'Sync PRs and issues', icon: Puzzle, color: 'text-primary' },
                        { name: 'Jira Cloud', desc: 'Manage tickets and sprints', icon: Layout, color: 'text-blue-400' },
                        { name: 'Zoom Meetings', desc: 'Auto-generate call links', icon: Video, color: 'text-cyan-400' },
                        { name: 'Linear', desc: 'Issue tracking for teams', icon: Workflow, color: 'text-indigo-400' },
                        { name: 'Sentry', desc: 'Error monitoring', icon: AlertTriangle, color: 'text-red-500' },
                        { name: 'CircleCI', desc: 'CI/CD pipeline', icon: RefreshCw, color: 'text-green-400' },
                        { name: 'Figma', desc: 'Collaborative design', icon: Palette, color: 'text-purple-400' },
                        { name: 'Trello', desc: 'Project management', icon: TrelloIcon, color: 'text-blue-500' },
                        { name: 'Notion', desc: 'Notes and docs', icon: BookOpen, color: 'text-white' },
                        { name: 'Datadog', desc: 'Cloud monitoring', icon: Activity, color: 'text-purple-500' },
                        { name: 'PagerDuty', desc: 'Incident response', icon: BellRing, color: 'text-green-500' },
                        { name: 'Confluence', desc: 'Team documentation', icon: FileText, color: 'text-blue-400' },
                        { name: 'Asana', desc: 'Project management', icon: CheckSquare, color: 'text-red-400' }
                      ].map((item) => (
                        <div key={item.name} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between group hover:bg-white/10 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform", item.color)}>
                              <item.icon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold text-sm">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.desc}</p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 border-white/10 hover:bg-white/5"
                            onClick={() => handleIntegrationAction(item.name, 'Configure')}
                          >
                            Configure
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {activeDialogTab === 'settings' && (
                  <ScrollArea className="h-[350px] pr-4 scrollbar-hide">
                    <div className="space-y-6">
                      {/* Posting Permissions */}
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-sm text-white">Posting permissions</h4>
                          <button 
                            onClick={handleEditPermissions}
                            className="text-xs text-primary font-bold hover:underline"
                          >
                            Edit
                          </button>
                        </div>
                        <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
                          <li>Everyone except guests can post</li>
                          <li>Everyone can reply to messages</li>
                          <li>Because of your workspace settings, only people who have permission can use @everyone mentions</li>
                        </ul>
                      </div>

                      {/* Huddles */}
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-sm text-white">Huddles</h4>
                          <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                          Members can start and join huddles in this channel.
                        </p>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 bg-black/20 border-white/10 gap-2 text-[11px] font-bold"
                            onClick={() => {
                              onToggleHuddle();
                              setIsMemberListOpen(false);
                            }}
                          >
                            <Headphones className="w-3.5 h-3.5" />
                            Start Huddle
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 bg-black/20 border-white/10 gap-2 text-[11px] font-bold"
                            onClick={() => {
                              const link = `https://devtalk.app/huddle/${activeItem?.id || 'general'}`;
                              navigator.clipboard.writeText(link);
                              toast({ title: "Link Copied", description: "Huddle link is ready." });
                            }}
                          >
                            <LinkIcon className="w-3.5 h-3.5" />
                            Copy Link
                          </Button>
                        </div>
                      </div>

                      {/* Tab Management */}
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <h4 className="font-bold text-sm text-white mb-4">Choose who can manage tabs</h4>
                        <Select 
                          defaultValue="owner"
                          onValueChange={(val) => {
                            toast({ title: "Permissions Updated", description: `Tab management restricted to ${val}.` });
                          }}
                        >
                          <SelectTrigger className="w-full bg-black/20 border-white/10 h-10 text-xs">
                            <SelectValue placeholder="Select permission" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1d21] border-white/10 text-white">
                            <SelectItem value="everyone">Everyone</SelectItem>
                            <SelectItem value="owner">Channel owner</SelectItem>
                            <SelectItem value="admins">Workspace admins</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="pt-4 space-y-2">
                        <Button 
                          variant="ghost" 
                          onClick={handleLeaveChannel}
                          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 gap-3 text-xs font-bold"
                        >
                          <EyeOff className="w-4 h-4" />
                          Leave Channel
                        </Button>
                      </div>
                    </div>
                  </ScrollArea>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-[#1a1d21] border-white/10 text-white">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-xl font-black">Invite people to {activeItem?.name}</DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Invite via Link</label>
              <div className="flex gap-2">
                <Input 
                  readOnly 
                  value={`https://devtalk.app/join/${activeItem?.id || 'general'}`}
                  className="bg-white/5 border-white/10 text-sm focus-visible:ring-primary/40"
                />
                <Button 
                  onClick={copyInviteLink} 
                  variant="secondary" 
                  className="shrink-0 bg-primary/20 text-primary hover:bg-primary/30"
                >
                  {copied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Workspace Members</label>
              <ScrollArea className="h-40 rounded-md border border-white/5 p-2">
                <div className="space-y-1">
                  {mockMembers.slice(0, 4).map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-2 rounded hover:bg-white/5 group">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8 rounded border border-white/10">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>{member.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{member.name}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary text-xs hover:bg-primary/10"
                        onClick={() => handleInviteUser(member.name)}
                      >
                        Invite
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Profile Dialog */}
      {isDm && (
        <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-[#1a1d21] border-white/10 text-white">
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
