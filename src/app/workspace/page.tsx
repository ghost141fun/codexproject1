"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { WorkspaceClient } from '@/components/workspace-client';
import { Loader2 } from "lucide-react";

export default function WorkspacePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    user: any;
    channels: any[];
    directMessages: any[];
    files: any[];
    activeWorkspace: any;
    workspaces: any[];
  } | null>(null);

  const fetchData = React.useCallback(async () => {
    const supabase = createClient();

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser) {
        router.push('/');
        return;
      }

      // Fetch full user profile from the database
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      const user = { ...authUser, ...userData };

      // 1. Find all workspaces the user is part of or owns
      const { data: workspacesData } = await supabase
        .from('workspaces')
        .select('*');

       const { data: memberWorkspaces } = await supabase
        .from('workspace_memberships')
        .select('workspace_id')
        .eq('user_id', user.id);

      const memberWorkspaceIds = (memberWorkspaces ?? []).map(m => m.workspace_id);
      
      const allWorkspaces = (workspacesData ?? []).filter(w => 
        String(w.owner_id) === String(user.id) || memberWorkspaceIds.includes(w.id)
      );

      // Determine active workspace: either from URL, or the first one available
      const urlParams = new URLSearchParams(window.location.search);
      const urlWsId = urlParams.get('ws');

      let activeWorkspace = null;
      if (urlWsId) {
        activeWorkspace = allWorkspaces.find(w => w.id === urlWsId) || null;
      }
      if (!activeWorkspace && allWorkspaces.length > 0) {
        activeWorkspace = allWorkspaces[0];
      }

      const workspaceId = activeWorkspace?.id;

      // 2. Fetch all member IDs for this workspace
      const { data: memberRecords } = workspaceId 
        ? await supabase
            .from('workspace_memberships')
            .select('user_id')
            .eq('workspace_id', workspaceId)
        : { data: [] };

      let memberIds = Array.from(new Set((memberRecords ?? []).map(m => m.user_id)));



      // 4. Fetch the actual profiles
      const { data: profiles } = memberIds.length > 0
        ? await supabase
            .from('users')
            .select('id, display_name, username, avatar_gradient, avatar_url, profile_picture_url, status')
            .in('id', memberIds)
        : { data: [] };

      const [
        { data: channels, error: channelsError },
        { data: directMessages, error: dmsError },
        { data: files, error: filesError },
      ] = await Promise.all([
        workspaceId 
          ? supabase.from('channels').select('*').eq('workspace_id', workspaceId)
          : supabase.from('channels').select('*').or(`created_by.eq.${user.id},workspace_id.is.null`),
        workspaceId
          ? supabase.from('direct_message_conversations').select('*')
              .eq('workspace_id', workspaceId)
              .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          : supabase.from('direct_message_conversations').select('*')
              .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`),
        workspaceId
          ? supabase.from('files').select('*').eq('workspace_id', workspaceId)
          : supabase.from('files').select('*').eq('owner_id', user.id),
      ]);

      if (channelsError) console.error('Channels error:', channelsError.message);
      if (dmsError) console.error('DMs error:', dmsError.message);
      if (filesError) console.error('Files error:', filesError.message);

      // Map profiles to DM sidebar format
      const formattedDMs = (profiles ?? [])
        .filter(u => u.id !== user.id) // exclude self
        .map((u: any) => {
          // Find existing conversation ID if it exists
          const existingConv = (directMessages ?? []).find(dm => 
            (dm.user1_id === user.id && dm.user2_id === u.id) || 
            (dm.user1_id === u.id && dm.user2_id === user.id)
          );

          return {
            id: existingConv?.id || `new-dm-${u.id}`,
            userId: u.id,
            name: u.display_name || u.username || 'User',
            avatar: u.avatar_url || u.profile_picture_url || '',
            color: u.avatar_gradient || '',
            status: u.status || 'offline',
            type: 'dm' as const,
          };
        });
      
      // Secondary deduplication to ensure unique entries
      const uniqueDMs = Array.from(new Map(formattedDMs.map(dm => [dm.userId, dm])).values());

      setData({
        user,
        channels: channels ?? [],
        directMessages: uniqueDMs as any[],
        files: files ?? [],
        activeWorkspace: activeWorkspace || null,
        workspaces: allWorkspaces,
      });
      setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const supabase = createClient();
    const workspacesChannel = supabase.channel('public:workspaces')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workspaces' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(workspacesChannel);
    };
  }, [fetchData]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#1a1d21] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
            Initializing Workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <WorkspaceClient
      user={data.user}
      channels={data.channels}
      directMessages={data.directMessages}
      files={data.files}
      activeWorkspace={data.activeWorkspace}
      workspaces={data.workspaces}
      refresh={fetchData}
    />
  );
}