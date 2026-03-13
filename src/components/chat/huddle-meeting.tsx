
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
import { doc, arrayUnion, arrayRemove, collection, query, where, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/database/non-blocking-updates';

interface HuddleMeetingProps {
  workspaceId: string;
  channelId: string;
  channelName?: string;
  onLeave: () => void;
}

interface ParticipantProfile {
  id: string;
  displayName: string;
  avatarUrl: string;
  email: string;
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

  // Firestore Huddle Document Reference
  const huddleRef = useMemoDatabase(() => {
    if (!db || !workspaceId || !channelId) return null;
    return doc(db, 'workspaces', workspaceId, 'channels', channelId, 'huddle', 'active');
  }, [db, workspaceId, channelId]);

  const { data: huddleData, isLoading: isHuddleLoading } = useDoc(huddleRef);

  // Fetch profiles for all participants currently in the huddle
  const participantsQuery = useMemoDatabase(() => {
    if (!db || !huddleData?.participantIds || huddleData.participantIds.length === 0) return null;
    return query(collection(db, 'userProfiles'), where('id', 'in', huddleData.participantIds));
  }, [db, huddleData?.participantIds]);

  const { data: participantsProfiles, isLoading: isProfilesLoading } = useCollection<ParticipantProfile>(participantsQuery);

  // Fetch all workspace members for invitation (simulate finding people to invite)
  const workspaceMembersQuery = useMemoDatabase(() => {
    if (!db) return null;
    return query(collection(db, 'userProfiles'));
  }, [db]);
  const { data: allMembers } = useCollection<ParticipantProfile>(workspaceMembersQuery);

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
          description: 'Please enable camera permissions in your browser settings to use huddles.',
        });
      }
    };
    
    getCameraPermission();
    
    // Join Huddle presence in Firestore
    if (user && huddleRef) {
      setDocumentNonBlocking(huddleRef, {
        id: 'active',
        participantIds: arrayUnion(user.uid),
        startedAt: serverTimestamp()
      }, { merge: true });
    }
    
    return () => {
      // Cleanup: Stop media tracks
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      // Leave Huddle presence in Firestore
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
      description: `We've notified ${memberName} that you're starting a huddle.`,
    });
  };

  const remoteParticipants = participantsProfiles?.filter(p => p.id !== user?.uid) || [];

  return (
    <div className="absolute inset-0 z-40 bg-[#070608] flex flex-col p-4 animate-in fade-in duration-500 overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 bg-black">
        <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-primary/20 rounded-full blur-[160px] animate-blob-extreme opacity-40" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-blue-500/10 rounded-full blur-[140px] animate-blob-extreme animation-delay-4000 opacity-30" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 px-2 shrink-0">
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_12px_rgba(34,197,94,0.6)]" />
              #{channelName || 'general'} Huddle
            </h2>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40">
              <Users className="w-3 h-3" />
              <span>{huddleData?.participantIds?.length || 1} CONNECTED</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white/5 border-white/10 hover:bg-white/10 text-white font-bold text-xs gap-2 h-9 px-4">
                  <UserPlus className="w-4 h-4" />
                  Invite
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1a1d21] border-white/10 text-white sm:max-w-md shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black">Invite Team</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Copy the huddle link or invite active workspace members.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Meeting Link</label>
                    <div className="flex gap-2">
                      <Input 
                        readOnly 
                        value={`${window.location.origin}/join/huddle/${channelId}`}
                        className="bg-black/20 border-white/10 text-sm focus-visible:ring-primary/40"
                      />
                      <Button onClick={copyInviteLink} variant="secondary" className="shrink-0 bg-primary/20 text-primary hover:bg-primary/30">
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Active Members</label>
                    <ScrollArea className="h-48 rounded-xl border border-white/5 p-2 bg-black/10">
                      <div className="space-y-1">
                        {allMembers?.filter(m => m.id !== user?.uid && !huddleData?.participantIds?.includes(m.id)).map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8 rounded-lg border border-white/10">
                                <AvatarImage src={member.avatarUrl} />
                                <AvatarFallback>{member.displayName[0]}</AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold">{member.displayName}</span>
                                <span className="text-[10px] text-green-500 font-bold">Online</span>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-primary hover:bg-primary/10 h-8 font-bold text-[10px] uppercase tracking-wider"
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
            <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/5">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 flex min-h-0 gap-4 overflow-hidden">
          <div className="flex-1 min-h-0 w-full overflow-y-auto scrollbar-hide">
            <div className={cn(
              "grid gap-4 h-full transition-all duration-500",
              isChatOpen ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            )}>
              {/* Local Participant */}
              <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl group transition-all hover:scale-[1.01] hover:shadow-primary/10">
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

              {/* Remote Participants */}
              {remoteParticipants.map((p) => (
                <div key={p.id} className="relative bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl group animate-in zoom-in-95 duration-500">
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-white/5 to-transparent">
                    <Avatar className="w-24 h-24 mb-4 border-2 border-white/10 shadow-2xl rounded-2xl">
                      <AvatarImage src={p.avatarUrl} />
                      <AvatarFallback className="text-2xl font-black">{p.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{p.displayName}</p>
                  </div>
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-black text-white uppercase tracking-wider">
                    <MicOff className="w-3.5 h-3.5 text-destructive" />
                    <span>{p.displayName}</span>
                  </div>
                </div>
              ))}

              {(isHuddleLoading || isProfilesLoading) && (
                <div className="flex items-center justify-center col-span-full">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Chat (Optional) */}
          {isChatOpen && (
            <div className="w-80 bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 flex flex-col animate-in slide-in-from-right duration-500 shadow-2xl">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-white/80">Session Chat</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(false)} className="h-8 w-8 text-white/40 hover:text-white">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
                <MessageSquare className="w-8 h-8 text-white/10" />
                <p className="text-xs text-white/20 font-medium">Chat is enabled during huddles for quick code sharing.</p>
              </div>
              <div className="p-4 border-t border-white/5">
                <div className="relative">
                  <Input 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..." 
                    className="bg-black/20 border-white/10 h-11 pr-10 text-sm focus-visible:ring-primary/40 rounded-xl" 
                  />
                  <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-9 w-9 text-primary hover:bg-primary/10">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls Bar */}
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
          <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl bg-white/5 text-white hover:bg-white/10 shadow-xl">
            <Maximize2 className="w-5 h-5" />
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
