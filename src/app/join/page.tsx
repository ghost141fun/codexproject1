"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Hash, UserPlus, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

function JoinContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'joining' | 'success'>('idle');

  const handleJoin = async () => {
    setStatus('joining');
    // Simulate a brief delay for the "premium" feel
    await new Promise(resolve => setTimeout(resolve, 1500));
    setStatus('success');
    await new Promise(resolve => setTimeout(resolve, 800));
    router.push('/workspace');
  };

  return (
    <div className="min-h-screen bg-[#1a1d21] flex items-center justify-center p-4 selection:bg-primary/30">
      <div className="max-w-[480px] w-full bg-[#222529] rounded-[32px] border border-white/10 shadow-[0_32px_128px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in duration-700">
        <div className="h-2 bg-primary/20 w-full overflow-hidden">
          {status === 'joining' && <div className="h-full bg-primary animate-progress-loading" style={{ width: '40%' }} />}
          {status === 'success' && <div className="h-full bg-green-500 transition-all duration-500" style={{ width: '100%' }} />}
        </div>
        
        <div className="p-12 text-center space-y-8">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-[28px] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                <Hash className="w-12 h-12 text-primary" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#1a1d21] border-4 border-[#222529] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-black text-white tracking-tight">You've been invited</h1>
            <p className="text-[#b9babd] text-base leading-relaxed">
              Join <span className="text-white font-bold">Codex Teams</span> to collaborate with your team on projects and engineering discussions.
            </p>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleJoin}
              disabled={status !== 'idle'}
              className={cn(
                "w-full h-14 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all duration-300 shadow-lg active:scale-95",
                status === 'idle' && "bg-primary hover:bg-primary/90 text-white shadow-primary/20",
                status === 'joining' && "bg-white/5 text-white/50 cursor-wait",
                status === 'success' && "bg-green-600 text-white shadow-green-500/20"
              )}
            >
              {status === 'idle' && (
                <span className="flex items-center gap-3">
                  Accept Invitation <ArrowRight className="w-4 h-4" />
                </span>
              )}
              {status === 'joining' && (
                <span className="flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin" /> Joining Workspace...
                </span>
              )}
              {status === 'success' && (
                <span className="flex items-center gap-3">
                   Redirecting...
                </span>
              )}
            </Button>
          </div>

          <div className="pt-6 flex items-center justify-center gap-6 opacity-40 grayscale group-hover:grayscale-0 transition-all">
             <div className="w-8 h-8 rounded bg-white/10" />
             <div className="w-8 h-8 rounded bg-white/10" />
             <div className="w-8 h-8 rounded bg-white/10" />
          </div>
        </div>
        
        <div className="px-12 py-6 bg-white/[0.02] border-t border-white/5 flex justify-center">
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">
            DevTalk Engineering Workspace
          </p>
        </div>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#1a1d21] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <JoinContent />
    </Suspense>
  );
}
