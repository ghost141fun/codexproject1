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
];

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
                <DropdownMenuContent align="end" className="w-64 bg-[#1a1d21] border-white/10 text-white shadow-2xl p-1.5">
                  <DropdownMenuItem 
                    onClick={() => {
                      setIsMemberListOpen(true);
                      setActiveDialogTab('about');
                    }}
                    className="gap-2 py-2 cursor-pointer focus:bg-white/10 rounded-sm"
                  >
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
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-white/5 rounded-xl p-5 border border-white/10 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary/40" />
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-white">Posting permissions</h4>
                          <p className="text-[11px] text-muted-foreground">Control who can send messages and use mentions.</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setIsEditingPermissions(true)}
                          className="h-8 text-xs text-primary font-bold hover:bg-primary/10"
                        >
                          Edit
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Check className="w-3.5 h-3.5 text-green-500" />
                          <span>Everyone except guests can post</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Check className="w-3.5 h-3.5 text-green-500" />
                          <span>Thread replies are enabled for all</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 flex flex-col gap-2">
                      <Button 
                        variant="ghost" 
                        onClick={handleLeaveChannel}
                        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 gap-3 text-xs font-bold h-12"
                      >
                        <LogOut className="w-4 h-4" />
                        Leave Channel
                      </Button>
                    </div>
                  </div>
                )}
                
                {activeDialogTab === 'members' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Find members" className="pl-9 bg-white/5 border-white/10 h-10" />
                    </div>
                    <ScrollArea className="h-[250px]">
                      {filteredMembers.map(m => (
                        <div key={m.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 group">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8 rounded-lg">
                              <AvatarImage src={m.avatar} />
                              <AvatarFallback>{m.name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-bold">{m.name}</span>
                          </div>
                        </div>
                      ))}
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
