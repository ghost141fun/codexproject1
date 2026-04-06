import { useCallback, useRef, useEffect, useState } from 'react';
import { useAuth, useUser } from '@/database';

export function useDrafts() {
  const { supabase } = useAuth();
  const { user } = useUser();
  const timerRef = useRef<Record<string, NodeJS.Timeout>>({});

  const saveDraft = useCallback((contextId: string, contextType: 'channel' | 'dm', text: string) => {
    if (!supabase || !user || !contextId) return;
    
    // Clear existing timer to debounce
    if (timerRef.current[contextId]) clearTimeout(timerRef.current[contextId]);

    // Delay the network request so we don't spam the DB while typing
    timerRef.current[contextId] = setTimeout(async () => {
      // If the text is completely clear, remove the draft
      if (!text.trim()) {
        await supabase.from('drafts').delete().match({ user_id: user.id, context_id: contextId });
        return;
      }

      // Use select + update/insert to avoid onConflict constraint name issues
      const { data: existing } = await supabase
        .from('drafts')
        .select('id')
        .match({ user_id: user.id, context_id: contextId })
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from('drafts').update({
          content: text,
          updated_at: new Date().toISOString()
        }).match({ id: existing.id });
        if (error) console.error('Error updating draft:', error.message);
      } else {
        const { error } = await supabase.from('drafts').insert({
          user_id: user.id,
          context_id: contextId,
          context_type: contextType,
          content: text,
          updated_at: new Date().toISOString()
        });
        if (error) console.error('Error inserting draft:', error.message);
      }
    }, 1500); 
  }, [supabase, user]);

  const removeDraft = useCallback(async (contextId: string) => {
    if (!supabase || !user || !contextId) return;
    if (timerRef.current[contextId]) clearTimeout(timerRef.current[contextId]);
    await supabase.from('drafts').delete().match({ user_id: user.id, context_id: contextId });
  }, [supabase, user]);


  return { saveDraft, removeDraft };
}

export function useDraftCount() {
  const { supabase } = useAuth();
  const { user } = useUser();
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function fetchCount() {
      if (!supabase || !user) return;
      const { count: fetchedCount, error } = await supabase
        .from('drafts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (!error && fetchedCount !== null) {
        setCount(fetchedCount);
      }
    }

    fetchCount();

    if (supabase && user) {
      const channel = supabase.channel(`drafts-count-${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'drafts', filter: `user_id=eq.${user.id}` }, fetchCount)
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [supabase, user]);

  return count;
}
