"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Hash, ArrowRight, Loader2, Sparkles, Users, Shield, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from '@/lib/supabase/client';

interface WorkspaceInfo {
  id: string;
  name: string;
  owner_id: string;
  memberCount: number;
}

function JoinContent() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('id');
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'idle' | 'joining' | 'success' | 'error' | 'already_member'>('loading');
  const [workspace, setWorkspace] = useState<WorkspaceInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      if (!workspaceId) {
        setErrorMsg('No workspace ID provided in the invite link.');
        setStatus('error');
        return;
      }

      // Check if workspace exists
      const { data: ws, error: wsError } = await supabase
        .from('workspaces')
        .select('id, name, owner_id')
        .eq('id', workspaceId)
        .maybeSingle();

      if (wsError || !ws) {
        setErrorMsg('This invite link is invalid or the workspace no longer exists.');
        setStatus('error');
        return;
      }

      // Get member count
      const { count } = await supabase
        .from('workspace_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId);

      setWorkspace({ ...ws, memberCount: count || 0 });

      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setIsLoggedIn(false);
        setStatus('idle');
        return;
      }

      setIsLoggedIn(true);

      // Check if already a member
      const { data: existingMembership } = await supabase
        .from('workspace_memberships')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .maybeSingle();

      // Also check if owner
      if (existingMembership || ws.owner_id === user.id) {
        setStatus('already_member');
        return;
      }

      setStatus('idle');
    }

    init();
  }, [workspaceId]);

  const handleJoin = async () => {
    if (!workspace) return;

    // If not logged in, redirect to login with the invite context
    if (!isLoggedIn) {
      router.push(`/login?invite=${workspace.id}`);
      return;
    }

    setStatus('joining');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?invite=${workspace.id}`);
      return;
    }

    // Create workspace membership
    const { error: membershipError } = await supabase
      .from('workspace_memberships')
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'member'
      });

    if (membershipError) {
      if (membershipError.message.includes('duplicate') || membershipError.message.includes('unique')) {
        // Already a member, just redirect
        setStatus('success');
        await new Promise(resolve => setTimeout(resolve, 800));
        router.push(`/workspace?ws=${workspace.id}`);
        return;
      }
      setErrorMsg('Failed to join workspace: ' + membershipError.message);
      setStatus('error');
      return;
    }

    // Ensure user profile exists
    await supabase.from('users').upsert({
      id: user.id,
      email: user.email,
      display_name: user.user_metadata?.display_name || user.email?.split('@')[0],
      username: user.email?.split('@')[0],
      role: 'member',
    }, { onConflict: 'id' });

    setStatus('success');
    await new Promise(resolve => setTimeout(resolve, 1000));
    router.push(`/workspace?ws=${workspace.id}`);
  };

  return (
    <div className="min-h-screen bg-[#0e0f11] flex items-center justify-center p-4">
      <div className="max-w-[480px] w-full bg-[#18191d] rounded-[28px] border border-[#2a2c33] shadow-[0_32px_128px_rgba(0,0,0,0.6)] overflow-hidden" style={{ animation: 'fadeIn 0.5s ease' }}>
        
        {/* Progress bar */}
        <div className="h-1.5 bg-[#1e2026] w-full overflow-hidden">
          {status === 'loading' && <div className="h-full bg-[#7c3aed] animate-pulse w-full" />}
          {status === 'joining' && <div className="h-full bg-[#7c3aed] w-[60%]" style={{ animation: 'progressFill 2s ease forwards' }} />}
          {(status === 'success' || status === 'already_member') && <div className="h-full bg-emerald-500 w-full transition-all duration-500" />}
          {status === 'error' && <div className="h-full bg-[#ef4444] w-full" />}
        </div>

        <div className="p-10 text-center space-y-7">
          {/* Loading state */}
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-8 h-8 text-[#7c3aed] animate-spin" />
              <p className="font-mono text-[12px] text-[#6b7280]">Loading workspace...</p>
            </div>
          )}

          {/* Error state */}
          {status === 'error' && (
            <div className="flex flex-col items-center gap-5 py-8">
              <div className="w-20 h-20 rounded-2xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] flex items-center justify-center">
                <AlertTriangle className="w-9 h-9 text-[#ef4444]" />
              </div>
              <div>
                <h1 className="text-[22px] font-bold text-white mb-2">Invalid Invite</h1>
                <p className="text-[#6b7280] text-[14px] font-mono leading-relaxed max-w-[340px]">{errorMsg}</p>
              </div>
              <Button onClick={() => router.push('/login')} className="bg-[#1e2026] hover:bg-[#2a2c33] text-white border border-[#2a2c33] h-11 rounded-xl px-6 font-semibold text-[13px]">
                Go to login
              </Button>
            </div>
          )}

          {/* Ready to join / Already member */}
          {(status === 'idle' || status === 'joining' || status === 'success' || status === 'already_member') && workspace && (
            <>
              {/* Workspace icon */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center shadow-[0_8px_32px_rgba(124,58,237,0.3)]">
                    <span className="text-3xl font-black text-white">{workspace.name[0].toUpperCase()}</span>
                  </div>
                  <div className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-[#18191d] border-[3px] border-[#18191d] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[#f59e0b] animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2">
                <h1 className="text-[26px] font-black text-white tracking-tight">
                  {status === 'already_member' ? `You're already in ${workspace.name}` : `Join ${workspace.name}`}
                </h1>
                <p className="text-[#8b92a5] text-[14px] leading-relaxed max-w-[360px] mx-auto">
                  {status === 'already_member'
                    ? 'You are already a member of this workspace. Click below to open it.'
                    : isLoggedIn 
                      ? `You've been invited to collaborate in the ${workspace.name} workspace.`
                      : `Sign up or log in to join the ${workspace.name} workspace.`
                  }
                </p>
              </div>

              {/* Workspace stats */}
              <div className="flex justify-center gap-6">
                <div className="flex items-center gap-2 text-[#6b7280]">
                  <Users size={14} />
                  <span className="font-mono text-[11px]">{workspace.memberCount} members</span>
                </div>
                <div className="flex items-center gap-2 text-[#6b7280]">
                  <Shield size={14} />
                  <span className="font-mono text-[11px]">Verified workspace</span>
                </div>
              </div>

              {/* Action button */}
              <div className="pt-2">
                <Button
                  onClick={status === 'already_member' ? () => router.push(`/workspace?ws=${workspace.id}`) : handleJoin}
                  disabled={status === 'joining'}
                  className={cn(
                    "w-full h-[52px] rounded-xl font-bold text-[14px] transition-all duration-300 shadow-lg active:scale-[0.98]",
                    status === 'idle' && "bg-[#7c3aed] hover:bg-[#a855f7] text-white shadow-[#7c3aed]/20",
                    status === 'joining' && "bg-[#7c3aed]/50 text-white/70 cursor-wait",
                    status === 'success' && "bg-emerald-600 text-white shadow-emerald-500/20",
                    status === 'already_member' && "bg-[#7c3aed] hover:bg-[#a855f7] text-white shadow-[#7c3aed]/20",
                  )}
                >
                  {status === 'idle' && (
                    <span className="flex items-center gap-2">
                      {isLoggedIn ? 'Accept Invitation' : 'Continue to Sign Up'} <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                  {status === 'joining' && (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Joining workspace...
                    </span>
                  )}
                  {status === 'success' && (
                    <span className="flex items-center gap-2">✓ Welcome! Redirecting...</span>
                  )}
                  {status === 'already_member' && (
                    <span className="flex items-center gap-2">Open {workspace.name} <ArrowRight className="w-4 h-4" /></span>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-10 py-5 bg-[#111214] border-t border-[#1e2026] flex justify-center">
          <p className="font-mono text-[9px] font-bold text-[#33363f] uppercase tracking-[0.3em]">
            Codex Teams · Secure Workspace
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes progressFill { from { width: 10%; } to { width: 90%; } }
      `}</style>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0e0f11] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#7c3aed] animate-spin" />
      </div>
    }>
      <JoinContent />
    </Suspense>
  );
}
