'use client';

import { createContext, useContext, type ReactNode, useMemo, useState, useEffect } from 'react';
import { initializeDatabase } from '@/database';

const DatabaseContext = createContext<ReturnType<typeof initializeDatabase> | null>(null);

export function DatabaseClientProvider({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Ensure initialization only happens on the client
  const db = useMemo(() => {
    if (typeof window === 'undefined' || !isMounted) return { app: null, auth: null };
    return initializeDatabase();
  }, [isMounted]);

  return (
    <DatabaseContext.Provider value={db}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabaseClient() {
  const ctx = useContext(DatabaseContext);
  if (!ctx) throw new Error('useDatabaseClient must be used within DatabaseClientProvider');
  return ctx;
}
