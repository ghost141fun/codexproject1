import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { WorkspaceClient } from '@/components/workspace-client';

export default async function WorkspacePage() {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) redirect('/');

  const [
    { data: channels, error: channelsError },
    { data: directMessages, error: dmsError },
    { data: files, error: filesError },
  ] = await Promise.all([
    supabase.from('channels').select('*'),
    supabase.from('direct_messages').select('*').eq('sender_id', user.id),
    supabase.from('files').select('*').eq('owner_id', user.id),
  ]);

  if (channelsError) console.error('Channels error:', channelsError.message);
  if (dmsError) console.error('DMs error:', dmsError.message);
  if (filesError) console.error('Files error:', filesError.message);

  return (
    <WorkspaceClient
      user={user}
      channels={channels ?? []}
      directMessages={directMessages ?? []}
      files={files ?? []}
    />
  );
}