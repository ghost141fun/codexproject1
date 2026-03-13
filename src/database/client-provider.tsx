'use client';

import { createContext, useContext, type ReactNode, useState, useEffect } from 'react';
import { initializeDatabase } from '@/database';

const DatabaseContext = createContext<ReturnType<typeof initializeDatabase> | null>(null);

export function DatabaseClientProvider({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const [db, setDb] = useState<ReturnType<typeof initializeDatabase>>({ app: null, auth: null });

  useEffect(() => {
    setIsMounted(true);
    // Initialize database only once on the client after mounting
    setDb(initializeDatabase());
  }, []);

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
