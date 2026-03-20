"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
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
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push('/');
        return;
      }

      const [
        { data: channels, error: channelsError },
        { data: directMessages, error: dmsError },
        { data: files, error: filesError },
      ] = await Promise.all([
        supabase.from('channels').select('*'),
        supabase.from('direct_message_conversations').select('*')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`),
        supabase.from('files').select('*').eq('owner_id', user.id),
      ]);

      if (channelsError) console.error('Channels error:', channelsError.message);
      if (dmsError) console.error('DMs error:', dmsError.message);
      if (filesError) console.error('Files error:', filesError.message);

      const formattedDMs = (directMessages ?? []).map((dm: any) => ({
        id: dm.id,
        userId: dm.user1_id === user.id ? dm.user2_id : dm.user1_id,
        name: 'User',
        avatar: '',
        type: 'dm',
      }));

      setData({
        user,
        channels: channels ?? [],
        directMessages: formattedDMs,
        files: files ?? [],
      });
      setLoading(false);
    }

    fetchData();
  }, [router]);

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
    />
  );
}