
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, Settings, 
  Users, UserPlus, MessageSquare, Maximize2, MoreVertical,
  X, Send, Copy, Check, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser, useFirestore, useDoc, useCollection, useMemoDatabase } from '@/database';
import { doc, setDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/database/non-blocking-updates';

interface HuddleMeetingProps {
  workspaceId: string;
  channelId: string;
  channelName?: string;
  onLeave: () => void;
}

interface Participant {
  id: string;
  displayName: string;
  avatarUrl: string;
}

export const HuddleMeeting: React.FC<HuddleMeetingProps> = ({ 
  workspaceId, 
  channelId, 
  channelName, 
  onLeave 
}) => {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  // Firestore Huddle Document
  const huddleRef = useMemoDatabase(() => {
    if (!db || !workspaceId || !channelId) return null;
    return doc(db, 'workspaces', workspaceId, 'channels', channelId, 'huddle', 'active');
  }, [db, workspaceId, channelId]);

  const { data: huddleData, isLoading: isHuddleLoading } = useDoc(huddleRef);

  // Fetch profiles for all participants
  const participantsQuery = useMemoDatabase(() => {
    if (!db || !huddleData?.participantIds || huddleData.participantIds.length === 0) return null;
    return query(collection(db, 'userProfiles'), where('id', 'in', huddleData.participantIds));
  }, [db, huddleData?.participantIds]);

  const { data: participantsProfiles, isLoading: isProfilesLoading } = useCollection<Participant>(participantsQuery);

  // Fetch all workspace members for invitation
  const workspaceRef = useMemoDatabase(() => {
    if (!db || !workspaceId) return null;
    return doc(db, 'workspaces', workspaceId);
  }, [db, workspaceId]);
  const { data: workspaceData } = useDoc(workspaceRef);

  const workspaceMembersQuery = useMemoDatabase(() => {
    if (!db || !workspaceData?.memberIds) return null;
    return query(collection(db, 'userProfiles'), where('id', 'in', workspaceData.memberIds));
  }, [db, workspaceData?.memberIds]);
  const { data: workspaceMembers } = useCollection<Participant>(workspaceMembersQuery);

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
          description: 'Please enable camera permissions in your browser settings to use group huddles.',
        });
      }
    };
    
    getCameraPermission();
    
    // Join Huddle in Firestore
    if (user && huddleRef) {
      setDocumentNonBlocking(huddleRef, {
        id: 'active',
        participantIds: arrayUnion(user.uid),
        startedAt: serverTimestamp()
      }, { merge: true });
    }
    
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      // Leave Huddle in Firestore
      if (user && huddleRef) {
        updateDocumentNonBlocking(huddleRef, {
          participantIds: arrayRemove(user.uid)
        });
      }
    };
  }, [user, huddleRef, toast]);

  const copyInviteLink = () => {
    const link = `${window.location.origin}/join/huddle/${channelId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast({
      title: "Link Copied",
      description: "Invitation link has been copied to your clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const inviteMember = (memberName: string) => {
    toast({
      title: "Invitation Sent",
      description: `Waiting for ${memberName} to join the huddle.`,
    });
  };

  const remoteParticipants = participantsProfiles?.filter(p => p.id !== user?.uid) || [];

  return (
    <div className="absolute inset-0 z-40 bg-[#070608] flex flex-col p-4 animate-in fade-in duration-500 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 bg-black">
        <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-primary/30 rounded-full blur-[160px] animate-blob-extreme opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-blue-500/20 rounded-full blur-[140px] animate-blob-extreme animation-delay-4000 opacity-40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-indigo-900/10 rounded-full blur-[200px] animate-blob-extreme animation-delay-8000" />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4 px-2 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 drop-shadow-md">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                Group Huddle: #{channelName || 'general'}
              </h2>
              <div className="flex items-center gap-2 text-xs text-white/60 font-medium">
                <Users className="w-3 h-3" />
                <span>{huddleData?.participantIds?.length || 1} people connected</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 gap-2 backdrop-blur-md border border-white/5">
                  <UserPlus className="w-4 h-4" />
                  Invite
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1a1d21]/95 backdrop-blur-xl border-white/10 text-white sm:max-w-md z-[200] shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black">Invite to Huddle</DialogTitle>
                  <DialogDescription className="text-white/60">
                    Invite teammates to join the conversation via link or select from members.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Share Meeting Link</label>
                    <div className="flex gap-2">
                      <Input 
                        readOnly 
                        value={`${window.location.origin}/join/huddle/${channelId}`}
                        className="bg-white/5 border-white/10 text-sm focus-visible:ring-primary/30"
                      />
                      <Button onClick={copyInviteLink} variant="secondary" className="shrink-0 bg-primary/20 text-primary hover:bg-primary/30">
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Workspace Members</label>
                    <ScrollArea className="h-48 rounded-md border border-white/5 p-2 bg-black/20">
                      <div className="space-y-1">
                        {workspaceMembers?.filter(m => m.id !== user?.uid && !huddleData?.participantIds?.includes(m.id)).map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8 rounded-md border border-white/10">
                                <AvatarImage src={member.avatarUrl} />
                                <AvatarFallback>{member.displayName[0]}</AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold">{member.displayName}</span>
                                <span className="text-[10px] font-bold text-green-500">Available</span>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-primary hover:bg-primary/10 h-8 px-3 font-bold"
                              onClick={() => inviteMember(member.displayName)}
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
            <div className="w-px h-6 bg-white/10 mx-2" />
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 backdrop-blur-md">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 flex min-h-0 gap-4 overflow-hidden">
          <div className="flex-1 min-h-0 w-full overflow-y-auto scrollbar-hide">
            <div className={cn(
              "grid gap-4 h-full",
              isChatOpen ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            )}>
              <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl overflow-hidden border border-primary/30 shadow-2xl aspect-video sm:aspect-auto ring-1 ring-primary/20">
                 <video 
                    ref={videoRef} 
                    className={cn(
                      "w-full h-full object-cover scale-x-[-1] transition-opacity duration-700", 
                      (isVideoOff || hasCameraPermission === false) ? "opacity-0" : "opacity-100"
                    )} 
                    autoPlay 
                    muted 
                    playsInline 
                 />
                 { (isVideoOff || hasCameraPermission === false) && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#1a1d21]/60 to-[#0b0a0d]/80 backdrop-blur-3xl">
                      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 mb-4 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                        <VideoOff className="w-8 h-8 text-primary animate-pulse" />
                      </div>
                      <p className="text-xs font-black text-white/40 uppercase tracking-[0.3em]">
                        {hasCameraPermission === false ? 'No Camera Access' : 'Camera Off'}
                      </p>
                   </div>
                 )}
                 <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-xl px-3 py-1.5 rounded-lg border border-white/10 text-[11px] font-black text-white uppercase tracking-wider">
                   {isMuted && <MicOff className="w-3.5 h-3.5 text-destructive" />}
                   <span>You ({user?.displayName || 'Me'})</span>
                 </div>
              </div>

              {remoteParticipants.map((p) => (
                <div key={p.id} className="relative bg-black/30 backdrop-blur-md rounded-2xl overflow-hidden group aspect-video sm:aspect-auto border border-white/5 hover:border-white/20 transition-all duration-300 shadow-xl">
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800/20 to-black/40">
                    <Avatar className="w-24 h-24 mb-4 border-2 border-white/10 shadow-2xl">
                      <AvatarImage src={p.avatarUrl} />
                      <AvatarFallback className="text-xl font-bold">{p.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-black text-white/40 uppercase tracking-widest">{p.displayName}</p>
                  </div>
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-xl px-3 py-1.5 rounded-lg border border-white/10 text-[11px] font-black text-white uppercase tracking-wider">
                    <MicOff className="w-3.5 h-3.5 text-destructive" />
                    <span>{p.displayName}</span>
                  </div>
                </div>
              ))}

              {(isHuddleLoading || isProfilesLoading) && (
                <div className="flex items-center justify-center col-span-full py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}
            </div>
          </div>

          {isChatOpen && (
            <div className="w-80 bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 flex flex-col animate-in slide-in-from-right duration-500 shadow-2xl">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-black text-xs uppercase tracking-widest text-white/80">In-Call Messages</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(false)} className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/5">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-hide">
                <p className="text-center text-xs text-white/20 mt-10">Chat is enabled for current session</p>
              </div>
              <div className="p-4 border-t border-white/5 bg-black/20">
                <div className="relative group">
                  <Input 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Message the team..." 
                    className="bg-white/5 border-white/10 h-11 pr-10 text-sm focus-visible:ring-primary/40 rounded-xl" 
                  />
                  <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-9 w-9 text-primary hover:bg-primary/10">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center gap-5 py-5 px-10 bg-white/5 backdrop-blur-3xl rounded-full border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] mx-auto max-w-fit shrink-0 mb-4 ring-1 ring-white/5 animate-in slide-in-from-bottom-10 duration-700">
          <div className="flex items-center gap-4 pr-5 border-r border-white/10">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsMuted(!isMuted)}
              className={cn(
                "w-14 h-14 rounded-full transition-all active:scale-90 shadow-xl",
                isMuted 
                  ? "bg-destructive text-white hover:bg-destructive/90 shadow-destructive/20" 
                  : "bg-white/5 text-white hover:bg-white/10 hover:shadow-primary/20"
              )}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={cn(
                "w-14 h-14 rounded-full transition-all active:scale-90 shadow-xl",
                isVideoOff 
                  ? "bg-destructive text-white hover:bg-destructive/90 shadow-destructive/20" 
                  : "bg-white/5 text-white hover:bg-white/10 hover:shadow-primary/20"
              )}
            >
              {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={cn(
                "w-14 h-14 rounded-full transition-all active:scale-90 shadow-xl",
                isChatOpen 
                  ? "bg-primary text-white shadow-[0_0_25px_rgba(168,85,247,0.5)]" 
                  : "bg-white/5 text-white hover:bg-white/10"
              )}
            >
              <MessageSquare className="w-6 h-6" />
            </Button>
            <Button variant="ghost" size="icon" className="w-14 h-14 rounded-full bg-white/5 text-white hover:bg-white/10 transition-all active:scale-90 shadow-xl">
              <Maximize2 className="w-6 h-6" />
            </Button>
            <Button 
              variant="destructive" 
              onClick={onLeave}
              className="h-14 px-10 rounded-full font-black uppercase tracking-widest text-xs gap-3 shadow-[0_10px_30px_rgba(239,68,68,0.3)] active:scale-95 transition-all hover:bg-red-600"
            >
              <PhoneOff className="w-5 h-5 fill-current" />
              End Call
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
