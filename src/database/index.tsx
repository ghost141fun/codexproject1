'use client';

import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { type User } from '@supabase/supabase-js';

let supabaseInstance: ReturnType<typeof createClient> | undefined;

export function initializeDatabase() {
  if (typeof window === 'undefined') return { supabase: null };

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient();
    } catch (e) {
      console.error('Supabase initialization failed', e);
    }
  }

  return { supabase: supabaseInstance ?? null };
}

export function useUser(): { user: User | null; isUserLoading: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  useEffect(() => {
    const { supabase } = initializeDatabase();
    if (!supabase) { setIsUserLoading(false); return; }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsUserLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsUserLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, isUserLoading };
}

export function useAuth() {
  const { supabase } = initializeDatabase();
  return {
    signOut: () => supabase?.auth.signOut(),
    supabase,
  };
}
