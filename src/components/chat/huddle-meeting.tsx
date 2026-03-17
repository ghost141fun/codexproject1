'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import DailyIframe, {
  DailyCall,
  DailyParticipant,
  DailyEventObjectParticipant,
  DailyEventObjectParticipantLeft,
} from '@daily-co/daily-js';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  Users, UserPlus, MessageSquare, X, Send,
  Copy, Check, Loader2, MonitorUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/database';

interface Participant {
  id: string;
  displayName: string;
  audioTrack?: MediaStreamTrack;
  videoTrack?: MediaStreamTrack;
  isLocal: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
}

interface HuddleMeetingProps {
  workspaceId: string;
  channelId: string;
  channelName?: string;
  onLeave: () => void;
}

/* ── Single video tile ───────────────────────────────────────────────────── */
const ParticipantTile = ({ participant }: { participant: Participant }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (videoRef.current && participant.videoTrack) {
      videoRef.current.srcObject = new MediaStream([participant.videoTrack]);
    } else if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [participant.videoTrack]);

  useEffect(() => {
    if (audioRef.current && participant.audioTrack && !participant.isLocal) {
      audioRef.current.srcObject = new MediaStream([participant.audioTrack]);
    }
  }, [participant.audioTrack, participant.isLocal]);

  const showVideo = !!participant.videoTrack && !participant.isVideoOff;

  return (
    <div className="relative bg-white/5 rounded-2xl overflow-hidden border border-white/10 min-h-[180px] flex items-center justify-center">
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={participant.isLocal}
          className={cn('w-full h-full object-cover', participant.isLocal && 'scale-x-[-1]')}
        />
      ) : (
        <div className="flex flex-col items-center gap-3 py-8">
          <Avatar className="w-14 h-14">
            <AvatarFallback className="text-xl bg-[#4a154b] text-white font-bold">
              {participant.displayName[0]?.toUpperCase() ?? '?'}
            </AvatarFallback>
          </Avatar>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
            {participant.isVideoOff ? 'Camera off' : 'No video'}
          </p>
        </div>
      )}

      {!participant.isLocal && <audio ref={audioRef} autoPlay playsInline />}

      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur px-2.5 py-1 rounded-lg border border-white/10">
        {participant.isMuted && <MicOff className="w-3 h-3 text-red-400 shrink-0" />}
        <span className="text-[11px] font-bold text-white truncate max-w-[120px]">
          {participant.displayName}
        </span>
      </div>
    </div>
  );
};

