'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Settings,
  Users, UserPlus, MessageSquare, Maximize2, MoreVertical,
  X, Send, Copy, Check, Loader2, Link as LinkIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser, client } from '@/database';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from '@/components/ui/separator';

interface HuddleMeetingProps {
  workspaceId: string;
  channelId: string;
  channelName?: string;
  onLeave: () => void;
}

export const HuddleMeeting: React.FC<HuddleMeetingProps> = ({ 
  workspaceId, 
  channelId, 
  channelName, 
  onLeave 
}) => {
  const { user } = useUser();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  // Real-time huddle presence using Data Connect client
  const { data: presenceList = [], isLoading: isPresenceLoading } = client.huddlePresence.useQuery({ 
    variables: { channelId } 
  });

  // Fetch all members for invitation
  const { data: allUsers = [], isLoading: isUsersLoading } = client.user.useQuery({});

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions to use huddles.',
        });
      }
    };
    
    getCameraPermission();
    
    // Join huddle via Data Connect
    if (user) {
      client.huddlePresence.join({ variables: { userId: user.uid, channelId } });
    }
    
    return () => {
      // Leave huddle via Data Connect
      if (user) {
        client.huddlePresence.leave({ variables: { userId: user.uid, channelId } });
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [user, channelId, toast]);

  const copyInviteLink = () => {
    const link = `${window.location.origin}/join/huddle/${channelId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast({ title: "Link Copied", description: "Invitation link ready." });
    setTimeout(() => setCopied(false), 2000);
  };

  const participants = useMemo(() => {
    return presenceList.map((p: any) => ({
      id: p.userId,
      displayName: p.userId === user?.uid ? 'You (Me)' : `Dev ${p.userId.slice(0, 4)}`,
      avatarUrl: `https://picsum.photos/seed/${p.userId}/100/100`
    }));
  }, [presenceList, user]);

  const invitees = useMemo(() => {
    return allUsers.filter((u: any) => 
      u.id !== user?.uid && !participants.some(p => p.id === u.id)
    );
  }, [allUsers, participants, user]);

  const handleInviteUser = (targetUser: any) => {
    toast({
      title: "Invitation Sent",
      description: `Pinging ${targetUser.displayName} to join the huddle.`,
    });
  };

  return (
    <div className="absolute inset-0 z-40 bg-[#070608] flex flex-col p-4 animate-in fade-in duration-500 overflow-hidden text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 bg-black">
        <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-primary/20 rounded-full blur-[160px] animate-blob-extreme opacity-40" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-blue-500/10 rounded-full blur-[140px] animate-blob-extreme animation-delay-4000 opacity-30" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-6 px-2 shrink-0">
          <div className="flex flex-col text-left">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              #{channelName || 'general'} Huddle
            </h2>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40">
              <Users className="w-3 h-3" />
              <span>{participants.length} CONNECTED</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white/5 border-white/10 hover:bg-white/10 text-white font-bold text-xs gap-2 h-9 px-4 rounded-xl">
                  <UserPlus className="w-4 h-4" />
                  Invite
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 bg-[#1a1d21] border-white/10 p-0 shadow-2xl text-white">
                <div className="p-4 bg-black/20">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white/60 mb-1">Invite to huddle</h3>
                  <p className="text-[10px] text-muted-foreground">Share the link or ping workspace members</p>
                </div>
                
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-white/40">Huddle Link</p>
                    <div className="flex gap-2">
                      <Input 
                        readOnly 
                        value={`${window.location.origin}/h/${channelId}`} 
                        className="h-8 text-[10px] bg-black/40 border-white/10 text-white/60 font-mono"
                      />
                      <Button size="icon" variant="ghost" onClick={copyInviteLink} className="h-8 w-8 text-primary hover:bg-primary/10">
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>

                  <Separator className="bg-white/5" />

                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-white/40">Workspace Members</p>
                    <ScrollArea className="h-48 pr-2">
                      {invitees.length > 0 ? (
                        <div className="space-y-2">
                          {invitees.map((invitee: any) => (
                            <div key={invitee.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 group transition-colors">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-7 h-7">
                                  <AvatarImage src={invitee.profilePictureUrl} />
                                  <AvatarFallback className="text-[10px]">{invitee.displayName[0]}</AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-bold truncate max-w-[100px]">{invitee.displayName}</span>
                              </div>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleInviteUser(invitee)}
                                className="h-7 px-3 text-[10px] font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100"
                              >
                                Ping
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                          <Users className="w-8 h-8 text-white/10 mb-2" />
                          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">No member</p>
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex-1 flex min-h-0 gap-4 overflow-hidden">
          <div className="flex-1 min-h-0 w-full overflow-y-auto scrollbar-hide">
            <div className={cn(
              "grid gap-4 h-full transition-all duration-500",
              isChatOpen ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            )}>
              {/* Local Participant Tile */}
              <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl group min-h-[300px]">
                 <video 
                    ref={videoRef} 
                    className={cn(
                      "w-full h-full object-cover scale-x-[-1] transition-opacity duration-1000", 
                      (isVideoOff || hasCameraPermission === false) ? "opacity-0" : "opacity-100"
                    )} 
                    autoPlay 
                    muted 
                    playsInline 
                 />
                 {(isVideoOff || hasCameraPermission === false) && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                      <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10 mb-4 animate-pulse">
                        <VideoOff className="w-8 h-8 text-white/20" />
                      </div>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">
                        {hasCameraPermission === false ? 'No Camera' : 'Video Muted'}
                      </p>
                   </div>
                 )}
                 <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-black text-white uppercase tracking-wider">
                   {isMuted && <MicOff className="w-3.5 h-3.5 text-destructive" />}
                   <span>YOU (ME)</span>
                 </div>
              </div>

              {/* Remote Participant Grid */}
              {participants.filter(p => p.id !== user?.uid).map((p) => (
                <div key={p.id} className="relative bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 flex flex-col items-center justify-center p-8 space-y-4 min-h-[300px]">
                  <div className="relative">
                    <Avatar className="w-24 h-24 border-4 border-white/5">
                      <AvatarImage src={p.avatarUrl} />
                      <AvatarFallback className="text-2xl">{p.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-[#070608] flex items-center justify-center">
                      <Mic className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <p className="font-black text-[10px] text-white uppercase tracking-widest">{p.displayName}</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Connected</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {isChatOpen && (
            <div className="w-80 bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 flex flex-col animate-in slide-in-from-right duration-500 shadow-2xl">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-white/80">Huddle Chat</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(false)} className="h-8 w-8 text-white/40">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <ScrollArea className="flex-1 p-4 text-left">
                <div className="space-y-4">
                  <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-widest py-4 border-b border-white/5">Huddle Started</p>
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-black text-primary uppercase">Dev Bot</p>
                    <p className="text-xs text-white/80 bg-white/5 p-3 rounded-lg">Welcome to the huddle! Share your thoughts or screen with the team.</p>
                  </div>
                </div>
              </ScrollArea>
              <div className="p-4 border-t border-white/5">
                <div className="relative">
                  <Input 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..." 
                    className="bg-black/20 border-white/10 h-11 pr-10 text-sm rounded-xl" 
                  />
                  <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-9 w-9 text-primary">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Meeting Controls */}
        <div className="mt-8 flex items-center justify-center gap-4 py-4 px-8 bg-white/5 backdrop-blur-3xl rounded-3xl border border-white/10 shadow-2xl mx-auto max-w-fit shrink-0 mb-4 animate-in slide-in-from-bottom-10 duration-700">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsMuted(!isMuted)}
            className={cn(
              "w-12 h-12 rounded-2xl transition-all shadow-xl",
              isMuted 
                ? "bg-destructive text-white hover:bg-destructive/90" 
                : "bg-white/5 text-white hover:bg-white/10"
            )}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={cn(
              "w-12 h-12 rounded-2xl transition-all shadow-xl",
              isVideoOff 
                ? "bg-destructive text-white hover:bg-destructive/90" 
                : "bg-white/5 text-white hover:bg-white/10"
            )}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </Button>
          
          <div className="w-px h-8 bg-white/10 mx-2" />

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={cn(
              "w-12 h-12 rounded-2xl transition-all shadow-xl",
              isChatOpen 
                ? "bg-primary text-white shadow-primary/20" 
                : "bg-white/5 text-white hover:bg-white/10"
            )}
          >
            <MessageSquare className="w-5 h-5" />
          </Button>

          <Button 
            variant="destructive" 
            onClick={onLeave}
            className="h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] gap-3 shadow-destructive/20 ml-4 hover:bg-red-600 transition-all active:scale-95"
          >
            <PhoneOff className="w-4 h-4 fill-current" />
            End Huddle
          </Button>
        </div>
      </div>
    </div>
  );
};
