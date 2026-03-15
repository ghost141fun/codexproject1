import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { WorkspaceClient } from '@/components/workspace-client';

export default async function WorkspacePage() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) redirect('/');

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

  return (
    <WorkspaceClient
      user={user}
      channels={channels ?? []}
      directMessages={formattedDMs}
      files={files ?? []}
    />
  );
}