/* ── Main component ──────────────────────────────────────────────────────── */
export const HuddleMeeting: React.FC<HuddleMeetingProps> = ({
  channelId,
  channelName,
  onLeave,
}) => {
  const { user } = useAuth() as any;
  const { toast } = useToast();

  const callRef = useRef<DailyCall | null>(null);
  const [callState, setCallState] = useState<'loading' | 'joined' | 'error'>('loading');
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const buildParticipant = useCallback(
    (p: DailyParticipant): Participant => ({
      id: p.session_id,
      displayName: p.local
        ? user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'You'
        : p.user_name || `Guest ${p.session_id.slice(0, 4)}`,
      audioTrack: p.tracks?.audio?.persistentTrack ?? undefined,
      videoTrack: p.tracks?.video?.persistentTrack ?? undefined,
      isLocal: !!p.local,
      isMuted: p.tracks?.audio?.state === 'off' || p.tracks?.audio?.state === 'blocked',
      isVideoOff: p.tracks?.video?.state === 'off' || p.tracks?.video?.state === 'blocked',
    }),
    [user]
  );

  const syncParticipants = useCallback(
    (call: DailyCall) => {
      const all = call.participants();
      const map = new Map<string, Participant>();
      Object.values(all).forEach((p) => map.set(p.session_id, buildParticipant(p)));
      setParticipants(map);
    },
    [buildParticipant]
  );

  /* ── Join Daily room ── */
  useEffect(() => {
    const join = async () => {
      try {
        const res = await fetch('/api/huddle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channelId }),
        });
        if (!res.ok) throw new Error('Failed to create huddle room');
        const room = await res.json();

        const call = DailyIframe.createCallObject({
          audioSource: true,
          videoSource: true,
        });
        callRef.current = call;

        call
          .on('joined-meeting', () => {
            setCallState('joined');
            syncParticipants(call);
          })
          .on('participant-joined', (e: DailyEventObjectParticipant) => {
            syncParticipants(call);
            toast({ title: `${e.participant.user_name || 'Someone'} joined the huddle` });
          })
          .on('participant-updated', () => syncParticipants(call))
          .on('participant-left', (e: DailyEventObjectParticipantLeft) => {
            setParticipants((prev) => {
              const next = new Map(prev);
              next.delete(e.participant.session_id);
              return next;
            });
            toast({ title: `${e.participant.user_name || 'Someone'} left the huddle` });
          })
          .on('error', (e: any) => {
            setCallState('error');
            toast({ variant: 'destructive', title: 'Huddle error', description: e?.errorMsg });
          });

        await call.join({
          url: room.url,
          userName:
            user?.user_metadata?.display_name ||
            user?.email?.split('@')[0] ||
            'Guest',
        });
      } catch (err: any) {
        setCallState('error');
        toast({ variant: 'destructive', title: 'Could not start huddle', description: err.message });
      }
    };

    join();

    return () => {
      callRef.current?.leave().then(() => callRef.current?.destroy());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  /* ── Controls ── */
  const toggleMute = () => {
    callRef.current?.setLocalAudio(isMuted); // pass true to re-enable
    setIsMuted((m) => !m);
  };

  const toggleVideo = () => {
    callRef.current?.setLocalVideo(isVideoOff);
    setIsVideoOff((v) => !v);
  };

  const toggleScreenShare = async () => {
    if (!callRef.current) return;
    if (isScreenSharing) {
      await callRef.current.stopScreenShare();
    } else {
      await callRef.current.startScreenShare();
    }
    setIsScreenSharing((s) => !s);
  };

  const handleLeave = async () => {
    await callRef.current?.leave();
    callRef.current?.destroy();
    onLeave();
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/join/huddle/${channelId}`);
    setCopied(true);
    toast({ title: 'Link Copied' });
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Grid column logic ── */
  const count = participants.size;
  const gridCols = cn(
    count <= 1 && 'grid-cols-1',
    count === 2 && 'grid-cols-2',
    count >= 3 && count <= 4 && 'grid-cols-2',
    count >= 5 && count <= 9 && 'grid-cols-3',
    count >= 10 && count <= 16 && 'grid-cols-4',
    count >= 17 && count <= 25 && 'grid-cols-5',
    count > 25 && 'grid-cols-6',
    isChatOpen && count >= 3 && 'grid-cols-2',
  );

  const participantList = Array.from(participants.values());
  const local = participantList.find((p) => p.isLocal);
  const remote = participantList.filter((p) => !p.isLocal);

  /* ── Loading ── */
  if (callState === 'loading') {
    return (
      <div className="absolute inset-0 z-40 bg-[#070608] flex flex-col items-center justify-center gap-4 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-bold text-white/50 uppercase tracking-widest">Starting huddle…</p>
      </div>
    );
  }

  if (callState === 'error') {
    return (
      <div className="absolute inset-0 z-40 bg-[#070608] flex flex-col items-center justify-center gap-4 text-white">
        <p className="text-sm text-red-400 font-bold">Failed to connect to huddle.</p>
        <button onClick={onLeave} className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-bold transition-colors">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-40 bg-[#070608] flex flex-col p-4 overflow-hidden text-white animate-in fade-in duration-300">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[160px] opacity-40" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[140px] opacity-30" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <h2 className="text-lg font-black flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              #{channelName || 'general'} Huddle
            </h2>
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 mt-0.5 flex items-center gap-1.5">
              <Users className="w-3 h-3" />
              {participantList.length} / 50 connected
            </p>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="bg-white/5 border-white/10 hover:bg-white/10 text-white font-bold text-xs gap-2 h-8 px-3 rounded-lg">
                <UserPlus className="w-3.5 h-3.5" />
                Invite
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 bg-[#1a1d21] border-white/10 p-0 shadow-2xl text-white">
              <div className="p-4 border-b border-white/10">
                <p className="text-[11px] font-black uppercase tracking-widest text-white/60">Invite to huddle</p>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Huddle Link</p>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/join/huddle/${channelId}`}
                    className="h-8 text-[11px] bg-black/40 border-white/10 text-white/60 font-mono"
                  />
                  <Button size="icon" variant="ghost" onClick={copyInviteLink} className="h-8 w-8 shrink-0 text-primary hover:bg-primary/10">
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Video grid + chat */}
        <div className="flex-1 flex min-h-0 gap-4 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className={cn('grid gap-3', gridCols)}>
              {local && <ParticipantTile participant={local} />}
              {remote.map((p) => (
                <ParticipantTile key={p.id} participant={p} />
              ))}
            </div>
          </div>

          {isChatOpen && (
            <div className="w-72 bg-white/5 rounded-2xl border border-white/10 flex flex-col shrink-0 animate-in slide-in-from-right duration-300">
              <div className="p-4 border-b border-white/[0.07] flex items-center justify-between">
                <h3 className="font-black text-[11px] uppercase tracking-widest text-white/70">Huddle Chat</h3>
                <button onClick={() => setIsChatOpen(false)} className="h-6 w-6 flex items-center justify-center rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <ScrollArea className="flex-1 p-4">
                <p className="text-[10px] text-center text-white/30 font-bold uppercase tracking-widest py-4 border-b border-white/5 mb-4">
                  Huddle started · {participantList.length} participant{participantList.length !== 1 ? 's' : ''}
                </p>
              </ScrollArea>
              <div className="p-3 border-t border-white/[0.07]">
                <div className="relative">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && setMessage('')}
                    placeholder="Message…"
                    className="bg-black/20 border-white/10 h-9 pr-9 text-sm rounded-lg text-white placeholder:text-white/30"
                  />
                  <button className="absolute right-1 top-1 h-7 w-7 flex items-center justify-center rounded text-primary hover:bg-primary/10 transition-colors">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls bar */}
        <div className="mt-5 flex items-center justify-center gap-3 py-3 px-6 bg-white/5 rounded-2xl border border-white/10 mx-auto max-w-fit shrink-0 mb-2">
          <button
            onClick={toggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
            className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center transition-all',
              isMuted ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
            )}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleVideo}
            title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
            className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center transition-all',
              isVideoOff ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
            )}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleScreenShare}
            title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
            className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center transition-all',
              isScreenSharing ? 'bg-primary text-white' : 'bg-white/10 hover:bg-white/20 text-white'
            )}
          >
            <MonitorUp className="w-5 h-5" />
          </button>

          <div className="w-px h-7 bg-white/10 mx-1" />

          <button
            onClick={() => setIsChatOpen((c) => !c)}
            title="Toggle chat"
            className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center transition-all',
              isChatOpen ? 'bg-primary text-white' : 'bg-white/10 hover:bg-white/20 text-white'
            )}
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          <button
            onClick={handleLeave}
            className="h-11 px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-[11px] uppercase tracking-widest flex items-center gap-2 ml-2 transition-all active:scale-95"
          >
            <PhoneOff className="w-4 h-4" />
            Leave
          </button>
        </div>
      </div>
    </div>
  );
};